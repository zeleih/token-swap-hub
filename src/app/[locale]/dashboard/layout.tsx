import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import DashboardActions from "./components/DashboardActions";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await verifySession();
  const { locale } = await params;
  const t = await getTranslations("Dashboard");
  
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true, displayName: true, showOnLeaderboard: true }
  });

  // Collect all texts needed by client components
  const actionTexts = {
    profile: t("profile"), displayName: t("displayName"),
    displayNamePlaceholder: t("displayNamePlaceholder"),
    showOnLeaderboard: t("showOnLeaderboard"),
    saveProfile: t("saveProfile"), saving: t("saving"),
    profileSaved: t("profileSaved"), close: t("close"),
    leaderboard: t("leaderboard"),
    contributionBoard: t("contributionBoard"), consumptionBoard: t("consumptionBoard"),
    rank: t("rank"), user: t("user"), tokens_count: t("tokens_count"),
    noData: t("noData"),
    day: t("day"), week: t("week"), month: t("month"), year: t("year"), all: t("all"),
    transferPoints: t("transferPoints"),
    toUsername: t("toUsername"), toUsernamePlaceholder: t("toUsernamePlaceholder"),
    transferAmount: t("transferAmount"), transferAmountPlaceholder: t("transferAmountPlaceholder"),
    confirmTransfer: t("confirmTransfer"), confirmPlaceholder: t("confirmPlaceholder"),
    doTransfer: t("doTransfer"), transferring: t("transferring"),
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-lg font-bold text-zinc-900 dark:text-white">
                {t("title")}
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              {user && (
                <DashboardActions
                  user={{ displayName: user.displayName, showOnLeaderboard: user.showOnLeaderboard }}
                  texts={actionTexts}
                />
              )}
              <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                {user?.displayName || user?.username}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-2"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
