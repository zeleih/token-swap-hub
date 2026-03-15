import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

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
            
            <div className="flex items-center gap-4">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
