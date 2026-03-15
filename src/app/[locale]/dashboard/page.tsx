import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import DashboardCopyKey from "./components/DashboardCopyKey";
import PlatformKeyCard from "./components/PlatformKeyCard";
import AddTokenForm from "./components/AddTokenForm";
import TokenList from "./components/TokenList";
import UsageLogPanel from "./components/UsageLogPanel";
import { getLocale, getTranslations } from "next-intl/server";
import { ensurePricingFresh, formatPoints, formatUsd, getLatestPricingRefreshAt } from "@/lib/pricing";
import { refreshPricingAction } from "@/actions/pricing";

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
  consumer: {
    username: string;
    displayName: string | null;
  };
  token: {
    provider: string;
  };
};

export default async function DashboardPage() {
  const session = await verifySession();
  const userId = session!.userId;
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  await ensurePricingFresh();

  const platformUrl = process.env.PLATFORM_URL || "http://localhost:3000/api/v1";
  const latestPricingRefreshAt = await getLatestPricingRefreshAt();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      providedTokens: {
        orderBy: { createdAt: "desc" },
      },
    }
  });

  if (!user) return null;

  // Merge both perspectives: logs I consumed + logs where my token was consumed.
  const recentLogs = await prisma.requestLog.findMany({
    where: {
      OR: [
        { consumerId: userId },
        { token: { userId } }
      ]
    },
    include: {
      consumer: {
        select: {
          username: true,
          displayName: true,
        }
      },
      token: {
        select: {
          provider: true,
        }
      }
    },
    take: 80,
    orderBy: { createdAt: "desc" }
  });

  const mergedLogs = (recentLogs as DashboardLog[]).map((req) => {
    const type: UsageLogType =
      req.consumerId === userId
        ? (req.isDirected ? "directedUsage" : "usage")
        : (req.isDirected ? "directedProvided" : "provided");
    const visiblePointDelta = req.consumerId === userId ? req.consumerPointsDelta : req.providerPointsDelta;

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner: Credits & Platform Key & URL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Credits Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t("points")}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatPoints(user.points)}
            </span>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("pointsUnit")}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">{t("pointsExcludeDirected")}</p>
        </div>

        {/* Platform Key Card with Reset */}
        <PlatformKeyCard
          platformKey={user.platformKey}
          copyText={t("copy")}
          resetText={t("resetKey")}
          confirmResetText={t("confirmResetKey")}
          label={t("platformKey")}
        />

        {/* Platform URL Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t("platformUrl")}</h3>
          <DashboardCopyKey platformKey={platformUrl} copyText={t("copy")} />
          <p className="text-xs text-zinc-400 mt-2">{t("platformKeyTip")}</p>
        </div>
      </div>

      {/* Grid for Shared Tokens and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          {/* Token Source List */}
          <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">{t("yourTokens")}</h3>
            <div className="min-h-[20rem] max-h-[34rem] resize-y overflow-y-auto pr-2">
              <TokenList
                tokens={user.providedTokens}
                noTokensText={t("noTokens")}
                contributedText={t("contributed")}
                revokeText={t("revoke")}
                confirmRevokeText={t("confirmRevoke")}
                pauseText={t("pauseToken")}
                resumeText={t("resumeToken")}
                usageLimitText={t("usageLimit")}
                unlimitedText={t("unlimitedText")}
                directedBadge={t("directedLabel")}
                providerFilterLabel={t("providerFilter")}
                statusFilterLabel={t("statusFilter")}
                allProvidersText={t("allProviders")}
                allStatusesText={t("allStatuses")}
                prevPageText={t("prevPage")}
                nextPageText={t("nextPage")}
                pageLabelText={t("pageLabel")}
              />
            </div>
          </div>

          {/* Usage Log (merged: normal + directed with different colors) */}
          <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("usage")}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("pricingUpdatedAt", {
                    time: latestPricingRefreshAt
                      ? new Intl.DateTimeFormat(locale, {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(latestPricingRefreshAt)
                      : t("pricingUnknown")
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
              logs={mergedLogs}
              texts={{
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
              }}
            />
          </div>

          {/* Announcement Board */}
          <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200/50 dark:border-blue-500/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📢</span>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("announcement")}</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-zinc-200/50 dark:border-white/5">
                <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-2">{t("announcementTitle")}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{t("announcementContent")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Add Token Source */}
        <div className="lg:col-span-1">
           <AddTokenForm
             title={t("addToken")}
             platformLabel={t("platform")}
             apiKeyLabel={t("apiKey")}
             submitText={t("submitToken")}
             validatingText={t("validating")}
             tokenAddedText={t("tokenAdded")}
             usageLimitLabel={t("usageLimit")}
             usageLimitPlaceholder={t("usageLimitPlaceholder")}
             allowedUsersLabel={t("allowedUsers")}
             allowedUsersPlaceholder={t("allowedUsersPlaceholder")}
             allowedUsersTip={t("allowedUsersTip")}
             oauthTab={t("oauthTab")}
             manualTab={t("manualTab")}
             oauthComingSoon={t("oauthComingSoon")}
           />
        </div>
      </div>
    </div>
  );
}
