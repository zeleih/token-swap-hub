import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleTokenConfigs = [
  {
    key: "sample_demo_public_token",
    owner: "demo_user",
    provider: "openai",
    allowedUsers: null,
    totalUsedTokens: 122,
  },
  {
    key: "sample_demo_directed_token",
    owner: "demo_user",
    provider: "moonshot",
    allowedUsers: "test",
    totalUsedTokens: 0,
  },
  {
    key: "sample_test_public_token",
    owner: "test",
    provider: "deepseek",
    allowedUsers: null,
    totalUsedTokens: 202,
  },
  {
    key: "sample_test_directed_token",
    owner: "test",
    provider: "grok",
    allowedUsers: "demo_user",
    totalUsedTokens: 0,
  },
];

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      username: { in: ["demo_user", "test"] },
    },
    select: {
      id: true,
      username: true,
    },
  });

  const userMap = new Map(users.map((user) => [user.username, user]));
  const demoUser = userMap.get("demo_user");
  const testUser = userMap.get("test");

  if (!demoUser || !testUser) {
    throw new Error("Missing sample users demo_user or test.");
  }

  const sampleTokens = [];

  for (const config of sampleTokenConfigs) {
    const owner = userMap.get(config.owner);
    if (!owner) {
      throw new Error(`Missing token owner ${config.owner}.`);
    }

    const token = await prisma.tokenKey.upsert({
      where: { key: config.key },
      update: {
        provider: config.provider,
        status: "ACTIVE",
        allowedUsers: config.allowedUsers,
        usageLimit: null,
        userId: owner.id,
        totalUsedTokens: config.totalUsedTokens,
      },
      create: {
        key: config.key,
        provider: config.provider,
        status: "ACTIVE",
        allowedUsers: config.allowedUsers,
        usageLimit: null,
        userId: owner.id,
        totalUsedTokens: config.totalUsedTokens,
      },
      select: {
        id: true,
        key: true,
      },
    });

    sampleTokens.push(token);
  }

  const tokenByKey = new Map(sampleTokens.map((token) => [token.key, token]));

  await prisma.requestLog.deleteMany({
    where: {
      tokenId: {
        in: sampleTokens.map((token) => token.id),
      },
    },
  });

  await prisma.requestLog.createMany({
    data: [
      {
        consumerId: demoUser.id,
        tokenId: tokenByKey.get("sample_test_public_token").id,
        tokensUsed: 120,
        isDirected: false,
        status: "SUCCESS",
        createdAt: minutesAgo(75),
      },
      {
        consumerId: testUser.id,
        tokenId: tokenByKey.get("sample_demo_public_token").id,
        tokensUsed: 95,
        isDirected: false,
        status: "SUCCESS",
        createdAt: minutesAgo(62),
      },
      {
        consumerId: demoUser.id,
        tokenId: tokenByKey.get("sample_test_directed_token").id,
        tokensUsed: 48,
        isDirected: true,
        status: "SUCCESS",
        createdAt: minutesAgo(48),
      },
      {
        consumerId: testUser.id,
        tokenId: tokenByKey.get("sample_demo_directed_token").id,
        tokensUsed: 33,
        isDirected: true,
        status: "SUCCESS",
        createdAt: minutesAgo(36),
      },
      {
        consumerId: demoUser.id,
        tokenId: tokenByKey.get("sample_demo_public_token").id,
        tokensUsed: 27,
        isDirected: false,
        status: "SUCCESS",
        createdAt: minutesAgo(28),
      },
      {
        consumerId: testUser.id,
        tokenId: tokenByKey.get("sample_test_public_token").id,
        tokensUsed: 18,
        isDirected: false,
        status: "SUCCESS",
        createdAt: minutesAgo(19),
      },
      {
        consumerId: demoUser.id,
        tokenId: tokenByKey.get("sample_test_public_token").id,
        tokensUsed: 64,
        isDirected: false,
        status: "SUCCESS",
        createdAt: minutesAgo(11),
      },
      {
        consumerId: testUser.id,
        tokenId: tokenByKey.get("sample_demo_directed_token").id,
        tokensUsed: 21,
        isDirected: true,
        status: "SUCCESS",
        createdAt: minutesAgo(4),
      },
    ],
  });

  console.log("Seeded dashboard sample tokens and request logs for demo_user / test.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
