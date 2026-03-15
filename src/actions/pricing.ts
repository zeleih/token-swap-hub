"use server";

import { refreshAllPricingSnapshots } from "@/lib/pricing";
import { revalidatePath } from "next/cache";

export async function refreshPricingAction() {
  await refreshAllPricingSnapshots();
  revalidatePath("/dashboard");
}
