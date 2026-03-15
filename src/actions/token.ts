"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function addTokenAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const provider = formData.get("provider") as string;
  const key = formData.get("key") as string;

  if (!provider || !key) return { error: "Missing fields" };

  // Here you could add a real fetch to api.openai.com/v1/models to validate the key
  // For simplicity and speed of development, we do a basic format check
  if (!key.startsWith("sk-")) {
    return { error: "Invalid API Key format (must start with sk-)" };
  }

  const existing = await prisma.tokenKey.findUnique({ where: { key } });
  if (existing) {
    return { error: "This token is already shared in the platform" };
  }

  await prisma.tokenKey.create({
    data: {
      key,
      provider,
      userId: session.userId,
      status: "ACTIVE"
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTokenAction(tokenId: string) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  // Ensure owner
  const token = await prisma.tokenKey.findUnique({ where: { id: tokenId } });
  if (!token || token.userId !== session.userId) return { error: "Not allowed" };

  // We hard delete it for simplicity (or we can mark it as frozen)
  await prisma.tokenKey.delete({ where: { id: tokenId } });
  revalidatePath("/dashboard");
  return { success: true };
}
