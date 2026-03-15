"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// 从 cookie 中读取当前 locale，默认 zh
async function getLocale() {
  const c = await cookies();
  return c.get("NEXT_LOCALE")?.value || "zh";
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and Password required" };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid credentials" };

  const valid = await compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials" };

  await createSession(user.id);
  const locale = await getLocale();
  redirect(`/${locale}/dashboard`);
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const inviteCode = formData.get("inviteCode") as string;

  if (!email || !password || !inviteCode) {
    return { error: "All fields are required" };
  }

  // Check Invite Code
  const codeRecord = await prisma.inviteCode.findUnique({
    where: { code: inviteCode }
  });

  if (!codeRecord || codeRecord.usedCount >= codeRecord.maxUses) {
    return { error: "Invalid or expired invite code" };
  }

  // Check Email
  const existUser = await prisma.user.findUnique({ where: { email } });
  if (existUser) return { error: "Email already registered" };

  // Register
  const passwordHash = await hash(password, 10);
  const platformKey = "tk_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
  .map(b => b.toString(16).padStart(2, '0')).join('');

  const newUser = await prisma.$transaction(async (tx: any) => {
    // Increment invite code usage
    await tx.inviteCode.update({
      where: { id: codeRecord.id },
      data: { usedCount: { increment: 1 } }
    });

    // Create user with 100 bonus starting points (can be customized)
    return await tx.user.create({
      data: {
        email,
        passwordHash,
        platformKey,
        points: 100, // Pre-given bonus credits
        inviteCodeId: codeRecord.id,
      }
    });
  });

  await createSession(newUser.id);
  const locale = await getLocale();
  redirect(`/${locale}/dashboard`);
}

export async function logoutAction() {
  await deleteSession();
  const locale = await getLocale();
  redirect(`/${locale}`);
}
