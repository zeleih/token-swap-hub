"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import type { FormState } from "@/lib/form-state";
import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function getLocale() {
  const c = await cookies();
  return c.get("NEXT_LOCALE")?.value || "zh";
}

export async function loginAction(prevState: FormState | undefined, formData: FormData) {
  void prevState;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) return { error: "用户名和密码不能为空" };

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { error: "用户名或密码错误" };

  const valid = await compare(password, user.passwordHash);
  if (!valid) return { error: "用户名或密码错误" };

  await createSession(user.id);
  const locale = await getLocale();
  redirect(`/${locale}/dashboard`);
}

export async function registerAction(prevState: FormState | undefined, formData: FormData) {
  void prevState;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const inviteCode = formData.get("inviteCode") as string;

  if (!username || !password || !inviteCode) {
    return { error: "所有字段都必须填写" };
  }

  if (username.length < 2 || username.length > 30) {
    return { error: "用户名长度须在 2-30 个字符之间" };
  }

  const codeRecord = await prisma.inviteCode.findUnique({
    where: { code: inviteCode }
  });

  if (!codeRecord || codeRecord.usedCount >= codeRecord.maxUses) {
    return { error: "邀请码无效或已过期" };
  }

  const existUser = await prisma.user.findUnique({ where: { username } });
  if (existUser) return { error: "该用户名已被注册" };

  const passwordHash = await hash(password, 10);
  const platformKey = "tk_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const newUser = await prisma.$transaction(async (tx) => {
    await tx.inviteCode.update({
      where: { id: codeRecord.id },
      data: { usedCount: { increment: 1 } }
    });

    return await tx.user.create({
      data: {
        username,
        displayName: username,
        passwordHash,
        platformKey,
        points: 100,
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
