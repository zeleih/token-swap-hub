import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

export async function POST() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newKey =
    "tk_" +
    Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

  await prisma.user.update({
    where: { id: session.userId },
    data: { platformKey: newKey },
  });

  return NextResponse.json({ success: true, newKey });
}
