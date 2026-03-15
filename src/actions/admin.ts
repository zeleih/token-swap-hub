"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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

export async function updateAnnouncementAction(prevState: any, formData: FormData) {
  const user = await requireAdmin();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const announcementTitleZh = (formData.get("announcementTitleZh") as string | null)?.trim() || null;
  const announcementContentZh = (formData.get("announcementContentZh") as string | null)?.trim() || null;
  const announcementTitleEn = (formData.get("announcementTitleEn") as string | null)?.trim() || null;
  const announcementContentEn = (formData.get("announcementContentEn") as string | null)?.trim() || null;

  await prisma.appSettings.upsert({
    where: { id: "global" },
    update: {
      announcementTitleZh,
      announcementContentZh,
      announcementTitleEn,
      announcementContentEn,
    },
    create: {
      id: "global",
      announcementTitleZh,
      announcementContentZh,
      announcementTitleEn,
      announcementContentEn,
    },
  });

  revalidatePath("/zh/dashboard");
  revalidatePath("/en/dashboard");
  revalidatePath("/zh/dashboard/admin");
  revalidatePath("/en/dashboard/admin");

  return { success: true };
}
