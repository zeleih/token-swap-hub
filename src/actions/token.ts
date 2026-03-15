"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function addTokenAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const provider = formData.get("provider") as string;
  const key = formData.get("key") as string;
  const usageLimitStr = formData.get("usageLimit") as string;
  const allowedUsers = formData.get("allowedUsers") as string;

  if (!provider || !key) return { error: "缺少必填字段" };

  if (!key.startsWith("sk-")) {
    return { error: "API Key 格式不正确（需以 sk- 开头）" };
  }

  const existing = await prisma.tokenKey.findUnique({ where: { key } });
  if (existing) {
    return { error: "该 Token 已在平台中共享" };
  }

  const usageLimit = usageLimitStr ? parseInt(usageLimitStr) : null;

  await prisma.tokenKey.create({
    data: {
      key,
      provider,
      userId: session.userId,
      status: "ACTIVE",
      usageLimit: usageLimit && usageLimit > 0 ? usageLimit : null,
      allowedUsers: allowedUsers?.trim() || null
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTokenAction(tokenId: string) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const token = await prisma.tokenKey.findUnique({ where: { id: tokenId } });
  if (!token || token.userId !== session.userId) return { error: "Not allowed" };

  await prisma.tokenKey.delete({ where: { id: tokenId } });
  revalidatePath("/dashboard");
  return { success: true };
}
