// ==========================================
// Database Table Types
// ==========================================

export type UserRole = "admin" | "pm" | "contractor";
export type COStatus = "draft" | "sent" | "approved" | "declined" | "void" | "invoiced";
export type PricingType = "fixed" | "tm" | "hybrid";
export type ApprovalMethod = "sms" | "email" | "link" | "both";
export type ProjectStatus = "active" | "completed" | "archived";
export type PlanTier = "starter" | "growth" | "pro" | "enterprise";
export type NotificationChannel = "sms" | "email";
export type NotificationStatus = "sent" | "delivered" | "failed" | "bounced" | "opened" | "clicked";
export type ApprovalAction = "approved" | "declined" | "viewed" | "reminder_sent";
export type LineItemType = "labor" | "materials" | "other";

export interface CompanySettings {
  default_approval_method: ApprovalMethod;
  reminder_hours: number;
  co_prefix: string;
  co_sequence_start: number;
  default_labor_rate: number | null;
  terms_text: string | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  trade_type: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  logo_url: string | null;
  plan_tier: PlanTier;
  settings: CompanySettings;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_phone_secondary: string | null;
  sms_consent: boolean;
  sms_consent_at: string | null;
  status: ProjectStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChangeOrder {
  id: string;
  company_id: string;
  project_id: string;
  co_number: string;
  title: string;
  description: string | null;
  pricing_type: PricingType;
  fixed_amount: number | null;
  total_amount: number | null;
  status: COStatus;
  approval_method: ApprovalMethod | null;
  approval_token: string | null;
  approval_token_expires_at: string | null;
  internal_notes: string | null;
  start_date: string | null;
  completion_date: string | null;
  sent_at: string | null;
  approved_at: string | null;
  declined_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface COLineItem {
  id: string;
  change_order_id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number | null;
  amount: number | null;
  item_type: LineItemType;
  sort_order: number;
  created_at: string;
}

export interface COPhoto {
  id: string;
  change_order_id: string;
  original_url: string;
  annotated_url: string | null;
  file_name: string | null;
  file_size: number | null;
  sort_order: number;
  created_at: string;
}

export interface ApprovalEvent {
  id: string;
  change_order_id: string;
  company_id: string;
  action: ApprovalAction;
  method: ApprovalMethod | null;
  ip_address: string | null;
  user_agent: string | null;
  client_name_typed: string | null;
  phone_number_hash: string | null;
  twilio_message_sid: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  change_order_id: string | null;
  company_id: string;
  channel: NotificationChannel;
  recipient: string;
  template_type: string | null;
  external_id: string | null;
  status: NotificationStatus;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

// ==========================================
// Form Types
// ==========================================

export interface CreateProjectForm {
  name: string;
  address?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_phone_secondary?: string;
}

export interface CreateCOForm {
  project_id: string;
  title: string;
  description?: string;
  pricing_type: PricingType;
  fixed_amount?: number;
  internal_notes?: string;
  start_date?: string;
  completion_date?: string;
  line_items?: CreateLineItemForm[];
}

export interface CreateLineItemForm {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  item_type: LineItemType;
}

export interface CompanySetupForm {
  name: string;
  trade_type?: string;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}

// ==========================================
// Extended types with relations
// ==========================================

export interface ChangeOrderWithRelations extends ChangeOrder {
  project?: Project;
  line_items?: COLineItem[];
  photos?: COPhoto[];
  approval_events?: ApprovalEvent[];
}

export interface ProjectWithCOs extends Project {
  change_orders?: ChangeOrder[];
}

export interface UserWithCompany extends User {
  company?: Company;
}
