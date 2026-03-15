import { prisma } from "@/lib/prisma";

export type AnnouncementContent = {
  title: string;
  content: string;
};

export async function getAnnouncement(locale: string, fallback: AnnouncementContent) {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "global" },
  });

  if (!settings) {
    return fallback;
  }

  if (locale === "en") {
    return {
      title: settings.announcementTitleEn || fallback.title,
      content: settings.announcementContentEn || fallback.content,
    };
  }

  return {
    title: settings.announcementTitleZh || fallback.title,
    content: settings.announcementContentZh || fallback.content,
  };
}

export async function getAnnouncementSettings() {
  return prisma.appSettings.findUnique({
    where: { id: "global" },
  });
}
