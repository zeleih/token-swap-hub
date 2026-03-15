import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { getAnnouncementSettings } from "@/lib/announcement";
import AnnouncementEditor from "../components/AnnouncementEditor";

export default async function AdminPage() {
  const session = await verifySession();
  const locale = await getLocale();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("Dashboard");
  const zhT = await getTranslations({ locale: "zh", namespace: "Dashboard" });
  const enT = await getTranslations({ locale: "en", namespace: "Dashboard" });
  const settings = await getAnnouncementSettings();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-3xl">🛠️</span>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("adminTitle")}</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("adminSubtitle")}</p>
          </div>
        </div>

        <AnnouncementEditor
          texts={{
            sectionTitle: t("announcementManagerTitle"),
            sectionTip: t("announcementManagerTip"),
            zhTitle: t("announcementZhTitle"),
            zhContent: t("announcementZhContent"),
            enTitle: t("announcementEnTitle"),
            enContent: t("announcementEnContent"),
            save: t("saveAnnouncement"),
            saving: t("savingAnnouncement"),
            saved: t("announcementSaved"),
          }}
          initialValues={{
            announcementTitleZh: settings?.announcementTitleZh || zhT("announcementTitle"),
            announcementContentZh: settings?.announcementContentZh || zhT("announcementContent"),
            announcementTitleEn: settings?.announcementTitleEn || enT("announcementTitle"),
            announcementContentEn: settings?.announcementContentEn || enT("announcementContent"),
          }}
        />
      </div>
    </div>
  );
}
