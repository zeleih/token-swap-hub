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

  // Pick a token: only consumer's own tokens + tokens directed to consumer + admin supply tokens
  const allActiveTokens = await prisma.tokenKey.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { username: true } } }
  });

  const consumer_username = (consumer as any).username;
  const availableTokens = allActiveTokens.filter((token: any) => {
    // Check usage limit
    if (token.usageLimit !== null && token.totalUsedTokens >= token.usageLimit) return false;

    // Rule 1: Consumer's own tokens are always available
    if (token.userId === consumer.id) return true;

    // Rule 2: Admin supply (public pool) tokens are available to everyone
    if (token.isAdminSupply) return true;

    // Rule 3: Tokens directed to this consumer (allowor whitelist)
    if (token.allowedUsers) {
      const allowed = token.allowedUsers.split(",").map((u: string) => u.trim().toLowerCase());
      if (allowed.includes(consumer_username.toLowerCase())) return true;
    }

    // Otherwise: not available (don't use other people's tokens)
    return false;
  });

  if (availableTokens.length === 0) {
    return NextResponse.json({ error: "没有可用的 Token。请先添加自己的 Token，或等待有人向您定向开放。" }, { status: 503 });
  }

  // Simple random picking among available tokens
  const chosenToken = availableTokens[Math.floor(Math.random() * availableTokens.length)];
  // 定向开放的 Token（有白名单）不赚取信用点数
  const isDirected = !!chosenToken.allowedUsers;

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
        commitBilling(consumer.id, chosenToken.id, chosenToken.userId, finalTokensUsed, chosenToken.isAdminSupply, isDirected);
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
    commitBilling(consumer.id, chosenToken.id, chosenToken.userId, finalTokensUsed, chosenToken.isAdminSupply, isDirected);

    return new NextResponse(bodyStr, {
      status: upstreamRes.status,
      headers: upstreamRes.headers
    });
  }
}

async function commitBilling(consumerId: string, tokenId: string, providerId: string, tokensUsed: number, isAdminSupply: boolean, isDirected: boolean) {
  if (tokensUsed <= 0) return;

  const ops: any[] = [
    // 记录请求日志（始终记录，标记是否定向）
    prisma.requestLog.create({
      data: { consumerId, tokenId, tokensUsed, isDirected, status: "SUCCESS" }
    })
  ];

  // 定向 Token：不计入总额度，不扣分，不加分
  if (!isDirected) {
    // 更新 token 使用量（仅非定向）
    ops.push(
      prisma.tokenKey.update({
        where: { id: tokenId },
        data: { totalUsedTokens: { increment: tokensUsed } }
      })
    );
    // 扣消费者点数
    ops.push(
      prisma.user.update({
        where: { id: consumerId },
        data: { points: { decrement: tokensUsed } }
      })
    );
    // 非管理员供应的，奖励提供者
    if (!isAdminSupply) {
      ops.push(
        prisma.user.update({
          where: { id: providerId },
          data: { points: { increment: tokensUsed } }
        })
      );
    }
  }

  await prisma.$transaction(ops).catch((e: any) => console.error("Billing commit failed: ", e));
}
