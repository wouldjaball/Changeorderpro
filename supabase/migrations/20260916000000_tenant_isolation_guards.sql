-- Tenant isolation guards.
--
-- 1. users: a signed-in user could update their own row and change
--    company_id (or role) to any company, which would grant full access to
--    that company's projects and change orders through get_my_company_id().
--    Lock company_id, role, and email for non-privileged sessions. The only
--    allowed transition is claiming a brand-new company during onboarding:
--    company_id from NULL to a company that has no members yet.
--
-- 2. change_orders: the insert/update policies check company_id, but
--    project_id could still point at another company's project. Enforce that
--    the project belongs to the same company.
--
-- Both functions are SECURITY DEFINER so they can see rows hidden by RLS.

CREATE OR REPLACE FUNCTION public.guard_user_membership_changes()
RETURNS TRIGGER AS $$
DECLARE
  session_role TEXT := coalesce(auth.role(), '');
  claiming_new_company BOOLEAN := false;
BEGIN
  IF session_role NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    IF OLD.company_id IS NULL
       AND NEW.company_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.users u
         WHERE u.company_id = NEW.company_id AND u.id <> NEW.id
       )
    THEN
      claiming_new_company := true;
    ELSE
      RAISE EXCEPTION 'company membership can only be changed by an administrator'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT claiming_new_company THEN
    RAISE EXCEPTION 'role can only be changed by an administrator'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'email cannot be changed here'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS users_guard_membership_changes ON public.users;
CREATE TRIGGER users_guard_membership_changes
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_membership_changes();

CREATE OR REPLACE FUNCTION public.guard_change_order_project_company()
RETURNS TRIGGER AS $$
DECLARE
  project_company UUID;
BEGIN
  SELECT company_id INTO project_company
  FROM public.projects
  WHERE id = NEW.project_id;

  IF project_company IS NULL OR project_company <> NEW.company_id THEN
    RAISE EXCEPTION 'project does not belong to this company'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS change_orders_guard_project_company ON public.change_orders;
CREATE TRIGGER change_orders_guard_project_company
  BEFORE INSERT OR UPDATE OF project_id, company_id ON public.change_orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_change_order_project_company();
