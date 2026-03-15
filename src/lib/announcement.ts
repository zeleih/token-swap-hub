import type { Announcement, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AnnouncementSeed = {
  titleZh: string;
  contentZh: string;
  titleEn: string;
  contentEn: string;
};

export type AnnouncementDisplayItem = {
  id: string;
  title: string;
  content: string;
  publishedAt: Date | null;
  isFallback: boolean;
};

const announcementClient = prisma as typeof prisma & {
  announcement: Prisma.AnnouncementDelegate;
};

async function getLegacyAnnouncementSeed(fallback: AnnouncementSeed): Promise<AnnouncementSeed> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "global" },
  });

  if (!settings) {
    return fallback;
  }

  return {
    titleZh: settings.announcementTitleZh || fallback.titleZh,
    contentZh: settings.announcementContentZh || fallback.contentZh,
    titleEn: settings.announcementTitleEn || fallback.titleEn,
    contentEn: settings.announcementContentEn || fallback.contentEn,
  };
}

export async function listPublishedAnnouncements(
  locale: string,
  fallback: AnnouncementSeed,
): Promise<AnnouncementDisplayItem[]> {
  const announcements = await announcementClient.announcement.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });

  if (announcements.length > 0) {
    return announcements.map((announcement: Announcement) => ({
      id: announcement.id,
      title: locale === "en" ? announcement.titleEn : announcement.titleZh,
      content: locale === "en" ? announcement.contentEn : announcement.contentZh,
      publishedAt: announcement.publishedAt,
      isFallback: false,
    }));
  }

  const legacy = await getLegacyAnnouncementSeed(fallback);
  return [
    {
      id: "legacy-announcement",
      title: locale === "en" ? legacy.titleEn : legacy.titleZh,
      content: locale === "en" ? legacy.contentEn : legacy.contentZh,
      publishedAt: null,
      isFallback: true,
    },
  ];
}

export async function listAdminAnnouncements() {
  return announcementClient.announcement.findMany({
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
}

export async function ensureAnnouncementSeed(fallback: AnnouncementSeed) {
  const count = await announcementClient.announcement.count();
  if (count > 0) {
    return;
  }

  const seed = await getLegacyAnnouncementSeed(fallback);
  await announcementClient.announcement.create({
    data: {
      titleZh: seed.titleZh,
      contentZh: seed.contentZh,
      titleEn: seed.titleEn,
      contentEn: seed.contentEn,
      isPublished: true,
      publishedAt: new Date(),
    },
  });
}
