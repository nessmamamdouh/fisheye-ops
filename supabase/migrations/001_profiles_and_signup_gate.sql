-- ═══════════════════════════════════════════════════════════════════════
-- Migration 1: profiles table + domain-restricted signup gate
-- Run this FIRST in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════

-- One row per logged-in user: their role decides what RLS lets them do.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'viewer' check (role in ('admin','viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any logged-in user can read the profiles list (needed so the app can
-- show "who's on the team" and check its own role).
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select
  using (auth.uid() is not null);

-- Only an admin can change a role (promote/demote). A user can never
-- grant themselves admin — the check re-reads profiles for the CALLER,
-- not the row being edited.
drop policy if exists "profiles_update_admin_only" on public.profiles;
create policy "profiles_update_admin_only" on public.profiles
  for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Nobody inserts/deletes profiles directly from the client — rows are
-- created only by the trigger below, and there is no delete path from
-- the app (deactivate by other means later if ever needed).
revoke insert, delete on public.profiles from anon, authenticated;

-- ─── Domain-restricted auto-provisioning ────────────────────────────────
-- This is the REAL security boundary, not the signup form's client-side
-- check: anyone can technically create a Supabase Auth account with any
-- email, but this trigger only creates a `profiles` row — and therefore
-- only grants any access at all, anywhere in the app — for @fisheye.sa
-- addresses. No profile row = every RLS policy in this project denies
-- them, silently and completely.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email ilike '%@fisheye.sa' then
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'viewer')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Backfill ────────────────────────────────────────────────────────
-- Covers the case where someone already signed up (e.g. through the app,
-- moments before this migration ran) before this trigger existed — the
-- trigger only fires on NEW signups, so existing @fisheye.sa accounts
-- need a one-time catch-up.
insert into public.profiles (id, email, role)
select id, email, 'viewer' from auth.users
where email ilike '%@fisheye.sa'
on conflict (id) do nothing;

-- ─── One-time: make Nessma an admin ─────────────────────────────────────
-- Run this part ONLY after she has actually signed up once in the app
-- (so the auth.users row — and the profiles row the trigger creates —
-- already exist). Adjust the email below if it's not this one.
-- update public.profiles set role = 'admin' where email = 'Nesma@fisheye.sa';
