"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const announcementClient = prisma as typeof prisma & {
  announcement: Prisma.AnnouncementDelegate;
};

async function requireAdmin() {
  const session = await verifySession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

function revalidateAnnouncementPages() {
  revalidatePath("/zh/dashboard/announcements");
  revalidatePath("/en/dashboard/announcements");
  revalidatePath("/zh/dashboard/admin");
  revalidatePath("/en/dashboard/admin");
}

export async function createAnnouncementAction() {
  const user = await requireAdmin();
  if (!user) {
    return;
  }

  await announcementClient.announcement.create({
    data: {
      titleZh: "新公告",
      contentZh: "请填写公告内容。",
      titleEn: "New announcement",
      contentEn: "Please add the announcement content.",
      isPublished: false,
      publishedAt: null,
    },
  });

  revalidateAnnouncementPages();
}

export async function saveAnnouncementAction(announcementId: string, formData: FormData) {
  const user = await requireAdmin();
  if (!user) {
    return;
  }

  const titleZh = String(formData.get("titleZh") || "").trim();
  const contentZh = String(formData.get("contentZh") || "").trim();
  const titleEn = String(formData.get("titleEn") || "").trim();
  const contentEn = String(formData.get("contentEn") || "").trim();
  const isPublished = formData.get("isPublished") === "on";

  const current = await announcementClient.announcement.findUnique({
    where: { id: announcementId },
    select: { publishedAt: true },
  });

  if (!current) {
    return;
  }

  await announcementClient.announcement.update({
    where: { id: announcementId },
    data: {
      titleZh,
      contentZh,
      titleEn,
      contentEn,
      isPublished,
      publishedAt: isPublished ? current.publishedAt ?? new Date() : null,
    },
  });

  revalidateAnnouncementPages();
}

export async function deleteAnnouncementAction(announcementId: string) {
  const user = await requireAdmin();
  if (!user) {
    return;
  }

  await announcementClient.announcement.delete({
    where: { id: announcementId },
  });

  revalidateAnnouncementPages();
}
