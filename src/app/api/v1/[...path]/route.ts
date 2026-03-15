import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createParser } from "eventsource-parser";
import { getProviderBaseUrl } from "@/lib/providers";
import { calculateCreditsForUsage, extractUsage } from "@/lib/pricing";

export const runtime = "nodejs";

type RouteParams = { path: string[] };

type TokenWithUser = {
  id: string;
  key: string;
  provider: string;
  status: string;
  isAdminSupply: boolean;
  totalUsedTokens: number;
  usageLimit: number | null;
  allowedUsers: string | null;
  userId: string;
  user: {
    username: string;
  };
};

type ParsedRequestBody = {
  model: string | null;
  isStream: boolean;
  serializedBody?: string;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

async function parseRequestBody(req: NextRequest, pathString: string) {
  const parsed: ParsedRequestBody = {
    model: null,
    isStream: false,
  };

  if (req.method === "GET" || req.method === "HEAD") {
    return parsed;
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    parsed.serializedBody = await req.text();
    return parsed;
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    parsed.model = typeof body.model === "string" ? body.model : null;

    if (pathString === "chat/completions" && body.stream === true) {
      parsed.isStream = true;
      body.stream_options = { include_usage: true };
    }

    parsed.serializedBody = JSON.stringify(body);
    return parsed;
  } catch {
    parsed.serializedBody = await req.text();
    return parsed;
  }
}

async function handleProxy(req: NextRequest, params: RouteParams) {
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

  const consumerUsername = consumer.username;
  const availableTokens = (allActiveTokens as TokenWithUser[]).filter((token) => {
    // Check usage limit
    if (token.usageLimit !== null && token.totalUsedTokens >= token.usageLimit) return false;

    // Rule 1: Consumer's own tokens are always available
    if (token.userId === consumer.id) return true;

    // Rule 2: Admin supply (public pool) tokens are available to everyone
    if (token.isAdminSupply) return true;

    // Rule 3: Tokens directed to this consumer (allowor whitelist)
    if (token.allowedUsers) {
      const allowed = token.allowedUsers.split(",").map((user) => user.trim().toLowerCase());
      if (allowed.includes(consumerUsername.toLowerCase())) return true;
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

  // Reconstruct target URL based on chosen token's provider
  const targetUrl = new URL(req.url);
  const pathString = params.path.join("/");
  const providerBaseUrl = getProviderBaseUrl(chosenToken.provider);
  const proxyTarget = `${providerBaseUrl}/${pathString}${targetUrl.search}`;
  const parsedBody = await parseRequestBody(req, pathString);

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: {
      "Authorization": `Bearer ${chosenToken.key}`,
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
  };

  if (parsedBody.serializedBody !== undefined) {
    fetchOptions.body = parsedBody.serializedBody;
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
  let finalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  // If streaming
  if (parsedBody.isStream && upstreamRes.body) {
    let parser: ReturnType<typeof createParser>;
    const transformStream = new TransformStream({
      start() {
        parser = createParser({ onEvent: (event) => {
          if (event.data !== "[DONE]") {
            try {
              const data = JSON.parse(event.data);
              const usage = extractUsage(data);
              if (usage.totalTokens > 0) {
                finalUsage = usage;
              }
            } catch {}
          }
        } });
      },
      transform(chunk, controller) {
        const decoded = new TextDecoder().decode(chunk);
        parser.feed(decoded);
        controller.enqueue(chunk);
      },
      async flush() {
        // Record billing when stream ends
        await commitBilling({
          consumerId: consumer.id,
          tokenId: chosenToken.id,
          providerOwnerId: chosenToken.userId,
          provider: chosenToken.provider,
          model: parsedBody.model,
          usage: finalUsage,
          isAdminSupply: chosenToken.isAdminSupply,
          isDirected,
        });
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
      finalUsage = extractUsage(data);
    } catch {}

    // Record billing directly
    await commitBilling({
      consumerId: consumer.id,
      tokenId: chosenToken.id,
      providerOwnerId: chosenToken.userId,
      provider: chosenToken.provider,
      model: parsedBody.model,
      usage: finalUsage,
      isAdminSupply: chosenToken.isAdminSupply,
      isDirected,
    });

    return new NextResponse(bodyStr, {
      status: upstreamRes.status,
      headers: upstreamRes.headers
    });
  }
}

async function commitBilling(params: {
  consumerId: string;
  tokenId: string;
  providerOwnerId: string;
  provider: string;
  model: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  isAdminSupply: boolean;
  isDirected: boolean;
}) {
  if (params.usage.totalTokens <= 0) return;

  const creditResult = await calculateCreditsForUsage({
    provider: params.provider,
    model: params.model,
    promptTokens: params.usage.promptTokens,
    completionTokens: params.usage.completionTokens,
    totalTokens: params.usage.totalTokens,
  });

  const credits = creditResult?.credits ?? 0;
  const estimatedCostUsd = creditResult?.estimatedCostUsd ?? 0;
  const consumerPointsDelta = params.isDirected ? 0 : -credits;
  const providerPointsDelta = params.isDirected || params.isAdminSupply ? 0 : credits;

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.requestLog.create({
      data: {
        consumerId: params.consumerId,
        tokenId: params.tokenId,
        tokensUsed: params.usage.totalTokens,
        promptTokens: params.usage.promptTokens,
        completionTokens: params.usage.completionTokens,
        provider: params.provider,
        model: params.model,
        inputPricePerM: creditResult?.pricing.inputPricePerM,
        outputPricePerM: creditResult?.pricing.outputPricePerM,
        estimatedCostUsd,
        consumerPointsDelta,
        providerPointsDelta,
        pricingSourceUrl: creditResult?.pricing.sourceUrl,
        pricingRefreshedAt: creditResult?.pricing.fetchedAt,
        isDirected: params.isDirected,
        status: "SUCCESS",
      }
    })
  ];

  // 定向 Token：不计入总额度，不扣分，不加分
  if (!params.isDirected) {
    // 更新 token 使用量（仅非定向）
    operations.push(
      prisma.tokenKey.update({
        where: { id: params.tokenId },
        data: { totalUsedTokens: { increment: params.usage.totalTokens } }
      })
    );
    // 扣消费者点数
    operations.push(
      prisma.user.update({
        where: { id: params.consumerId },
        data: { points: { increment: consumerPointsDelta } }
      })
    );
    // 非管理员供应的，奖励提供者
    if (!params.isAdminSupply) {
      operations.push(
        prisma.user.update({
          where: { id: params.providerOwnerId },
          data: { points: { increment: providerPointsDelta } }
        })
      );
    }
  }

  await prisma.$transaction(operations).catch((error) => console.error("Billing commit failed:", error));
}
