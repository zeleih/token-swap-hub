import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import DashboardCopyKey from "./components/DashboardCopyKey";
import PlatformKeyCard from "./components/PlatformKeyCard";
import AddTokenForm from "./components/AddTokenForm";
import TokenList from "./components/TokenList";
import UsageLogPanel from "./components/UsageLogPanel";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ensurePricingFresh,
  formatPoints,
  formatUsd,
  getLatestPricingRefreshAt,
} from "@/lib/pricing";
import { refreshPricingAction } from "@/actions/pricing";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { parseCustomModelsConfig } from "@/lib/custom-models";
import HelpHint from "./components/HelpHint";

type UsageLogType = "usage" | "provided" | "directedUsage" | "directedProvided";

type DashboardLog = {
  id: string;
  consumerId: string;
  provider: string | null;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  tokensUsed: number;
  inputPricePerM: number | null;
  outputPricePerM: number | null;
  estimatedCostUsd: number | null;
  consumerPointsDelta: number;
  providerPointsDelta: number;
  isDirected: boolean;
  status: string;
  createdAt: Date;
  token: {
    provider: string;
  };
};

type AccessibleToken = {
  id: string;
  provider: string;
  isAdminSupply: boolean;
  usedCredits: number;
  creditLimit: number | null;
  customProviderName: string | null;
  customBaseUrl: string | null;
  customModelsConfig: string | null;
  allowedUsers: string | null;
  userId: string;
  user: {
    username: string;
  };
};

type AvailableModelGroup = {
  id: string;
  providerLabel: string;
  helperText: string | null;
  models: Array<{
    id: string;
    name: string;
    inputPricePerM: number | null;
    outputPricePerM: number | null;
  }>;
};

type PageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

function resolveTab(tab?: string | string[]) {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value === "contribution" ? "contribution" : "usage";
}

function getProviderLabel(token: {
  provider: string;
  customProviderName?: string | null;
  customBaseUrl?: string | null;
}) {
  if (token.provider === "openai") {
    return "OpenAI";
  }

  return token.customProviderName?.trim() || token.customBaseUrl?.trim() || "Custom";
}

