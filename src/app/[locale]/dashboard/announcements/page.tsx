import { getLocale, getTranslations } from "next-intl/server";
import AnnouncementAccordion from "../components/AnnouncementAccordion";
import { listPublishedAnnouncements } from "@/lib/announcement";

export default async function AnnouncementsPage() {
  const locale = await getLocale();
  const t = await getTranslations("Dashboard");
  const zhT = await getTranslations({ locale: "zh", namespace: "Dashboard" });
  const enT = await getTranslations({ locale: "en", namespace: "Dashboard" });

  const announcements = await listPublishedAnnouncements(locale, {
    titleZh: zhT("announcementTitle"),
    contentZh: zhT("announcementContent"),
    titleEn: enT("announcementTitle"),
    contentEn: enT("announcementContent"),
  });

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-3xl">📢</span>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {t("announcementsTitle")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("announcementsSubtitle")}
            </p>
          </div>
        </div>

        <AnnouncementAccordion
          announcements={announcements}
          emptyText={t("noAnnouncements")}
          publishedAtLabel={t("announcementPublishedAt")}
          dateFormatter={dateFormatter}
        />
      </div>
    </div>
  );
}
