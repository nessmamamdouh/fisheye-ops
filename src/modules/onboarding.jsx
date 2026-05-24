import React, { useState, useMemo } from 'react';
import { FileText, UserPlus, CheckCircle, Clock, AlertCircle, CalendarDays, RotateCcw } from 'lucide-react';
import { supabase } from '../utils/supabase';

const M = "#800000";

// ─── Workflow buckets ──────────────────────────────────────────────────────────
const WF_ONBOARDING = new Set(['onboarding']);
const WF_PENDING    = new Set(['pending']);
const WF_INPROGRESS = new Set(['docs requested', 'docs received', 'docs received +', 'agreement sent']);

function getWorkflowBucket(emp) {
  const wf = (emp.workflowStatus || '').toLowerCase();
  if (WF_ONBOARDING.has(wf)) return 'onboarding';
  if (WF_PENDING.has(wf))    return 'pending';
  if (WF_INPROGRESS.has(wf)) return 'inprogress';
  return null;
}

// Returns the applicable onboarding steps for a given employee.
// partners[] is optional — used to check partnerType (operational vs commission).
function getApplicableSteps(emp, partners = []) {
  const isSela       = (emp.client || '').toLowerCase() === 'sela';
  const isFisheyeSrc = (emp.sourcingThrough || '').toLowerCase().includes('fisheye');

  const assignedName = String(emp.partnerAssigned || '').trim();
  const partnerRecord = assignedName
    ? partners.find(p => p.name === assignedName)
    : null;
  // Only count as operational partner if partnerType === 'operational'
  // (commission-only partners like Blue Cube don't trigger Qiwa/paperwork steps)
  const hasPartner = emp.profitMode === 'partner'
                     && assignedName !== ''
                     && partnerRecord?.partnerType === 'operational';

  const steps = [];

  // ── 1. Universal: enter in system ───────────────────────────────
  steps.push({
    id: 'sys-1',
    title: 'إدخال بيانات الموظف في السيستم',
    hint: 'اسم، منصب، عميل، راتب، تاريخ البداية — تأكد من صحة كل البيانات',
    day: 'يوم 1', daycolor: 'b',
  });

  // ── 2. Universal: confirm documents ─────────────────────────────
  steps.push({
    id: 'docs-1',
    title: 'تأكيد المستندات مكتملة',
    hint: 'هوية وطنية أو إقامة، شهادات، حساب بنكي + IBAN',
    day: 'يوم 1', daycolor: 'b',
  });

  // ── 3. Offer letter — Fisheye sourcing only ──────────────────────
  if (isFisheyeSrc) {
    steps.push({
      id: 'offer-1',
      title: 'إرسال الأوفر ليتر للموظف',
      hint: 'Sourcing = Fisheye — راجع الراتب والمسمى والتاريخ قبل الإرسال',
      day: 'يوم 1', daycolor: 'b',
    });
  }

  // ── 4. Sela only: PO Number ──────────────────────────────────────
  if (isSela) {
    steps.push({
      id: 'po-1',
      title: 'استلام وتسجيل PO Number من Sela',
      hint: 'حقل PO Numbers في بروفايل الموظف — بدونه مفيش فاتورة تتبعت',
      day: 'يوم 3', daycolor: 'r',
    });
  }

  // ── 5–7. Operational partner: notify + Qiwa submitted + approved ─
  if (hasPartner) {
    steps.push({
      id: 'partner-1',
      title: `إبلاغ البارتنر (${emp.partnerAssigned}) وإرسال الأوراق`,
      hint: 'هوية، عقد، IBAN، بيانات Qiwa — للبارتنر التشغيلي',
      day: 'يوم 3', daycolor: 'r',
    });
    steps.push({
      id: 'qiwa-1',
      title: 'متابعة تسجيل Qiwa — Submitted',
      hint: 'تأكد إن البارتنر رفع الطلب — غيّر الـ Workflow إلى Qiwa Submitted',
      day: 'يوم 5', daycolor: 'r',
    });
    steps.push({
      id: 'qiwa-2',
      title: 'تأكيد Qiwa Approved',
      hint: 'بعد الموافقة الرسمية — غيّر الـ Workflow إلى Qiwa Approved في السيستم',
      day: 'يوم 7', daycolor: 'r',
    });
  }

  // ── GOSI: for any employee with gosiOption set ────────────────────
  const hasGosi = emp.gosiOption
    && String(emp.gosiOption).trim() !== ''
    && String(emp.gosiOption).trim() !== 'not_registered';
  const isSaudiNational = (emp.nationalityType || '').toLowerCase() === 'saudi_national';

  if (hasGosi) {
    const isPartnerGosi = emp.gosiOption === "On Partner's GOSI";

    steps.push({
      id: 'gosi-1',
      title: isPartnerGosi ? 'تأكيد تسجيل الموظف على GOSI عند البارتنر' : 'تسجيل الموظف على GOSI',
      hint: isPartnerGosi
        ? 'البارتنر مسؤول عن التسجيل — تأكد منه وإنه اتعمل فعلاً'
        : `${emp.gosiOption}${isSaudiNational ? ' — سعودي: خصم 9.75% من (Basic + HRA)' : ' — غير سعودي: بدون خصم'}`,
      day: 'يوم 5', daycolor: 'r',
    });
    steps.push({
      id: 'gosi-2',
      title: 'تأكيد تفعيل GOSI وتحديث السيستم',
      hint: isPartnerGosi
        ? 'تأكد من البارتنر إن التسجيل تفعّل — خصم 9.75% لو سعودي'
        : 'تأكد من التسجيل الفعلي — وإن الـ GOSI Option في بروفايل الموظف صح',
      day: 'يوم 7', daycolor: 'r',
    });

    // ── Qiwa contract steps — required for any employee enrolled in GOSI ──
    steps.push({
      id: 'qiwa-contract-1',
      title: 'إرسال عقد Qiwa للموظف',
      hint: 'تسجيل GOSI يستلزم عقد موثّق على Qiwa — أرسل العقد وانتظر القبول',
      day: 'يوم 7', daycolor: 'r',
    });
    steps.push({
      id: 'qiwa-contract-2',
      title: 'تأكيد Qiwa Contract Approved',
      hint: 'تأكد إن الموظف قبل العقد على Qiwa وإن الحالة تحولت لـ Approved',
      day: 'يوم 10', daycolor: 'r',
    });

    // ── Iqama Transfer — non-Saudis only ────────────────────────────────
    if (!isSaudiNational) {
      steps.push({
        id: 'iqama-transfer-1',
        title: 'نقل الإقامة (Iqama Transfer)',
        hint: 'الموظف غير سعودي مسجّل على GOSI — لازم نقل الكفالة/الإقامة لـ Fisheye أو البارتنر',
        day: 'يوم 14', daycolor: 'r',
      });
    }
  }

  // ── Contract: only if no GOSI (GOSI employees use Qiwa contract instead) ──
  if (!hasGosi) {
    steps.push({
      id: 'contract-1',
      title: 'إرسال العقد للموظف',
      hint: 'مراجعة الراتب والمدة وشروط العقد قبل الإرسال',
      day: 'أسبوع', daycolor: 'b',
    });
    steps.push({
      id: 'contract-2',
      title: 'توقيع العقد وحفظه في السيستم',
      hint: 'توقيع الطرفين — نسخة محفوظة في السيستم وعند الموظف',
      day: 'أسبوع', daycolor: 'g',
    });
  }

  return steps;
}

