import { prisma } from "@/lib/prisma";

export const POINTS_PER_USD = 1000;
const PRICE_REFRESH_HOURS = 12;

type PriceSeed = {
  provider: string;
  model: string;
  displayName: string;
  inputPricePerM: number;
  outputPricePerM: number;
  sourceUrl: string;
  isFallback?: boolean;
};

type PricingResolution = {
  provider: string;
  model: string;
  displayName: string;
  inputPricePerM: number;
  outputPricePerM: number;
  sourceUrl: string;
  fetchedAt: Date;
  isFallback: boolean;
};

type PricingOverride = {
  provider: string;
  model: string;
  displayName: string;
  inputPricePerM: number;
  outputPricePerM: number;
  sourceUrl: string;
  fetchedAt: Date;
  isFallback?: boolean;
};

type UsageShape = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

const DEFAULT_MODEL_PRICES: PriceSeed[] = [
  {
    provider: "openai",
    model: "gpt-4o",
    displayName: "GPT-4o",
    inputPricePerM: 2.5,
    outputPricePerM: 10,
    sourceUrl: "https://platform.openai.com/pricing",
  },
  {
    provider: "openai",
    model: "gpt-4o-mini",
    displayName: "GPT-4o mini",
    inputPricePerM: 0.15,
    outputPricePerM: 0.6,
    sourceUrl: "https://platform.openai.com/pricing",
  },
  {
    provider: "openai",
    model: "gpt-4.1",
    displayName: "GPT-4.1",
    inputPricePerM: 2,
    outputPricePerM: 8,
    sourceUrl: "https://platform.openai.com/pricing",
  },
  {
    provider: "openai",
    model: "gpt-4.1-mini",
    displayName: "GPT-4.1 mini",
    inputPricePerM: 0.4,
    outputPricePerM: 1.6,
    sourceUrl: "https://platform.openai.com/pricing",
  },
];

const PROVIDER_SOURCE_URLS: Record<string, string> = {
  openai: "https://platform.openai.com/pricing",
};

