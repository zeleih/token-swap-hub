import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleTokenConfigs = [
  {
    key: "sample_demo_openai_primary",
    owner: "demo_user",
    provider: "openai",
    status: "ACTIVE",
    allowedUsers: null,
    usageLimit: 1200,
    totalUsedTokens: 486,
  },
  {
    key: "sample_demo_qwen_pool",
    owner: "demo_user",
    provider: "qwen",
    status: "ACTIVE",
    allowedUsers: null,
    usageLimit: 900,
    totalUsedTokens: 331,
  },
  {
    key: "sample_demo_moonshot_directed",
    owner: "demo_user",
    provider: "moonshot",
    status: "ACTIVE",
    allowedUsers: "test",
    usageLimit: null,
    totalUsedTokens: 0,
  },
  {
    key: "sample_demo_gemini_directed",
    owner: "demo_user",
    provider: "gemini",
    status: "ACTIVE",
    allowedUsers: "test",
    usageLimit: null,
    totalUsedTokens: 0,
  },
  {
    key: "sample_demo_mistral_paused",
    owner: "demo_user",
    provider: "mistral",
    status: "PAUSED",
    allowedUsers: null,
    usageLimit: 450,
    totalUsedTokens: 120,
  },
  {
    key: "sample_test_deepseek_primary",
    owner: "test",
    provider: "deepseek",
    status: "ACTIVE",
    allowedUsers: null,
    usageLimit: 1400,
    totalUsedTokens: 590,
  },
  {
    key: "sample_test_claude_pool",
    owner: "test",
    provider: "claude",
    status: "ACTIVE",
    allowedUsers: null,
    usageLimit: 760,
    totalUsedTokens: 288,
  },
  {
    key: "sample_test_grok_directed",
    owner: "test",
    provider: "grok",
    status: "ACTIVE",
    allowedUsers: "demo_user",
    usageLimit: null,
    totalUsedTokens: 0,
  },
  {
    key: "sample_test_zhipu_directed",
    owner: "test",
    provider: "zhipu",
    status: "ACTIVE",
    allowedUsers: "demo_user",
    usageLimit: null,
    totalUsedTokens: 0,
  },
  {
    key: "sample_test_openai_paused",
    owner: "test",
    provider: "openai",
    status: "PAUSED",
    allowedUsers: null,
    usageLimit: 520,
    totalUsedTokens: 144,
  },
];

const sampleLogConfigs = [
  { tokenKey: "sample_test_deepseek_primary", consumer: "demo_user", tokensUsed: 112, isDirected: false, minutesAgo: 285 },
  { tokenKey: "sample_demo_openai_primary", consumer: "test", tokensUsed: 95, isDirected: false, minutesAgo: 272 },
  { tokenKey: "sample_test_grok_directed", consumer: "demo_user", tokensUsed: 38, isDirected: true, minutesAgo: 259 },
  { tokenKey: "sample_demo_moonshot_directed", consumer: "test", tokensUsed: 44, isDirected: true, minutesAgo: 246 },
  { tokenKey: "sample_test_claude_pool", consumer: "demo_user", tokensUsed: 81, isDirected: false, minutesAgo: 231 },
  { tokenKey: "sample_demo_qwen_pool", consumer: "test", tokensUsed: 76, isDirected: false, minutesAgo: 216 },
  { tokenKey: "sample_test_zhipu_directed", consumer: "demo_user", tokensUsed: 29, isDirected: true, minutesAgo: 204 },
  { tokenKey: "sample_demo_gemini_directed", consumer: "test", tokensUsed: 31, isDirected: true, minutesAgo: 191 },
  { tokenKey: "sample_test_deepseek_primary", consumer: "demo_user", tokensUsed: 64, isDirected: false, minutesAgo: 178 },
  { tokenKey: "sample_demo_openai_primary", consumer: "test", tokensUsed: 58, isDirected: false, minutesAgo: 164 },
  { tokenKey: "sample_test_grok_directed", consumer: "demo_user", tokensUsed: 22, isDirected: true, minutesAgo: 153 },
  { tokenKey: "sample_demo_moonshot_directed", consumer: "test", tokensUsed: 27, isDirected: true, minutesAgo: 142 },
  { tokenKey: "sample_test_claude_pool", consumer: "demo_user", tokensUsed: 73, isDirected: false, minutesAgo: 129 },
  { tokenKey: "sample_demo_qwen_pool", consumer: "test", tokensUsed: 69, isDirected: false, minutesAgo: 118 },
  { tokenKey: "sample_test_zhipu_directed", consumer: "demo_user", tokensUsed: 34, isDirected: true, minutesAgo: 104 },
  { tokenKey: "sample_demo_gemini_directed", consumer: "test", tokensUsed: 19, isDirected: true, minutesAgo: 91 },
  { tokenKey: "sample_test_deepseek_primary", consumer: "demo_user", tokensUsed: 47, isDirected: false, minutesAgo: 78 },
  { tokenKey: "sample_demo_openai_primary", consumer: "test", tokensUsed: 52, isDirected: false, minutesAgo: 66 },
  { tokenKey: "sample_test_grok_directed", consumer: "demo_user", tokensUsed: 16, isDirected: true, minutesAgo: 54 },
  { tokenKey: "sample_demo_moonshot_directed", consumer: "test", tokensUsed: 24, isDirected: true, minutesAgo: 43 },
  { tokenKey: "sample_test_claude_pool", consumer: "demo_user", tokensUsed: 61, isDirected: false, minutesAgo: 31 },
  { tokenKey: "sample_demo_qwen_pool", consumer: "test", tokensUsed: 49, isDirected: false, minutesAgo: 22 },
  { tokenKey: "sample_test_zhipu_directed", consumer: "demo_user", tokensUsed: 14, isDirected: true, minutesAgo: 11 },
  { tokenKey: "sample_demo_gemini_directed", consumer: "test", tokensUsed: 18, isDirected: true, minutesAgo: 5 },
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

  const existingSampleTokens = await prisma.tokenKey.findMany({
    where: {
      key: {
        startsWith: "sample_",
      },
    },
    select: {
      id: true,
      key: true,
    },
  });

  if (existingSampleTokens.length > 0) {
    await prisma.requestLog.deleteMany({
      where: {
        tokenId: {
          in: existingSampleTokens.map((token) => token.id),
        },
      },
    });

    await prisma.tokenKey.deleteMany({
      where: {
        key: {
          startsWith: "sample_",
          notIn: sampleTokenConfigs.map((token) => token.key),
        },
      },
    });
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
        status: config.status,
        allowedUsers: config.allowedUsers,
        usageLimit: config.usageLimit,
        userId: owner.id,
        totalUsedTokens: config.totalUsedTokens,
      },
      create: {
        key: config.key,
        provider: config.provider,
        status: config.status,
        allowedUsers: config.allowedUsers,
        usageLimit: config.usageLimit,
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

  await prisma.requestLog.createMany({
    data: sampleLogConfigs.map((log) => ({
      consumerId: userMap.get(log.consumer).id,
      tokenId: tokenByKey.get(log.tokenKey).id,
      tokensUsed: log.tokensUsed,
      isDirected: log.isDirected,
      status: "SUCCESS",
      createdAt: minutesAgo(log.minutesAgo),
    })),
  });

  console.log("Seeded rich dashboard sample tokens and request logs for demo_user / test.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
