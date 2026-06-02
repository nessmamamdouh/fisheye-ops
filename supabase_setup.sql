-- =====================================================
-- FISHEYE OPS PRO — Supabase Tables Setup
-- شغّلي هذا الـ SQL في:
--   Supabase Dashboard → SQL Editor → New query
-- =====================================================

-- ── 1. EMPLOYEES (موجود بالفعل — تأكد من العمود _id) ────────────────────
-- لو employees_master مش موجود، شغّلي هذا:
CREATE TABLE IF NOT EXISTS employees_master (
  _id          TEXT PRIMARY KEY,
  name         TEXT,
  employeeId   TEXT,
  position     TEXT,
  client       TEXT,
  partner      TEXT,
  nationality  TEXT,
  startDate    TEXT,
  endDate      TEXT,
  package      NUMERIC,
  clientBill   NUMERIC,
  workflowStatus TEXT,
  gosiStatus   TEXT,
  iqamaExpiry  TEXT,
  passportExpiry TEXT,
  poNumber     TEXT,
  sourcing     TEXT,
  notes        TEXT,
  onboardingSteps JSONB,
  data         JSONB,   -- باقي الحقول الديناميكية
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 2. CLIENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fisheye_clients (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  region       TEXT,
  email        TEXT,
  status       TEXT DEFAULT 'active',
  notes        TEXT,
  data         JSONB,   -- كل الحقول الإضافية
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 3. PARTNERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fisheye_partners (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  contact      TEXT,
  email        TEXT,
  phone        TEXT,
  status       TEXT DEFAULT 'active',
  notes        TEXT,
  data         JSONB,   -- كل الحقول الإضافية
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 4. PAYROLL FLOWS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fisheye_payroll_flows (
  month        TEXT PRIMARY KEY,  -- مثال: "2025-05"
  data         JSONB NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Row Level Security (اختياري - للأمان) ─────────────────────────────
-- لو عايزه public (كل المستخدمين يقدروا يقروا ويكتبوا):
ALTER TABLE employees_master    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fisheye_clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fisheye_partners    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fisheye_payroll_flows ENABLE ROW LEVEL SECURITY;

-- Policy: السماح للـ anon key بالقراءة والكتابة الكاملة
CREATE POLICY "allow_all_employees"     ON employees_master      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clients"       ON fisheye_clients       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_partners"      ON fisheye_partners      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_payroll"       ON fisheye_payroll_flows FOR ALL USING (true) WITH CHECK (true);

-- ── 6. Realtime (تفعيل التحديثات اللحظية) ───────────────────────────────
-- في Supabase Dashboard → Database → Replication
-- أضيف: employees_master, fisheye_clients, fisheye_partners

-- =====================================================
-- ✅ خلاص! بعد تشغيل هذا الـ SQL:
--    1. ارجعي للـ app
--    2. اضغطي "Upload to Cloud" في Dashboard
--    3. كل البيانات هترفع لـ Supabase
-- =====================================================
