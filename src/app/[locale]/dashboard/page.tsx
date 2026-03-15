import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import DashboardCopyKey from "./components/DashboardCopyKey";
import PlatformKeyCard from "./components/PlatformKeyCard";
import AddTokenForm from "./components/AddTokenForm";
import TokenList from "./components/TokenList";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const session = await verifySession();
  const userId = session!.userId;
  const t = await getTranslations("Dashboard");

  const platformUrl = process.env.PLATFORM_URL || "http://localhost:3000/api/v1";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      providedTokens: true,
    }
  });

  if (!user) return null;

  // Fetch recent usage logs (both normal and directed, merged)
  const recentLogs = await prisma.requestLog.findMany({
    where: { consumerId: userId },
    take: 10,
    orderBy: { createdAt: "desc" }
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
              {user.points.toLocaleString()}
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
            />
          </div>

          {/* Usage Log (merged: normal + directed with different colors) */}
          <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">{t("usage")}</h3>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("noLogs")}</p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-white/10">
                {recentLogs.map((req: any) => (
                  <li key={req.id} className="py-3 flex justify-between items-center text-sm">
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {req.isDirected
                        ? t("directedSpent", { count: req.tokensUsed })
                        : t("spent", { count: req.tokensUsed })
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      {req.isDirected && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-500">
                          {t("directedLabel")}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${req.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {req.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