function formatPricePerM(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await verifySession();
  const locale = await getLocale();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("Dashboard");
  await ensurePricingFresh();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeTab = resolveTab(resolvedSearchParams?.tab);
  const userId = session.userId;
  const platformUrl = process.env.PLATFORM_URL || "http://localhost:3000/api/v1";
  const latestPricingRefreshAt = await getLatestPricingRefreshAt();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      providedTokens: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const allActiveTokens = await prisma.tokenKey.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  const accessibleTokens = (allActiveTokens as AccessibleToken[]).filter((token) => {
    if (!["openai", "custom"].includes(token.provider)) {
      return false;
    }

    if (token.creditLimit !== null && token.usedCredits >= token.creditLimit) {
      return false;
    }

    if (token.provider === "custom" && (!token.customBaseUrl || !token.customModelsConfig)) {
      return false;
    }

    if (token.userId === userId) {
      return true;
    }

    if (token.isAdminSupply) {
      return true;
    }

    if (token.allowedUsers) {
      const allowed = token.allowedUsers.split(",").map((entry) => entry.trim().toLowerCase());
      return allowed.includes(user.username.toLowerCase());
    }

    return false;
  });

  const pricingSnapshots = await prisma.modelPriceSnapshot.findMany({
    orderBy: [{ provider: "asc" }, { model: "asc" }],
  });

  const availableModelGroups: AvailableModelGroup[] = [];
  const hasOpenAiAccess = accessibleTokens.some((token) => token.provider === "openai");

  if (hasOpenAiAccess) {
    availableModelGroups.push({
      id: "openai",
      providerLabel: "OpenAI",
      helperText: null,
      models: pricingSnapshots
        .filter((snapshot) => snapshot.provider === "openai")
        .map((snapshot) => ({
          id: snapshot.model,
          name: snapshot.displayName,
          inputPricePerM: snapshot.inputPricePerM,
          outputPricePerM: snapshot.outputPricePerM,
        })),
    });
  }

  const customGroups = new Map<string, AvailableModelGroup>();

  for (const token of accessibleTokens) {
    if (token.provider !== "custom" || !token.customModelsConfig) {
      continue;
    }

    const groupId = `${getProviderLabel(token)}::${token.customBaseUrl || token.id}`;
    const existingGroup = customGroups.get(groupId) ?? {
      id: groupId,
      providerLabel: getProviderLabel(token),
      helperText: token.customBaseUrl,
      models: [],
    };

    const existingModelIds = new Set(existingGroup.models.map((model) => model.id.toLowerCase()));
    for (const model of parseCustomModelsConfig(token.customModelsConfig)) {
      if (existingModelIds.has(model.id.toLowerCase())) {
        continue;
      }

      existingGroup.models.push({
        id: model.id,
        name: model.name,
        inputPricePerM: model.inputPricePerM,
        outputPricePerM: model.outputPricePerM,
      });
      existingModelIds.add(model.id.toLowerCase());
    }

    customGroups.set(groupId, existingGroup);
  }

  availableModelGroups.push(...Array.from(customGroups.values()));
  const availableModelCount = availableModelGroups.reduce((sum, group) => sum + group.models.length, 0);

  const providedTokens = user.providedTokens.map((token) => ({
    ...token,
    providerLabel: getProviderLabel(token),
  }));

  const recentLogs = await prisma.requestLog.findMany({
    where: {
      OR: [{ consumerId: userId }, { token: { userId } }],
    },
    include: {
      token: {
        select: {
          provider: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const mergedLogs = (recentLogs as DashboardLog[]).map((req) => {
    const type: UsageLogType =
      req.consumerId === userId
        ? req.isDirected
          ? "directedUsage"
          : "usage"
        : req.isDirected
          ? "directedProvided"
          : "provided";
    const visiblePointDelta =
      req.consumerId === userId ? req.consumerPointsDelta : req.providerPointsDelta;

    return {
      id: req.id,
      type,
      provider: req.provider || req.token.provider,
      model: req.model || t("unknownModel"),
      inputTokens: req.promptTokens.toLocaleString(),
      outputTokens: req.completionTokens.toLocaleString(),
      totalTokens: req.tokensUsed.toLocaleString(),
      unitPrice: `$${(req.inputPricePerM ?? 0).toFixed(2)} / $${(req.outputPricePerM ?? 0).toFixed(2)} / 1M`,
      costUsd: formatUsd(req.estimatedCostUsd),
      creditDelta: `${visiblePointDelta > 0 ? "+" : ""}${formatPoints(visiblePointDelta)}`,
      status: req.status,
      createdAtLabel: new Intl.DateTimeFormat(locale, {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(req.createdAt),
    };
  });

  const usageLogs = mergedLogs.filter(
    (log) => log.type === "usage" || log.type === "directedUsage",
  );
  const contributionLogs = mergedLogs.filter(
    (log) => log.type === "provided" || log.type === "directedProvided",
  );

  const usageLogTexts = {
    noLogs: t("noLogs"),
    noLogsForFilter: t("noLogsForFilter"),
    all: t("allLogTypes"),
    usage: t("usageLabel"),
    provided: t("providedLabel"),
    directedUsage: t("directedUsageLabel"),
    directedProvided: t("directedProvidedLabel"),
    prevPage: t("prevPage"),
    nextPage: t("nextPage"),
    pageLabel: t("pageLabel"),
    providerFilterLabel: t("providerFilter"),
    allProvidersText: t("allProviders"),
    timeHeader: t("timeHeader"),
    typeHeader: t("typeHeader"),
    providerHeader: t("providerHeader"),
    modelHeader: t("modelHeader"),
    tokensHeader: t("tokensHeader"),
    priceHeader: t("priceHeader"),
    costHeader: t("costHeader"),
    pointsHeader: t("pointsChangeHeader"),
    statusHeader: t("statusHeader"),
    helpTexts: {
      providerFilter: t("providerFilterHelp"),
      time: t("timeHeaderHelp"),
      type: t("typeHeaderHelp"),
      provider: t("providerHeaderHelp"),
      model: t("modelHeaderHelp"),
      tokens: t("tokensHeaderHelp"),
      price: t("priceHeaderHelp"),
      cost: t("costHeaderHelp"),
      points: t("pointsChangeHeaderHelp"),
      status: t("statusHeaderHelp"),
    },
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
        <Link
          href={{ pathname: "/dashboard", query: { tab: "usage" } }}
          className={`rounded-xl px-4 py-2 text-center text-sm font-medium transition-colors ${
            activeTab === "usage"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          {t("usageTab")}
        </Link>
        <Link
          href={{ pathname: "/dashboard", query: { tab: "contribution" } }}
          className={`rounded-xl px-4 py-2 text-center text-sm font-medium transition-colors ${
            activeTab === "contribution"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          {t("contributionTab")}
        </Link>
      </div>

      {activeTab === "usage" ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
              </div>
              <div className="relative z-10 mb-2 flex items-center gap-1.5">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("points")}
                </h3>
                <HelpHint text={t("pointsHelp")} />
              </div>
              <div className="relative z-10 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {formatPoints(user.points)}
                </span>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("pointsUnit")}
                </span>
              </div>
            </div>

            <PlatformKeyCard
              platformKey={user.platformKey}
              copyText={t("copy")}
              resetText={t("resetKey")}
              resetDoneText={t("resetKeyDone")}
              confirmResetText={t("confirmResetKey")}
              label={t("platformKey")}
              labelHelpText={t("platformKeyHelp")}
            />

            <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
              </div>
              <div className="relative z-10 flex flex-col justify-between">
              <div className="mb-2 flex items-center gap-1.5">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("platformUrl")}
                </h3>
                <HelpHint text={t("platformUrlHelp")} />
              </div>
              <DashboardCopyKey platformKey={platformUrl} copyText={t("copy")} />
              <p className="mt-2 text-xs text-zinc-400">{t("platformKeyTip")}</p>
              </div>
            </div>
          </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {t("availableModelsTitle")}
                    </h3>
                    <HelpHint text={t("availableModelsTitleHelp")} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {t("availableModelsSubtitle")}
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  availableModelCount > 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {availableModelCount > 0 ? t("availableModelsOnline") : t("availableModelsOffline")}
                </div>
              </div>

              {availableModelCount > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-white/10">
                      {t("availableSourcesSummary", { count: availableModelGroups.length })}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-white/10">
                      {t("availableModelsSummary", { count: availableModelCount })}
                    </span>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {availableModelGroups.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-black/20"
                      >
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {group.providerLabel}
                          </h4>
                          {group.helperText && (
                            <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {group.helperText}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          {group.models.map((model) => (
                            <div
                              key={`${group.id}-${model.id}`}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                                    {model.name}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                                    {model.id}
                                  </p>
                                </div>
                                <div className="text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                                  <p>
                                    {t("availableModelInputPrice", {
                                      price: formatPricePerM(model.inputPricePerM),
                                    })}
                                  </p>
                                  <p className="mt-1">
                                    {t("availableModelOutputPrice", {
                                      price: formatPricePerM(model.outputPricePerM),
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  {t("noAvailableModels")}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {t("usageRecordsTitle")}
                    </h3>
                    <HelpHint text={t("usageRecordsTitleHelp")} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {t("pricingUpdatedAt", {
                      time: latestPricingRefreshAt
                        ? new Intl.DateTimeFormat(locale, {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(latestPricingRefreshAt)
                        : t("pricingUnknown"),
                    })}
                  </p>
                </div>
              <form action={refreshPricingAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  {t("refreshPricing")}
                </button>
              </form>
            </div>

            <UsageLogPanel
              logs={usageLogs}
              texts={usageLogTexts}
              visibleTypes={["usage", "directedUsage"]}
            />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
              </div>
              <div className="relative z-10 mb-2 flex items-center gap-1.5">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("points")}
                </h3>
                <HelpHint text={t("pointsHelp")} />
              </div>
              <div className="relative z-10 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {formatPoints(user.points)}
                </span>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("pointsUnit")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-6 flex items-center gap-2">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {t("yourTokens")}
                </h3>
                <HelpHint text={t("yourTokensHelp")} />
              </div>
              <div className="min-h-[20rem] max-h-[34rem] resize-y overflow-y-auto pr-2">
                <TokenList
                  tokens={providedTokens}
                  noTokensText={t("noTokens")}
                  contributedText={t("contributed")}
                  revokeText={t("revoke")}
                  confirmRevokeText={t("confirmRevoke")}
                  pauseText={t("pauseToken")}
                  resumeText={t("resumeToken")}
                  creditLimitText={t("creditLimit")}
                  unlimitedText={t("unlimitedText")}
                  directedBadge={t("directedLabel")}
                  providerFilterLabel={t("providerFilter")}
                  statusFilterLabel={t("statusFilter")}
                  allProvidersText={t("allProviders")}
                  allStatusesText={t("allStatuses")}
                  prevPageText={t("prevPage")}
                  nextPageText={t("nextPage")}
                  pageLabelText={t("pageLabel")}
                  modelsText={t("modelsText")}
                  helpTexts={{
                    providerFilter: t("providerFilterHelp"),
                    statusFilter: t("statusFilterHelp"),
                    contributed: t("contributedHelp"),
                    creditLimit: t("creditLimitHelp"),
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {t("contributionRecordsTitle")}
                  </h3>
                  <HelpHint text={t("contributionRecordsTitleHelp")} />
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("contributionRecordsTip")}
                </p>
              </div>

              <UsageLogPanel
                logs={contributionLogs}
                texts={{
                  ...usageLogTexts,
                  noLogs: t("noContributionLogs"),
                }}
                visibleTypes={["provided", "directedProvided"]}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <AddTokenForm
              title={t("addToken")}
              titleHelp={t("addTokenHelp")}
              platformLabel={t("platform")}
              apiKeyLabel={t("apiKey")}
              submitText={t("submitToken")}
              validatingText={t("validating")}
              tokenAddedText={t("tokenAdded")}
              creditLimitLabel={t("creditLimit")}
              creditLimitPlaceholder={t("creditLimitPlaceholder")}
              allowedUsersLabel={t("allowedUsers")}
              allowedUsersPlaceholder={t("allowedUsersPlaceholder")}
              allowedUsersTip={t("allowedUsersTip")}
              customProviderNameLabel={t("customProviderName")}
              customProviderNamePlaceholder={t("customProviderNamePlaceholder")}
              customBaseUrlLabel={t("customBaseUrl")}
              customBaseUrlPlaceholder={t("customBaseUrlPlaceholder")}
              customModelsTitle={t("customModels")}
              customModelsTip={t("customModelsTip")}
              customModelIdLabel={t("customModelId")}
              customModelNameLabel={t("customModelName")}
              customInputPriceLabel={t("customInputPrice")}
              customOutputPriceLabel={t("customOutputPrice")}
              addModelText={t("addModel")}
              removeModelText={t("removeModel")}
              helpTexts={{
                platform: t("platformHelp"),
                apiKey: t("apiKeyHelp"),
                creditLimit: t("creditLimitHelp"),
                allowedUsers: t("allowedUsersHelp"),
                customProviderName: t("customProviderNameHelp"),
                customBaseUrl: t("customBaseUrlHelp"),
                customModels: t("customModelsHelp"),
                customModelId: t("customModelIdHelp"),
                customModelName: t("customModelNameHelp"),
                customInputPrice: t("customInputPriceHelp"),
                customOutputPrice: t("customOutputPriceHelp"),
              }}
            />
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
