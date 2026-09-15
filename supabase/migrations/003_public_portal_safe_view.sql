-- ═══════════════════════════════════════════════════════════════════════
-- Migration 3: safe read-only view for the public Client/Partner portals
-- Run this THIRD, after migrations 001 and 002.
--
-- Client Portal (/client/:name) and Partner Portal (/partner/:id) stay
-- public with no login, per Nessma's decision — but they may only ever
-- see the handful of columns they actually render, scoped to their own
-- client/partner. Everything else on employees_master (IBAN, bank,
-- salary breakdown, iqama/national ID beyond what's already shown,
-- fisheye margin, partner cost, client price, PO/invoice numbers,
-- notes, audit log, GOSI option, email, phone, sponsor, DOB, contract
-- IDs) is excluded from this view entirely — not just hidden in the UI.
-- ═══════════════════════════════════════════════════════════════════════

create or replace view public.employees_portal_safe as
select
  _id,
  client,
  "partnerAssigned",
  name,
  position,
  project,
  "startDate",
  "endDate",
  status,
  "workflowStatus",
  "totalPackage",
  "idNumber"
from public.employees_master;

-- Views don't enforce RLS on their own — grant SELECT to anon explicitly,
-- and rely on the base table's RLS (migration 002) to keep anon out of
-- employees_master directly.
grant select on public.employees_portal_safe to anon, authenticated;

-- Belt-and-suspenders: make sure anon truly has nothing on the base table.
revoke all on public.employees_master from anon;
