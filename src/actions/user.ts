"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// 更新个人信息
export async function updateProfileAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const displayName = formData.get("displayName") as string;
  const showOnLeaderboard = formData.get("showOnLeaderboard") === "on";

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      displayName: displayName?.trim() || null,
      showOnLeaderboard
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// 重置平台 Key
export async function resetPlatformKeyAction() {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const newKey = "tk_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  await prisma.user.update({
    where: { id: session.userId },
    data: { platformKey: newKey }
  });

  revalidatePath("/dashboard");
  return { success: true, newKey };
}

// 赠送积分
export async function transferPointsAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session) return { error: "Unauthorized" };

  const toUsername = formData.get("toUsername") as string;
  const amountStr = formData.get("amount") as string;
  const confirmation = formData.get("confirmation") as string;

  if (!toUsername || !amountStr) return { error: "请填写所有字段" };

  const amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) return { error: "赠送数量必须大于 0" };

  // 二次确认：需手动输入 CONFIRM
  if (confirmation !== "CONFIRM") {
    return { error: "请输入 CONFIRM 以确认赠送" };
  }

  const sender = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!sender) return { error: "用户不存在" };
  if (sender.points < amount) return { error: "点数不足" };

  const receiver = await prisma.user.findUnique({ where: { username: toUsername } });
  if (!receiver) return { error: "目标用户不存在" };
  if (receiver.id === sender.id) return { error: "不能赠送给自己" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: sender.id },
      data: { points: { decrement: amount } }
    }),
    prisma.user.update({
      where: { id: receiver.id },
      data: { points: { increment: amount } }
    }),
    prisma.pointTransfer.create({
      data: {
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount
      }
    })
  ]);

  revalidatePath("/dashboard");
  return { success: true, message: `成功赠送 ${amount} 点数给 ${toUsername}` };
}

// 排行榜查询（排除定向使用）
export async function getLeaderboardData(range: string) {
  let dateFilter: Date | undefined;
  const now = new Date();

  switch (range) {
    case "day":
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      const dayOfWeek = now.getDay();
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      break;
    case "month":
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      dateFilter = new Date(now.getFullYear(), 0, 1);
      break;
    default: // "all"
      dateFilter = undefined;
  }

  const baseWhere = {
    status: "SUCCESS",
    isDirected: false, // 排除定向使用
    ...(dateFilter ? { createdAt: { gte: dateFilter } } : {})
  };

  // 贡献榜：按 Token 被使用的量排序（排除定向）
  const contributionLogs = await prisma.requestLog.groupBy({
    by: ["tokenId"],
    where: baseWhere,
    _sum: { tokensUsed: true }
  });

  // 获取 Token 和对应的用户
  const tokenIds = contributionLogs.map(l => l.tokenId);
  const tokens = await prisma.tokenKey.findMany({
    where: { id: { in: tokenIds } },
    include: { user: { select: { id: true, username: true, displayName: true, showOnLeaderboard: true } } }
  });

  const tokenMap = new Map(tokens.map(t => [t.id, t.user]));
  const contributionMap = new Map<string, { username: string; displayName: string | null; total: number }>();

  for (const log of contributionLogs) {
    const user = tokenMap.get(log.tokenId);
    if (!user || !user.showOnLeaderboard) continue;
    const existing = contributionMap.get(user.id);
    const total = log._sum.tokensUsed || 0;
    if (existing) {
      existing.total += total;
    } else {
      contributionMap.set(user.id, { username: user.username, displayName: user.displayName, total });
    }
  }

  const contributionBoard = Array.from(contributionMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  // 消费榜：按用户消费的总量排序（排除定向）
  const consumptionLogs = await prisma.requestLog.groupBy({
    by: ["consumerId"],
    where: baseWhere,
    _sum: { tokensUsed: true }
  });

  const consumerIds = consumptionLogs.map(l => l.consumerId);
  const consumers = await prisma.user.findMany({
    where: { id: { in: consumerIds }, showOnLeaderboard: true },
    select: { id: true, username: true, displayName: true }
  });

  const consumerMap = new Map(consumers.map(c => [c.id, c]));
  const consumptionBoard = consumptionLogs
    .filter(l => consumerMap.has(l.consumerId))
    .map(l => {
      const user = consumerMap.get(l.consumerId)!;
      return { username: user.username, displayName: user.displayName, total: l._sum.tokensUsed || 0 };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return { contributionBoard, consumptionBoard };
}
