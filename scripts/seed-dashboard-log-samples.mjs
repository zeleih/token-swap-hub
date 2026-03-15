import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const POINTS_PER_USD = 1000;

const priceMap = {
  "openai:gpt-4o-mini": { inputPricePerM: 0.15, outputPricePerM: 0.6 },
  "openai:gpt-4o": { inputPricePerM: 2.5, outputPricePerM: 10 },
  "deepseek:deepseek-chat": { inputPricePerM: 0.27, outputPricePerM: 1.1 },
  "deepseek:deepseek-reasoner": { inputPricePerM: 0.55, outputPricePerM: 2.19 },
  "claude:claude-sonnet-4": { inputPricePerM: 3, outputPricePerM: 15 },
  "gemini:gemini-2.5-flash": { inputPricePerM: 0.3, outputPricePerM: 2.5 },
  "grok:grok-3-mini": { inputPricePerM: 0.3, outputPricePerM: 0.5 },
  "moonshot:moonshot-v1-32k": { inputPricePerM: 24, outputPricePerM: 24 },
  "qwen:qwen-plus": { inputPricePerM: 0.56, outputPricePerM: 1.68 },
  "zhipu:glm-4-air": { inputPricePerM: 0.5, outputPricePerM: 0.5 },
  "mistral:mistral-small-latest": { inputPricePerM: 0.2, outputPricePerM: 0.6 },
};

const sampleTokenConfigs = [
  { key: "sample_demo_openai_primary", owner: "demo_user", provider: "openai", status: "ACTIVE", allowedUsers: null, usageLimit: 1200, totalUsedTokens: 486 },
  { key: "sample_demo_qwen_pool", owner: "demo_user", provider: "qwen", status: "ACTIVE", allowedUsers: null, usageLimit: 900, totalUsedTokens: 331 },
  { key: "sample_demo_moonshot_directed", owner: "demo_user", provider: "moonshot", status: "ACTIVE", allowedUsers: "test", usageLimit: null, totalUsedTokens: 0 },
  { key: "sample_demo_gemini_directed", owner: "demo_user", provider: "gemini", status: "ACTIVE", allowedUsers: "test", usageLimit: null, totalUsedTokens: 0 },
  { key: "sample_demo_mistral_paused", owner: "demo_user", provider: "mistral", status: "PAUSED", allowedUsers: null, usageLimit: 450, totalUsedTokens: 120 },
  { key: "sample_demo_deepseek_backup", owner: "demo_user", provider: "deepseek", status: "ACTIVE", allowedUsers: null, usageLimit: 760, totalUsedTokens: 211 },
  { key: "sample_demo_claude_backup", owner: "demo_user", provider: "claude", status: "ACTIVE", allowedUsers: null, usageLimit: 530, totalUsedTokens: 168 },
  { key: "sample_test_deepseek_primary", owner: "test", provider: "deepseek", status: "ACTIVE", allowedUsers: null, usageLimit: 1400, totalUsedTokens: 590 },
  { key: "sample_test_claude_pool", owner: "test", provider: "claude", status: "ACTIVE", allowedUsers: null, usageLimit: 760, totalUsedTokens: 288 },
  { key: "sample_test_grok_directed", owner: "test", provider: "grok", status: "ACTIVE", allowedUsers: "demo_user", usageLimit: null, totalUsedTokens: 0 },
  { key: "sample_test_zhipu_directed", owner: "test", provider: "zhipu", status: "ACTIVE", allowedUsers: "demo_user", usageLimit: null, totalUsedTokens: 0 },
  { key: "sample_test_openai_paused", owner: "test", provider: "openai", status: "PAUSED", allowedUsers: null, usageLimit: 520, totalUsedTokens: 144 },
  { key: "sample_test_qwen_backup", owner: "test", provider: "qwen", status: "ACTIVE", allowedUsers: null, usageLimit: 880, totalUsedTokens: 305 },
  { key: "sample_test_moonshot_backup", owner: "test", provider: "moonshot", status: "ACTIVE", allowedUsers: null, usageLimit: 620, totalUsedTokens: 226 },
];

