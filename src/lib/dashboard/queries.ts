import type { createClient } from "@/lib/supabase/server";
import {
  latestClientResponse,
  type ApprovalEventLike,
} from "@/lib/approval-notes";
import type { DashboardFilters } from "@/lib/dashboard/filters";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface DashboardStats {
  totalCOs: number;
  awaitingApproval: number;
  approvedThisMonth: number;
  totalApprovedValue: number;
  paidCount: number;
  totalPaidValue: number;
}

export interface DashboardProject {
  id: string;
  name: string;
}

export interface DashboardChangeOrder {
  id: string;
  co_number: string;
  title: string;
  status: string;
  total_amount: number | null;
  fixed_amount: number | null;
  project: { name: string } | null;
  declineNotes: string | null;
}

interface DashboardChangeOrderRow {
  id: string;
  co_number: string;
  title: string;
  status: string;
  total_amount: number | null;
  fixed_amount: number | null;
  project: { name: string } | { name: string }[] | null;
  approval_events: ApprovalEventLike[] | null;
}

function monthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getDashboardStats(
  supabase: ServerSupabaseClient,
  companyId: string
): Promise<DashboardStats> {
  const monthStart = monthStartIso();

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "dashboard_stats",
    { p_company_id: companyId }
  );

  if (!rpcError && rpcData) {
    const row = rpcData as Record<string, unknown>;
    return {
      totalCOs: toNumber(row.total_cos),
      awaitingApproval: toNumber(row.awaiting_approval),
      approvedThisMonth: toNumber(row.approved_this_month),
      totalApprovedValue: toNumber(row.total_approved_value),
      paidCount: toNumber(row.paid_count),
      totalPaidValue: toNumber(row.total_paid_value),
    };
  }

  const [total, awaiting, approvedMonth, approved, paid] = await Promise.all([
    supabase
      .from("change_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("change_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "sent"),
    supabase
      .from("change_orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "approved")
      .gte("approved_at", monthStart),
    supabase
      .from("change_orders")
      .select("total_amount")
      .eq("company_id", companyId)
      .eq("status", "approved")
      .limit(1000),
    supabase
      .from("change_orders")
      .select("total_amount", { count: "exact" })
      .eq("company_id", companyId)
      .eq("status", "paid")
      .limit(1000),
  ]);

  const totalApprovedValue =
    (approved.data as { total_amount: number | null }[] | null)?.reduce(
      (sum, co) => sum + toNumber(co.total_amount),
      0
    ) || 0;

  const totalPaidValue =
    (paid.data as { total_amount: number | null }[] | null)?.reduce(
      (sum, co) => sum + toNumber(co.total_amount),
      0
    ) || 0;

  return {
    totalCOs: total.count || 0,
    awaitingApproval: awaiting.count || 0,
    approvedThisMonth: approvedMonth.count || 0,
    totalApprovedValue,
    paidCount: paid.count || 0,
    totalPaidValue,
  };
}

export async function getActiveProjects(
  supabase: ServerSupabaseClient,
  companyId: string
): Promise<DashboardProject[]> {
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("name")
    .limit(500);

  return (data as DashboardProject[] | null) || [];
}

export async function getDashboardChangeOrders(
  supabase: ServerSupabaseClient,
  companyId: string,
  filters: DashboardFilters
): Promise<DashboardChangeOrder[]> {
  let coQuery = supabase
    .from("change_orders")
    .select(
      "*, project:projects(name), approval_events(action, metadata, created_at)"
    )
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (filters.status) {
    coQuery = coQuery.eq("status", filters.status);
  }
  if (filters.period === "month") {
    coQuery = coQuery.gte("approved_at", monthStartIso());
  }
  if (filters.project) {
    coQuery = coQuery.eq("project_id", filters.project);
  }
  if (filters.q) {
    coQuery = coQuery.or(
      `co_number.ilike.%${filters.q}%,title.ilike.%${filters.q}%`
    );
  }

  const { data } = await coQuery;
  const rows = (data as DashboardChangeOrderRow[] | null) || [];

  return rows.map((co) => ({
    id: co.id,
    co_number: co.co_number,
    title: co.title,
    status: co.status,
    total_amount: co.total_amount,
    fixed_amount: co.fixed_amount,
    project:
      co.project && !Array.isArray(co.project)
        ? { name: co.project.name }
        : null,
    declineNotes:
      co.status === "declined"
        ? latestClientResponse(co.approval_events || [])?.notes || null
        : null,
  }));
}
