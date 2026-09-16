drop trigger if exists change_orders_guard_project_company on public.change_orders;
drop function if exists public.guard_change_order_project_company();
drop trigger if exists users_guard_membership_changes on public.users;
drop function if exists public.guard_user_membership_changes();
