import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditLogEntry } from "./types";
import { logger } from "./logger";

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const db = createAdminClient();
    await db.from("admin_audit_log").insert({
      admin_email: entry.admin_email,
      action: entry.action,
      resource_type: entry.resource_type || null,
      resource_id: entry.resource_id || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      metadata: entry.metadata || {},
    });
  } catch (err) {
    logger.error({ err, entry }, "Failed to write audit log");
  }
}
