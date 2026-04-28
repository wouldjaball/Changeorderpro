import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PlatformStats,
  CompanyStats,
  CompanyListParams,
  CompanyListResult,
  EventRow,
  TeamMember,
  ChangeOrderRow,
  WeeklyTrendPoint,
} from "./types";

export async function getPlatformStats(): Promise<PlatformStats | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("mv_platform_stats")
    .select("*")
    .limit(1)
    .single();
  if (error) return null;
  return data as PlatformStats;
}

export async function getCompanyList(
  params: CompanyListParams
): Promise<CompanyListResult> {
  const db = createAdminClient();
  const {
    search = "",
    page = 1,
    pageSize = 50,
    sortBy = "signup_at",
    sortDir = "desc",
    plan,
    status,
    channel,
    activity,
    signupFrom,
    signupTo,
  } = params;

  let query = db.from("mv_company_stats").select("*", { count: "exact" });

  if (search) {
    const s = `%${search}%`;
    query = query.or(
      `company_name.ilike.${s},owner_email.ilike.${s},owner_name.ilike.${s}`
    );
  }

  if (plan && plan.length > 0) {
    query = query.in("plan_name", plan);
  }

  if (status && status.length > 0) {
    query = query.in("subscription_status", status);
  }

  if (channel && channel.length > 0) {
    query = query.in("channel_preference", channel);
  }

  if (activity === "active_30") {
    query = query.gte(
      "last_activity_at",
      new Date(Date.now() - 30 * 86400000).toISOString()
    );
  } else if (activity === "dormant_14") {
    query = query.lt(
      "last_activity_at",
      new Date(Date.now() - 14 * 86400000).toISOString()
    );
  } else if (activity === "dormant_30") {
    query = query.lt(
      "last_activity_at",
      new Date(Date.now() - 30 * 86400000).toISOString()
    );
  }

  if (signupFrom) {
    query = query.gte("signup_at", signupFrom);
  }
  if (signupTo) {
    query = query.lte("signup_at", signupTo);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .order(sortBy, { ascending: sortDir === "asc" })
    .range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch company list: ${error.message}`);
  }

  return {
    data: (data || []) as CompanyStats[],
    total: count || 0,
    page,
    pageSize,
  };
}

export async function getCompanyStats(
  companyId: string
): Promise<CompanyStats | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("mv_company_stats")
    .select("*")
    .eq("company_id", companyId)
    .limit(1)
    .single();
  if (error) return null;
  return data as CompanyStats;
}

export async function getRecentEvents(limit = 20): Promise<EventRow[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select("*, companies!inner(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data || []).map((row: Record<string, unknown>) => {
    const { companies, ...rest } = row;
    return {
      ...rest,
      company_name: (companies as { name: string })?.name,
    } as EventRow;
  });
}

export async function getCompanyEvents(
  companyId: string,
  limit = 50,
  offset = 0
): Promise<EventRow[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data || []) as EventRow[];
}

export async function getTeamMembers(
  companyId: string
): Promise<TeamMember[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("users")
    .select("id, email, full_name, role, created_at")
    .eq("company_id", companyId)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data || []) as TeamMember[];
}

export async function getCompanyChangeOrders(
  companyId: string,
  page = 1,
  pageSize = 25,
  sortBy = "created_at",
  sortDir: "asc" | "desc" = "desc"
): Promise<{ data: ChangeOrderRow[]; total: number }> {
  const db = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await db
    .from("change_orders")
    .select(
      "id, co_number, total_amount, status, approval_method, created_at, projects!inner(client_name)",
      { count: "exact" }
    )
    .eq("company_id", companyId)
    .order(sortBy, { ascending: sortDir === "asc" })
    .range(from, to);

  if (error) return { data: [], total: 0 };

  const rows = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    co_number: row.co_number as string,
    customer_name: (row.projects as { client_name: string | null })
      ?.client_name,
    total_amount: row.total_amount as number | null,
    status: row.status as string,
    sent_via: row.approval_method as string | null,
    created_at: row.created_at as string,
  }));

  return { data: rows, total: count || 0 };
}

export async function getSignupsTrend(): Promise<WeeklyTrendPoint[]> {
  const db = createAdminClient();
  const cutoff = new Date(Date.now() - 12 * 7 * 86400000).toISOString();
  const { data, error } = await db.rpc("get_signups_trend", {
    cutoff_date: cutoff,
  });
  if (error || !data) return [];
  return data as WeeklyTrendPoint[];
}

export async function getChangeOrdersTrend(): Promise<WeeklyTrendPoint[]> {
  const db = createAdminClient();
  const cutoff = new Date(Date.now() - 12 * 7 * 86400000).toISOString();
  const { data, error } = await db.rpc("get_cos_trend", {
    cutoff_date: cutoff,
  });
  if (error || !data) return [];
  return data as WeeklyTrendPoint[];
}

export async function getCompanyDetail(companyId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function refreshMaterializedViews(): Promise<void> {
  const db = createAdminClient();
  await db.rpc("refresh_admin_views");
}
