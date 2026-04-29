"use server";

import { revalidatePath } from "next/cache";
import { refreshMaterializedViews } from "@/lib/admin/queries";

export async function refreshStats() {
  await refreshMaterializedViews();
  revalidatePath("/admin");
}
