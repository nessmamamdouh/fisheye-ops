-- ═══════════════════════════════════════════════════════════════════════
-- Migration 2: Row Level Security on the app's real data tables
-- Run this SECOND, only after migration 001 and after Nessma's account
-- has been promoted to admin (otherwise nobody — including her — will
-- be able to read anything once this runs).
--
-- Model: SELECT requires any logged-in @fisheye.sa user (a profiles row
-- exists). INSERT/UPDATE/DELETE require role = 'admin'. Viewers can look
-- but not touch anything, matching the two-tier access Nessma asked for.
-- The anon key gets NO access to these tables at all — public portal
-- reads go through the separate safe view in migration 003 instead.
-- ═══════════════════════════════════════════════════════════════════════

-- Small helper so every policy below reads the same and stays easy to audit.
create or replace function public.is_logged_in()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ─── employees_master ───────────────────────────────────────────────────
alter table public.employees_master enable row level security;

drop policy if exists "employees_select_logged_in" on public.employees_master;
create policy "employees_select_logged_in" on public.employees_master
  for select using (public.is_logged_in());

drop policy if exists "employees_insert_admin_only" on public.employees_master;
create policy "employees_insert_admin_only" on public.employees_master
  for insert with check (public.is_admin());

drop policy if exists "employees_update_admin_only" on public.employees_master;
create policy "employees_update_admin_only" on public.employees_master
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "employees_delete_admin_only" on public.employees_master;
create policy "employees_delete_admin_only" on public.employees_master
  for delete using (public.is_admin());

-- ─── fisheye_app_data (config: clients, partners, mapping rules, payroll flow) ──
alter table public.fisheye_app_data enable row level security;

drop policy if exists "appdata_select_logged_in" on public.fisheye_app_data;
create policy "appdata_select_logged_in" on public.fisheye_app_data
  for select using (public.is_logged_in());

drop policy if exists "appdata_insert_admin_only" on public.fisheye_app_data;
create policy "appdata_insert_admin_only" on public.fisheye_app_data
  for insert with check (public.is_admin());

drop policy if exists "appdata_update_admin_only" on public.fisheye_app_data;
create policy "appdata_update_admin_only" on public.fisheye_app_data
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "appdata_delete_admin_only" on public.fisheye_app_data;
create policy "appdata_delete_admin_only" on public.fisheye_app_data
  for delete using (public.is_admin());

-- ─── fisheye_invoices ────────────────────────────────────────────────────
alter table public.fisheye_invoices enable row level security;

drop policy if exists "invoices_select_logged_in" on public.fisheye_invoices;
create policy "invoices_select_logged_in" on public.fisheye_invoices
  for select using (public.is_logged_in());

drop policy if exists "invoices_insert_admin_only" on public.fisheye_invoices;
create policy "invoices_insert_admin_only" on public.fisheye_invoices
  for insert with check (public.is_admin());

drop policy if exists "invoices_update_admin_only" on public.fisheye_invoices;
create policy "invoices_update_admin_only" on public.fisheye_invoices
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "invoices_delete_admin_only" on public.fisheye_invoices;
create policy "invoices_delete_admin_only" on public.fisheye_invoices
  for delete using (public.is_admin());

-- ─── fisheye_payroll_flows ───────────────────────────────────────────────
alter table public.fisheye_payroll_flows enable row level security;

drop policy if exists "payroll_select_logged_in" on public.fisheye_payroll_flows;
create policy "payroll_select_logged_in" on public.fisheye_payroll_flows
  for select using (public.is_logged_in());

drop policy if exists "payroll_insert_admin_only" on public.fisheye_payroll_flows;
create policy "payroll_insert_admin_only" on public.fisheye_payroll_flows
  for insert with check (public.is_admin());

drop policy if exists "payroll_update_admin_only" on public.fisheye_payroll_flows;
create policy "payroll_update_admin_only" on public.fisheye_payroll_flows
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payroll_delete_admin_only" on public.fisheye_payroll_flows;
create policy "payroll_delete_admin_only" on public.fisheye_payroll_flows
  for delete using (public.is_admin());

-- ─── partners (id, name — read by the root app for the partner picker) ──
alter table public.partners enable row level security;

drop policy if exists "partners_select_logged_in" on public.partners;
create policy "partners_select_logged_in" on public.partners
  for select using (public.is_logged_in());

drop policy if exists "partners_insert_admin_only" on public.partners;
create policy "partners_insert_admin_only" on public.partners
  for insert with check (public.is_admin());

drop policy if exists "partners_update_admin_only" on public.partners;
create policy "partners_update_admin_only" on public.partners
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "partners_delete_admin_only" on public.partners;
create policy "partners_delete_admin_only" on public.partners
  for delete using (public.is_admin());