function getCompletedOnboardingSteps(emp, partners = []) {
  const applicable = getApplicableSteps(emp, partners);
  if (!emp.onboardingSteps) return 0;
  return applicable.filter(s => emp.onboardingSteps[s.id]).length;
}

const DAY_COLOR = {
  r: { bg: '#fee2e2', color: '#991b1b' },
  g: { bg: '#dcfce7', color: '#14532d' },
  b: { bg: '#dbeafe', color: '#1e40af' },
};

const BUCKET_META = {
  onboarding: { label: 'Onboarding', color: '#16a34a', bg: '#dcfce7' },
  pending:    { label: 'Pending',    color: '#d97706', bg: '#fef9c3' },
  inprogress: { label: 'Workflow',    color: '#2563eb', bg: '#dbeafe' },
};

// ─── Monthly checklist definition ─────────────────────────────────────────────
// Stored in localStorage keyed by "fisheye_checklist_YYYY-MM" → resets each month

const MONTHLY_CHECKLIST = [
  // ══════════════════════════════════════════════════════════════════
  // القسم 1 — أول الشهر: الفواتير والتحصيل (يوم 1–7)
  // ══════════════════════════════════════════════════════════════════
  {
    section: 'أول الشهر — الفواتير والتحصيل',
    color: '#d97706',
    steps: [
      {
        id: 'iv-1',
        title: 'تأكيد PO Numbers لموظفي Sela',
        hint: 'Sela فقط — لازم الـ PO يكون في السيستم قبل ما نبعت أي فاتورة',
        day: 'يوم 1–5', daycolor: 'r',
      },
      {
        id: 'iv-2',
        title: 'إرسال فاتورة الشهر السابق لكل العملاء',
        hint: 'كل العملاء — بناءً على شيت الرواتب، يوم 1 إلى 7 من الشهر الجديد',
        day: 'يوم 1–7', daycolor: 'r',
      },
      {
        id: 'iv-3',
        title: 'تسجيل أرقام الفواتير في السيستم',
        hint: 'كل العملاء — حقل Invoice Numbers لكل موظف في الـ Employee Profile',
        day: 'يوم 7', daycolor: 'b',
      },
      {
        id: 'iv-4',
        title: 'متابعة التحصيل المتأخر من الشهر السابق',
        hint: 'كل العملاء — العملاء اللي لسه ما دفعوش، راجع Billing في Finance',
        day: 'يوم 1–10', daycolor: 'r',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // القسم 2 — الموظفون الجدد: تسجيل وتوثيق (يوم 1–10)
  // ══════════════════════════════════════════════════════════════════
  {
    section: 'الموظفون الجدد — التسجيل والتوثيق',
    color: '#2563eb',
    steps: [
      {
        id: 'tp-1',
        title: 'تجميع قائمة الموظفين الجدد هذا الشهر',
        hint: 'كل العملاء — التعيينات الجديدة والـ transfers، راجع Onboarding tab',
        day: 'يوم 1–3', daycolor: 'b',
      },
      {
        id: 'tp-2',
        title: 'إرسال ملف الموظفين الجدد للبارتنر التشغيلي',
        hint: 'SPL / Channelplay / Riva / Combuzz فقط — هوية، عقد، IBAN، بيانات Qiwa',
        day: 'يوم 3', daycolor: 'r',
      },
      {
        id: 'tp-3',
        title: 'متابعة البارتنر لإتمام تسجيل Qiwa',
        hint: 'SPL / Channelplay / Riva / Combuzz فقط — متابعة حتى تظهر الموافقة',
        day: 'يوم 7', daycolor: 'b',
      },
      {
        id: 'tp-4',
        title: 'تأكيد تسجيل السعوديين الجدد على GOSI مع البارتنر',
        hint: 'SPL / Channelplay / Riva / Combuzz — Saudi Nationals فقط، تأكد من option في السيستم',
        day: 'يوم 7', daycolor: 'r',
      },
      {
        id: 'tp-5',
        title: 'توثيق بيانات الموظف الجديد في السيستم مباشرة',
        hint: 'Sela فقط — لا Qiwa ولا GOSI، فيشاي تتولى الأوبريشن كاملاً',
        day: 'يوم 3', daycolor: 'b',
      },
      {
        id: 'tp-6',
        title: 'تحديث Workflow Status للموظفين المسجلين',
        hint: 'كل العملاء — Agreement Signed أو Qiwa Approved حسب كل موظف',
        day: 'يوم 10', daycolor: 'b',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // القسم 3 — كوميشن البارتنر (يوم 10–15)
  // ══════════════════════════════════════════════════════════════════
  {
    section: 'كوميشن البارتنر',
    color: '#7c3aed',
    steps: [
      {
        id: 'pt-1',
        title: 'حساب كوميشن البارتنر للشهر',
        hint: 'كل العملاء — راجع Partner Hub وتأكد من عدد الموظفين الفعليين',
        day: 'يوم 10', daycolor: 'b',
      },
      {
        id: 'pt-2',
        title: 'مراجعة الـ Profit Margins والـ Savings',
        hint: 'كل العملاء — Finance → Billing، تأكد أن الهامش منطقي بعد الكوميشن',
        day: 'يوم 12', daycolor: 'b',
      },
      {
        id: 'pt-3',
        title: 'إرسال تقرير الكوميشن للمالية',
        hint: 'كل العملاء — Sela: كوميشن بدون عمل تشغيلي / باقي العملاء: كوميشن + تشغيل',
        day: 'يوم 15', daycolor: 'r',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // القسم 4 — الرواتب (يوم 18–25)
  // ══════════════════════════════════════════════════════════════════
  {
    section: 'منتصف الشهر — الرواتب',
    color: M,
    steps: [
      {
        id: 'pr-1',
        title: 'مراجعة Proration للجدد والمغادرين',
        hint: 'كل العملاء — Joiners + Leavers في هذا الشهر، راجع Finance → Payroll',
        day: 'يوم 18', daycolor: 'b',
      },
      {
        id: 'pr-2',
        title: 'مراجعة خصومات GOSI في شيت الرواتب',
        hint: 'SPL / Channelplay / Riva / Combuzz — (Basic+HRA)×9.75% للسعوديين فقط، Sela مفيش GOSI',
        day: 'يوم 19', daycolor: 'r',
      },
      {
        id: 'pr-3',
        title: 'تصدير شيت الرواتب ومراجعته',
        hint: 'كل العملاء — مراجعة الأيام والبدلات والـ proration قبل الإرسال',
        day: 'يوم 20', daycolor: 'b',
      },
      {
        id: 'pr-4',
        title: 'إرسال الشيت للمالية',
        hint: 'كل العملاء — لإصدار تحويلات الرواتب',
        day: 'يوم 22', daycolor: 'b',
      },
      {
        id: 'pr-5',
        title: 'متابعة تحويل الرواتب للموظفين',
        hint: 'كل العملاء — تأكيد من المالية أن التحويلات تمت فعلياً',
        day: 'يوم 25', daycolor: 'r',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // القسم 5 — نهاية الشهر: الإغلاق (يوم 26–30)
  // ══════════════════════════════════════════════════════════════════
  {
    section: 'نهاية الشهر — الإغلاق',
    color: '#16a34a',
    steps: [
      {
        id: 'cl-1',
        title: 'إرسال Payslips للموظفين',
        hint: 'كل العملاء — من السيستم أو بالإيميل لكل موظف',
        day: 'يوم 28', daycolor: 'g',
      },
      {
        id: 'cl-2',
        title: 'مراجعة العقود المنتهية والـ Renewals القادمة',
        hint: 'كل العملاء — Action Center → Urgent، تواصل مع العميل قبل الانتهاء',
        day: 'آخر الشهر', daycolor: 'r',
      },
      {
        id: 'cl-3',
        title: 'تحديث Workflow Status للموظفين في السيستم',
        hint: 'كل العملاء — أي تغييرات في الحالة لازم تتسجل قبل الشهر الجديد',
        day: 'آخر الشهر', daycolor: 'b',
      },
      {
        id: 'cl-4',
        title: 'حل قضايا الـ Pending قبل الشهر الجديد',
        hint: 'كل العملاء — راجع Onboarding → Pending وحل أي معلقات',
        day: 'آخر الشهر', daycolor: 'b',
      },
    ],
  },
];

// localStorage key = "fisheye_checklist_YYYY-MM"
function getChecklistKey() {
  const now = new Date();
  return `fisheye_checklist_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function loadChecklist() {
  try { return JSON.parse(localStorage.getItem(getChecklistKey()) || '{}'); }
  catch { return {}; }
}

function saveChecklist(state) {
  localStorage.setItem(getChecklistKey(), JSON.stringify(state));
}

const MG = "linear-gradient(135deg,#800000,#5c0000)";

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING MODULE — top-level view
// ═══════════════════════════════════════════════════════════════════════════════

export function OnboardingModule({ employees = [], setEmployees = () => {}, userRole = 'admin', partners = [] }) {
  const [moduleTab, setModuleTab] = useState('employees');

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%', gap: 0, boxSizing: 'border-box' }}>

      {/* Module tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', flexShrink: 0, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 20, paddingBottom: 10 }}>
          <UserPlus size={17} style={{ color: M }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>Onboarding</span>
        </div>
        {[
          { k: 'employees', l: 'Employees' },
          { k: 'checklist', l: 'Monthly Checklist' },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setModuleTab(k)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none', fontFamily: 'var(--font-sans)',
              borderBottom: moduleTab === k ? `2px solid ${M}` : '2px solid transparent',
              color: moduleTab === k ? M : '#6b7280',
              marginBottom: -1,
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {moduleTab === 'employees' && (
          <EmployeesView employees={employees} setEmployees={setEmployees} userRole={userRole} partners={partners} />
        )}
        {moduleTab === 'checklist' && (
          <MonthlyChecklistView employees={employees} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEES VIEW — master-detail layout
// ═══════════════════════════════════════════════════════════════════════════════

function EmployeesView({ employees, setEmployees, userRole, partners = [] }) {
  const [selectedId, setSelectedId]     = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterBucket, setFilterBucket] = useState('all');

  const today    = new Date(); today.setHours(0,0,0,0);
  const seen     = new Set();
  const pool     = employees.filter(e => {
    if (!getWorkflowBucket(e)) return false;
    // Exclude expired contracts — but keep if missing PO (still needs onboarding)
    const hasPO = e.poNumbers && String(e.poNumbers).trim() !== '';
    if (e.endDate && new Date(e.endDate) < today && hasPO) return false;
    if (seen.has(e._id)) return false;
    seen.add(e._id);
    return true;
  });
  const filtered = pool.filter(e => {
    const matchSearch = !searchTerm || e.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBucket = filterBucket === 'all' || getWorkflowBucket(e) === filterBucket;
    return matchSearch && matchBucket;
  });

  const selected = selectedId != null ? employees.find(e => e._id === selectedId) ?? null : null;

  const counts = {
    total:      pool.length,
    onboarding: pool.filter(e => getWorkflowBucket(e) === 'onboarding').length,
    pending:    pool.filter(e => getWorkflowBucket(e) === 'pending').length,
    inprogress: pool.filter(e => getWorkflowBucket(e) === 'inprogress').length,
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, backgroundColor: '#f3f4f6', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR 256px ── */}
      <div style={{ width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', backgroundColor: 'white' }}>

        {/* Gradient header */}
        <div style={{ background: MG, padding: '14px 14px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <UserPlus size={14} color="white" style={{ opacity: 0.85 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>Pipeline</span>
          </div>
          {/* Mini KPI strip — 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {[
              { label: 'TOTAL',   val: counts.total,      accent: 'rgba(255,255,255,0.95)' },
              { label: 'NEW',     val: counts.onboarding, accent: '#86efac' },
              { label: 'PENDING', val: counts.pending,    accent: '#fde68a' },
              { label: 'WORKFLOW', val: counts.inprogress, accent: '#93c5fd' },
            ].map(({ label, val, accent }) => (
              <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 8px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.07em' }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: accent, fontFamily: 'monospace', lineHeight: 1.2 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + filter pills */}
        <div style={{ padding: '8px 10px 7px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <input
            type="text" placeholder="Search employee…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 7, outline: 'none', marginBottom: 6, fontFamily: 'var(--font-sans)', color: '#111827' }}
          />
          <div style={{ display: 'flex', gap: 3 }}>
            {[
              { k: 'all',        l: 'All',     color: M        },
              { k: 'onboarding', l: 'New',     color: '#16a34a' },
              { k: 'pending',    l: 'Pending', color: '#d97706' },
              { k: 'inprogress', l: 'Workflow', color: '#2563eb' },
            ].map(({ k, l, color }) => (
              <button key={k} onClick={() => setFilterBucket(k)}
                style={{
                  flex: 1, padding: '4px 4px', fontSize: 10, fontWeight: 700, cursor: 'pointer', borderRadius: 6,
                  border: filterBucket === k ? `1.5px solid ${color}` : '1.5px solid #e5e7eb',
                  backgroundColor: filterBucket === k ? `${color}12` : 'white',
                  color: filterBucket === k ? color : '#9ca3af',
                  fontFamily: 'var(--font-sans)',
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Employee list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 12px', color: '#9ca3af', fontSize: 12 }}>
                {pool.length === 0 ? 'No employees in pipeline' : 'No results'}
              </div>
            : filtered.map(emp => (
                <EmployeeListItem key={emp._id} employee={emp} partners={partners}
                  isSelected={selectedId === emp._id} onSelect={e => setSelectedId(e._id)} />
              ))
          }
        </div>
      </div>

      {/* ── RIGHT DETAIL PANEL ── */}
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 10 }}>
          <UserPlus size={36} style={{ opacity: 0.18 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Select an employee to view their onboarding</p>
        </div>
      ) : (
        <EmployeeOnboardingDetail key={`detail-${selectedId}`} employee={selected} employees={employees}
          setEmployees={setEmployees} userRole={userRole} partners={partners} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY CHECKLIST VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function MonthlyChecklistView({ employees }) {
  const [checks, setChecks] = useState(loadChecklist);

  const now        = new Date();
  const monthName  = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const noPoSela      = employees.filter(e => (e.client || '').toLowerCase() === 'sela' && !(e.poNumbers && String(e.poNumbers).trim()));
  const pendingCount  = employees.filter(e => (e.workflowStatus || '').toLowerCase() === 'pending').length;
  const expiringCount = employees.filter(e => {
    if (!e.endDate) return false;
    const days = Math.ceil((new Date(e.endDate) - now) / 86400000);
    return days >= 0 && days <= 30;
  }).length;

  const toggle = (id) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveChecklist(next);
  };

  const resetAll = () => {
    if (!window.confirm('إعادة تعيين الـ checklist؟ سيتم حذف كل التيكات.')) return;
    setChecks({});
    saveChecklist({});
  };

  const allIds  = MONTHLY_CHECKLIST.flatMap(s => s.steps.map(st => st.id));
  const doneAll = allIds.filter(id => checks[id]).length;
  const pctAll  = Math.round((doneAll / allIds.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, backgroundColor: '#f3f4f6', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

      {/* Gradient header */}
      <div style={{ background: MG, padding: '16px 20px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={15} color="white" style={{ opacity: 0.85 }} />
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
                Monthly Checklist — {monthName}
              </h3>
              <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>تتصفر تلقائياً مع بداية كل شهر جديد</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 12, fontWeight: 800,
              color: pctAll === 100 ? '#86efac' : 'rgba(255,255,255,0.95)',
              backgroundColor: 'rgba(255,255,255,0.12)', padding: '4px 11px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              {doneAll}/{allIds.length} ({pctAll}%)
            </span>
            <button onClick={resetAll} style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
              padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
              backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-sans)',
            }}>
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>
        {/* Overall progress bar */}
        <div style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pctAll}%`, backgroundColor: pctAll === 100 ? '#86efac' : 'rgba(255,255,255,0.75)', borderRadius: 10, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 20px 40px' }}>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { dot: '#64748b', label: 'كل العملاء',                         bg: '#f1f5f9', color: '#334155' },
              { dot: '#1d4ed8', label: 'Sela فقط',                           bg: '#eff6ff', color: '#1d4ed8' },
              { dot: '#c2410c', label: 'SPL / Channelplay / Riva / Combuzz', bg: '#fff7ed', color: '#c2410c' },
            ].map(({ dot, label, bg, color }) => (
              <span key={label} style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 6, backgroundColor: bg, color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dot, display: 'inline-block', flexShrink: 0 }} />
                {label}
              </span>
            ))}
          </div>

          {/* Context alerts */}
          {(noPoSela.length > 0 || pendingCount > 0 || expiringCount > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
              {noPoSela.length > 0 && (
                <div style={{ padding: '9px 13px', borderRadius: 9, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#92400e', borderLeft: '3px solid #f97316' }}>
                  <strong>{noPoSela.length}</strong> موظف Sela بدون PO Number — لازم يتأكدوا قبل الفاتورة
                </div>
              )}
              {pendingCount > 0 && (
                <div style={{ padding: '9px 13px', borderRadius: 9, backgroundColor: '#fefce8', border: '1px solid #fde047', fontSize: 12, color: '#713f12', borderLeft: '3px solid #eab308' }}>
                  <strong>{pendingCount}</strong> موظف في حالة Pending
                </div>
              )}
              {expiringCount > 0 && (
                <div style={{ padding: '9px 13px', borderRadius: 9, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', fontSize: 12, color: '#9f1239', borderLeft: '3px solid #f43f5e' }}>
                  <strong>{expiringCount}</strong> عقد ينتهي خلال 30 يوم — راجع Renewals
                </div>
              )}
            </div>
          )}

          {/* Checklist sections */}
          {MONTHLY_CHECKLIST.map(section => {
            const sectionDone  = section.steps.filter(st => checks[st.id]).length;
            const sectionTotal = section.steps.length;
            const sectionPct   = Math.round((sectionDone / sectionTotal) * 100);

            return (
              <div key={section.section} style={{ marginBottom: 14, borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', backgroundColor: 'white' }}>
                {/* Section header */}
                <div style={{ padding: '11px 15px', borderBottom: '1px solid #e5e7eb', backgroundColor: `${section.color}08`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${section.color}` }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: section.color, fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>
                    {section.section}
                  </h4>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5,
                    backgroundColor: sectionPct === 100 ? '#dcfce7' : `${section.color}18`,
                    color: sectionPct === 100 ? '#14532d' : section.color,
                  }}>
                    {sectionDone}/{sectionTotal} {sectionPct === 100 ? '✓' : ''}
                  </span>
                </div>
                {/* Steps */}
                <div style={{ padding: '7px 12px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {section.steps.map(step => (
                    <ChecklistStepItem key={step.id} step={step} isDone={!!checks[step.id]} onToggle={() => toggle(step.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function EmployeeOnboardingDetail({ employee, employees, setEmployees, userRole, partners = [] }) {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [toast, setToast]         = useState(null); // { msg, ok }
  const canEdit = ['admin', 'hr'].includes(userRole);

  const ONBOARDING_STEPS = getApplicableSteps(employee, partners);

  const TABS = [
    { k: 'onboarding', l: 'Onboarding Steps' },
    { k: 'profile',    l: 'Profile' },
    { k: 'documents',  l: 'Documents' },
  ];

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); };

  const toggleStep = async (stepId) => {
    if (!canEdit) return;
    const current    = employee.onboardingSteps || {};
    const updated    = { ...current, [stepId]: !current[stepId] };
    const applicable = getApplicableSteps(employee, partners);
    const allDone    = applicable.length > 0 && applicable.every(s => updated[s.id]);
    const payload    = allDone
      ? { onboardingSteps: updated, workflowStatus: 'Agreement Signed' }
      : { onboardingSteps: updated };

    setEmployees(prev => prev.map(e => e._id === employee._id ? { ...e, ...payload } : e));

    try {
      const { error } = await supabase
        .from('employees_master')
        .update(payload)
        .eq('_id', Number(employee._id));
      if (error) throw error;
      showToast(allDone ? 'Onboarding complete — moved to Agreement Signed' : 'Saved', true);
    } catch (e) {
      console.error(e);
      showToast('Save failed', false);
    }
  };

  const doneCount  = getCompletedOnboardingSteps(employee, partners);
  const totalSteps = ONBOARDING_STEPS.length;
  const progress   = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  const isSela               = (employee.client || '').toLowerCase() === 'sela';
  const isFisheyeSrc         = (employee.sourcingThrough || '').toLowerCase().includes('fisheye');
  const assignedName         = String(employee.partnerAssigned || '').trim();
  const partnerRecord        = assignedName ? partners.find(p => p.name === assignedName) : null;
  const isOperationalPartner = employee.profitMode === 'partner' && partnerRecord?.partnerType === 'operational';
  const isCommissionPartner  = employee.profitMode === 'partner' && partnerRecord?.partnerType === 'commission';

  const tags = [
    isSela               && { label: 'Sela — PO Required',                        bg: 'rgba(219,234,254,0.3)', color: '#bfdbfe' },
    isFisheyeSrc         && { label: 'Fisheye Sourcing',                           bg: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' },
    isOperationalPartner && { label: `Partner (Operational): ${assignedName}`,     bg: 'rgba(196,181,253,0.25)', color: '#ddd6fe' },
    isCommissionPartner  && { label: `Partner (Commission only): ${assignedName}`, bg: 'rgba(254,240,138,0.2)', color: '#fef08a' },
    !assignedName && !isSela && { label: 'Direct',                                 bg: 'rgba(134,239,172,0.2)', color: '#86efac' },
  ].filter(Boolean);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          padding: '10px 18px', borderRadius: 10, fontSize: 13,
          backgroundColor: toast.ok ? '#166534' : '#991b1b',
          color: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>{toast.msg}</div>
      )}

      {/* Gradient header */}
      <div style={{ background: MG, padding: '16px 20px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tags.length > 0 ? 8 : 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'white', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>{employee.name}</h3>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{employee.position} · {employee.client}</p>
          </div>
          <span style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            backgroundColor: progress === 100 ? 'rgba(134,239,172,0.25)' : 'rgba(255,255,255,0.15)',
            color: progress === 100 ? '#86efac' : 'rgba(255,255,255,0.9)',
            border: `1px solid ${progress === 100 ? 'rgba(134,239,172,0.4)' : 'rgba(255,255,255,0.2)'}`,
          }}>{doneCount}/{totalSteps} steps {progress === 100 ? '✓' : ''}</span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {tags.map(t => (
              <span key={t.label} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, backgroundColor: t.bg, color: t.color, border: '1px solid rgba(255,255,255,0.15)' }}>
                {t.label}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, backgroundColor: progress === 100 ? '#86efac' : 'rgba(255,255,255,0.75)', borderRadius: 10, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', flexShrink: 0 }}>
        {TABS.map(({ k, l }) => (
          <button key={k} onClick={() => setActiveTab(k)} style={{
            flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: activeTab === k ? 700 : 500,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
            color: activeTab === k ? M : '#6b7280',
            borderBottom: `2px solid ${activeTab === k ? M : 'transparent'}`,
          }}>{l}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, backgroundColor: 'white' }}>

        {activeTab === 'onboarding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {ONBOARDING_STEPS.map(step => (
              <StepItem key={step.id} step={step}
                isDone={!!employee.onboardingSteps?.[step.id]}
                onToggle={() => toggleStep(step.id)}
                canEdit={canEdit} />
            ))}

            {canEdit && (
              <button
                onClick={async () => {
                  if (!window.confirm(`تأكيد إتمام أونبوردينج ${employee.name}؟`)) return;
                  const allDone = {};
                  ONBOARDING_STEPS.forEach(s => { allDone[s.id] = true; });
                  const payload = { onboardingSteps: allDone, workflowStatus: 'Agreement Signed' };
                  setEmployees(prev => prev.map(e => e._id === employee._id ? { ...e, ...payload } : e));
                  try {
                    const { error } = await supabase.from('employees_master').update(payload).eq('_id', Number(employee._id));
                    if (error) throw error;
                    showToast('Onboarding complete — employee moved out of pipeline', true);
                  } catch (e) {
                    console.error(e);
                    showToast('Save failed', false);
                  }
                }}
                style={{
                  marginTop: 10, width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer',
                  backgroundColor: '#16a34a', border: 'none', color: 'white',
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16"><polyline points="3,8 6.5,12 13,4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Complete Onboarding
              </button>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <DataCard label="Full Name"     value={employee.name} />
            <DataCard label="Position"      value={employee.position} />
            <DataCard label="Client"        value={employee.client} />
            <DataCard label="Email"         value={employee.email} />
            <DataCard label="Phone"         value={employee.phone} />
            <DataCard label="Total Package" value={employee.totalPackage ? `SR ${Number(employee.totalPackage).toLocaleString()}` : undefined} highlight />
            <DataCard label="Start Date"    value={employee.startDate} />
            <DataCard label="End Date"      value={employee.endDate} />
            <DataCard label="Nationality"   value={employee.nationalityType} />
            <DataCard label="GOSI"          value={employee.gosiOption || 'Not Registered'} />
            <DataCard label="Workflow"      value={employee.workflowStatus} />
            <DataCard label="PO Number"     value={employee.poNumbers} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
            <FileText size={28} style={{ opacity: 0.2, color: '#6b7280' }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Document uploads coming soon</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>Store contracts, IDs, and offer letters per employee</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepItem({ step, isDone, onToggle, canEdit }) {
  const dc = DAY_COLOR[step.daycolor] || DAY_COLOR.b;
  return (
    <div onClick={canEdit ? onToggle : undefined} style={{
      padding: '11px 14px', border: `1px solid ${isDone ? '#bbf7d0' : 'var(--border)'}`,
      borderRadius: 10, backgroundColor: isDone ? '#f0fdf4' : 'white',
      cursor: canEdit ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 12,
      transition: 'background 150ms',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDone ? '#16a34a' : 'var(--border)', transition: 'background 200ms',
      }}>
        {isDone && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }} dir="rtl">
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDone ? '#15803d' : 'var(--text-1)', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.7 : 1 }}>{step.title}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-3)' }}>{step.hint}</p>
      </div>
      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: dc.bg, color: dc.color }}>{step.day}</span>
    </div>
  );
}

// Checklist step (module-level) — similar but no Supabase, just localStorage
function ChecklistStepItem({ step, isDone, onToggle }) {
  const dc = DAY_COLOR[step.daycolor] || DAY_COLOR.b;
  return (
    <div onClick={onToggle} style={{
      padding: '10px 14px', border: `1px solid ${isDone ? '#bbf7d0' : 'var(--border)'}`,
      borderRadius: 10, backgroundColor: isDone ? '#f0fdf4' : 'white',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 150ms',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDone ? '#16a34a' : 'var(--border)', transition: 'background 200ms',
      }}>
        {isDone && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }} dir="rtl">
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDone ? '#15803d' : 'var(--text-1)', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.7 : 1 }}>{step.title}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-3)' }}>{step.hint}</p>
      </div>
      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: dc.bg, color: dc.color }}>{step.day}</span>
    </div>
  );
}

function EmployeeListItem({ employee, isSelected, onSelect, partners = [] }) {
  const done   = getCompletedOnboardingSteps(employee, partners);
  const total  = getApplicableSteps(employee, partners).length;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const bucket = getWorkflowBucket(employee);
  const meta   = BUCKET_META[bucket] || { label: bucket, color: M, bg: '#f3f4f6' };

  return (
    <div onClick={() => onSelect(employee)} style={{
      padding: '10px 11px', borderRadius: 9, marginBottom: 5, cursor: 'pointer',
      border: `1px solid ${isSelected ? M : '#e5e7eb'}`,
      borderLeft: `3px solid ${isSelected ? M : meta.color}`,
      backgroundColor: isSelected ? `${M}08` : 'white',
      boxShadow: isSelected ? `0 0 0 2px ${M}22` : 'none',
      transition: 'all 130ms',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#111827' }}>{employee.name}</p>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, backgroundColor: meta.bg, color: meta.color }}>
          {bucket === 'inprogress' ? employee.workflowStatus : meta.label}
        </span>
      </div>
      <p style={{ margin: '0 0 5px', fontSize: 10, color: '#6b7280' }}>{employee.client}</p>
      {bucket === 'onboarding' && (
        <>
          <div style={{ height: 3, backgroundColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? '#16a34a' : M, borderRadius: 10, transition: 'width 0.4s' }} />
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 9, color: '#9ca3af' }}>{done}/{total} steps</p>
        </>
      )}
    </div>
  );
}

function DataCard({ label, value, highlight }) {
  return (
    <div style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, backgroundColor: highlight ? '#fdf5f5' : 'var(--surface-sub)' }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: highlight ? M : 'var(--text-1)' }}>{value || '—'}</p>
    </div>
  );
}

export default OnboardingModule;
