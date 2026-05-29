export interface PlatformStats {
  total_companies: number;
  active_companies_30d: number;
  total_change_orders: number;
  change_orders_this_month: number;
  mrr: number;
  signups_last_30d: number;
  signups_prior_30d: number;
  cos_last_30d: number;
  cos_prior_30d: number;
  refreshed_at: string;
}

export interface CompanyStats {
  company_id: string;
  company_name: string;
  signup_at: string;
  owner_user_id: string | null;
  owner_email: string | null;
  owner_name: string | null;
  plan_name: string | null;
  subscription_status: string;
  monthly_amount: number;
  total_change_orders: number;
  change_orders_this_month: number;
  avg_change_order_value: number | null;
  total_change_order_value: number | null;
  last_change_order_at: string | null;
  last_activity_at: string;
  emails_sent_90d: number;
  sms_sent_90d: number;
  emails_sent_total: number;
  sms_sent_total: number;
  channel_preference: "email" | "sms" | "both" | "none";
  team_size: number;
}

export interface EventRow {
  id: string;
  company_id: string;
  user_id: string | null;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  company_name?: string;
}

export interface CompanyListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  plan?: string[];
  status?: string[];
  channel?: string[];
  activity?: string;
  signupFrom?: string;
  signupTo?: string;
}

export interface CompanyListResult {
  data: CompanyStats[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface ChangeOrderRow {
  id: string;
  co_number: string;
  customer_name: string | null;
  total_amount: number | null;
  status: string;
  sent_via: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  admin_email: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

export interface WeeklyTrendPoint {
  week_start: string;
  count: number;
}

export interface ChangeOrderDetail {
  id: string;
  co_number: string;
  title: string;
  description: string | null;
  pricing_type: string;
  fixed_amount: number | null;
  total_amount: number | null;
  status: string;
  approval_method: string | null;
  internal_notes: string | null;
  start_date: string | null;
  completion_date: string | null;
  sent_at: string | null;
  approved_at: string | null;
  declined_at: string | null;
  edit_count: number;
  created_at: string;
  company_id: string;
  company_name: string;
  project_name: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  created_by_name: string | null;
  line_items: {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number | null;
    amount: number | null;
    item_type: string;
    sort_order: number;
  }[];
  photos: {
    id: string;
    original_url: string;
    annotated_url: string | null;
    file_name: string | null;
    sort_order: number;
  }[];
  approval_events: {
    id: string;
    action: string;
    method: string | null;
    client_name_typed: string | null;
    ip_address: string | null;
    created_at: string;
  }[];
}

export interface ChangeOrderListRow {
  id: string;
  co_number: string;
  title: string;
  customer_name: string | null;
  total_amount: number | null;
  status: string;
  sent_via: string | null;
  created_at: string;
  company_id: string;
  company_name: string;
}