const sampleLogConfigs = [
  { tokenKey: "sample_test_deepseek_primary", consumer: "demo_user", model: "deepseek-chat", promptTokens: 720, completionTokens: 260, isDirected: false, minutesAgo: 325 },
  { tokenKey: "sample_demo_openai_primary", consumer: "test", model: "gpt-4o-mini", promptTokens: 690, completionTokens: 210, isDirected: false, minutesAgo: 311 },
  { tokenKey: "sample_test_grok_directed", consumer: "demo_user", model: "grok-3-mini", promptTokens: 410, completionTokens: 130, isDirected: true, minutesAgo: 299 },
  { tokenKey: "sample_demo_moonshot_directed", consumer: "test", model: "moonshot-v1-32k", promptTokens: 460, completionTokens: 180, isDirected: true, minutesAgo: 286 },
  { tokenKey: "sample_test_claude_pool", consumer: "demo_user", model: "claude-sonnet-4", promptTokens: 800, completionTokens: 340, isDirected: false, minutesAgo: 274 },
  { tokenKey: "sample_demo_qwen_pool", consumer: "test", model: "qwen-plus", promptTokens: 750, completionTokens: 290, isDirected: false, minutesAgo: 261 },
  { tokenKey: "sample_test_zhipu_directed", consumer: "demo_user", model: "glm-4-air", promptTokens: 390, completionTokens: 180, isDirected: true, minutesAgo: 248 },
  { tokenKey: "sample_demo_gemini_directed", consumer: "test", model: "gemini-2.5-flash", promptTokens: 430, completionTokens: 120, isDirected: true, minutesAgo: 237 },
  { tokenKey: "sample_test_qwen_backup", consumer: "demo_user", model: "qwen-plus", promptTokens: 540, completionTokens: 210, isDirected: false, minutesAgo: 223 },
  { tokenKey: "sample_demo_deepseek_backup", consumer: "test", model: "deepseek-reasoner", promptTokens: 610, completionTokens: 250, isDirected: false, minutesAgo: 212 },
  { tokenKey: "sample_test_moonshot_backup", consumer: "demo_user", model: "moonshot-v1-32k", promptTokens: 470, completionTokens: 200, isDirected: false, minutesAgo: 198 },
  { tokenKey: "sample_demo_claude_backup", consumer: "test", model: "claude-sonnet-4", promptTokens: 520, completionTokens: 160, isDirected: false, minutesAgo: 184 },
  { tokenKey: "sample_test_deepseek_primary", consumer: "demo_user", model: "deepseek-chat", promptTokens: 580, completionTokens: 190, isDirected: false, minutesAgo: 171 },
  { tokenKey: "sample_demo_openai_primary", consumer: "test", model: "gpt-4o", promptTokens: 430, completionTokens: 150, isDirected: false, minutesAgo: 159 },
  { tokenKey: "sample_test_grok_directed", consumer: "demo_user", model: "grok-3-mini", promptTokens: 300, completionTokens: 110, isDirected: true, minutesAgo: 146 },
  { tokenKey: "sample_demo_moonshot_directed", consumer: "test", model: "moonshot-v1-32k", promptTokens: 340, completionTokens: 140, isDirected: true, minutesAgo: 134 },
  { tokenKey: "sample_test_claude_pool", consumer: "demo_user", model: "claude-sonnet-4", promptTokens: 660, completionTokens: 240, isDirected: false, minutesAgo: 118 },
  { tokenKey: "sample_demo_qwen_pool", consumer: "test", model: "qwen-plus", promptTokens: 490, completionTokens: 170, isDirected: false, minutesAgo: 103 },
  { tokenKey: "sample_test_zhipu_directed", consumer: "demo_user", model: "glm-4-air", promptTokens: 290, completionTokens: 90, isDirected: true, minutesAgo: 89 },
  { tokenKey: "sample_demo_gemini_directed", consumer: "test", model: "gemini-2.5-flash", promptTokens: 320, completionTokens: 100, isDirected: true, minutesAgo: 76 },
  { tokenKey: "sample_test_qwen_backup", consumer: "demo_user", model: "qwen-plus", promptTokens: 410, completionTokens: 140, isDirected: false, minutesAgo: 62 },
  { tokenKey: "sample_demo_deepseek_backup", consumer: "test", model: "deepseek-chat", promptTokens: 370, completionTokens: 130, isDirected: false, minutesAgo: 48 },
  { tokenKey: "sample_test_moonshot_backup", consumer: "demo_user", model: "moonshot-v1-32k", promptTokens: 360, completionTokens: 160, isDirected: false, minutesAgo: 30 },
  { tokenKey: "sample_demo_claude_backup", consumer: "test", model: "claude-sonnet-4", promptTokens: 310, completionTokens: 140, isDirected: false, minutesAgo: 18 },
  { tokenKey: "sample_test_deepseek_primary", consumer: "demo_user", model: "deepseek-chat", promptTokens: 280, completionTokens: 90, isDirected: false, minutesAgo: 11 },
  { tokenKey: "sample_demo_openai_primary", consumer: "test", model: "gpt-4o-mini", promptTokens: 260, completionTokens: 80, isDirected: false, minutesAgo: 5 },
];

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

