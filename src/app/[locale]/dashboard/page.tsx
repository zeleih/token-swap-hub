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

type PageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

function resolveTab(tab?: string | string[]) {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value === "contribution" ? "contribution" : "usage";
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
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
        <Link
          href={{ pathname: "/dashboard", query: { tab: "usage" } }}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "usage"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          {t("usageTab")}
        </Link>
        <Link
          href={{ pathname: "/dashboard", query: { tab: "contribution" } }}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
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
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
              <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {t("points")}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {formatPoints(user.points)}
                </span>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("pointsUnit")}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">{t("pointsExcludeDirected")}</p>
            </div>

            <PlatformKeyCard
              platformKey={user.platformKey}
              copyText={t("copy")}
              resetText={t("resetKey")}
              confirmResetText={t("confirmResetKey")}
              label={t("platformKey")}
            />

            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
              <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {t("platformUrl")}
              </h3>
              <DashboardCopyKey platformKey={platformUrl} copyText={t("copy")} />
              <p className="mt-2 text-xs text-zinc-400">{t("platformKeyTip")}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {t("usageRecordsTitle")}
                </h3>
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-white">
                {t("yourTokens")}
              </h3>
              <div className="min-h-[20rem] max-h-[34rem] resize-y overflow-y-auto pr-2">
                <TokenList
                  tokens={user.providedTokens}
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
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {t("contributionRecordsTitle")}
                </h3>
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
