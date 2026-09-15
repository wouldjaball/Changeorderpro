"use server";

import { revalidatePath } from "next/cache";
import { refreshMaterializedViews } from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export async function refreshStats() {
  await refreshMaterializedViews();
  revalidatePath("/admin");
}

async function emptyStorageFolder(
  db: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string
): Promise<void> {
  const { data: entries } = await db.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!entries || entries.length === 0) return;

  const files: string[] = [];
  for (const entry of entries) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      await emptyStorageFolder(db, bucket, path);
    } else {
      files.push(path);
    }
  }

  if (files.length > 0) {
    await db.storage.from(bucket).remove(files);
  }
}

export async function deleteCompany(
  companyId: string,
  confirmName: string
): Promise<{ error?: string }> {
  const db = createAdminClient();

  const { data: company, error: companyError } = await db
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    return { error: "Company not found." };
  }

  if (confirmName.trim() !== company.name) {
    return { error: "Typed name didn't match the company name exactly." };
  }

  // approval_events rows are protected by an immutable BEFORE DELETE trigger
  // (007_approval_events.sql) — deleting a company with any approval history
  // would fail on that trigger, so check up front and give a clear reason.
  const { count: approvalCount, error: approvalError } = await db
    .from("approval_events")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (approvalError) {
    return { error: "Couldn't check approval history. Nothing was deleted." };
  }

  if ((approvalCount ?? 0) > 0) {
    return {
      error: `This company has ${approvalCount} legally-immutable approval record${
        approvalCount === 1 ? "" : "s"
      } (client approvals, declines, or views on change orders) and can't be hard-deleted. Those records are protected by design.`,
    };
  }

  await emptyStorageFolder(db, "co-photos", companyId);
  await emptyStorageFolder(db, "company-logos", companyId);

  // notifications_log and audit_log reference company_id with no cascade
  // action, so they must be cleared explicitly before the company row can go.
  const { error: notifError } = await db
    .from("notifications_log")
    .delete()
    .eq("company_id", companyId);
  if (notifError) {
    return { error: `Failed to clear notification history: ${notifError.message}` };
  }

  const { error: auditError } = await db
    .from("audit_log")
    .delete()
    .eq("company_id", companyId);
  if (auditError) {
    return { error: `Failed to clear audit log: ${auditError.message}` };
  }

  const { data: users } = await db
    .from("users")
    .select("id")
    .eq("company_id", companyId);

  for (const user of users || []) {
    await db.auth.admin.deleteUser(user.id);
  }

  const { error: deleteError } = await db
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (deleteError) {
    return { error: `Failed to delete company: ${deleteError.message}` };
  }

  await refreshMaterializedViews();
  revalidatePath("/admin/companies");

  return {};
}