function normalizeModelName(model: string | null | undefined) {
  return (model || "").trim().toLowerCase();
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function hoursSince(date: Date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

async function upsertPriceSeeds(seeds: PriceSeed[]) {
  const fetchedAt = new Date();
  await prisma.$transaction(
    seeds.map((seed) =>
      prisma.modelPriceSnapshot.upsert({
        where: {
          provider_model: {
            provider: seed.provider,
            model: seed.model,
          },
        },
        update: {
          displayName: seed.displayName,
          inputPricePerM: seed.inputPricePerM,
          outputPricePerM: seed.outputPricePerM,
          sourceUrl: seed.sourceUrl,
          fetchedAt,
          isFallback: seed.isFallback ?? false,
        },
        create: {
          provider: seed.provider,
          model: seed.model,
          displayName: seed.displayName,
          inputPricePerM: seed.inputPricePerM,
          outputPricePerM: seed.outputPricePerM,
          sourceUrl: seed.sourceUrl,
          fetchedAt,
          isFallback: seed.isFallback ?? false,
        },
      })
    )
  );
}

async function seedDefaultPricing() {
  const existingCount = await prisma.modelPriceSnapshot.count();
  if (existingCount === 0) {
    await upsertPriceSeeds(DEFAULT_MODEL_PRICES);
  }
}

async function fetchProviderText(provider: string) {
  const url = PROVIDER_SOURCE_URLS[provider];
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TokenHub/1.0",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return stripHtml(await response.text());
  } catch {
    return null;
  }
}

function maybeExtractPrices(
  text: string | null,
  provider: string,
  candidates: Array<{ model: string; displayName: string; sourceUrl?: string }>
) {
  if (!text) {
    return [];
  }

  const results: PriceSeed[] = [];

  for (const candidate of candidates) {
    const escapedModel = candidate.model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedModel}[\\s\\S]{0,80}?\\$\\s*([0-9.]+)[\\s\\S]{0,40}?\\$\\s*([0-9.]+)`, "i");
    const match = text.match(regex);
    if (!match) {
      continue;
    }

    results.push({
      provider,
      model: candidate.model,
      displayName: candidate.displayName,
      inputPricePerM: Number(match[1]),
      outputPricePerM: Number(match[2]),
      sourceUrl: candidate.sourceUrl || PROVIDER_SOURCE_URLS[provider],
    });
  }

  return results;
}

async function refreshPricingFromOfficialPages(provider?: string) {
  const providers = provider ? [provider] : ["openai"];
  const refreshedSeeds: PriceSeed[] = [];

  for (const currentProvider of providers) {
    const text = await fetchProviderText(currentProvider);

    if (currentProvider === "openai") {
      refreshedSeeds.push(
        ...maybeExtractPrices(text, currentProvider, [
          { model: "gpt-4o", displayName: "GPT-4o" },
          { model: "gpt-4o-mini", displayName: "GPT-4o mini" },
          { model: "gpt-4.1", displayName: "GPT-4.1" },
          { model: "gpt-4.1-mini", displayName: "GPT-4.1 mini" },
        ])
      );
    }
  }

  if (refreshedSeeds.length > 0) {
    await upsertPriceSeeds(refreshedSeeds);
  }
}

export async function ensurePricingFresh(provider?: string) {
  await seedDefaultPricing();

  const latestSnapshot = await prisma.modelPriceSnapshot.findFirst({
    where: provider ? { provider } : undefined,
    orderBy: { fetchedAt: "desc" },
  });

  if (!latestSnapshot || hoursSince(latestSnapshot.fetchedAt) >= PRICE_REFRESH_HOURS) {
    await refreshPricingFromOfficialPages(provider);
  }
}

export async function refreshAllPricingSnapshots() {
  await seedDefaultPricing();
  await refreshPricingFromOfficialPages();
  return prisma.modelPriceSnapshot.findMany({
    orderBy: [{ provider: "asc" }, { model: "asc" }],
  });
}

export async function getLatestPricingRefreshAt() {
  const latest = await prisma.modelPriceSnapshot.findFirst({
    orderBy: { fetchedAt: "desc" },
  });
  return latest?.fetchedAt ?? null;
}

function buildResolution(snapshot: {
  provider: string;
  model: string;
  displayName: string;
  inputPricePerM: number;
  outputPricePerM: number;
  sourceUrl: string;
  fetchedAt: Date;
  isFallback: boolean;
}): PricingResolution {
  return {
    provider: snapshot.provider,
    model: snapshot.model,
    displayName: snapshot.displayName,
    inputPricePerM: snapshot.inputPricePerM,
    outputPricePerM: snapshot.outputPricePerM,
    sourceUrl: snapshot.sourceUrl,
    fetchedAt: snapshot.fetchedAt,
    isFallback: snapshot.isFallback,
  };
}

export async function resolveModelPricing(provider: string, model: string | null | undefined) {
  await ensurePricingFresh(provider);

  const normalizedModel = normalizeModelName(model);
  const providerSnapshots = await prisma.modelPriceSnapshot.findMany({
    where: { provider },
  });

  const exact = providerSnapshots.find((snapshot) => snapshot.model === normalizedModel);
  if (exact) {
    return buildResolution(exact);
  }

  const prefix = providerSnapshots.find((snapshot) => normalizedModel.startsWith(snapshot.model));
  if (prefix) {
    return buildResolution(prefix);
  }

  const fallbackSeed = DEFAULT_MODEL_PRICES.find((seed) => seed.provider === provider);
  if (fallbackSeed) {
    return {
      provider,
      model: normalizedModel || fallbackSeed.model,
      displayName: model || fallbackSeed.displayName,
      inputPricePerM: fallbackSeed.inputPricePerM,
      outputPricePerM: fallbackSeed.outputPricePerM,
      sourceUrl: fallbackSeed.sourceUrl,
      fetchedAt: new Date(),
      isFallback: true,
    };
  }

  return null;
}

export function extractUsage(payload: unknown): UsageShape {
  if (!payload || typeof payload !== "object") {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  const usage = (payload as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  const usageRecord = usage as Record<string, unknown>;
  const promptTokens = Number(
    usageRecord.prompt_tokens ??
    usageRecord.input_tokens ??
    usageRecord.promptTokens ??
    0
  );
  const completionTokens = Number(
    usageRecord.completion_tokens ??
    usageRecord.output_tokens ??
    usageRecord.completionTokens ??
    0
  );
  const totalTokens = Number(
    usageRecord.total_tokens ??
    usageRecord.totalTokens ??
    promptTokens + completionTokens
  );

  return {
    promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
    completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
  };
}

export async function calculateCreditsForUsage(params: {
  provider: string;
  model: string | null | undefined;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  pricingOverride?: PricingOverride | null;
}) {
  const pricing = params.pricingOverride ?? await resolveModelPricing(params.provider, params.model);

  if (!pricing) {
    return null;
  }

  const inputCostUsd = (params.promptTokens / 1_000_000) * pricing.inputPricePerM;
  const outputCostUsd = (params.completionTokens / 1_000_000) * pricing.outputPricePerM;
  const estimatedCostUsd = inputCostUsd + outputCostUsd;
  const credits = estimatedCostUsd * POINTS_PER_USD;

  return {
    pricing,
    promptTokens: params.promptTokens,
    completionTokens: params.completionTokens,
    totalTokens: params.totalTokens,
    estimatedCostUsd,
    credits,
  };
}

export function formatPoints(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}
