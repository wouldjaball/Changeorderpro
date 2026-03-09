-- ==========================================
-- Row Level Security Policies
-- All data scoped by company_id to enforce
-- multi-tenant isolation at the DB layer
-- ==========================================

-- Helper function: get current user's company_id
-- Note: must be in public schema (auth schema is read-only on hosted Supabase)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- COMPANIES
-- ==========================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = public.get_my_company_id());

CREATE POLICY "Admins can update their own company"
  ON companies FOR UPDATE
  USING (id = public.get_my_company_id())
  WITH CHECK (id = public.get_my_company_id());

-- Allow insert during company creation (user not yet linked)
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- USERS
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teammates"
  ON users FOR SELECT
  USING (company_id = public.get_my_company_id() OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "New users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ==========================================
-- PROJECTS
-- ==========================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company projects"
  ON projects FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Users can create projects for their company"
  ON projects FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "Users can update company projects"
  ON projects FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "Users can delete company projects"
  ON projects FOR DELETE
  USING (company_id = public.get_my_company_id());

-- ==========================================
-- CHANGE ORDERS
-- ==========================================
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company change orders"
  ON change_orders FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Users can create change orders for their company"
  ON change_orders FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "Users can update company change orders"
  ON change_orders FOR UPDATE
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "Users can delete draft change orders"
  ON change_orders FOR DELETE
  USING (company_id = public.get_my_company_id() AND status = 'draft');

-- ==========================================
-- CO LINE ITEMS
-- ==========================================
ALTER TABLE co_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view line items for company COs"
  ON co_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM change_orders
    WHERE change_orders.id = co_line_items.change_order_id
    AND change_orders.company_id = public.get_my_company_id()
  ));

CREATE POLICY "Users can manage line items for company COs"
  ON co_line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM change_orders
    WHERE change_orders.id = co_line_items.change_order_id
    AND change_orders.company_id = public.get_my_company_id()
  ));

CREATE POLICY "Users can update line items for company COs"
  ON co_line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM change_orders
    WHERE change_orders.id = co_line_items.change_order_id
    AND change_orders.company_id = public.get_my_company_id()
  ));

CREATE POLICY "Users can delete line items for company COs"
  ON co_line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM change_orders
    WHERE change_orders.id = co_line_items.change_order_id
    AND change_orders.company_id = public.get_my_company_id()
  ));

-- ==========================================
-- CO PHOTOS
-- ==========================================
ALTER TABLE co_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos for company COs"
  ON co_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM change_orders
    WHERE change_orders.id = co_photos.change_order_id
    AND change_orders.company_id = public.get_my_company_id()
  ));

CREATE POLICY "Users can add photos to company COs"
  ON co_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM change_orders
    WHERE change_orders.id = co_photos.change_order_id
    AND change_orders.company_id = public.get_my_company_id()
  ));

CREATE POLICY "Users can delete photos from company COs"
  ON co_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM change_orders
    WHERE change_orders.id = co_photos.change_order_id
    AND change_orders.company_id = public.get_my_company_id()
  ));

-- ==========================================
-- APPROVAL EVENTS (immutable - INSERT only)
-- ==========================================
ALTER TABLE approval_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval events for company COs"
  ON approval_events FOR SELECT
  USING (company_id = public.get_my_company_id());

-- Insert allowed for service role only (webhooks/API routes use admin client)
-- No UPDATE or DELETE policies — triggers enforce immutability

-- ==========================================
-- NOTIFICATIONS LOG
-- ==========================================
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their company"
  ON notifications_log FOR SELECT
  USING (company_id = public.get_my_company_id());

-- Insert via service role only (API routes)

-- ==========================================
-- AUDIT LOG
-- ==========================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log for their company"
  ON audit_log FOR SELECT
  USING (company_id = public.get_my_company_id());

-- Insert via service role only (server actions)

-- ==========================================
-- STORAGE POLICIES
-- ==========================================
-- Note: These are configured in Supabase Dashboard or via supabase CLI
-- co-photos bucket: authenticated users can upload to their company path
-- co-pdfs bucket: authenticated users can read their company's PDFs
-- company-logos bucket: public read, authenticated upload
