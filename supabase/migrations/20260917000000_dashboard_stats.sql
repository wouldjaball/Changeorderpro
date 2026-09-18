-- Dashboard stat tiles used to run five separate count/sum round trips per
-- page load. One stable function returns them all in a single query.
--
-- SECURITY INVOKER is deliberate: the caller's RLS policies still decide which
-- change_orders rows are visible, so a company can only ever total its own.

CREATE OR REPLACE FUNCTION public.dashboard_stats(p_company_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_cos', count(*),
    'awaiting_approval', count(*) FILTER (WHERE status = 'sent'),
    'approved_this_month', count(*) FILTER (
      WHERE status = 'approved' AND approved_at >= date_trunc('month', now())
    ),
    'total_approved_value', coalesce(
      sum(total_amount) FILTER (WHERE status = 'approved'), 0
    ),
    'paid_count', count(*) FILTER (WHERE status = 'paid'),
    'total_paid_value', coalesce(
      sum(total_amount) FILTER (WHERE status = 'paid'), 0
    )
  )
  FROM public.change_orders
  WHERE company_id = p_company_id
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;
