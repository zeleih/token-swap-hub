"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { normalizeBaseUrl, parseCustomModelsConfig } from "@/lib/custom-models";
import type { FormState } from "@/lib/form-state";

export async function addTokenAction(prevState: FormState | undefined, formData: FormData) {
  void prevState;
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const provider = formData.get("provider") as string;
  const key = formData.get("key") as string;
  const creditLimitStr = formData.get("creditLimit") as string;
  const allowedUsers = formData.get("allowedUsers") as string;
  const customBaseUrl = formData.get("customBaseUrl") as string;
  const customModelsConfigRaw = formData.get("customModelsConfig") as string;

  if (!provider || !key) return { error: "缺少必填字段" };
  if (!["openai", "custom"].includes(provider)) return { error: "当前仅支持 OpenAI 和自定义平台" };

  if (key.length < 8) {
    return { error: "API Key 太短" };
  }

  const existing = await prisma.tokenKey.findUnique({ where: { key } });
  if (existing) {
    return { error: "该 Token 已在平台中共享" };
  }

  const creditLimit = creditLimitStr ? parseFloat(creditLimitStr) : null;
  if (creditLimit !== null && (!Number.isFinite(creditLimit) || creditLimit <= 0)) {
    return { error: "额度必须大于 0" };
  }

  let normalizedCustomBaseUrl: string | null = null;
  let customModelsConfig: string | null = null;

  if (provider === "custom") {
    normalizedCustomBaseUrl = normalizeBaseUrl(customBaseUrl || "");
    if (!/^https?:\/\//i.test(normalizedCustomBaseUrl)) {
      return { error: "自定义平台 URL 必须以 http:// 或 https:// 开头" };
    }

    const customModels = parseCustomModelsConfig(customModelsConfigRaw);
    if (customModels.length === 0) {
      return { error: "请至少配置一个自定义模型" };
    }

    customModelsConfig = JSON.stringify(customModels);
  }

  await prisma.tokenKey.create({
    data: {
      key,
      provider,
      userId: session.userId,
      status: "ACTIVE",
      creditLimit,
      customBaseUrl: normalizedCustomBaseUrl,
      customModelsConfig,
      allowedUsers: allowedUsers?.trim() || null
    }
  });

  revalidatePath("/", "layout");
  return { success: true, resetToken: crypto.randomUUID() };
}

export async function deleteTokenAction(tokenId: string) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const token = await prisma.tokenKey.findUnique({ where: { id: tokenId } });
  if (!token || token.userId !== session.userId) return { error: "Not allowed" };

  await prisma.$transaction([
    prisma.requestLog.deleteMany({ where: { tokenId } }),
    prisma.tokenKey.delete({ where: { id: tokenId } }),
  ]);

  revalidatePath("/", "layout");
  return { success: true };
}

// 暂停/恢复 Token
export async function toggleTokenAction(tokenId: string) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const token = await prisma.tokenKey.findUnique({ where: { id: tokenId } });
  if (!token || token.userId !== session.userId) return { error: "Not allowed" };

  const newStatus = token.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  await prisma.tokenKey.update({
    where: { id: tokenId },
    data: { status: newStatus }
  });

  revalidatePath("/", "layout");
  return { success: true, status: newStatus };
}
