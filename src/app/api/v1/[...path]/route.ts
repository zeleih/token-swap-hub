import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createParser } from "eventsource-parser";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

async function handleProxy(req: NextRequest, params: { path: string[] }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer tk_")) {
    return NextResponse.json({ error: "Unauthorized. Missing or invalid Platform Key." }, { status: 401 });
  }

  const platformKey = authHeader.replace("Bearer ", "").trim();

  // Find Consumer
  const consumer = await prisma.user.findUnique({
    where: { platformKey }
  });

  if (!consumer) {
    return NextResponse.json({ error: "Invalid Platform Key." }, { status: 401 });
  }

  if (consumer.points <= 0) {
    return NextResponse.json({ error: "Insufficient points. Earn more by sharing tokens!" }, { status: 402 });
  }

  // Pick a provider Token
  // We prioritize tokens mapping to users other than consumer, or fallback
  const availableTokens = await prisma.tokenKey.findMany({
    where: { status: "ACTIVE" }
  });

  if (availableTokens.length === 0) {
    return NextResponse.json({ error: "No active tokens available in the pool." }, { status: 503 });
  }

  // Simple random picking for MVP
  const chosenToken = availableTokens[Math.floor(Math.random() * availableTokens.length)];

  // Reconstruct target URL
  const targetUrl = new URL(req.url);
  const pathString = params.path.join("/");
  const proxyTarget = `https://api.openai.com/v1/${pathString}${targetUrl.search}`;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: {
      "Authorization": `Bearer ${chosenToken.key}`,
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
  };

  let isStream = false;

  // Intercept body for chat completions to force stream_options for token usage
  if (req.method === "POST" && pathString === "chat/completions") {
    try {
      const body = await req.json();
      if (body.stream === true) {
        isStream = true;
        // Force the upstream to return usage at the end of the stream
        body.stream_options = { include_usage: true };
      }
      fetchOptions.body = JSON.stringify(body);
    } catch (e) {
      // Body might be empty or not JSON, fallback to blob
      fetchOptions.body = await req.text();
    }
  } else if (req.method !== "GET" && req.method !== "HEAD") {
    fetchOptions.body = await req.text();
  }

  const upstreamRes = await fetch(proxyTarget, fetchOptions);

  if (!upstreamRes.ok) {
    // We should handle 401/429 specifically to freeze the offending token
    if (upstreamRes.status === 401 || upstreamRes.status === 429) {
       await prisma.tokenKey.update({
         where: { id: chosenToken.id },
         data: { status: "FROZEN" }
       });
    }
    // Return upstream error directly
    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: upstreamRes.headers
    });
  }

  // Handle billing logic post-response
  let finalTokensUsed = 0;

  // If streaming
  if (isStream && upstreamRes.body) {
    let parser: ReturnType<typeof createParser>;
    const transformStream = new TransformStream({
      start(controller) {
        parser = createParser({ onEvent: (event: any) => {
          if (event.type === "event" && event.data !== "[DONE]") {
            try {
              const data = JSON.parse(event.data);
              if (data.usage && data.usage.total_tokens) {
                 finalTokensUsed = data.usage.total_tokens;
              }
            } catch (e) {}
          }
        } });
      },
      transform(chunk, controller) {
        const decoded = new TextDecoder().decode(chunk);
        parser.feed(decoded);
        controller.enqueue(chunk);
      },
      flush(controller) {
        // Record billing when stream ends
        commitBilling(consumer.id, chosenToken.id, chosenToken.userId, finalTokensUsed, chosenToken.isAdminSupply);
      }
    });

    return new NextResponse(upstreamRes.body.pipeThrough(transformStream), {
      status: upstreamRes.status,
      headers: upstreamRes.headers
    });
  } else {
    // Non-streaming response, intercept body
    const bodyStr = await upstreamRes.text();
    try {
      const data = JSON.parse(bodyStr);
      if (data.usage && data.usage.total_tokens) {
        finalTokensUsed = data.usage.total_tokens;
      }
    } catch (e) {}

    // Record billing directly
    commitBilling(consumer.id, chosenToken.id, chosenToken.userId, finalTokensUsed, chosenToken.isAdminSupply);

    return new NextResponse(bodyStr, {
      status: upstreamRes.status,
      headers: upstreamRes.headers
    });
  }
}

async function commitBilling(consumerId: string, tokenId: string, providerId: string, tokensUsed: number, isAdminSupply: boolean) {
  if (tokensUsed <= 0) return;

  await prisma.$transaction([
    // Deduct consumer points
    prisma.user.update({
      where: { id: consumerId },
      data: { points: { decrement: tokensUsed } }
    }),
    // Reward provider points (if not admin supply)
    ...(isAdminSupply ? [] : [
      prisma.user.update({
        where: { id: providerId },
        data: { points: { increment: tokensUsed } }
      })
    ]),
    // Update token usage stat
    prisma.tokenKey.update({
      where: { id: tokenId },
      data: { totalUsedTokens: { increment: tokensUsed } }
    }),
    // Log the request
    prisma.requestLog.create({
      data: {
        consumerId,
        tokenId,
        tokensUsed,
        status: "SUCCESS"
      }
    })
  ]).catch((e: any) => console.error("Billing commit failed: ", e));
}
