import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  saveAnnouncementAction,
} from "@/actions/admin";
import { ensureAnnouncementSeed, listAdminAnnouncements } from "@/lib/announcement";

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
  await ensureAnnouncementSeed({
    titleZh: zhT("announcementTitle"),
    contentZh: zhT("announcementContent"),
    titleEn: enT("announcementTitle"),
    contentEn: enT("announcementContent"),
  });
  const announcements = await listAdminAnnouncements();

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
          <span className="text-3xl">🛠️</span>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("adminTitle")}</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("adminSubtitle")}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {t("announcementManagerTitle")}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {t("announcementManagerTip")}
              </p>
            </div>
            <form action={createAnnouncementAction}>
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {t("createAnnouncement")}
              </button>
            </form>
          </div>

          {announcements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              {t("noAdminAnnouncements")}
            </p>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <form
                  key={announcement.id}
                  action={saveAnnouncementAction.bind(null, announcement.id)}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-black/20"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {announcement.titleZh}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {announcement.updatedAt ? dateFormatter.format(announcement.updatedAt) : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        announcement.isPublished
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                          : "bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                      }`}
                    >
                      {announcement.isPublished
                        ? t("publishedAnnouncement")
                        : t("hiddenAnnouncement")}
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {t("announcementZhTitle")}
                      </span>
                      <input
                        name="titleZh"
                        required
                        defaultValue={announcement.titleZh}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {t("announcementEnTitle")}
                      </span>
                      <input
                        name="titleEn"
                        required
                        defaultValue={announcement.titleEn}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {t("announcementZhContent")}
                      </span>
                      <textarea
                        name="contentZh"
                        required
                        rows={10}
                        defaultValue={announcement.contentZh}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {t("announcementEnContent")}
                      </span>
                      <textarea
                        name="contentEn"
                        required
                        rows={10}
                        defaultValue={announcement.contentEn}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:bg-black/30 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <input
                        name="isPublished"
                        type="checkbox"
                        defaultChecked={announcement.isPublished}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500/50"
                      />
                      <span>{t("publishAnnouncement")}</span>
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {t("saveAnnouncement")}
                      </button>
                      <button
                        type="submit"
                        formAction={deleteAnnouncementAction.bind(null, announcement.id)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                      >
                        {t("deleteAnnouncement")}
                      </button>
                    </div>
                  </div>
                </form>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