function createLogPricing(provider, model, promptTokens, completionTokens, isDirected) {
  const price = priceMap[`${provider}:${model}`];
  if (!price) {
    throw new Error(`Missing price config for ${provider}:${model}`);
  }

  const estimatedCostUsd =
    (promptTokens / 1_000_000) * price.inputPricePerM +
    (completionTokens / 1_000_000) * price.outputPricePerM;
  const credits = estimatedCostUsd * POINTS_PER_USD;

  return {
    inputPricePerM: price.inputPricePerM,
    outputPricePerM: price.outputPricePerM,
    estimatedCostUsd,
    consumerPointsDelta: isDirected ? 0 : -credits,
    providerPointsDelta: isDirected ? 0 : credits,
  };
}

function createPriceSnapshots() {
  return Object.entries(priceMap).map(([key, price]) => {
    const [provider, model] = key.split(":");
    return {
      provider,
      model,
      displayName: model,
      inputPricePerM: price.inputPricePerM,
      outputPricePerM: price.outputPricePerM,
      currency: "USD",
      sourceUrl: "https://example.com/sample-pricing",
      fetchedAt: new Date(),
      isFallback: false,
    };
  });
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

  await prisma.user.update({
    where: { id: demoUser.id },
    data: { points: 248.732 },
  });

  await prisma.user.update({
    where: { id: testUser.id },
    data: { points: 191.486 },
  });

  await prisma.modelPriceSnapshot.deleteMany({
    where: {
      provider: {
        in: Array.from(new Set(Object.keys(priceMap).map((key) => key.split(":")[0]))),
      },
    },
  });

  await prisma.modelPriceSnapshot.createMany({
    data: createPriceSnapshots(),
  });

  const existingSampleTokens = await prisma.tokenKey.findMany({
    where: {
      key: {
        startsWith: "sample_",
      },
    },
    select: {
      id: true,
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
  }

  await prisma.tokenKey.deleteMany({
    where: {
      key: {
        startsWith: "sample_",
      },
    },
  });

  const sampleTokens = [];

  for (const config of sampleTokenConfigs) {
    const owner = userMap.get(config.owner);
    if (!owner) {
      throw new Error(`Missing token owner ${config.owner}.`);
    }

    const token = await prisma.tokenKey.create({
      data: {
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
        provider: true,
        userId: true,
      },
    });

    sampleTokens.push(token);
  }

  const tokenByKey = new Map(sampleTokens.map((token) => [token.key, token]));

  await prisma.requestLog.createMany({
    data: sampleLogConfigs.map((log) => {
      const token = tokenByKey.get(log.tokenKey);
      const consumer = userMap.get(log.consumer);

      if (!token || !consumer) {
        throw new Error(`Missing token or consumer for ${log.tokenKey}`);
      }

      const pricing = createLogPricing(token.provider, log.model, log.promptTokens, log.completionTokens, log.isDirected);

      return {
        consumerId: consumer.id,
        tokenId: token.id,
        tokensUsed: log.promptTokens + log.completionTokens,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        provider: token.provider,
        model: log.model,
        inputPricePerM: pricing.inputPricePerM,
        outputPricePerM: pricing.outputPricePerM,
        estimatedCostUsd: pricing.estimatedCostUsd,
        consumerPointsDelta: pricing.consumerPointsDelta,
        providerPointsDelta: pricing.providerPointsDelta,
        pricingSourceUrl: "https://example.com/sample-pricing",
        pricingRefreshedAt: new Date(),
        isDirected: log.isDirected,
        status: "SUCCESS",
        createdAt: minutesAgo(log.minutesAgo),
      };
    }),
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
