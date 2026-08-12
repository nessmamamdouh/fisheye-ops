import React, { useState, useMemo, useEffect } from "react";
import PartnerSettlementReport from './Partnersettlementreport';
import { InvoiceManager, normalizeDate } from './modules/invoiceManager';
import {
  DollarSign, Search, Users, AlertTriangle,
  TrendingUp, FileText, Layers, Download, CheckCircle, Plus, Trash2, Save, Check
} from "lucide-react";
import { isExcluded } from "./utils/helpers";
import { supabase } from "./utils/supabase";

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────
const M   = "#A02843";
const MD  = "#00293A";

const fmtSAR = n =>
  `SAR ${Number(n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}`;
const fmtNum = n =>
  Number(n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 });
 
/** Calculate per-employee billing line */
const calcLine = emp => {
  const totalPkg = Number(emp.totalPackage || 0);
  let marginAmount = 0;

  if (emp.profitMode === "partner") {
    // Partner mode: margin = what Fisheye charges CLIENT (clientPrice), not what it pays partner
    const pValue = Number(emp.clientPrice || 0);
    const pType  = emp.clientPriceType || "percent";
    marginAmount = pType === "percent" ? (pValue / 100) * totalPkg : pValue;
  } else {
    // Direct mode: margin = fisheyeMargin on top of totalPackage
    const mValue = Number(emp.fisheyeMargin || 0);
    const mType  = emp.fisheyeMarginType || "percent";
    marginAmount = mType === "percent" ? (mValue / 100) * totalPkg : mValue;
  }

  const baseAmount = totalPkg + marginAmount; // total invoice to client (consistent for both modes)
  const vat        = marginAmount * 0.15;     // VAT on margin only
  return { subTotal: baseAmount, margin: marginAmount, vat, total: baseAmount + vat };
};

/** What Fisheye pays the partner (cost side) */
const calcPartnerPayout = emp => {
  if (emp.profitMode !== "partner") return 0;
  const totalPkg = Number(emp.totalPackage || 0);
  if (emp.partnerCostType === "percent") return Math.round((Number(emp.partnerCost || 0) / 100) * totalPkg);
  return Number(emp.partnerCost || 0);
};

/** Fisheye net profit = client margin − partner payout */
const calcNetProfit = emp => calcLine(emp).margin - calcPartnerPayout(emp);

// ═══════════════════════════════════════════════════════════════════════════════
// 🧮 SPRINT 6 — SALARY PRORATION ENGINE
// Fixed 30-day payroll logic with exact worked-days calculation
// ═══════════════════════════════════════════════════════════════════════════════
 
/**
 * calcProration(emp, year, month)
 * Returns { workedDays, totalDays:30, factor, proratedPkg, isFullMonth, isJoiner, isLeaver }
 *
 * Rules:
 *  - Fixed 30-day month regardless of calendar month length
 *  - If startDate is in this month → joiner, count days from startDate to end of month
 *  - If endDate   is in this month → leaver, count days from start of month to endDate
 *  - Both in same month → count days between start and end
 *  - Otherwise full month (factor = 1)
 */
export function calcProration(emp, year, month) {
  const DAYS = 30; // fixed payroll month
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd   = new Date(year, month - 1, 30); // 30th always
 
  // Use parseDate() to avoid UTC midnight shift (new Date("YYYY-MM-DD") = UTC → wrong local day)
  const start = parseDate(emp.startDate);
  const end   = parseDate(emp.endDate);
 
  const startsThisMonth = start && start.getFullYear() === year && start.getMonth() === month - 1;
  const endsThisMonth   = end   && end.getFullYear()   === year && end.getMonth()   === month - 1;
 
  let workedDays = DAYS;
  let isJoiner   = false;
  let isLeaver   = false;
 
  if (startsThisMonth && endsThisMonth) {
    // Joined and left same month
    workedDays = Math.min(DAYS, Math.max(1, end.getDate() - start.getDate() + 1));
    isJoiner = true; isLeaver = true;
  } else if (startsThisMonth) {
    // Joined mid-month: days from startDate to day 30
    workedDays = Math.max(1, DAYS - start.getDate() + 1);
    isJoiner = true;
  } else if (endsThisMonth) {
    // Left mid-month: days from day 1 to endDate
    workedDays = Math.max(1, Math.min(end.getDate(), DAYS));
    isLeaver = true;
  }
 
  const factor   = workedDays / DAYS;
  const totalPkg = Number(emp.totalPackage || 0);

  // ── Salary breakdown — always derived from totalPackage
  const basic = Math.round(totalPkg / 1.35);
  const hra   = Math.round(basic * 0.25);
  const tpt   = Math.round(basic * 0.10);

  // ── GOSI employee deduction = (Basic + HRA) × 9.75%
  // Only applies to Saudi nationals — expats have no employee-side deduction
  // "On Partner's GOSI" still deducts normally for Saudis (partner manages admin, not the deduction)
  const isSaudiNational = (emp.nationalityType || "").toLowerCase() === "saudi_national";
  const GOSI_RATE    = 0.0975;
  const gosiMonthly  = (emp.gosiOption && isSaudiNational)
    ? Math.round((basic + hra) * GOSI_RATE) : 0;
  const gosiDeduction = Math.round(gosiMonthly * factor);          // prorated
  const proratedPkg   = Math.round(totalPkg * factor);
  const netProrated   = proratedPkg - gosiDeduction;               // what employee actually receives

  return {
    workedDays,
    totalDays: DAYS,
    factor,
    isFullMonth:    !isJoiner && !isLeaver,
    isJoiner,
    isLeaver,
    proratedPkg,
    proratedBasic: Math.round(basic * factor),
    proratedHRA:   Math.round(hra   * factor),
    proratedTPT:   Math.round(tpt   * factor),
    gosiMonthly,        // full-month GOSI amount (for display reference)
    gosiDeduction,      // prorated GOSI employee deduction
    netProrated,        // proratedPkg minus GOSI deduction
  };
}
 
/**
 * calcAccumulatedSalary(emp)
 * For employees with no PO — calculates total salary owed from startDate to today
 * Uses 30-day month logic across all months worked
 */
function calcAccumulatedSalary(emp, year, month) {
  const monthEndDate = new Date(year, month - 1, 30); // نهاية الشهر المختار
  const start = parseDate(emp.startDate);
  if (!start) return { months: 0, totalDays: 0, accumulated: 0, breakdown: [] };

  // End = endDate if expired and before monthEnd, otherwise end of selected month
  const empEnd = parseDate(emp.endDate);
  const end = empEnd && empEnd < monthEndDate ? empEnd : monthEndDate;

  const pkg = Number(emp.totalPackage || 0);
  const dailyRate = pkg / 30;
  let accumulated = 0;
  let totalDays   = 0;
  const breakdown = [];

  // Iterate month by month from startDate to end
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth(); // 0-based
    const pro = calcProration(emp, y, m + 1);

    // Only count if end is in or after this month
    const monthEnd30 = new Date(y, m, 30);
    if (start <= monthEnd30) {
      accumulated += pro.proratedPkg;
      totalDays   += pro.workedDays;
      breakdown.push({
        label: cursor.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        days: pro.workedDays,
        amount: pro.proratedPkg,
      });
    }
    cursor = new Date(y, m + 1, 1); // next month
    if (cursor > end) break;
  }

  const monthsCount = breakdown.length;
  return { months: monthsCount, totalDays, accumulated: Math.round(accumulated), breakdown };
}

function parseYM(ym) {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}
 
/**
 * parseDate(str) — handles MM/DD/YY, MM/DD/YYYY, and YYYY-MM-DD safely.
 * Avoids (a) 2-digit year → 1926 bug and (b) ISO UTC midnight → wrong local day.
 */
function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  // ISO: YYYY-MM-DD (parse as local to avoid UTC shift)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  // Slash: MM/DD/YY or MM/DD/YYYY
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slash) {
    let y = +slash[3];
    if (y < 100) y += 2000;
    return new Date(y, +slash[1] - 1, +slash[2]);
  }
  return null;
}

/** Classify employees for a given month into: fullMonth, joiners, leavers */
function classifyMovements(employees, year, month) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd30 = new Date(year, month - 1, 30);
 
  const active = [], joiners = [], leavers = [];
 
  employees.forEach(e => {
    const start = parseDate(e.startDate);
    const end   = parseDate(e.endDate);

    // Was employee active at any point in this month?
    const startsBefore  = !start || start <= monthEnd30;
    const endsAfter     = !end   || end   >= monthStart;
    if (!startsBefore || !endsAfter) return; // not in this month at all
 
    const pro = calcProration(e, year, month);
    if (pro.isJoiner && pro.isLeaver) { joiners.push({ ...e, _pro: pro }); leavers.push({ ...e, _pro: pro }); active.push({ ...e, _pro: pro }); }
    else if (pro.isJoiner)  { joiners.push({ ...e, _pro: pro }); active.push({ ...e, _pro: pro }); }
    else if (pro.isLeaver)  { leavers.push({ ...e, _pro: pro }); active.push({ ...e, _pro: pro }); }
    else                    { active.push({ ...e, _pro: pro }); }
  });
 
  return { active, joiners, leavers };
}
 
 
const card  = { backgroundColor: "white", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };

// ─── Single source of truth for client colours ─────────────────────────────
// Used by ProfitPerClientTab AND MonthlyPLTrend.
// getClientColor(name) falls back to a deterministic colour for unknown clients.
const CLIENT_COLORS_MAP = {
  "Sela":               { accent: "#A02843", light: "#fff5f5" },
  "SPL":                { accent: "#7c3aed", light: "#f5f3ff" },
  "Channelplay":        { accent: "#2563eb", light: "#eff6ff" },
  "Riva Engineering 2": { accent: "#c2410c", light: "#fff7ed" },
  "Combuzz HR":         { accent: "#d97706", light: "#fffbeb" },
};
const FALLBACK_PALETTE = ["#0369a1","#059669","#6d28d9","#b45309","#374151","#0f766e"];
const _clientColorCache = {};
function getClientColor(name) {
  if (CLIENT_COLORS_MAP[name]) return CLIENT_COLORS_MAP[name];
  if (_clientColorCache[name]) return _clientColorCache[name];
  // Deterministic pick from palette based on name hash
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const accent = FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
  _clientColorCache[name] = { accent, light: `${accent}12` };
  return _clientColorCache[name];
}
const th    = { padding: "12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", backgroundColor: "#fdf8f8", borderBottom: "1px solid #f3f4f6" };
const td    = { padding: "12px", borderBottom: "1px solid #f9fafb", fontSize: 13 };
const tabStyle = active => ({
  padding: "13px 24px", cursor: "pointer", fontSize: 13, fontWeight: 800,
  color: active ? M : "#6b7280",
  borderBottom: `3px solid ${active ? M : "transparent"}`,
  backgroundColor: active ? "#fff5f5" : "transparent",
  display: "flex", alignItems: "center", gap: 8, transition: "0.2s",
});
const badgePO = hasPO => ({
  backgroundColor: hasPO ? "#f3f4f6" : "#fff7ed",
  color: hasPO ? "#374151" : "#c2410c",
  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800,
  border: `1px solid ${hasPO ? "#e5e7eb" : "#ffedd5"}`,
  display: "inline-flex", alignItems: "center", gap: 6,
});
 
// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: "white", borderRadius: 12,
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color = M, border = "#e5e7eb" }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      border: `1.5px solid ${border}`, backgroundColor: "white", minWidth: 0,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}
// ─── STAT MINI CARD ──────────────────────────────────────────────────────────
function MiniStat({ label, value, color = M }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — PAYROLL
// ═══════════════════════════════════════════════════════════════════════════════
function PayrollTab({ employees, setEmployees, flows, onSaveFlows }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [search, setSearch]             = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [viewMode, setViewMode]         = useState("all"); // "all" | "joiners" | "leavers"
  const [filterPO, setFilterPO]         = useState("all"); // "all" | "has_po" | "no_po"
  const [expandedCard, setExpandedCard] = useState(null);  // null | "joiners" | "leavers" | "newpos"
  const [selectedPOIds, setSelectedPOIds] = useState(new Set());
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [editingPODateId, setEditingPODateId] = useState(null);
  const [showEditPODates, setShowEditPODates] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [poDateValues, setPODateValues] = useState({}); // { [empId]: dateString }
  const [finToast, setFinToast] = useState(null);
  // User-configurable cutoff: hide employees whose endDate is before this date
  // Stored in localStorage so it persists across sessions
  const [poNeedsCutoff, setPONeedsCutoff] = useState(
    () => localStorage.getItem('fisheye_po_needs_cutoff') || ''
  );
  const savePONeedsCutoff = (date) => {
    setPONeedsCutoff(date);
    if (date) localStorage.setItem('fisheye_po_needs_cutoff', date);
    else localStorage.removeItem('fisheye_po_needs_cutoff');
  };
  const showFinToast = (msg, color = "#16a34a") => {
    setFinToast({ msg, color });
    setTimeout(() => setFinToast(null), 3000);
  };
 
  // ── Stable employee key (name-based, same as PayrollFlowTracker) ────────────
  const empStableKey = e => (e.name || '').trim().toLowerCase().replace(/\s+/g, '_') || String(e._id);

  // ── Last paid month: scan flows for last month where salary===true ───────────
  // Flows are stored as flat keys: "YYYY-MM_emp_stable_key" → { salary, timesheet, invoice, ... }
  const lastPaidMonthFor = e => {
    const sk = empStableKey(e);
    const allFlows = flows || {};
    const paidMonths = Object.entries(allFlows)
      .filter(([fkey, fdata]) => {
        // flat key format: "YYYY-MM_name_slug"
        if (typeof fdata !== 'object' || fdata === null) return false;
        const underscoreIdx = fkey.indexOf('_', 7); // skip "YYYY-MM"
        if (underscoreIdx === -1) return false;
        const empPart = fkey.slice(underscoreIdx + 1);
        return empPart === sk && fdata.salary === true;
      })
      .map(([fkey]) => fkey.slice(0, 7)) // extract "YYYY-MM"
      .sort();
    if (paidMonths.length === 0) return 'New';
    const last = paidMonths[paidMonths.length - 1];
    const [y, m] = last.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    };
  });
 
  const { year, month } = parseYM(selectedMonth);
 
  const allEmployees = useMemo(() => {
    return employees.filter(e => {
      const status  = (e.status||"").toLowerCase();
      const isSela  = (e.client||"").toLowerCase() === "sela";
      const hasPO   = e.poNumbers && String(e.poNumbers).trim() !== "";
      // Resigned → never show
      if (["resigned","resigned_ar","مستقيل"].includes(status)) return false;
      // "expired" status branch — but ONLY if endDate has truly passed before this month.
      // If endDate is still in this month or later, treat the employee as active (data may be ahead of status).
      const endDt = parseDate(e.endDate);
      const monthStart2 = new Date(year, month - 1, 1);
      const contractTrulyExpired = endDt && endDt < monthStart2;
      const isExpiredByStatus = status.includes('expired') || status.includes('منتهي');
      if (isExpiredByStatus && contractTrulyExpired) {
        if (isSela && !hasPO) {
          // Exclude if poAddedDate is this month — data entry in progress, will appear in expiredNewPO once poNumbers is filled
          if (e.poAddedDate) {
            const d = new Date(e.poAddedDate);
            if (d.getFullYear() === year && d.getMonth() + 1 === month) return false;
          }
          return true; // Sela expired بدون PO → للـ No-PO view
        }
        // Expired وعنده PO وصل الشهر ده → accumulated salary مستحقة
        if (isSela && hasPO && e.poAddedDate) {
          const d = new Date(e.poAddedDate);
          if (d.getFullYear() === year && d.getMonth() + 1 === month) return true;
        }
        return false;
      }
      return true;
    });
  }, [employees, year, month]);
  const clients      = useMemo(() => Array.from(new Set(allEmployees.map(e => e.client).filter(Boolean))), [allEmployees]);

  // ── Eligible for payroll — same logic as Payroll Flow ──────────────────────
  // Excludes Sela-without-PO and not-yet-started, but keeps expired who got PO this month
  const eligibleForPayroll = useMemo(() => {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd   = new Date(year, month - 1, 30);
    return employees.filter(e => {
      const st = (e.status || '').toLowerCase();
      // Resigned → never
      if (['resigned', 'resigned_ar', 'مستقيل'].includes(st)) return false;
      // Detect expired by status string (broad match) or by endDate already passed
      const isExpiredStatus = st.includes('expired') || st.includes('منتهي');
      const end2 = parseDate(e.endDate);
      const contractEndedBeforeMonth = end2 && end2 < monthStart;
      // Treat as "expired needing PO" only when:
      //   (a) endDate is actually before this month, OR
      //   (b) status says expired AND there is no endDate (status is the only signal)
      // This prevents employees whose status is "expired" but endDate is still in this/future month
      // from being incorrectly blocked (e.g. contract ending June 2 with status already "expired").
      const treatAsExpired = contractEndedBeforeMonth || (isExpiredStatus && !end2);
      if (treatAsExpired) {
        if (!e.poAddedDate) return false;
        const poDate = parseDate(e.poAddedDate);
        if (!poDate || poDate.getFullYear() !== year || poDate.getMonth() + 1 !== month) return false;
        return true; // expired + PO added this month → show (accumulated salary)
      }
      const start = parseDate(e.startDate);
      if (start && start > monthEnd) return false;
      return true;
    });
  }, [employees, year, month]);

  const { active: _active, joiners, leavers } = useMemo(
    () => classifyMovements(eligibleForPayroll, year, month),
    [eligibleForPayroll, year, month]
  );

  // Expired Sela employees with PO number but NO poAddedDate — imported externally, need date set manually
  const expiredNeedsPODate = useMemo(() => {
    return employees.filter(e => {
      const st = (e.status || '').toLowerCase();
      if (!['expired', 'expired_ar', 'منتهي'].includes(st)) return false;
      if (['resigned', 'resigned_ar', 'مستقيل'].includes(st)) return false;
      const isSela = (e.client || '').toLowerCase() === 'sela';
      if (!isSela) return false;
      const hasPO = e.poNumbers && String(e.poNumbers).trim() !== '';
      if (!hasPO) return false;          // no PO → belongs to no-PO view
      if (e.poAddedDate) return false;   // has date → handled by normal flow
      // Apply user-set cutoff — hide employees whose contract ended before that date
      if (poNeedsCutoff && e.endDate) {
        const endDt = parseDate(e.endDate);
        const cutoffDt = parseDate(poNeedsCutoff);
        if (endDt && cutoffDt && endDt < cutoffDt) return false;
      }
      return true; // PO exists but no date → needs manual resolution
    }).map(e => ({ ...e, _accumulated: calcAccumulatedSalary(e, year, month) }));
  }, [employees, year, month]);

  // Expired Sela employees who already HAVE poAddedDate — shown for editing
  const expiredHasPODate = useMemo(() => {
    return employees.filter(e => {
      const st = (e.status || '').toLowerCase();
      const isExpired = st.includes('expired') || st.includes('منتهي');
      if (!isExpired) return false;
      if (st.includes('resigned') || st.includes('مستقيل')) return false;
      const isSela = (e.client || '').toLowerCase() === 'sela';
      if (!isSela) return false;
      if (!e.poAddedDate) return false;
      return true;
    });
  }, [employees]);

  // Employees eligible but dropped by classifyMovements (endDate < monthStart, but PO arrived this month)
  const expiredNewPO = useMemo(() => {
    const activeIds = new Set(_active.map(e => e._id));
    return eligibleForPayroll
      .filter(e => {
        if (activeIds.has(e._id)) return false;
        // Must have PO added this month AND poNumbers must be filled — otherwise still in no-PO view
        if (!e.poAddedDate) return false;
        const hasPO = e.poNumbers && String(e.poNumbers).trim() !== '';
        if (!hasPO) return false; // dedup: no-PO view owns this employee until poNumbers is filled
        const d = new Date(e.poAddedDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .map(e => ({ ...e, _pro: calcProration(e, year, month), _accumulated: calcAccumulatedSalary(e, year, month) }));
  }, [eligibleForPayroll, _active, year, month]);

  // Full active pool = normal active + expired-with-new-PO
  const active = useMemo(() => [..._active, ...expiredNewPO], [_active, expiredNewPO]);
 
  const displayPool = viewMode === "joiners" ? joiners : viewMode === "leavers" ? leavers : active;
 
  // لما الفلتر no_po نجيب كل Sela بدون PO بغض النظر عن الشهر
  const allSelaNoP = useMemo(() =>
    filterPO === "no_po"
      ? allEmployees
          .filter(e => (e.client||"").toLowerCase() === "sela" && !(e.poNumbers && String(e.poNumbers).trim() !== ""))
          .map(e => ({ ...e, _accumulated: calcAccumulatedSalary(e, year, month) }))
      : [],
    [allEmployees, filterPO, year, month]
  );

  const rows = useMemo(() => {
    let list;
    if (filterPO === "no_po") {
      list = allSelaNoP
        .filter(e => (e.name||"").toLowerCase().includes(search.toLowerCase()))
        .map(e => ({ ...e, _pro: e._pro || calcProration(e, year, month) }))
        .sort((a, b) => (b._accumulated?.accumulated || 0) - (a._accumulated?.accumulated || 0));
    } else {
      list = displayPool.filter(e => {
        const matchClient = filterClient === "all" || (e.client||"").toLowerCase() === filterClient.toLowerCase();
        const matchSearch = (e.name||"").toLowerCase().includes(search.toLowerCase());
        const hasPO = e.poNumbers && String(e.poNumbers).trim() !== "";
        const isSela = (e.client||"").toLowerCase() === "sela";
        const matchPO = filterPO === "all" || !isSela ? true : hasPO;
        return matchClient && matchSearch && matchPO;
      });
    }
    // Deduplicate by stable key — keep the record with the latest endDate (most recent active contract)
    // Tie-break: higher totalPackage
    const seen = new Map();
    list.forEach(e => {
      const sk = empStableKey(e);
      const existing = seen.get(sk);
      if (!existing) { seen.set(sk, e); return; }
      const eEnd = parseDate(e.endDate);
      const exEnd = parseDate(existing.endDate);
      const ePkg  = Number(e.totalPackage||0);
      const exPkg = Number(existing.totalPackage||0);
      // Prefer later endDate; if equal prefer higher package
      const eScore  = eEnd  ? eEnd.getTime()  : 0;
      const exScore = exEnd ? exEnd.getTime() : 0;
      if (eScore > exScore || (eScore === exScore && ePkg > exPkg)) {
        seen.set(sk, e);
      }
    });
    return Array.from(seen.values());
  }, [displayPool, allSelaNoP, filterClient, search, filterPO, year, month]);
 
  // Selected rows from main table
  const selectedRows = useMemo(() =>
    selectedRowIds.size > 0 ? rows.filter(e => selectedRowIds.has(e._id)) : rows,
  [rows, selectedRowIds]);

  const totals = useMemo(() => ({
    headcount:     selectedRows.length,
    payroll:       selectedRows.reduce((s, e) => s + e._pro.proratedPkg,    0),
    basic:         selectedRows.reduce((s, e) => s + e._pro.proratedBasic,  0),
    hra:           selectedRows.reduce((s, e) => s + e._pro.proratedHRA,    0),
    tpt:           selectedRows.reduce((s, e) => s + e._pro.proratedTPT,    0),
    fullPayroll:   selectedRows.reduce((s, e) => s + Number(e.totalPackage||0), 0),
    proratedDiff:  selectedRows.reduce((s, e) => s + Number(e.totalPackage||0) - e._pro.proratedPkg, 0),
    gosiTotal:     selectedRows.reduce((s, e) => s + (e._pro.gosiDeduction || 0), 0),
    netTotal:      selectedRows.reduce((s, e) => s + (e._pro.netProrated   || e._pro.proratedPkg), 0),
    isFiltered:    selectedRowIds.size > 0,
  }), [selectedRows, selectedRowIds]);

  // ── Month-over-Month comparison ──────────────────────────────────────────
  const mom = useMemo(() => {
    const prevDate  = new Date(year, month - 2, 1); // الشهر السابق
    const prevYear  = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    // Use eligibleForPayroll as base (same as current month) — not allEmployees
    // allEmployees includes Sela-no-PO and not-yet-started which inflates the prev month count
    const { active: prevActive } = classifyMovements(eligibleForPayroll, prevYear, prevMonth);
    const prevPayroll   = prevActive.reduce((s, e) => s + e._pro.proratedPkg, 0);
    const prevHeadcount = prevActive.length;
    const payrollDiff   = totals.payroll - prevPayroll;
    const headcountDiff = totals.headcount - prevHeadcount;
    return { prevPayroll, prevHeadcount, payrollDiff, headcountDiff };
  }, [eligibleForPayroll, year, month, totals.payroll, totals.headcount]);

 const fmtPro = n => Number(n||0).toLocaleString("en-SA");

  // ── New POs this month — employees whose PO was added during the selected month ──
  const newPoThisMonth = useMemo(() => {
    return allEmployees.filter(e => {
      if (!e.poAddedDate) return false;
      const d = new Date(e.poAddedDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    }).map(e => ({
      ...e,
      _accumulated: calcAccumulatedSalary(e, year, month),
    }));
  }, [allEmployees, year, month]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Month Selector */}
      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
        {months.map(m => {
          const isActive = selectedMonth === m.key;
          return (
            <button key={m.key} onClick={() => setSelectedMonth(m.key)} style={{
              padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700,
              cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
              border:          `1.5px solid ${isActive ? "#7c3aed" : "#e5e7eb"}`,
              backgroundColor: isActive ? "#7c3aed" : "white",
              color:           isActive ? "white" : "#6b7280",
              boxShadow:       isActive ? "0 2px 6px rgba(124,58,237,0.25)" : "none",
            }}>{m.label}</button>
          );
        })}
      </div>

      {/* ⚠️ Expired employees with PO but no date — imported externally, need manual date */}
      {expiredNeedsPODate.length > 0 && (
        <div style={{ backgroundColor: "#fffbeb", border: "1.5px solid #fde68a", borderLeft: "4px solid #d97706", borderRadius: 10, padding: "12px 16px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#92400e", flex: 1 }}>
              {expiredNeedsPODate.length} موظف expired عندهم PO بس تاريخ استلامه مش مسجّل — تم الإضافة عبر import
            </span>
            {/* Cutoff control — hide employees processed before a certain date */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: "white", borderRadius: 7, padding: "4px 8px", border: "1px solid #fde68a" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>إخفاء ما قبل:</span>
              <input
                type="date"
                value={poNeedsCutoff}
                onChange={e => savePONeedsCutoff(e.target.value)}
                style={{ fontSize: 11, padding: "2px 6px", border: "1px solid #d1d5db", borderRadius: 5, width: 120 }}
              />
              {poNeedsCutoff && (
                <button onClick={() => savePONeedsCutoff('')} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕</button>
              )}
            </div>
            {selectedPOIds.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#fef3c7", borderRadius: 8, padding: "6px 10px", border: "1px solid #fde68a" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>
                  {selectedPOIds.size} محدد
                </span>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={e => setBulkDate(e.target.value)}
                  style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #d1d5db", borderRadius: 6 }}
                />
                <button
                  onClick={async () => {
                    if (!bulkDate) return;
                    const toUpdate = expiredNeedsPODate.filter(e => selectedPOIds.has(e._id));
                    setEmployees(prev => prev.map(emp => {
                      if (selectedPOIds.has(emp._id)) return { ...emp, poAddedDate: bulkDate };
                      return emp;
                    }));
                    setSelectedPOIds(new Set());
                    for (const emp of toUpdate) {
                      try { await supabase.from('employees_master').update({ poAddedDate: bulkDate }).eq('_id', emp._id); } catch {}
                    }
                  }}
                  style={{ fontSize: 11, fontWeight: 800, padding: "4px 14px", backgroundColor: "#d97706", color: "white", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  حفظ الكل ({selectedPOIds.size})
                </button>
              </div>
            )}
          </div>

          {/* Select-all row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "4px 12px" }}>
            <input
              type="checkbox"
              checked={selectedPOIds.size === expiredNeedsPODate.length && expiredNeedsPODate.length > 0}
              onChange={e => {
                if (e.target.checked) setSelectedPOIds(new Set(expiredNeedsPODate.map(x => x._id)));
                else setSelectedPOIds(new Set());
              }}
              style={{ cursor: "pointer", width: 14, height: 14, accentColor: "#d97706" }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>تحديد الكل</span>
          </div>

          {/* Employee rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {expiredNeedsPODate.map(e => {
              const isChecked = selectedPOIds.has(e._id);
              return (
                <div
                  key={e._id}
                  onClick={() => setSelectedPOIds(prev => {
                    const next = new Set(prev);
                    if (next.has(e._id)) next.delete(e._id); else next.add(e._id);
                    return next;
                  })}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, borderRadius: 8,
                    padding: "8px 12px", cursor: "pointer", transition: "all 0.12s",
                    backgroundColor: isChecked ? "#fef3c7" : "white",
                    border: `1px solid ${isChecked ? "#f59e0b" : "#fde68a"}`,
                    boxShadow: isChecked ? "0 0 0 2px #fde68a" : "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={ev => {
                      ev.stopPropagation();
                      setSelectedPOIds(prev => {
                        const next = new Set(prev);
                        if (next.has(e._id)) next.delete(e._id); else next.add(e._id);
                        return next;
                      });
                    }}
                    style={{ cursor: "pointer", width: 14, height: 14, accentColor: "#d97706", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 180 }}>{e.name}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 100 }}>End: {e.endDate}</span>
                  <span style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", minWidth: 80 }}>{e.poNumbers}</span>
                  <span style={{ fontSize: 11, color: "#059669", fontFamily: "monospace" }}>
                    Accum: SAR {(e._accumulated?.accumulated || 0).toLocaleString()}
                  </span>
                  {/* Individual date + save — only when not in bulk selection */}
                  {!isChecked && (
                    <>
                      <input
                        type="date"
                        value={poDateValues[e._id] ?? new Date().toISOString().split("T")[0]}
                        onChange={ev => { ev.stopPropagation(); setPODateValues(prev => ({ ...prev, [e._id]: ev.target.value })); }}
                        style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #d1d5db", borderRadius: 6, marginLeft: "auto" }}
                        onClick={ev => ev.stopPropagation()}
                      />
                      <button
                        onClick={async ev => {
                          ev.stopPropagation();
                          const poDate = poDateValues[e._id] ?? new Date().toISOString().split("T")[0];
                          if (!poDate) return;
                          setEmployees(prev => prev.map(emp => emp._id === e._id ? { ...emp, poAddedDate: poDate } : emp));
                          try { await supabase.from('employees_master').update({ poAddedDate: poDate }).eq('_id', e._id); } catch {}
                          showFinToast(`✅ تم حفظ تاريخ PO لـ ${e.name}`);
                        }}
                        style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", backgroundColor: "#d97706", color: "white", border: "none", borderRadius: 6, cursor: "pointer", flexShrink: 0 }}
                      >
                        حفظ
                      </button>
                    </>
                  )}
                  {isChecked && (
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#d97706" }}>✓ محدد</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ✏️ Edit existing poAddedDate for expired employees */}
      {expiredHasPODate.length > 0 && (
        <div style={{ backgroundColor: "#f0f9ff", border: "1.5px solid #bae6fd", borderLeft: "4px solid #0284c7", borderRadius: 10, padding: "10px 16px" }}>
          <div
            onClick={() => setShowEditPODates(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
          >
            <span style={{ fontSize: 14 }}>✏️</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#0c4a6e", flex: 1 }}>
              {expiredHasPODate.length} موظف expired عندهم تاريخ PO مسجّل — اضغط للتعديل
            </span>
            <span style={{ fontSize: 11, color: "#0284c7", fontWeight: 700 }}>{showEditPODates ? "▲ إخفاء" : "▼ إظهار"}</span>
          </div>

          {showEditPODates && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
              {expiredHasPODate.map(e => (
                <div key={e._id} style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "white", borderRadius: 8, padding: "8px 12px", border: "1px solid #bae6fd" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e3a5f", minWidth: 180 }}>{e.name}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 100 }}>End: {e.endDate}</span>
                  <span style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", minWidth: 80 }}>{e.poNumbers}</span>
                  {editingPODateId === e._id ? (
                    <>
                      <input
                        type="date"
                        value={poDateValues[`edit_${e._id}`] ?? (e.poAddedDate ? e.poAddedDate.slice(0, 10) : '')}
                        onChange={ev => setPODateValues(prev => ({ ...prev, [`edit_${e._id}`]: ev.target.value }))}
                        style={{ fontSize: 11, padding: "3px 8px", border: "1.5px solid #0284c7", borderRadius: 6, marginLeft: "auto" }}
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          const newDate = poDateValues[`edit_${e._id}`] ?? (e.poAddedDate ? e.poAddedDate.slice(0, 10) : '');
                          if (!newDate) return;
                          setEmployees(prev => prev.map(emp => emp._id === e._id ? { ...emp, poAddedDate: newDate } : emp));
                          setEditingPODateId(null);
                          try { await supabase.from('employees_master').update({ poAddedDate: newDate }).eq('_id', e._id); } catch {}
                          showFinToast(`✅ تم تحديث تاريخ PO لـ ${e.name}`);
                        }}
                        style={{ fontSize: 11, fontWeight: 800, padding: "4px 12px", backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                      >حفظ</button>
                      <button
                        onClick={() => setEditingPODateId(null)}
                        style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer" }}
                      >إلغاء</button>
                      <button
                        onClick={async () => {
                          setEmployees(prev => prev.map(emp => emp._id === e._id ? { ...emp, poAddedDate: null } : emp));
                          setEditingPODateId(null);
                          try { await supabase.from('employees_master').update({ poAddedDate: null }).eq('_id', e._id); } catch {}
                          showFinToast(`🗑 تم مسح تاريخ PO لـ ${e.name}`, "#dc2626");
                        }}
                        style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer" }}
                      >🗑 مسح</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 11, color: "#0284c7", fontFamily: "monospace", marginLeft: "auto" }}>
                        📅 {e.poAddedDate ? new Date(e.poAddedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                      <button
                        onClick={() => setEditingPODateId(e._id)}
                        style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", backgroundColor: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 6, cursor: "pointer" }}
                      >✏️ تعديل</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Strip — 5 cards, Joiners/Leavers/NewPOs are clickable */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {/* Active — static */}
        <div className="fe-stat-card" style={{ padding: "11px 13px", borderRadius: 10, border: "1px solid #e5e7eb", borderLeft: "4px solid #6b7280", backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Active</p>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#374151", margin: 0, lineHeight: 1 }}>{active.length}</p>
        </div>
        {/* Joiners — clickable */}
        <div
          className="fe-stat-card"
          onClick={() => setExpandedCard(v => v === "joiners" ? null : "joiners")}
          style={{
            padding: "11px 13px", borderRadius: 10, cursor: "pointer",
            border: `1px solid ${expandedCard === "joiners" ? "#16a34a" : "#bbf7d0"}`,
            borderLeft: `4px solid #059669`,
            backgroundColor: expandedCard === "joiners" ? "#dcfce7" : "#f0fdf4",
            boxShadow: expandedCard === "joiners" ? "0 2px 6px rgba(5,150,105,0.15)" : "none",
            transition: "all 0.15s",
          }}
        >
          <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
            Joiners {expandedCard === "joiners" ? "▲" : "▼"}
          </p>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#059669", margin: 0, lineHeight: 1 }}>{joiners.length}</p>
        </div>
        {/* Leavers — clickable */}
        <div
          className="fe-stat-card"
          onClick={() => setExpandedCard(v => v === "leavers" ? null : "leavers")}
          style={{
            padding: "11px 13px", borderRadius: 10, cursor: "pointer",
            border: `1px solid ${expandedCard === "leavers" ? "#dc2626" : "#fecaca"}`,
            borderLeft: `4px solid #dc2626`,
            backgroundColor: expandedCard === "leavers" ? "#fecaca" : "#fef2f2",
            boxShadow: expandedCard === "leavers" ? "0 2px 6px rgba(220,38,38,0.15)" : "none",
            transition: "all 0.15s",
          }}
        >
          <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
            Leavers {expandedCard === "leavers" ? "▲" : "▼"}
          </p>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#dc2626", margin: 0, lineHeight: 1 }}>{leavers.length}</p>
        </div>
        {/* Prorated Total — static */}
        <div className="fe-stat-card" style={{ padding: "11px 13px", borderRadius: 10, border: "1px solid #bfdbfe", borderLeft: "4px solid #2563eb", backgroundColor: "#eff6ff" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Prorated Total</p>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#2563eb", margin: 0, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>
            SR {fmtPro(active.reduce((s,e)=>s+e._pro.proratedPkg,0))}
          </p>
        </div>
        {/* New POs — clickable, only shown if any */}
        <div
          className="fe-stat-card"
          onClick={() => newPoThisMonth.length > 0 && setExpandedCard(v => v === "newpos" ? null : "newpos")}
          style={{
            padding: "11px 13px", borderRadius: 10,
            cursor: newPoThisMonth.length > 0 ? "pointer" : "default",
            border: `1px solid ${expandedCard === "newpos" ? "#7c3aed" : "#ddd6fe"}`,
            borderLeft: "4px solid #7c3aed",
            backgroundColor: expandedCard === "newpos" ? "#ede9fe" : "#faf5ff",
            boxShadow: expandedCard === "newpos" ? "0 2px 6px rgba(124,58,237,0.15)" : "none",
            transition: "all 0.15s",
            opacity: newPoThisMonth.length === 0 ? 0.5 : 1,
          }}
        >
          <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
            New POs {newPoThisMonth.length > 0 ? (expandedCard === "newpos" ? "▲" : "▼") : ""}
          </p>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#7c3aed", margin: 0, lineHeight: 1 }}>
            {newPoThisMonth.length}
            {newPoThisMonth.length > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", marginLeft: 5 }}>
                SR {fmtPro(newPoThisMonth.reduce((s,e)=>s+(e._accumulated?.accumulated||0),0))}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Expandable Detail Panels — Joiners / Leavers / New POs */}
      {expandedCard === "joiners" && joiners.length > 0 && (
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #bbf7d0" }}>
          {joiners.map((e, i) => (
            <div key={e._id} style={{
              fontSize: 11, color: "#374151", padding: "8px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: i < joiners.length - 1 ? "1px solid #f0fdf4" : "none",
              borderLeft: "4px solid #16a34a",
              backgroundColor: i % 2 === 0 ? "white" : "#f0fdf4",
            }}>
              <div>
                <span style={{ fontWeight: 700, color: "#111827" }}>{e.name}</span>
                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 8 }}>{e.client}</span>
              </div>
              <span style={{ color: "#15803d", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>
                Day {new Date(e.startDate).getDate()} · {e._pro.workedDays}d · SR {fmtPro(e._pro.proratedPkg)}
              </span>
            </div>
          ))}
        </div>
      )}

      {expandedCard === "leavers" && leavers.length > 0 && (
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #fecaca" }}>
          {leavers.map((e, i) => (
            <div key={e._id} style={{
              fontSize: 11, color: "#374151", padding: "8px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: i < leavers.length - 1 ? "1px solid #fef2f2" : "none",
              borderLeft: "4px solid #dc2626",
              backgroundColor: i % 2 === 0 ? "white" : "#fef2f2",
            }}>
              <div>
                <span style={{ fontWeight: 700, color: "#111827" }}>{e.name}</span>
                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 8 }}>{e.client}</span>
              </div>
              <span style={{ color: "#b91c1c", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>
                Until Day {Math.min(new Date(e.endDate).getDate(), 30)} · {e._pro.workedDays}d · SR {fmtPro(e._pro.proratedPkg)}
              </span>
            </div>
          ))}
        </div>
      )}

      {expandedCard === "newpos" && newPoThisMonth.length > 0 && (
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #ddd6fe" }}>
          <div style={{ padding: "8px 14px", backgroundColor: "#ede9fe", borderLeft: "4px solid #7c3aed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#5b21b6" }}>
              {newPoThisMonth.length} New PO{newPoThisMonth.length > 1 ? "s" : ""} added this month — accumulated salary due now
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#5b21b6", fontFamily: "monospace" }}>
              SR {fmtPro(newPoThisMonth.reduce((s,e)=>s+(e._accumulated?.accumulated||0),0))}
            </span>
          </div>
          {newPoThisMonth.map((e, i) => (
            <div key={e._id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 14px",
              borderBottom: i < newPoThisMonth.length - 1 ? "1px solid #ede9fe" : "none",
              borderLeft: "4px solid #a78bfa",
              backgroundColor: i % 2 === 0 ? "white" : "#faf5ff",
            }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>{e.name}</span>
                <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>{e.client}</span>
                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 8 }}>
                  PO added: {new Date(e.poAddedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#5b21b6", fontFamily: "monospace" }}>
                  SR {fmtPro(e._accumulated?.accumulated || 0)}
                </div>
                <div style={{ fontSize: 10, color: "#7c3aed" }}>
                  {e._accumulated?.months || 0} month{e._accumulated?.months !== 1 ? "s" : ""} accumulated
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month-over-Month Banner */}
      {(mom.payrollDiff !== 0 || mom.headcountDiff !== 0) && (
        <div style={{ display: "flex", gap: 12, padding: "9px 14px", borderRadius: 10, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderLeft: "4px solid #6b7280", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>vs Last Month</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: mom.headcountDiff > 0 ? "#059669" : mom.headcountDiff < 0 ? "#dc2626" : "#6b7280" }}>
            {mom.headcountDiff > 0 ? "▲" : mom.headcountDiff < 0 ? "▼" : "—"} {Math.abs(mom.headcountDiff)} headcount
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: mom.payrollDiff > 0 ? "#dc2626" : mom.payrollDiff < 0 ? "#059669" : "#6b7280" }}>
            {mom.payrollDiff > 0 ? "▲" : mom.payrollDiff < 0 ? "▼" : "—"} SR {fmtPro(Math.abs(mom.payrollDiff))} payroll
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>prev: {mom.prevHeadcount} emp · SR {fmtPro(mom.prevPayroll)}</span>
        </div>
      )}

      {/* Filters + View Mode */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 10, padding: "10px 14px", border: "1px solid #f3f4f6" }}>
        {/* Search */}
        <div style={{ flex: 1, position: "relative", minWidth: 180 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#d1d5db" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…"
            style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 12, boxSizing: "border-box", backgroundColor: "white", outline: "none" }} />
        </div>
        {/* Client filter */}
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #e5e7eb", backgroundColor: "white", fontSize: 12, fontWeight: 600, minWidth: 140, color: "#374151", cursor: "pointer" }}>
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* View mode pills */}
        <div style={{ display: "flex", gap: 2, backgroundColor: "#e5e7eb", borderRadius: 7, padding: 2 }}>
          {[["all","All"],["joiners","Joiners ↑"],["leavers","Leavers ↓"]].map(([k,l]) => (
            <button key={k} onClick={() => setViewMode(k)} style={{
              padding: "5px 11px", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              backgroundColor: viewMode === k ? "white" : "transparent",
              color: viewMode === k ? "#111827" : "#9ca3af",
              boxShadow: viewMode === k ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        {/* PO Filter — Sela only */}
        {(filterClient === "all" || filterClient.toLowerCase() === "sela") && (
          <div style={{ display: "flex", gap: 2, backgroundColor: "#e5e7eb", borderRadius: 7, padding: 2 }}>
            {[
              ["all",     "All PO",    "#374151"],
              ["has_po",  "Has PO ✓",  "#059669"],
              ["no_po",   "No PO ⚠",   "#c2410c"],
            ].map(([k, l, activeColor]) => (
              <button key={k} onClick={() => setFilterPO(k)} style={{
                padding: "5px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                backgroundColor: filterPO === k ? "white" : "transparent",
                color: filterPO === k ? activeColor : "#9ca3af",
                boxShadow: filterPO === k ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}>{l}</button>
            ))}
          </div>
        )}
        {/* Count */}
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginLeft: "auto" }}>
          {rows.length} employee{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Payroll Table */}
      <div style={{ ...card, overflow: "hidden", padding: 0 }}>
        {/* No PO total exposure banner */}
        {filterPO === "no_po" && rows.length > 0 && (
          <div style={{ padding: "10px 16px", backgroundColor: "#fff7ed", borderBottom: "1px solid #fed7aa", borderLeft: "4px solid #f97316", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#c2410c" }}>⚠ إجمالي الرواتب المتراكمة بدون PO</span>
              <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 8 }}> — تُحسب من تاريخ البداية لحد نهاية {months.find(m => m.key === selectedMonth)?.label}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#c2410c", fontFamily: "monospace" }}>
              SR {fmtPro(rows.reduce((s,e) => s + (e._accumulated?.accumulated||0), 0))}
            </div>
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <table className="fe-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th style={{ ...th, width: 36, textAlign: "center", borderLeft: `4px solid ${M}` }}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedRowIds.size === rows.length}
                    ref={el => { if (el) el.indeterminate = selectedRowIds.size > 0 && selectedRowIds.size < rows.length; }}
                    onChange={e => {
                      if (e.target.checked) setSelectedRowIds(new Set(rows.map(r => r._id)));
                      else setSelectedRowIds(new Set());
                    }}
                    style={{ cursor: "pointer", width: 14, height: 14, accentColor: M }}
                  />
                </th>
                <th style={th}>Employee</th>
                <th style={th}>Client</th>
                {filterPO === "no_po" ? (<>
                  <th style={{ ...th, textAlign: "right" }}>Package / Month</th>
                  <th style={{ ...th, textAlign: "center" }}>Start Date</th>
                  <th style={{ ...th, textAlign: "center" }}>Months Worked</th>
                  <th style={{ ...th, textAlign: "right", color: "#c2410c" }}>Accumulated ⚠</th>
                </>) : (<>
                  <th style={{ ...th, textAlign: "center", width: 80 }}>Days</th>
                  <th style={{ ...th, textAlign: "center", width: 90, color: "#7c3aed" }}>Last Paid</th>
                  <th style={{ ...th, textAlign: "right" }}>Basic</th>
                  <th style={{ ...th, textAlign: "right" }}>HRA</th>
                  <th style={{ ...th, textAlign: "right" }}>Transport</th>
                  <th style={{ ...th, textAlign: "right" }}>Full Pkg</th>
                  <th style={{ ...th, textAlign: "right", color: "#a16207" }}>GOSI ↓</th>
                  <th style={{ ...th, textAlign: "right", color: "#16a34a" }}>Net Prorated ✓</th>
                </>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No employees found</td></tr>
              ) : rows.map((emp, rowIdx) => {
                const pro  = emp._pro;
                const acc  = emp._accumulated;
                const isJ   = pro?.isJoiner && !pro?.isLeaver;
                const isL   = pro?.isLeaver && !pro?.isJoiner;
                const isB   = pro?.isJoiner && pro?.isLeaver;
                const isExp  = (emp.status||"").toLowerCase() === "expired";
                const hasPO  = emp.poNumbers && String(emp.poNumbers).trim() !== "";
                const isSela = (emp.client||"").toLowerCase() === "sela";
                const rowBg  = filterPO === "no_po"
                  ? (rowIdx % 2 === 0 ? "#fffbf7" : "#fff7ed22")
                  : (rowIdx % 2 === 0 ? "white" : "#fafafa");
                const accentColor = filterPO === "no_po" ? "#f97316"
                  : isExp ? "#dc2626"
                  : isJ   ? "#16a34a"
                  : isL   ? "#f97316"
                  : "transparent";
                return (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: selectedRowIds.has(emp._id) ? "#fdf4ff" : rowBg, cursor: "pointer" }}
                    onClick={() => setSelectedRowIds(prev => { const n = new Set(prev); if (n.has(emp._id)) n.delete(emp._id); else n.add(emp._id); return n; })}
                  >
                    <td style={{ ...td, textAlign: "center", borderLeft: `4px solid ${accentColor}` }} onClick={ev => ev.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRowIds.has(emp._id)}
                        onChange={() => setSelectedRowIds(prev => { const n = new Set(prev); if (n.has(emp._id)) n.delete(emp._id); else n.add(emp._id); return n; })}
                        style={{ cursor: "pointer", width: 14, height: 14, accentColor: M }}
                      />
                    </td>
                    <td style={{ ...td }}>
                      <div style={{ fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        {emp.name}
                        {isJ   && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#dcfce7", color: "#16a34a", padding: "1px 5px", borderRadius: 999 }}>JOIN</span>}
                        {isL   && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#fef2f2", color: "#dc2626", padding: "1px 5px", borderRadius: 999 }}>LEAVE</span>}
                        {isB   && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#f3f4f6", color: "#6b7280",  padding: "1px 5px", borderRadius: 999 }}>J+L</span>}
                        {isExp && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#fef2f2", color: "#991b1b",  padding: "1px 5px", borderRadius: 999 }}>EXPIRED</span>}
                        {!hasPO && filterPO !== "no_po" && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#fff7ed", color: "#c2410c", padding: "1px 5px", borderRadius: 999 }}>No PO</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{emp.position || ""}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{emp.client}</td>

                    {filterPO === "no_po" ? (<>
                      {/* Accumulated view */}
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#374151", fontWeight: 600 }}>
                        SR {fmtPro(emp.totalPackage)}
                      </td>
                      <td style={{ ...td, textAlign: "center", fontSize: 11, color: "#6b7280" }}>
                        {emp.startDate ? new Date(emp.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#d97706" }}>{acc?.months || 0} months</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{acc?.totalDays || 0} days</div>
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: 13, color: "#c2410c", fontFamily: "monospace" }}>
                          SR {fmtPro(acc?.accumulated || 0)}
                        </div>
                        {acc?.breakdown?.length > 0 && (
                          <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                            {acc.breakdown.map(b => `${b.label}: ${fmtPro(b.amount)}`).join(" · ")}
                          </div>
                        )}
                      </td>
                    </>) : (<>
                      {/* Normal prorated view */}
                      <td style={{ ...td, textAlign: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: pro.isFullMonth ? "#374151" : "#d97706" }}>
                          {pro.workedDays}/{pro.totalDays}
                        </span>
                        {!pro.isFullMonth && <div style={{ fontSize: 9, color: "#9ca3af" }}>{Math.round(pro.factor*100)}%</div>}
                      </td>
                      {/* Last Paid Month */}
                      <td style={{ ...td, textAlign: "center" }}>
                        {(() => {
                          const lp = lastPaidMonthFor(emp);
                          return lp === 'New'
                            ? <span style={{ fontSize: 10, fontWeight: 800, backgroundColor: "#ede9fe", color: "#7c3aed", padding: "2px 7px", borderRadius: 999 }}>New</span>
                            : <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{lp}</span>;
                        })()}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
                        {fmtPro(pro.proratedBasic)}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
                        {fmtPro(pro.proratedHRA)}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
                        {fmtPro(pro.proratedTPT)}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#d1d5db" }}>
                        {pro.isFullMonth ? fmtPro(emp.totalPackage) : <s style={{ color: "#d1d5db" }}>{fmtPro(emp.totalPackage)}</s>}
                      </td>
                      {/* GOSI deduction column */}
                      <td style={{ ...td, textAlign: "right" }}>
                        {pro.gosiDeduction > 0 ? (
                          <div>
                            <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#a16207" }}>
                              -{fmtPro(pro.gosiDeduction)}
                            </div>
                            <div style={{ fontSize: 9, color: "#a16207", opacity: 0.7 }}>
                              {emp.gosiOption?.replace("GOSI on ","").replace(" - Paid by "," / ")}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      {/* Net Prorated (after GOSI) */}
                      <td style={{ ...td, textAlign: "right", fontWeight: 800, color: "#16a34a", fontFamily: "monospace", fontSize: 13 }}>
                        {fmtPro(pro.netProrated)}
                        {!pro.isFullMonth && (() => {
                          const diff = Number(emp.totalPackage||0) - pro.proratedPkg;
                          return diff > 0 ? <div style={{ fontSize: 10, color: "#d97706", fontWeight: 600 }}>-{fmtPro(diff)}</div> : null;
                        })()}
                        {pro.gosiDeduction > 0 && (
                          <div style={{ fontSize: 9, color: "#a16207", fontWeight: 600 }}>GOSI -{fmtPro(pro.gosiDeduction)}</div>
                        )}
                      </td>
                    </>)}
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                  {filterPO === "no_po" ? (<>
                    <td style={{ ...td, fontWeight: 700, color: "#6b7280", fontSize: 12 }} colSpan={5}>{rows.length} employees without PO</td>
                    <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#d97706", fontSize: 12 }}>
                      {rows.reduce((s,e) => s+(e._accumulated?.months||0), 0)} months total
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#c2410c", fontFamily: "monospace", fontSize: 13 }}>
                      SR {fmtPro(rows.reduce((s,e) => s+(e._accumulated?.accumulated||0), 0))}
                    </td>
                  </>) : (<>
                    <td style={{ ...td, fontWeight: 700, color: "#6b7280", fontSize: 12 }} colSpan={5}>
                      {totals.isFiltered ? `${totals.headcount} / ${rows.length} selected` : `${totals.headcount} employees`}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "#374151" }}>{fmtPro(totals.basic)}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "#374151" }}>{fmtPro(totals.hra)}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "#374151" }}>{fmtPro(totals.tpt)}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#d1d5db", fontFamily: "monospace", fontSize: 12 }}>{fmtPro(totals.fullPayroll)}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#a16207", fontFamily: "monospace", fontSize: 12 }}>
                      {totals.gosiTotal > 0 ? `-${fmtPro(totals.gosiTotal)}` : "—"}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#16a34a", fontFamily: "monospace", fontSize: 13 }}>
                      {fmtPro(totals.netTotal)}
                      {totals.proratedDiff > 0 && <div style={{ fontSize: 10, color: "#d97706", fontWeight: 600 }}>-{fmtPro(totals.proratedDiff)} adj.</div>}
                      {totals.gosiTotal > 0 && <div style={{ fontSize: 10, color: "#a16207", fontWeight: 600 }}>GOSI -{fmtPro(totals.gosiTotal)}</div>}
                    </td>
                  </>)}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Action Bar ─────────────────────────────────────────────────────────── */}
      {rows.length > 0 && filterPO !== "no_po" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          backgroundColor: "#00293A", borderRadius: 12,
          padding: "12px 18px", marginTop: 4,
          boxShadow: "0 4px 16px rgba(0,41,58,0.18)",
        }}>
          {/* Totals summary */}
          <div style={{ display: "flex", gap: 18, flex: 1, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Selected</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "white", fontFamily: "monospace" }}>
                {totals.isFiltered ? `${totals.headcount}/${rows.length}` : totals.headcount}
              </div>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: "#334155" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Gross</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#e2e8f0", fontFamily: "monospace" }}>SAR {fmtPro(totals.payroll)}</div>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: "#334155" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>GOSI</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24", fontFamily: "monospace" }}>SAR {fmtPro(totals.gosiTotal)}</div>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: "#334155" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Net Payroll</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#4ade80", fontFamily: "monospace" }}>SAR {fmtPro(totals.netTotal)}</div>
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Export to Excel */}
            <button
              onClick={() => {
                const headers = ["Employee","Client","Days","Last Paid","Basic","HRA","Transport","Full Package","GOSI","Net Prorated"];
                const csvRows = rows.map(e => {
                  const p = e._pro;
                  const lp = lastPaidMonthFor(e);
                  return [
                    `"${e.name}"`, `"${e.client||''}"`,
                    `${p.workedDays}/${p.totalDays}`,
                    `"${lp}"`,
                    p.proratedBasic, p.proratedHRA, p.proratedTPT,
                    e.totalPackage, p.gosiDeduction || 0, p.netProrated,
                  ].join(",");
                });
                const csv = [headers.join(","), ...csvRows].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `payroll_${selectedMonth}.csv`; a.click();
                URL.revokeObjectURL(url);
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid #334155", backgroundColor: "#1e293b", color: "#e2e8f0", transition: "all 0.15s" }}
            >
              <Download size={13} /> Export Excel
            </button>
            {/* Send via Email */}
            <button
              onClick={() => {
                const subject = encodeURIComponent(`Payroll List — ${months.find(m => m.key === selectedMonth)?.label || selectedMonth}`);
                const body = encodeURIComponent(
                  `Payroll Summary\nMonth: ${months.find(m => m.key === selectedMonth)?.label || selectedMonth}\nEmployees: ${totals.headcount}\nGross: SAR ${fmtPro(totals.payroll)}\nGOSI: SAR ${fmtPro(totals.gosiTotal)}\nNet: SAR ${fmtPro(totals.netTotal)}`
                );
                window.open(`mailto:?subject=${subject}&body=${body}`);
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid #334155", backgroundColor: "#1e293b", color: "#e2e8f0", transition: "all 0.15s" }}
            >
              <FileText size={13} /> Send Email
            </button>
            {/* Send for Approval */}
            <button
              onClick={() => showFinToast(`📤 Payroll for ${months.find(m => m.key === selectedMonth)?.label} sent for approval — ${totals.headcount} employees · Net SAR ${fmtPro(totals.netTotal)}`, "#f59e0b")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: "#f59e0b", color: "white", transition: "all 0.15s" }}
            >
              <TrendingUp size={13} /> Send for Approval
            </button>
            {/* Approve & Process */}
            <button
              onClick={() => setShowApproveModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", border: "none", backgroundColor: "#A02843", color: "white", boxShadow: "0 2px 8px rgba(160,40,67,0.35)", transition: "all 0.15s" }}
            >
              <CheckCircle size={13} /> Approve & Process
            </button>
          </div>
        </div>
      )}

      {/* ── Finance Toast ── */}
      {finToast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:9999, backgroundColor:finToast.color, color:"white", padding:"10px 20px", borderRadius:10, fontSize:13, fontWeight:600, boxShadow:"0 4px 16px rgba(0,0,0,0.18)", pointerEvents:"none" }}>
          {finToast.msg}
        </div>
      )}

      {/* ── Approve & Process Modal ── */}
      {showApproveModal && (() => {
        const monthLabel = months.find(m => m.key === selectedMonth)?.label || selectedMonth;
        return (
          <div style={{ position:"fixed", inset:0, zIndex:9999, backgroundColor:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ backgroundColor:"white", borderRadius:16, width:"100%", maxWidth:420, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
              {approveSuccess ? (
                <div style={{ textAlign:"center" }}>
                  <CheckCircle size={44} style={{ color:"#16a34a", margin:"0 auto 12px", display:"block" }}/>
                  <h3 style={{ margin:"0 0 8px", fontSize:17, fontWeight:800, color:"#111827" }}>تم الاعتماد بنجاح ✅</h3>
                  <p style={{ margin:"0 0 16px", fontSize:13, color:"#6b7280" }}>
                    شهر: <strong>{monthLabel}</strong> · {totals.headcount} موظف · صافي SAR {fmtPro(totals.netTotal)}
                  </p>
                  <button onClick={() => { setShowApproveModal(false); setApproveSuccess(false); }} style={{ padding:"9px 24px", borderRadius:8, border:"none", backgroundColor:M, color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>إغلاق</button>
                </div>
              ) : (
                <>
                  <h3 style={{ margin:"0 0 6px", fontSize:17, fontWeight:800, color:"#111827" }}>✅ Approve & Process Payroll</h3>
                  <p style={{ margin:"0 0 18px", fontSize:12, color:"#6b7280" }}>هتتم معالجة الرواتب وتسجيل الدفع في السيستم.</p>
                  <div style={{ padding:"14px 16px", borderRadius:10, backgroundColor:"#f9fafb", border:"1px solid #e5e7eb", marginBottom:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div><div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Month</div><div style={{ fontSize:14, fontWeight:800, color:"#111827" }}>{monthLabel}</div></div>
                    <div><div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Employees</div><div style={{ fontSize:14, fontWeight:800, color:"#111827" }}>{totals.headcount}</div></div>
                    <div><div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Gross</div><div style={{ fontSize:14, fontWeight:800, color:"#374151" }}>SAR {fmtPro(totals.payroll)}</div></div>
                    <div><div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Net</div><div style={{ fontSize:14, fontWeight:800, color:M }}>SAR {fmtPro(totals.netTotal)}</div></div>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={() => { setShowApproveModal(false); setApproveSuccess(false); }} style={{ flex:1, padding:"9px", borderRadius:8, border:"1px solid #e5e7eb", backgroundColor:"white", cursor:"pointer", fontSize:13, fontWeight:600, color:"#374151" }}>Cancel</button>
                    <button onClick={() => {
                      const updated = { ...(flows || {}) };
                      selectedRows.forEach(emp => {
                        const sk = empStableKey(emp);
                        const fkey = `${selectedMonth}_${sk}`;
                        updated[fkey] = { ...(updated[fkey] || {}), salary:true, approvedAt:new Date().toISOString(), net:emp._pro?.netProrated||emp._pro?.proratedPkg||0 };
                      });
                      if (onSaveFlows) onSaveFlows(updated);
                      setApproveSuccess(true);
                    }} style={{ flex:2, padding:"9px", borderRadius:8, border:"none", backgroundColor:M, color:"white", cursor:"pointer", fontSize:13, fontWeight:800 }}>
                      ✅ Confirm & Process
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — INVOICES / BILLING  (was BillingModule)
// ═══════════════════════════════════════════════════════════════════════════════
function InvoicesTab({ employees }) {
  const [filterClient, setFilterClient] = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");

  const billingData = useMemo(() => employees.filter(e => !isExcluded(e)), [employees]);

  // العدد الحقيقي بعد استثناء Sela بدون PO (بدون تأثير الـ search)
  const billableCount = useMemo(() => billingData.filter(emp => {
    const empClient = (emp.client || "").toLowerCase();
    if (empClient === "sela") return emp.poNumbers && String(emp.poNumbers).trim() !== "";
    return true;
  }).length, [billingData]);

  const clientsList = useMemo(
    () => Array.from(new Set(billingData.map(e => e.client).filter(Boolean))),
    [billingData]
  );

  const filteredItems = useMemo(() => billingData.filter(emp => {
    const empClient     = (emp.client || "").toLowerCase();
    const selectedClient = filterClient.toLowerCase();
    const matchClient   = filterClient === "all" || empClient === selectedClient;
    const matchSearch   = (emp.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    // Sela: only include if PO exists
    if (empClient === "sela") {
      const hasPo = emp.poNumbers && String(emp.poNumbers).trim() !== "";
      if (!hasPo) return false;
    }
    return matchClient && matchSearch;
  }), [billingData, filterClient, searchQuery]);

  const stats = useMemo(() => {
    let marginTotal = 0, vatTotal = 0, grandTotal = 0;
    filteredItems.forEach(emp => {
      const line = calcLine(emp);
      marginTotal += line.margin;
      vatTotal    += line.vat;
      grandTotal  += line.total;
    });
    return { marginTotal, vatTotal, grandTotal };
  }, [filteredItems]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Total Margin",  value: fmtSAR(stats.marginTotal), color: "#059669", border: "#bbf7d0", bg: "#f0fdf4" },
          { label: "Est. VAT (15%)",value: fmtSAR(stats.vatTotal),    color: M,         border: `${M}30`,  bg: `${M}06` },
          { label: "Grand Total",   value: fmtSAR(stats.grandTotal),  color: "#1d4ed8", border: "#bfdbfe", bg: "#eff6ff" },
        ].map(k => (
          <div key={k.label} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${k.border}`, backgroundColor: k.bg }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{k.label}</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search employee…"
            style={{ width: "100%", padding: "9px 10px 9px 34px", borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 12, boxSizing: "border-box" }} />
        </div>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid #e5e7eb", backgroundColor: "white", fontSize: 12, fontWeight: 600, minWidth: 180 }}>
          <option value="all">All Clients ({billableCount})</option>
          {clientsList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{filteredItems.length} records</span>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="fe-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr style={{ backgroundColor: "#fdf8f8" }}>
                <th style={{ ...th, borderLeft: `3px solid ${M}` }}>Employee</th>
                <th style={th}>Client</th>
                <th style={{ ...th, textAlign: "right" }}>Package</th>
                <th style={{ ...th, textAlign: "right", color: "#059669" }}>Margin</th>
                <th style={{ ...th, textAlign: "right" }}>VAT 15%</th>
                <th style={{ ...th, textAlign: "right", backgroundColor: "#fdf8f8", color: M }}>Invoice Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No billing records found</td></tr>
              ) : filteredItems.map(emp => {
                const line  = calcLine(emp);
                const poRaw = emp.poNumbers || "";
                const hasPO = poRaw.toString().trim().length > 0;
                const isSela = (emp.client || "").toLowerCase() === "sela";
                return (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ ...td, borderLeft: "3px solid transparent" }}>
                      <p style={{ fontWeight: 700, color: "#111827", margin: 0 }}>{emp.name}</p>
                      {isSela && (
                        <span style={badgePO(hasPO)}>
                          {hasPO ? `PO: ${poRaw}` : <><AlertTriangle size={10} style={{ display: "inline", marginRight: 3 }}/> Missing PO</>}
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{emp.client}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{fmtNum(emp.totalPackage)}</td>
                    <td style={{ ...td, textAlign: "right", color: "#059669", fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{fmtNum(line.margin)}</td>
                    <td style={{ ...td, textAlign: "right", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{fmtNum(line.vat)}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 800, color: M, fontFamily: "monospace", fontSize: 13, backgroundColor: "#fdf8f808" }}>{fmtNum(line.total)}</td>
                  </tr>
                );
              })}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: "#fdf8f8", borderTop: "2px solid #f3f4f6" }}>
                  <td style={{ ...td, fontWeight: 800, color: M, fontSize: 12 }} colSpan={2}>{filteredItems.length} invoices</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#9ca3af" }}>—</td>
                  <td style={{ ...td, textAlign: "right", color: "#059669", fontWeight: 800, fontFamily: "monospace", fontSize: 12 }}>{fmtNum(stats.marginTotal)}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{fmtNum(stats.vatTotal)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 900, color: M, fontFamily: "monospace", fontSize: 14, backgroundColor: "#fdf8f8" }}>{fmtNum(stats.grandTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB — PROFIT PER CLIENT
// ═══════════════════════════════════════════════════════════════════════════════
function ProfitPerClientTab({ employees }) {
  const [expandedClient, setExpandedClient] = useState(null);
  const [showAllEmps, setShowAllEmps] = useState({}); // { [client]: bool }
  const active = useMemo(() => employees.filter(e => !isExcluded(e)), [employees]);

  const clientRows = useMemo(() => {
    const clients = Array.from(new Set(active.map(e => e.client).filter(Boolean))).sort();
    return clients.map(client => {
      const emps = active.filter(e => e.client === client);
      const billable = client === "Sela"
        ? emps.filter(e => e.poNumbers && String(e.poNumbers).trim() !== "")
        : emps;
      let totalBilled = 0, totalMargin = 0, totalVAT = 0, totalPartnerPayout = 0;
      billable.forEach(emp => {
        const line   = calcLine(emp);
        totalBilled        += line.total;
        totalMargin        += line.margin;
        totalVAT           += line.vat;
        totalPartnerPayout += calcPartnerPayout(emp);
      });
      const totalPayroll = emps.reduce((s, e) => s + Number(e.totalPackage || 0), 0);
      const netProfit    = totalMargin - totalPartnerPayout;
      const marginPct    = totalBilled > 0 ? (totalMargin  / totalBilled) * 100 : 0;
      const netPct       = totalBilled > 0 ? (netProfit    / totalBilled) * 100 : 0;
      const noPO = client === "Sela" ? emps.filter(e => !e.poNumbers || String(e.poNumbers).trim() === "").length : 0;
      return { client, emps, headcount: emps.length, billableCount: billable.length, totalPayroll, totalBilled, totalMargin, totalPartnerPayout, netProfit, totalVAT, marginPct, netPct, noPO };
    });
  }, [active]);

  const totals = useMemo(() => clientRows.reduce((acc, r) => ({
    headcount:          acc.headcount          + r.headcount,
    totalPayroll:       acc.totalPayroll       + r.totalPayroll,
    totalBilled:        acc.totalBilled        + r.totalBilled,
    totalMargin:        acc.totalMargin        + r.totalMargin,
    totalPartnerPayout: acc.totalPartnerPayout + r.totalPartnerPayout,
    netProfit:          acc.netProfit          + r.netProfit,
    totalVAT:           acc.totalVAT           + r.totalVAT,
  }), { headcount: 0, totalPayroll: 0, totalBilled: 0, totalMargin: 0, totalPartnerPayout: 0, netProfit: 0, totalVAT: 0 }), [clientRows]);

  const overallMarginPct = totals.totalBilled > 0 ? (totals.totalMargin  / totals.totalBilled) * 100 : 0;
  const overallNetPct    = totals.totalBilled > 0 ? (totals.netProfit     / totals.totalBilled) * 100 : 0;
  const barMax = Math.max(...clientRows.map(r => r.netProfit), 1);
  const f = n => Number(n || 0).toLocaleString("en-SA", { maximumFractionDigits: 0 });
  const marginColor = pct => pct >= 15 ? "#059669" : pct >= 8 ? "#d97706" : M;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {[
          { label: "Headcount",       value: totals.headcount,                       accent: "#374151", border: "#e5e7eb", bg: "#f9fafb" },
          { label: "Total Payroll",   value: `SAR ${f(totals.totalPayroll)}`,         accent: "#1d4ed8", border: "#bfdbfe", bg: "#eff6ff" },
          { label: "Total Billed",    value: `SAR ${f(totals.totalBilled)}`,          accent: M,         border: `${M}40`,  bg: "#fff5f5" },
          { label: "Gross Margin",    value: `SAR ${f(totals.totalMargin)}`,          accent: "#0369a1", border: "#bae6fd", bg: "#f0f9ff",
            sub: `${overallMarginPct.toFixed(1)}% of billed` },
          { label: "Net Profit",      value: `SAR ${f(totals.netProfit)}`,            accent: "#059669", border: "#bbf7d0", bg: "#f0fdf4",
            sub: `after partner payouts · ${overallNetPct.toFixed(1)}%` },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: k.bg, borderRadius: 10, border: `1px solid ${k.border}`, borderLeft: `4px solid ${k.accent}`, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: k.accent, fontFamily: "monospace", letterSpacing: "-0.5px" }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 10, color: k.accent, fontWeight: 700, marginTop: 2, opacity: 0.75 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Margin Chart + Table side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12, alignItems: "start" }}>

        {/* Bar Chart */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Net Profit by Client</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {clientRows.map(r => {
              const col = getClientColor(r.client);
              const pct = Math.round((r.netProfit / barMax) * 100);
              return (
                <div key={r.client}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{r.client}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: marginColor(r.netPct), fontFamily: "monospace" }}>
                      SAR {f(r.netProfit)} <span style={{ opacity: 0.7 }}>({r.netPct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 8, backgroundColor: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: col.accent, borderRadius: 99, transition: "width 0.5s ease", minWidth: r.netProfit > 0 ? 6 : 0, opacity: 0.85 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {[["≥15%","#059669","Good"],["8–14%","#d97706","OK"],["<8%",M,"Low"]].map(([l,c,t])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#6b7280" }}>
                <div style={{ width:8, height:8, borderRadius:2, backgroundColor:c }} />
                {l} {t}
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#fdf8f8" }}>
                {[
                  ["Client",          "left"],
                  ["HC",              "center"],
                  ["Payroll",         "right"],
                  ["Billed",          "right"],
                  ["Gross Margin",    "right"],
                  ["Partner Payout",  "right"],
                  ["Net Profit",      "right"],
                  ["%",               "right"],
                  ["VAT",             "right"],
                ].map(([h, align]) => (
                  <th key={h} style={{ ...th, textAlign: align, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientRows.map((r, i) => {
                const col = getClientColor(r.client);
                const isExp = expandedClient === r.client;
                return (
                  <>
                    <tr key={r.client}
                      onClick={() => setExpandedClient(isExp ? null : r.client)}
                      style={{ borderBottom: isExp ? "none" : "1px solid #f3f4f6", cursor: "pointer", backgroundColor: r.netProfit < 0 ? "#fff1f2" : isExp ? col.light : i % 2 === 0 ? "white" : "#fafafa", transition: "background 0.15s" }}>
                      <td style={{ ...td, borderLeft: `3px solid ${col.accent}`, fontWeight: 700, paddingLeft: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, color: col.accent, transition: "transform 0.2s", display: "inline-block", transform: isExp ? "rotate(90deg)" : "none" }}>▶</span>
                          {r.client}
                          {r.noPO > 0 && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#fff7ed", color: "#c2410c", padding: "1px 5px", borderRadius: 999 }}>{r.noPO} no PO</span>}
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>
                        {r.headcount}
                        {r.noPO > 0 && <div style={{ fontSize: 9, color: "#9ca3af" }}>{r.billableCount} billable</div>}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{f(r.totalPayroll)}</td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{f(r.totalBilled)}</td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#0369a1" }}>{f(r.totalMargin)}</td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: r.totalPartnerPayout > 0 ? "#7c3aed" : "#9ca3af" }}>
                        {r.totalPartnerPayout > 0 ? `(${f(r.totalPartnerPayout)})` : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: r.netProfit < 0 ? "#dc2626" : marginColor(r.netPct) }}>
                        {r.netProfit < 0 ? `🔴 (${f(Math.abs(r.netProfit))})` : f(r.netProfit)}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 900, fontSize: 12, color: marginColor(r.netPct) }}>{r.netPct.toFixed(1)}%</td>
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#9ca3af" }}>{f(r.totalVAT)}</td>
                    </tr>
                    {isExp && (
                      <tr key={`${r.client}-exp`}>
                        <td colSpan={7} style={{ padding: 0, backgroundColor: col.light, borderBottom: "1px solid #f3f4f6" }}>
                          <div style={{ padding: "8px 16px 12px 28px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  {["Employee","Position","Package","Billed","Gross Margin","Partner Payout","Net Profit","PO"].map(h => (
                                    <th key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", padding: "4px 8px", textAlign: ["Package","Billed","Gross Margin","Partner Payout","Net Profit"].includes(h) ? "right" : "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(showAllEmps[r.client] ? r.emps : r.emps.slice(0, 8)).map(e => {
                                  const ln     = calcLine(e);
                                  const payout = calcPartnerPayout(e);
                                  const net    = ln.margin - payout;
                                  const hasPO  = e.poNumbers && String(e.poNumbers).trim() !== "";
                                  return (
                                    <tr key={e._id}>
                                      <td style={{ fontSize: 11, fontWeight: 600, color: "#374151", padding: "5px 8px" }}>{e.name}</td>
                                      <td style={{ fontSize: 10, color: "#9ca3af", padding: "5px 8px" }}>{e.position || "—"}</td>
                                      <td style={{ fontSize: 11, fontFamily: "monospace", textAlign: "right", padding: "5px 8px", color: "#6b7280" }}>{f(e.totalPackage)}</td>
                                      <td style={{ fontSize: 11, fontFamily: "monospace", textAlign: "right", padding: "5px 8px" }}>{f(ln.total)}</td>
                                      <td style={{ fontSize: 11, fontFamily: "monospace", textAlign: "right", padding: "5px 8px", color: "#0369a1" }}>{f(ln.margin)}</td>
                                      <td style={{ fontSize: 11, fontFamily: "monospace", textAlign: "right", padding: "5px 8px", color: payout > 0 ? "#7c3aed" : "#d1d5db" }}>
                                        {payout > 0 ? `(${f(payout)})` : "—"}
                                      </td>
                                      <td style={{ fontSize: 11, fontFamily: "monospace", textAlign: "right", padding: "5px 8px", color: net < 0 ? "#dc2626" : "#059669", fontWeight: 700, backgroundColor: net < 0 ? "#fff1f2" : "transparent" }}>
                                        {net < 0 ? `🔴 (${f(Math.abs(net))})` : f(net)}
                                      </td>
                                      <td style={{ fontSize: 10, padding: "5px 8px" }}>
                                        {hasPO
                                          ? <span style={{ backgroundColor: "#f0fdf4", color: "#059669", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{String(e.poNumbers).trim()}</span>
                                          : <span style={{ backgroundColor: "#fff7ed", color: "#c2410c", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>No PO</span>}
                                      </td>
                                    </tr>
                                  );
                                })}
                                {r.emps.length > 8 && (
                                  <tr>
                                    <td colSpan={8} style={{ padding: "6px 8px", textAlign: "center" }}>
                                      <button
                                        onClick={() => setShowAllEmps(prev => ({ ...prev, [r.client]: !prev[r.client] }))}
                                        style={{ fontSize: 10, fontWeight: 700, color: M, background: "none", border: "none", cursor: "pointer" }}
                                      >
                                        {showAllEmps[r.client] ? "▲ Show less" : `▼ Show all ${r.emps.length} employees`}
                                      </button>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#fdf8f8", borderTop: "2px solid #e5e7eb" }}>
                <td style={{ ...td, fontWeight: 800, color: M, borderLeft: `3px solid ${M}`, paddingLeft: 10 }}>TOTAL</td>
                <td style={{ ...td, textAlign: "center", fontWeight: 800 }}>{totals.headcount}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace", color: "#6b7280", fontWeight: 700 }}>{f(totals.totalPayroll)}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontWeight: 800 }}>{f(totals.totalBilled)}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0369a1" }}>{f(totals.totalMargin)}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#7c3aed" }}>
                  {totals.totalPartnerPayout > 0 ? `(${f(totals.totalPartnerPayout)})` : "—"}
                </td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#059669", fontSize: 14 }}>{f(totals.netProfit)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#059669", fontSize: 13 }}>{overallNetPct.toFixed(1)}%</td>
                <td style={{ ...td, textAlign: "right", fontFamily: "monospace", color: "#9ca3af", fontWeight: 700 }}>{f(totals.totalVAT)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Monthly P&L Trend (last 6 months) ────────────────────────────── */}
      <MonthlyPLTrend employees={active} clientRows={clientRows} />
    </div>
  );
}

function MonthlyPLTrend({ employees, clientRows }) {
  const f = n => Number(n || 0).toLocaleString("en-SA", { maximumFractionDigits: 0 });
  const [view, setView] = useState("net");
  const [window, setWindow] = useState(6); // months to show: 3 | 6 | 12

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: window }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (window - 1) + i, 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        year: d.getFullYear(), month: d.getMonth() + 1,
      };
    });
  }, [window]);

  const data = useMemo(() => {
    return clientRows.map(({ client }) => {
      const color = getClientColor(client).accent;
      const monthly = months.map(({ year, month, key, label }) => {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay  = new Date(year, month, 0);
        const emps = employees.filter(e => {
          if ((e.client || '') !== client) return false;
          const start = e.startDate ? new Date(e.startDate) : null;
          const end   = e.endDate   ? new Date(e.endDate)   : null;
          if (start && start > lastDay)  return false;
          if (end   && end   < firstDay) return false;
          return true;
        });
        const billable = client === 'Sela'
          ? emps.filter(e => e.poNumbers && String(e.poNumbers).trim() !== '')
          : emps;
        let billed = 0, margin = 0, partnerPayout = 0;
        billable.forEach(e => {
          const ln = calcLine(e);
          billed += ln.total; margin += ln.margin;
          partnerPayout += calcPartnerPayout(e);
        });
        return { key, label, billed, margin, net: margin - partnerPayout, headcount: emps.length };
      });
      return { client, color, monthly };
    });
  }, [clientRows, months, employees]);

  const maxVal = useMemo(() => {
    let m = 0;
    data.forEach(d => d.monthly.forEach(mo => {
      const v = view === 'net' ? mo.net : view === 'billed' ? mo.billed : mo.margin;
      if (v > m) m = v;
    }));
    return m || 1;
  }, [data, view]);

  return (
    <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#111827" }}>Monthly P&L Trend</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>آخر {window} شهور — per client</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[[3,"3M"],[6,"6M"],[12,"12M"]].map(([n,l]) => (
            <button key={n} onClick={() => setWindow(n)} style={{
              fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, border: "none", cursor: "pointer",
              backgroundColor: window === n ? "#6b7280" : "#f3f4f6",
              color: window === n ? "white" : "#9ca3af",
            }}>{l}</button>
          ))}
          <div style={{ width: 1, backgroundColor: "#e5e7eb", margin: "0 2px" }} />
          {[["net","Net Profit"],["billed","Billed"],["margin","Gross Margin"]].map(([k,l]) => (
            <button key={k} onClick={() => setView(k)} style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              backgroundColor: view === k ? "#111827" : "#f3f4f6",
              color: view === k ? "white" : "#6b7280",
            }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ backgroundColor: "#fafafa" }}>
              <th style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "left", borderBottom: "1px solid #f3f4f6", width: 160 }}>Client</th>
              {months.map(m => (
                <th key={m.key} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "right", borderBottom: "1px solid #f3f4f6" }}>{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(({ client, color, monthly }) => (
              <tr key={client} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "10px 14px", borderLeft: `3px solid ${color}`, fontWeight: 700, fontSize: 12, color: "#374151" }}>{client}</td>
                {monthly.map(mo => {
                  const val = view === 'net' ? mo.net : view === 'billed' ? mo.billed : mo.margin;
                  const pct = Math.round((val / maxVal) * 80);
                  return (
                    <td key={mo.key} style={{ padding: "8px 10px", textAlign: "right" }}>
                      {mo.headcount === 0 ? (
                        <span style={{ fontSize: 10, color: "#d1d5db" }}>—</span>
                      ) : (
                        <div>
                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 3 }}>
                            <div style={{ height: 4, borderRadius: 99, backgroundColor: `${color}20`, width: 60, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 99 }} />
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: val >= 0 ? "#374151" : "#dc2626" }}>
                            {val < 0 ? "-" : ""}{f(Math.abs(val))}
                          </span>
                          <div style={{ fontSize: 9, color: "#9ca3af" }}>{mo.headcount} HC</div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#fdf8f8", borderTop: "2px solid #e5e7eb" }}>
              <td style={{ padding: "10px 14px", fontWeight: 800, fontSize: 12, color: "#111827", borderLeft: "3px solid #A02843" }}>TOTAL</td>
              {months.map(m => {
                const total = data.reduce((s, d) => {
                  const mo = d.monthly.find(x => x.key === m.key);
                  const v = view === 'net' ? mo?.net : view === 'billed' ? mo?.billed : mo?.margin;
                  return s + (v || 0);
                }, 0);
                return (
                  <td key={m.key} style={{ padding: "10px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, fontSize: 12, color: "#059669" }}>
                    {f(total)}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

//  MONTHLY PAYROLL FLOW TRACKER

const PAYROLL_STEPS = [
  { k: 'timesheet', l: 'Timesheet Received', short: '📋 TS',  color: '#3b82f6', desc: 'Timesheet   ' },
  { k: 'salary',    l: 'Salary Paid',        short: '💰 SAL', color: '#7c3aed', desc: 'Salary   / ' },
  { k: 'invoice',   l: 'Invoice Sent',       short: '📄 INV', color: '#d97706', desc: 'Invoice   (1-7 )' },
  { k: 'payment',   l: 'Payment Received',   short: '✅ PAY', color: '#16a34a', desc: 'Payment   ' },
];

function PayrollFlowTracker({ employees, sharedFlows, onSaveFlows }) {
  const now = new Date();
  const months = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    };
  });

  const [selectedMonth, setSelectedMonth] = useState(
    () => localStorage.getItem("fisheye_flow_month") || months[0].key
  );
  const [selectedClient, setSelectedClient] = useState(
    () => localStorage.getItem("fisheye_flow_client") || 'All'
  );
  const [filterDone, setFilterDone] = useState(false);
  const [syncingFlow, setSyncingFlow] = useState(false);

  // Use shared flows from parent FinanceModule (single source of truth)
  const flows = sharedFlows || {};
  const saveFlows = onSaveFlows || (() => {});
  const persistFlow = async (_key, _data) => {}; // no-op: parent handles Supabase sync

  // Stable key: employee name (not row index) so data survives spreadsheet row changes
  const empStableKey = (e) => (e.name || '').trim().toLowerCase().replace(/\s+/g, '_') || String(e._id);

  const getFlow  = (e) => flows[`${selectedMonth}_${empStableKey(e)}`] || {};
  const allDone  = e => PAYROLL_STEPS.every(s => getFlow(e)[s.k]);

  const toggle = async (e, step) => {
    const key = `${selectedMonth}_${empStableKey(e)}`;
    const cur = flows[key] || {};
    const updated = { ...flows, [key]: { ...cur, [step]: !cur[step] } };
    await saveFlows(updated);
    await persistFlow(key, updated[key]);
  };

  // ── Bulk: mark a STEP as done for ALL visible employees ─────────────────
  const bulkMarkStep = async (emps, step, value) => {
    const updated = { ...flows };
    const persists = [];
    emps.forEach(e => {
      const key = `${selectedMonth}_${empStableKey(e)}`;
      updated[key] = { ...(updated[key] || {}), [step]: value };
      persists.push(persistFlow(key, updated[key]));
    });
    await saveFlows(updated);
    await Promise.all(persists);
  };

  // ── Bulk: mark ALL steps done/undone for ALL visible employees ───────────
  const bulkMarkAll = async (emps, value) => {
    const updated = { ...flows };
    const persists = [];
    emps.forEach(e => {
      const key = `${selectedMonth}_${empStableKey(e)}`;
      const cur = updated[key] || {};
      PAYROLL_STEPS.forEach(s => { cur[s.k] = value; });
      updated[key] = cur;
      persists.push(persistFlow(key, cur));
    });
    await saveFlows(updated);
    await Promise.all(persists);
  };

  // ── Eligible for payroll this month:
  //    • Not excluded (resigned/etc.)
  //    • Was active during the selected month (start ≤ month end AND end ≥ month start, or no end date)
  //    • Sela employees must have a PO
  const { year: flowYear, month: flowMonth } = parseYM(selectedMonth);
  const monthStart = new Date(flowYear, flowMonth - 1, 1);
  const monthEnd   = new Date(flowYear, flowMonth - 1, 30);

  const activeEmps = useMemo(() => employees.filter(e => {
    const st = (e.status || '').toLowerCase();
    // Resigned → never
    if (['resigned', 'resigned_ar', 'مستقيل'].includes(st)) return false;

    // وصلهم PO الشهر ده → include دايمًا (accumulated salary، بغض النظر عن تاريخ انتهاء العقد)
    if (e.poAddedDate) {
      const d = parseDate(e.poAddedDate);
      if (d && d.getFullYear() === flowYear && d.getMonth() + 1 === flowMonth) return true;
    }

    // Expired: include only if contract ends within this month (leaver)
    if (['expired', 'expired_ar', 'منتهي'].includes(st)) {
      const end = parseDate(e.endDate);
      if (!end || end < monthStart) return false;
      // endDate >= monthStart → leaver this month → continue
    }

    // Sela بدون PO → مش eligible
    const isSela = (e.client || '').toLowerCase() === 'sela';
    const hasPO  = e.poNumbers && String(e.poNumbers).trim() !== '';
    if (isSela && !hasPO) return false;

    // ما بدأوش لسه → مش eligible
    const start = parseDate(e.startDate);
    if (start && start > monthEnd) return false;

    // عقده انتهى قبل الشهر ده → مش eligible
    const end2 = parseDate(e.endDate);
    if (end2 && end2 < monthStart) return false;

    return true;
  }), [employees, selectedMonth, flowYear, flowMonth]);

  // Client filter list — derived from actual employee data
  const clientsWithEmps = ['All', ...Array.from(new Set(activeEmps.map(e => e.client).filter(Boolean)))];

  const filteredByClient = selectedClient === 'All'
    ? activeEmps
    : activeEmps.filter(e => e.client === selectedClient);

  const displayedEmps = filterDone
    ? filteredByClient.filter(e => !allDone(e))
    : filteredByClient;

  const completedCount = filteredByClient.filter(allDone).length;

  // Step completion % for filtered client
  const stepCounts = PAYROLL_STEPS.map(st => ({
    ...st,
    done: filteredByClient.filter(e => getFlow(e)[st.k]).length,
    total: filteredByClient.length,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Month selector + Client filter + Toggle ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: '10px 14px', border: '1px solid #f3f4f6' }}>
        {/* Month pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {months.map(m => {
            const isAct = selectedMonth === m.key;
            return (
              <button key={m.key} onClick={() => { setSelectedMonth(m.key); localStorage.setItem('fisheye_flow_month', m.key); }}
                style={{
                  padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                  border: `1.5px solid ${isAct ? '#0ea5e9' : '#e5e7eb'}`,
                  backgroundColor: isAct ? '#0ea5e9' : 'white',
                  color: isAct ? 'white' : '#6b7280',
                  boxShadow: isAct ? '0 2px 6px rgba(14,165,233,0.25)' : 'none',
                }}>
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, backgroundColor: '#e5e7eb', margin: '0 4px', flexShrink: 0 }} />

        {/* Client pills */}
        <div style={{ display: 'flex', gap: 3, backgroundColor: '#e5e7eb', borderRadius: 7, padding: 2 }}>
          {clientsWithEmps.map(c => {
            const isAct = selectedClient === c;
            return (
              <button key={c} onClick={() => { setSelectedClient(c); localStorage.setItem('fisheye_flow_client', c); }}
                style={{
                  padding: '5px 11px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                  backgroundColor: isAct ? 'white' : 'transparent',
                  color: isAct ? '#111827' : '#9ca3af',
                  boxShadow: isAct ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {c === 'All' ? 'All Clients' : c}
                {c !== 'All' && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.6 }}>{activeEmps.filter(e => e.client === c).length}</span>}
              </button>
            );
          })}
        </div>

        {/* Pending toggle */}
        <button onClick={() => setFilterDone(f => !f)}
          style={{
            marginLeft: 'auto', padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: `1.5px solid ${filterDone ? '#0ea5e9' : '#e5e7eb'}`,
            backgroundColor: filterDone ? '#e0f2fe' : 'white',
            color: filterDone ? '#0369a1' : '#6b7280',
            transition: 'all 0.15s',
          }}>
          {filterDone ? '👁 Show All' : '⏳ Pending Only'}
        </button>

        {/* Count */}
        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
          {completedCount}/{filteredByClient.length} done
        </span>
      </div>

      {/* ── Step progress cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {stepCounts.map(st => {
          const pct = st.total ? Math.round(st.done / st.total * 100) : 0;
          return (
            <div key={st.k} className="fe-stat-card" style={{
              padding: '11px 13px', borderRadius: 10,
              border: '1px solid #e5e7eb', borderLeft: `4px solid ${st.color}`,
              backgroundColor: pct === 100 ? `${st.color}08` : 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st.desc}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: st.color }}>{st.done}/{st.total}</span>
              </div>
              <div style={{ height: 5, backgroundColor: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: st.color, borderRadius: 999, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 10, color: pct === 100 ? st.color : '#9ca3af', marginTop: 4, fontWeight: pct === 100 ? 700 : 400 }}>
                {pct === 100 ? '✓ Complete' : `${pct}%`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bulk Actions toolbar ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: '9px 14px', border: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
          Bulk — {displayedEmps.length} employees:
        </span>
        {PAYROLL_STEPS.map(st => {
          const allStepDone = displayedEmps.length > 0 && displayedEmps.every(e => getFlow(e)[st.k]);
          return (
            <button key={st.k} onClick={() => bulkMarkStep(displayedEmps, st.k, !allStepDone)}
              title={allStepDone ? `Unmark ${st.l} for all` : `Mark ${st.l} for all`}
              style={{
                padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${allStepDone ? st.color : '#e5e7eb'}`,
                backgroundColor: allStepDone ? st.color : 'white',
                color: allStepDone ? 'white' : st.color,
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
              }}>
              {allStepDone && <Check size={10} />}
              {st.short}
            </button>
          );
        })}
        <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb', flexShrink: 0 }} />
        <button onClick={() => { bulkMarkAll(displayedEmps, true); }}
          style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #16a34a', backgroundColor: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={10} /> All Done
        </button>
        <button onClick={() => { bulkMarkAll(displayedEmps, false); }}
          style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#9ca3af' }}>
          Reset
        </button>
      </div>

      {/* ── Table ── */}
      {displayedEmps.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>✅ All employees completed for this month!</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', backgroundColor: 'white' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="fe-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ ...th, borderLeft: `4px solid ${M}`, backgroundColor: '#f9fafb' }}>Employee</th>
                  <th style={{ ...th, backgroundColor: '#f9fafb' }}>Client</th>
                  <th style={{ ...th, backgroundColor: '#f9fafb' }}>Mode</th>
                  {PAYROLL_STEPS.map(st => (
                    <th key={st.k} style={{ ...th, textAlign: 'center', backgroundColor: '#f9fafb' }}>
                      <span style={{ color: st.color }}>{st.short}</span>
                    </th>
                  ))}
                  <th style={{ ...th, backgroundColor: '#f9fafb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedEmps.map((e, rowIdx) => {
                  const done      = allDone(e);
                  const doneCount = PAYROLL_STEPS.filter(st => getFlow(e)[st.k]).length;
                  const rowBg     = done ? '#f0fdf4' : rowIdx % 2 === 0 ? 'white' : '#fafafa';
                  return (
                    <tr key={e._id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: rowBg }}>
                      <td style={{ ...td, borderLeft: `4px solid ${done ? '#16a34a' : 'transparent'}` }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: 12 }}>{e.name}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{e.position}</div>
                      </td>
                      <td style={{ ...td }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: `${M}12`, color: M }}>
                          {e.client}
                        </span>
                      </td>
                      <td style={{ ...td }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: e.profitMode === 'direct' ? '#dbeafe' : '#f3e8ff', color: e.profitMode === 'direct' ? '#1e40af' : '#581c87' }}>
                          {e.profitMode === 'direct' ? '⚡ Direct' : '🤝 Partner'}
                        </span>
                      </td>
                      {PAYROLL_STEPS.map(st => (
                        <td key={st.k} style={{ ...td, textAlign: 'center' }}>
                          <button title={st.desc} onClick={() => toggle(e, st.k)}
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              border: `2px solid ${getFlow(e)[st.k] ? st.color : '#e5e7eb'}`,
                              backgroundColor: getFlow(e)[st.k] ? st.color : 'white',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto', transition: 'all 0.15s',
                            }}>
                            {getFlow(e)[st.k]
                              ? <Check size={11} style={{ color: 'white' }} />
                              : <span style={{ fontSize: 9, color: '#d1d5db' }}>○</span>}
                          </button>
                        </td>
                      ))}
                      <td style={{ ...td }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                          backgroundColor: done ? '#dcfce7' : doneCount > 0 ? '#fef9c3' : '#f3f4f6',
                          color: done ? '#166534' : doneCount > 0 ? '#854d0e' : '#9ca3af',
                        }}>
                          {done ? '✓ Done' : `${doneCount}/${PAYROLL_STEPS.length}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORECAST TAB
// ═══════════════════════════════════════════════════════════════════════════════
// Method (kept simple & transparent so it's trustworthy in a manager conversation):
//   1. Baseline run-rate = average monthly revenue over the last 3 months (from actual invoices).
//   2. Growth rate = % change between the last 3 months and the 3 months before that.
//   3. Pipeline signal = new POs/employees added THIS month for the client (poAddedDate,
//      falling back to startDate), valued at the average revenue-per-new-PO seen over the
//      last 6 months. Only half of that value is added to next month (new hires typically
//      start billing partway through their first cycle), and it fades out after month 1.
//   4. Each future month = previous projected month × (1 + growth rate), compounding forward
//      to the end of the calendar year.
// This is a projection from historical trend + known pipeline, not a guarantee — the numbers
// and assumptions are shown on-screen so they can be sanity-checked or overridden manually.

function ForecastTab({ employees = [] }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const fC = n => Number(n || 0).toLocaleString('en-SA', { maximumFractionDigits: 0 });

  useEffect(() => {
    supabase.from('fisheye_invoices').select('*').then(({ data }) => {
      if (data && data.length) setInvoices(data);
      else {
        try { setInvoices(JSON.parse(localStorage.getItem('fisheye_invoices_v1') || '[]')); }
        catch { setInvoices([]); }
      }
    });
  }, []);

  const monthKey = dateStr => {
    if (!dateStr) return null;
    const n = normalizeDate(dateStr);
    const m = /^(\d{4})-(\d{2})/.exec(n || '');
    return m ? `${m[1]}-${m[2]}` : null;
  };

  const clients = useMemo(() => {
    const set = new Set();
    invoices.forEach(i => { if (i.clientName) set.add(String(i.clientName).trim()); });
    employees.forEach(e => { if (e.client) set.add(String(e.client).trim()); });
    return [...set].filter(Boolean).sort();
  }, [invoices, employees]);

  useEffect(() => {
    if (!selectedClient && clients.length) {
      setSelectedClient(clients.includes('Sela') ? 'Sela' : clients[0]);
    }
  }, [clients, selectedClient]);

  // Last 12 calendar months ending this month, oldest first
  const months = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
  }, []);

  const monthLabel = ym => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  // Actual monthly revenue for the selected client (invoiceDate, excludes credit notes)
  const revenueByMonth = useMemo(() => {
    const map = {}; months.forEach(m => { map[m] = 0; });
    invoices
      .filter(i => String(i.clientName || '').trim() === selectedClient && !String(i.status || '').toLowerCase().includes('credit'))
      .forEach(i => {
        const mk = monthKey(i.invoiceDate) || monthKey(i.paidDate);
        if (mk && mk in map) map[mk] += Number(i.totalDue || 0);
      });
    return map;
  }, [invoices, selectedClient, months]);

  // New POs/requests added per month for the selected client (pipeline signal)
  const newPOsByMonth = useMemo(() => {
    const sets = {}; months.forEach(m => { sets[m] = new Set(); });
    employees
      .filter(e => String(e.client || '').trim() === selectedClient)
      .forEach(e => {
        const mk = monthKey(e.poAddedDate) || monthKey(e.startDate);
        if (!mk || !(mk in sets)) return;
        const pos = String(e.poNumbers || '').split(/[,;\n]/).map(p => p.trim()).filter(Boolean);
        if (pos.length) pos.forEach(po => sets[mk].add(po));
        else sets[mk].add(e._id); // no PO tracked — still counts as a new request/headcount
      });
    const counts = {};
    months.forEach(m => { counts[m] = sets[m].size; });
    return counts;
  }, [employees, selectedClient, months]);

  const forecast = useMemo(() => {
    // Exclude the current (in-progress) month — it's always partial and would
    // drag the baseline down. Also skip any completed month with SAR 0: in this
    // system that almost always means invoices for that period haven't been
    // entered yet, not that there was genuinely no revenue (confirmed while
    // reconciling — several recent months were missing invoice records).
    const completedMonths = months.slice(0, -1);
    const nonZeroMonths = completedMonths.filter(m => revenueByMonth[m] > 0);
    const skippedMonths = completedMonths.filter(m => revenueByMonth[m] === 0);

    const last3 = nonZeroMonths.slice(-3);
    const prev3 = nonZeroMonths.slice(-6, -3);
    const avgLast3 = last3.length ? last3.reduce((s, m) => s + revenueByMonth[m], 0) / last3.length : 0;
    const avgPrev3 = prev3.length ? prev3.reduce((s, m) => s + revenueByMonth[m], 0) / prev3.length : 0;
    const growthRate = avgPrev3 > 0 ? (avgLast3 - avgPrev3) / avgPrev3 : 0;
    const clampedGrowth = Math.max(-0.5, Math.min(0.5, growthRate)); // avoid runaway compounding

    const last6 = nonZeroMonths.slice(-6);
    const totalNewPOs6mo = last6.reduce((s, m) => s + newPOsByMonth[m], 0);
    const totalRevenue6mo = last6.reduce((s, m) => s + revenueByMonth[m], 0);
    const avgRevenuePerPO = totalNewPOs6mo > 0 ? totalRevenue6mo / totalNewPOs6mo : 0;

    const thisMonthNewPOs = newPOsByMonth[months[months.length - 1]] || 0;
    const pipelineBoost = thisMonthNewPOs * avgRevenuePerPO * 0.5;

    const now = new Date();
    const monthsLeftInYear = 11 - now.getMonth(); // e.g. Aug (idx 7) → 4 months left (Sep–Dec)
    let running = avgLast3;
    let remainingTotal = 0;
    const projection = [];
    for (let i = 1; i <= Math.max(monthsLeftInYear, 1); i++) {
      running = running * (1 + clampedGrowth);
      const boost = i === 1 ? pipelineBoost : 0;
      const val = Math.max(0, running + boost);
      remainingTotal += val;
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      projection.push({ label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), value: val, isNextMonth: i === 1 });
    }

    return {
      avgLast3, avgPrev3, growthRate: clampedGrowth, avgRevenuePerPO, thisMonthNewPOs,
      pipelineBoost, nextMonthForecast: projection[0]?.value || 0, monthsLeftInYear,
      remainingTotal, projection, skippedMonths,
    };
  }, [months, revenueByMonth, newPOsByMonth]);

  const maxBar = Math.max(...months.map(m => revenueByMonth[m]), ...forecast.projection.map(p => p.value), 1);
  const maxPOBar = Math.max(...months.map(m => newPOsByMonth[m]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Client selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f9fafb', borderRadius: 10, padding: '10px 14px', border: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client</span>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
          Forecast based on the last 12 months of invoices + new PO activity
        </span>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        <Kpi label="Avg / month (last 3)" value={`SAR ${fC(forecast.avgLast3)}`} color="#374151" bg="#f9fafb" border="#e5e7eb" />
        <Kpi label="Growth trend" value={`${forecast.growthRate >= 0 ? '+' : ''}${(forecast.growthRate * 100).toFixed(1)}%`}
          sub="vs. prior 3 months" color={forecast.growthRate >= 0 ? '#059669' : '#dc2626'} bg={forecast.growthRate >= 0 ? '#f0fdf4' : '#fef2f2'} border={forecast.growthRate >= 0 ? '#bbf7d0' : '#fca5a5'} />
        <Kpi label="New POs this month" value={forecast.thisMonthNewPOs} sub={`~SAR ${fC(forecast.avgRevenuePerPO)}/PO avg`} color="#7c3aed" bg="#faf5ff" border="#ddd6fe" />
        <Kpi label="Next month forecast" value={`SAR ${fC(forecast.nextMonthForecast)}`} color="#0369a1" bg="#f0f9ff" border="#bae6fd" />
        <Kpi label={`Rest of ${new Date().getFullYear()} (${forecast.monthsLeftInYear}mo)`} value={`SAR ${fC(forecast.remainingTotal)}`} color={M} bg="#fff5f5" border={`${M}33`} />
      </div>

      {/* Revenue chart: actual (last 12mo) + projected (remaining months) */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Monthly Revenue — {selectedClient} <span style={{ fontWeight: 500, color: '#9ca3af', textTransform: 'none' }}>(solid = actual · hatched = projected)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, borderBottom: '1px solid #f3f4f6', paddingBottom: 6 }}>
          {months.map(m => (
            <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div title={`${monthLabel(m)}: SAR ${fC(revenueByMonth[m])}`}
                style={{ width: '100%', maxWidth: 26, height: `${Math.max(2, (revenueByMonth[m] / maxBar) * 140)}px`, backgroundColor: M, borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
            </div>
          ))}
          {forecast.projection.map(p => (
            <div key={p.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div title={`${p.label} (projected): SAR ${fC(p.value)}`}
                style={{
                  width: '100%', maxWidth: 26, height: `${Math.max(2, (p.value / maxBar) * 140)}px`,
                  borderRadius: '3px 3px 0 0', border: `1.5px dashed ${p.isNextMonth ? '#0369a1' : '#7c3aed'}`,
                  backgroundColor: p.isNextMonth ? '#bae6fd55' : '#ddd6fe55',
                }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {months.map(m => (
            <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af' }}>{monthLabel(m)}</div>
          ))}
          {forecast.projection.map(p => (
            <div key={p.label} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: p.isNextMonth ? '#0369a1' : '#7c3aed', fontWeight: 700 }}>{p.label}</div>
          ))}
        </div>
      </div>

      {/* New POs / requests per month — the pipeline/demand signal */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          New POs / Requests per Month — {selectedClient}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, borderBottom: '1px solid #f3f4f6', paddingBottom: 6 }}>
          {months.map(m => (
            <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: '#7c3aed', fontWeight: 700 }}>{newPOsByMonth[m] || ''}</span>
              <div title={`${monthLabel(m)}: ${newPOsByMonth[m]} new PO(s)`}
                style={{ width: '100%', maxWidth: 26, height: `${Math.max(2, (newPOsByMonth[m] / maxPOBar) * 60)}px`, backgroundColor: '#7c3aed', borderRadius: '3px 3px 0 0', opacity: 0.8 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {months.map(m => (
            <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af' }}>{monthLabel(m)}</div>
          ))}
        </div>
      </div>

      {/* Methodology note — keep the forecast auditable */}
      <div style={{ fontSize: 11, color: '#6b7280', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', lineHeight: 1.6 }}>
        <strong style={{ color: '#92400e' }}>How this is calculated:</strong> baseline = average revenue over the last 3 months
        with invoice data (SAR {fC(forecast.avgLast3)}); growth trend compares that to the 3 months before that
        ({forecast.growthRate >= 0 ? '+' : ''}{(forecast.growthRate * 100).toFixed(1)}%); each future month compounds the baseline
        by that trend. New POs added this month ({forecast.thisMonthNewPOs}) are valued at the average revenue-per-new-PO over the
        last 6 months (~SAR {fC(forecast.avgRevenuePerPO)}) and added at 50% weight to next month only, since new hires typically
        bill partway through their first cycle. Treat this as a starting point for the conversation with your manager, not a
        guarantee — sanity-check it against known deals in the pipeline.
        {forecast.skippedMonths.length > 0 && (
          <><br/><strong style={{ color: '#b45309' }}>⚠ Heads up:</strong> {forecast.skippedMonths.length} recent month{forecast.skippedMonths.length!==1?'s':''} ({forecast.skippedMonths.map(monthLabel).join(', ')}) show SAR 0 and were excluded from the baseline — that almost always means invoices for that period haven't been entered into the system yet, not that there was no revenue. Worth checking before relying on this forecast.</>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, color, bg, border }) {
  return (
    <div style={{ backgroundColor: bg, borderRadius: 10, border: `1px solid ${border}`, borderLeft: `4px solid ${color}`, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 2, opacity: 0.75 }}>{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PO RECONCILIATION TAB
// ═══════════════════════════════════════════════════════════════════════════════

// Budgets extracted from Sela PO PDF files (Total Value incl. VAT)
// Last updated from POs folder — amended POs use latest revision
const PO_PDF_BUDGETS = {"PO-28358":71475.95,"PO-28551":73140.0,"PO-28568":230391.0,"PO-28681":16035.0,"PO-28763":9752.0,"PO-28788":9752.0,"PO-28823":245019.0,"PO-28847":11092.9,"PO-28867":75605.6,"PO-28874":21942.0,"PO-28893":249251.0,"PO-28946":55692.0,"PO-29001":14915.5,"PO-29102":144315.0,"PO-29304":107004.0,"PO-29402":52844.8,"PO-29453":113314.0,"PO-29491":8552.0,"PO-29525":8533.0,"PO-29572":112405.2,"PO-29592":8552.0,"PO-29608":19242.0,"PO-29725":16035.0,"PO-29742":43747.85,"PO-29745":56202.6,"PO-29841":36552.53,"PO-29875":86095.0,"PO-29884":8533.0,"PO-29987":8552.0,"PO-30144":18564.0,"PO-30185":154722.0,"PO-30436":12828.0,"PO-30932":65205.0,"PO-30940":315653.61,"PO-30954":22449.0,"PO-31043":12828.0,"PO-31306":76968.0,"PO-31371":25656.0,"PO-31391":65807.5,"PO-31665":216158.6,"PO-31910":19242.0,"PO-32100":189738.5,"PO-32264":59852.9,"PO-32265":121465.3,"PO-32279":34495.5,"PO-32287":218515.37,"PO-32339":20787.0,"PO-32355":58512.0,"PO-32408":80175.0,"PO-32488":9621.0,"PO-32489":21380.0,"PO-32490":21380.0,"PO-32652":49140.0,"PO-32679":127994.5,"PO-32762":380564.0,"PO-32782":251716.3,"PO-32807":86775.6,"PO-32811":84842.4,"PO-32895":474781.37,"PO-33025":16285.0,"PO-33077":127913.73,"PO-33179":51198.0,"PO-33181":249606.73,"PO-33227":13541.0,"PO-33261":27936.53,"PO-33266":35527.0,"PO-33273":150996.25,"PO-33371":620781.5,"PO-33376":15472.0,"PO-33382":78037.0,"PO-33426":218143.5,"PO-33444":143566.0,"PO-33448":289110.0,"PO-33450":32070.0,"PO-33669":269388.0,"PO-33740":62641.99,"PO-33756":42760.0,"PO-33778":16035.0,"PO-33802":40622.0,"PO-33812":40622.0,"PO-33819":19562.0,"PO-33857":18285.0,"PO-33859":24380.0,"PO-33886":17816.67,"PO-33891":8644.0,"PO-33894":29932.0,"PO-33899":28643.68,"PO-33923":5865.0,"PO-33995":3367.0,"PO-33999":150729.0,"PO-34026":96762.0,"PO-34032":44898.0,"PO-34034":447989.92,"PO-34125":9621.0,"PO-34149":96210.0,"PO-34156":103693.0,"PO-34159":48105.0,"PO-34217":3492.07,"PO-34243":6574.0,"PO-34273":175541.27,"PO-34279":34208.0,"PO-34284":9621.0,"PO-34317":32070.0,"PO-34318":357675.78,"PO-34319":132144.0,"PO-34425":10690.0,"PO-34426":236460.0,"PO-34469":34208.0,"PO-34495":10690.0,"PO-34497":57726.0,"PO-34508":32070.0,"PO-34579":77349.0,"PO-34596":147522.0,"PO-34611":240525.0,"PO-34663":125945.67,"PO-34680":104328.0,"PO-34765":42243.0,"PO-34769":53450.0,"PO-34775":60950.0,"PO-34781":87860.0,"PO-34786":7314.0,"PO-34866":152867.0,"PO-34931":53450.0,"PO-34954":102808.0,"PO-34969":19472.5,"PO-34979":109710.0,"PO-34986":36570.0,"PO-34993":51864.0,"PO-35055":64140.0,"PO-35056":103477.8,"PO-35067":107327.6,"PO-35071":163557.0,"PO-35079":30092.0,"PO-35123":33174.0,"PO-35125":28162.0,"PO-35140":46611.5,"PO-35337":45378.0,"PO-35338":58637.22,"PO-35343":413723.0,"PO-35406":113309.72,"PO-35410":56122.5,"PO-35422":40227.0,"PO-35463":110877.5,"PO-35492":51198.0,"PO-35517":286165.0,"PO-35648":331390.0,"PO-35667":84388.24,"PO-35753":191136.5,"PO-35817":44898.0,"PO-35920":17104.0,"PO-35987":96210.0,"PO-36028":32070.0,"PO-36032":73876.0,"PO-36043":113954.0,"PO-36047":34208.0,"PO-36063":32230.0,"PO-36083":100364.33,"PO-36193":92644.0};

const PO_BUDGET_KEY = 'fisheye_po_budgets_v1';
function loadPOBudgets() {
  // Start with PDF budgets; Supabase overrides loaded async in component
  try {
    const manual = JSON.parse(localStorage.getItem(PO_BUDGET_KEY) || '{}');
    return { ...PO_PDF_BUDGETS, ...manual };
  } catch { return { ...PO_PDF_BUDGETS }; }
}

// Same normalization as invoiceManager.jsx — module-level so it's always defined
const normPO = po => String(po || '').replace(/\s+/g, '').toUpperCase().replace(/_\d+$/, '');

function POReconciliationTab({ employees, initialFilter = "" }) {
  const [invoices, setInvoices]   = useState([]);
  const [budgets,  setBudgets]    = useState(() => loadPOBudgets());
  const [editing,  setEditing]    = useState({}); // po → draft string
  const [poFilter, setPOFilter]   = useState(initialFilter);
  const M = "#A02843";

  // Update filter when initialFilter changes (from global search)
  useEffect(() => { if (initialFilter) setPOFilter(initialFilter); }, [initialFilter]);

  // Load invoices + PO budget overrides from Supabase
  useEffect(() => {
    // Load invoices
    supabase.from('fisheye_invoices').select('*').then(({ data }) => {
      if (data && data.length) setInvoices(data);
      else {
        try { setInvoices(JSON.parse(localStorage.getItem('fisheye_invoices_v1') || '[]')); }
        catch { setInvoices([]); }
      }
    });
    // Load manual PO budget overrides from Supabase
    supabase.from('fisheye_app_data').select('data').eq('key', PO_BUDGET_KEY).single()
      .then(({ data }) => {
        if (data?.data && typeof data.data === 'object') {
          // Merge: PDF defaults < localStorage < Supabase
          setBudgets(prev => ({ ...PO_PDF_BUDGETS, ...prev, ...data.data }));
          // Also cache locally for offline use
          localStorage.setItem(PO_BUDGET_KEY, JSON.stringify(data.data));
        }
      });
  }, []);

  // Build PO map: normPO → { po, employees[], invoices[], invoiced, paid, pending }
  const poMap = useMemo(() => {
    const map = new Map();

    // Index ALL employees (including expired/resigned) so historical POs show names
    employees.filter(e => e.poNumbers && String(e.poNumbers).trim()).forEach(e => {
      String(e.poNumbers).split(/[,;\n]/).map(p => normPO(p)).filter(Boolean).forEach(po => {
        if (!map.has(po)) map.set(po, { po, emps: [], invoices: [] });
        // avoid duplicates
        if (!map.get(po).emps.find(x => x._id === e._id)) map.get(po).emps.push(e);
      });
    });

    // Index invoices by PO
    invoices.forEach(inv => {
      const po = normPO(inv.poNumber);
      if (!po) return;
      if (!map.has(po)) map.set(po, { po, emps: [], invoices: [] });
      map.get(po).invoices.push(inv);
    });

    // Compute totals
    return Array.from(map.values()).map(row => {
      const isCreditNote = i => (i.status || '').toLowerCase().includes('credit');
      const realInvoices = row.invoices.filter(i => !isCreditNote(i));
      const invoiced = realInvoices.reduce((s, i) => s + Number(i.totalDue || 0), 0);
      const paid     = realInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.totalDue || 0), 0);
      const pending  = invoiced - paid;
      const budget   = Number(budgets[row.po] || 0);
      const remaining = budget ? budget - invoiced : null;
      const overBudget = budget && invoiced > budget + 0.05; // allow 5 halalas rounding tolerance
      return { ...row, invoiced, paid, pending, budget, remaining, overBudget };
    }).sort((a, b) => a.po.localeCompare(b.po));
  }, [invoices, employees, budgets]);

  const saveBudget = (po, val) => {
    const num = parseFloat(String(val).replace(/,/g, '')) || 0;
    // Get current manual overrides
    const stored = (() => { try { return JSON.parse(localStorage.getItem(PO_BUDGET_KEY) || '{}'); } catch { return {}; } })();
    const nextStored = { ...stored, [po]: num };
    // Save to localStorage (offline cache)
    localStorage.setItem(PO_BUDGET_KEY, JSON.stringify(nextStored));
    // Save to Supabase (sync across devices/Vercel)
    supabase.from('fisheye_app_data').upsert({ key: PO_BUDGET_KEY, data: nextStored }, { onConflict: 'key' })
      .then(() => {});
    setBudgets(prev => ({ ...prev, [po]: num }));
    setEditing(prev => { const n = { ...prev }; delete n[po]; return n; });
  };

  const fmtSAR = n => Number(n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportToExcel = async () => {
    let XLSX = window.XLSX;
    if (!XLSX) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = () => { XLSX = window.XLSX; resolve(); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const rows = poMap.map(r => ({
      'PO Number':       r.po,
      'Employees':       r.emps.map(e => e.name + (isExcluded(e) ? ' (ended)' : '')).join(', ') || '—',
      'Invoices':        r.invoices.filter(i => !(i.status||'').toLowerCase().includes('credit')).length,
      'Invoiced (SAR)':  r.invoiced,
      'Paid (SAR)':      r.paid,
      'Pending (SAR)':   r.pending,
      'Budget (SAR)':    r.budget || '',
      'Remaining (SAR)': r.remaining !== null ? r.remaining : '',
      'Status':          r.overBudget ? 'Over Budget' : r.remaining !== null && Math.abs(r.remaining) < 0.05 ? 'Fully Used' : r.remaining !== null ? 'Active' : 'No Budget',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths
    ws['!cols'] = [14,40,10,16,16,16,16,16,14].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PO Reconciliation');
    XLSX.writeFile(wb, `PO_Reconciliation_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const alerts = poMap.filter(r => r.overBudget).length;
  const noBudget = poMap.filter(r => r.invoices.length > 0 && !r.budget).length;

  const tdS = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };

  return (
    <div style={{ padding: 16 }}>
      {/* Summary Pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ background: '#fff5f5', border: `1px solid ${M}33`, borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
          <span style={{ color: '#6b7280' }}>POs </span>
          <strong style={{ color: M }}>{poMap.length}</strong>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
          <span style={{ color: '#6b7280' }}>Total Invoiced </span>
          <strong style={{ color: '#059669' }}>SAR {fmtSAR(poMap.reduce((s, r) => s + r.invoiced, 0))}</strong>
        </div>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
          <span style={{ color: '#6b7280' }}>Pending </span>
          <strong style={{ color: '#ea580c' }}>SAR {fmtSAR(poMap.reduce((s, r) => s + r.pending, 0))}</strong>
        </div>
        {alerts > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#dc2626' }}>⚠️ {alerts} PO{alerts > 1 ? 's' : ''} over budget</span>
          </div>
        )}
        {noBudget > 0 && (
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
            <span style={{ color: '#92400e' }}>💡 {noBudget} PO{noBudget > 1 ? 's' : ''} without budget set</span>
          </div>
        )}
        <button onClick={exportToExcel} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          ⬇️ Export Excel
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 10, position: 'relative' }}>
        <input
          value={poFilter}
          onChange={e => setPOFilter(e.target.value)}
          placeholder="🔍  ابحث عن PO رقم أو موظف..."
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
        />
        {poFilter && <button onClick={() => setPOFilter("")} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>✕</button>}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['PO Number', 'Employees', 'Invoices', 'Invoiced (SAR)', 'Paid (SAR)', 'Pending (SAR)', 'Budget (SAR)', 'Remaining (SAR)', ''].map(h => (
                <th key={h} style={{ ...tdS, fontWeight: 700, color: '#374151', textAlign: h === '' ? 'center' : 'left', position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, boxShadow: '0 1px 0 #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {poMap.filter(row => {
              if (!poFilter) return true;
              const q = poFilter.toLowerCase();
              return row.po.toLowerCase().includes(q) ||
                row.emps.some(e => (e.name || "").toLowerCase().includes(q)) ||
                row.invoices.some(i => (i.invoiceNumber || "").toLowerCase().includes(q));
            }).map(row => {
              const isOver = row.overBudget;
              const rowBg = isOver ? '#fff5f5' : '#fff';
              const isDraft = editing[row.po] !== undefined;
              return (
                <tr key={row.po} style={{ background: rowBg }}>
                  <td style={{ ...tdS, fontWeight: 700, color: isOver ? '#dc2626' : M, fontFamily: 'monospace' }}>
                    {isOver && <span style={{ marginRight: 4 }}>⚠️</span>}
                    {row.po}
                  </td>
                  <td style={{ ...tdS, color: '#374151' }}>
                    {row.emps.length > 0
                      ? row.emps.map(e => (
                          <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                            <span>{e.name}</span>
                            {isExcluded(e) && <span style={{ fontSize: 10, color: '#9ca3af', background: '#f3f4f6', padding: '1px 5px', borderRadius: 10 }}>ended</span>}
                          </div>
                        ))
                      : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ ...tdS, textAlign: 'center', color: '#374151' }}>
                    {row.invoices.length > 0
                      ? <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{row.invoices.length}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: 'monospace', color: '#374151' }}>
                    {row.invoices.length ? fmtSAR(row.invoiced) : '—'}
                  </td>
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>
                    {row.paid ? fmtSAR(row.paid) : '—'}
                  </td>
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: 'monospace', color: row.pending > 0 ? '#ea580c' : '#9ca3af' }}>
                    {row.pending > 0 ? fmtSAR(row.pending) : '—'}
                  </td>
                  {/* Budget cell — editable */}
                  <td style={{ ...tdS, textAlign: 'right' }}>
                    {isDraft ? (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <input
                          autoFocus
                          value={editing[row.po]}
                          onChange={e => setEditing(prev => ({ ...prev, [row.po]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') saveBudget(row.po, editing[row.po]); if (e.key === 'Escape') setEditing(prev => { const n={...prev}; delete n[row.po]; return n; }); }}
                          style={{ width: 100, padding: '3px 6px', border: '1px solid #7c3aed', borderRadius: 4, fontSize: 12, textAlign: 'right', fontFamily: 'monospace' }}
                        />
                        <button onClick={() => saveBudget(row.po, editing[row.po])} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>✓</button>
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'monospace', color: row.budget ? '#374151' : '#9ca3af' }}>
                        {row.budget ? fmtSAR(row.budget) : '—'}
                      </span>
                    )}
                  </td>
                  {/* Remaining */}
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                    color: isOver ? '#dc2626' : row.remaining !== null ? (row.remaining < row.invoiced * 0.2 ? '#f59e0b' : '#059669') : '#9ca3af' }}>
                    {row.remaining !== null
                      ? isOver
                        ? `−${fmtSAR(Math.abs(row.remaining))}`
                        : Math.abs(row.remaining) < 0.05
                          ? <span style={{ color: '#059669' }}>✓ Fully Used</span>
                          : fmtSAR(row.remaining)
                      : '—'}
                  </td>
                  {/* Edit budget btn */}
                  <td style={{ ...tdS, textAlign: 'center' }}>
                    <button
                      onClick={() => setEditing(prev => ({ ...prev, [row.po]: row.budget || '' }))}
                      style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11, color: '#6b7280' }}
                      title="Set PO budget"
                    >✏️</button>
                  </td>
                </tr>
              );
            })}
            {poMap.length === 0 && (
              <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', color: '#9ca3af', padding: 32 }}>No PO data found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — FinanceModule
// ═══════════════════════════════════════════════════════════════════════════════
export function FinanceModule({ employees = [], setEmployees = () => {}, operationalIssues = [], pendingOpenPO, onPendingPOHandled, onNav }) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("fisheye_finance_tab") || "payroll"
  );
  // ── Shared flows state — single source of truth for attentionItems + PayrollFlowTracker ──
  const [flows, setFlows] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fisheye_payroll_flow_v1')) || {}; }
    catch { return {}; }
  });

  // ── Invoices state — loaded from Supabase for attentionItems overdue check ──
  const [invoicesForAttention, setInvoicesForAttention] = useState([]);
  useEffect(() => {
    supabase.from('fisheye_invoices').select('*').then(({ data }) => {
      if (data && data.length > 0) setInvoicesForAttention(data);
      else {
        try { setInvoicesForAttention(JSON.parse(localStorage.getItem('fisheye_invoices_v1') || '[]')); }
        catch {}
      }
    });
  }, []);

  // Load from Supabase on mount (merge: local wins), then update state so attentionItems re-renders
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('fisheye_app_data')
          .select('key, data')
          .eq('key', 'fisheye_payroll_flow_v1')
          .single();
        if (error || !data?.data) return;
        const local = (() => {
          try { return JSON.parse(localStorage.getItem('fisheye_payroll_flow_v1')) || {}; }
          catch { return {}; }
        })();
        const merged = { ...data.data, ...local }; // local wins
        localStorage.setItem('fisheye_payroll_flow_v1', JSON.stringify(merged));
        setFlows(merged);
      } catch {}
    })();
  }, []);

  const saveFlows = f => {
    setFlows(f);
    try { localStorage.setItem('fisheye_payroll_flow_v1', JSON.stringify(f)); } catch {}
    supabase.from('fisheye_app_data')
      .upsert({ key: 'fisheye_payroll_flow_v1', data: f }, { onConflict: 'key' })
      .then(() => {});
  };

  const [poSearchFilter, setPOSearchFilter] = useState("");

  // Jump to PO Reconciliation tab from global search
  useEffect(() => {
    if (!pendingOpenPO) return;
    setActiveTab("po_recon");
    localStorage.setItem("fisheye_finance_tab", "po_recon");
    setPOSearchFilter(pendingOpenPO);
    onPendingPOHandled?.();
  }, [pendingOpenPO]);

  const active = employees.filter(e => !isExcluded(e));
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthLabel   = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const headerStats = useMemo(() => {
    const { active: activeThisMonth, joiners, leavers } = classifyMovements(active, currentYear, currentMonth);

    // Billable = all clients EXCEPT Sela without PO (Sela without PO can't be invoiced)
    const billable = active.filter(emp => {
      const isSela = (emp.client || '').toLowerCase() === 'sela';
      const hasPO  = emp.poNumbers && String(emp.poNumbers).trim() !== '';
      return !isSela || hasPO;
    });

    let totalPayroll = 0, totalMargin = 0, totalVat = 0, proratedPayroll = 0;

    // Full payroll = ALL active (what Fisheye owes regardless of billing)
    active.forEach(emp => { totalPayroll += Number(emp.totalPackage || 0); });

    // Margin + VAT = billable only (what we can actually invoice)
    billable.forEach(emp => {
      const line  = calcLine(emp);
      totalMargin += line.margin;
      totalVat    += line.vat;
    });

    // Prorated = deduplicated union of active + joiners + leavers
    // (joiner+leaver same month appears in all 3 arrays — deduplicate by _id to avoid triple-count)
    const seenIds = new Set();
    [...activeThisMonth, ...joiners, ...leavers].forEach(emp => {
      if (seenIds.has(emp._id)) return;
      seenIds.add(emp._id);
      proratedPayroll += emp._pro?.proratedPkg ?? Number(emp.totalPackage || 0);
    });

    return {
      totalPayroll, proratedPayroll, totalMargin, totalVat,
      headcount: active.length,
      billableCount: billable.length,
      activeThisMonth: activeThisMonth.length,
    };
  }, [active]);



  // ── Needs Attention items ──────────────────────────────────────────────────
  const attentionItems = useMemo(() => {
    const items = [];
    const allFlows = flows; // use state (not localStorage) so it re-renders after Supabase load
    // Stable key: name-based (same as PayrollFlowTracker)
    const stableKey = (e) => (e.name || '').trim().toLowerCase().replace(/\s+/g, '_') || String(e._id);

    // 1. Salary paid but no invoice sent — last 3 months
    for (let m = 0; m < 3; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const monthName = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const missing = active.filter(e => {
        const f = allFlows[`${mk}_${stableKey(e)}`] || {};
        const hasPO = e.poNumbers && String(e.poNumbers).trim() !== '';
        return f.timesheet && f.salary && !f.invoice && hasPO;  // timesheet must be confirmed before salary counts as "paid"
      });
      if (missing.length > 0) {
        items.push({
          type: 'sal_no_inv',
          tab: 'partner_flow',
          color: '#7c3aed',
          bg: '#faf5ff',
          border: '#ddd6fe',
          icon: '💰→📄',
          label: `راتب بدون فاتورة — ${monthName}`,
          employees: missing,
          count: missing.length,
        });
      }
    }

    // 2. Missing salary in payroll window (day 25 → day 5)
    const day = now.getDate();
    if (day >= 25 || day <= 5) {
      const salaryMonthDate = day <= 5
        ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
        : now;
      const mk = `${salaryMonthDate.getFullYear()}-${String(salaryMonthDate.getMonth()+1).padStart(2,'0')}`;
      const { year: fYear, month: fMonth } = { year: salaryMonthDate.getFullYear(), month: salaryMonthDate.getMonth() + 1 };
      const mStart = new Date(fYear, fMonth - 1, 1);
      const mEnd   = new Date(fYear, fMonth - 1, 30);
      const monthName = salaryMonthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      // Only employees who were actually eligible for salary in this specific month
      const eligibleForMonth = active.filter(e => {
        const st = (e.status || '').toLowerCase();
        if (['resigned', 'resigned_ar', 'مستقيل'].includes(st)) return false;
        // Expired: include only if contract ended within this month (leaver)
        if (['expired', 'expired_ar', 'منتهي'].includes(st)) {
          const end = parseDate(e.endDate);
          if (!end || end < mStart) return false;
        }
        // Sela without PO → not eligible
        const isSela = (e.client || '').toLowerCase() === 'sela';
        const hasPO  = e.poNumbers && String(e.poNumbers).trim() !== '';
        if (isSela && !hasPO) return false;
        // Hasn't started yet
        const start = parseDate(e.startDate);
        if (start && start > mEnd) return false;
        // Contract ended before this month
        const end2 = parseDate(e.endDate);
        if (end2 && end2 < mStart) return false;
        return true;
      });
      const missingSal = eligibleForMonth.filter(e => !(allFlows[`${mk}_${stableKey(e)}`] || {}).salary);
      if (missingSal.length > 0) {
        items.push({
          type: 'missing_salary',
          tab: 'partner_flow',
          color: '#dc2626',
          bg: '#fef2f2',
          border: '#fecaca',
          icon: '💸',
          label: `راتب ناقص — ${monthName}`,
          employees: missingSal,
          count: missingSal.length,
        });
      }
    }

    // 3. Overdue invoices >30 days — uses Supabase-loaded state (not stale localStorage)
    const overdue = invoicesForAttention.filter(inv => {
      const st = (inv.status || '').toLowerCase();
      if (['paid','cancelled','credit note','credit_note'].includes(st)) return false;
      const d = new Date(inv.invoiceDate);
      return !isNaN(d) && (now - d) / 86400000 > 30;
    });
    if (overdue.length > 0) {
      items.push({
        type: 'overdue_inv',
        tab: 'invoices',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        icon: '⏰',
        label: `فواتير unpaid +30 يوم`,
        invoices: overdue,
        count: overdue.length,
      });
    }

    // 4. Negative net profit employees (partner payout > gross margin)
    const negProfit = active.filter(e => calcNetProfit(e) < 0);
    if (negProfit.length > 0) {
      items.push({
        type: 'neg_profit',
        tab: 'profit',
        color: '#dc2626',
        bg: '#fff1f2',
        border: '#fecdd3',
        icon: '🔴',
        label: `ربح سالب — ${negProfit.length} موظف (partner cost > margin)`,
        employees: negProfit,
        count: negProfit.length,
      });
    }

    return items;
  }, [active, flows, now, invoicesForAttention]);

  const [attOpen, setAttOpen] = useState(false);

  const TABS = [
    { k: "payroll",      l: "Payroll",             emoji: "💰", color: "#7c3aed" },
    { k: "partner_flow", l: "Payroll Flow",         emoji: "💸", color: "#0ea5e9" },
    { k: "invoices",     l: "Invoices",             emoji: "📄", color: "#ea580c" },
    { k: "po_recon",     l: "PO Reconciliation",    emoji: "🔗", color: "#0369a1" },
    { k: "profit",       l: "Profit per Client",    emoji: "📊", color: "#059669" },
    { k: "settlement",   l: "Settlements",          emoji: "🤝", color: "#16a34a" },
    { k: "forecast",     l: "Forecast",             emoji: "🔮", color: "#7c3aed" },
  ];

  const kpis = [
    { label: "Headcount",         value: String(headerStats.headcount),         sub: `${headerStats.billableCount} billable`,          color: M,         accent: M,         bg: "#fff5f5", border: `${M}22`  },
    { label: "Prorated Payroll",  value: fmtSAR(headerStats.proratedPayroll),   sub: `${monthLabel} · incl. joiners & leavers`,        color: "#059669", accent: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Full Payroll",      value: fmtSAR(headerStats.totalPayroll),      sub: "all active employees",                           color: "#374151", accent: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
    { label: "Billable Margin",   value: fmtSAR(headerStats.totalMargin),       sub: "billable employees only · excl. Sela no-PO",     color: "#0369a1", accent: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
    { label: "Est. VAT (15%)",    value: fmtSAR(headerStats.totalVat),          sub: "on billable margin",                             color: "#b45309", accent: "#b45309", bg: "#fffbeb", border: "#fed7aa" },
  ];

  return (
    <div className="fe-page" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: M, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={15} style={{ color: "white" }} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0, fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
              Finance
            </h1>
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, fontFamily: "var(--font-sans)", background: "#f3f4f6", padding: "2px 8px", borderRadius: 6 }}>{monthLabel}</span>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 12, margin: 0, fontFamily: "var(--font-sans)" }}>
            Payroll · Billing · Settlements
          </p>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
        {kpis.map(k => (
          <div key={k.label} className="fe-stat-card" style={{
            padding: "13px 15px",
            borderRadius: 10,
            backgroundColor: k.bg,
            border: `1px solid ${k.border}`,
            borderLeft: `4px solid ${k.accent}`,
          }}>
            <p className="fe-label" style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</p>
            <p className="fe-kpi-value" style={{ color: k.color, margin: 0, fontSize: 16, fontWeight: 900, lineHeight: 1.1 }}>{k.value}</p>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#9ca3af", fontFamily: "var(--font-sans)" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Needs Attention Strip ── */}
      {attentionItems.length > 0 && (
        <div style={{ marginBottom: 12, borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {/* Header — collapsed by default */}
          <button
            onClick={() => setAttOpen(p => !p)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#fafafa", border: "none", borderBottom: attOpen ? "1px solid #e5e7eb" : "none", cursor: "pointer" }}
          >
            <AlertTriangle size={12} style={{ color: "#d97706", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 11, color: "#1f2937", flex: 1, textAlign: "left" }}>
              يحتاج اهتمام — {attentionItems.reduce((s, i) => s + i.count, 0)} بند
            </span>
            {/* Mini summary badges when collapsed */}
            {!attOpen && attentionItems.map((item, idx) => (
              <span key={idx} style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999, backgroundColor: item.color, color: "white" }}>
                {item.icon} {item.count}
              </span>
            ))}
            <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>{attOpen ? "▲" : "▼"}</span>
          </button>

          {/* Expanded: one compact line per item */}
          {attOpen && attentionItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => { setActiveTab(item.tab); localStorage.setItem("fisheye_finance_tab", item.tab); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", cursor: "pointer", backgroundColor: item.bg, borderLeft: `3px solid ${item.color}`, borderBottom: idx < attentionItems.length - 1 ? "1px solid #f3f4f6" : "none", flexWrap: "wrap" }}
            >
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: item.color, whiteSpace: "nowrap" }}>{item.label}</span>
              <span style={{ fontSize: 10, fontWeight: 900, padding: "1px 7px", borderRadius: 999, backgroundColor: item.color, color: "white", whiteSpace: "nowrap" }}>{item.count}</span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                {(item.employees || []).slice(0, 5).map(e => (
                  <span key={e._id} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, backgroundColor: `${item.color}15`, color: item.color, fontWeight: 600 }}>
                    {e.name}
                  </span>
                ))}
                {(item.invoices || []).slice(0, 5).map(inv => (
                  <span key={inv.invoiceNumber} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, backgroundColor: `${item.color}15`, color: item.color, fontWeight: 600 }}>
                    {inv.invoiceNumber} — SAR {Number(inv.totalDue || inv.amountPreVat || 0).toLocaleString()}
                  </span>
                ))}
                {((item.employees?.length || 0) + (item.invoices?.length || 0)) > 5 && (
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>+{((item.employees?.length || 0) + (item.invoices?.length || 0)) - 5} أكثر</span>
                )}
              </span>
              <span style={{ fontSize: 10, color: item.color, fontWeight: 600, whiteSpace: "nowrap" }}>← tab</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div style={{ display: "flex", gap: 1, marginBottom: 20, borderBottom: "1px solid #e5e7eb", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => { setActiveTab(t.k); localStorage.setItem("fisheye_finance_tab", t.k); }}
            className="fe-tab"
            style={{
              borderBottom: `3px solid ${activeTab === t.k ? t.color : "transparent"}`,
              color: activeTab === t.k ? t.color : "#6b7280",
              fontWeight: activeTab === t.k ? 800 : 500,
              fontSize: 12,
              padding: "10px 16px",
              marginBottom: -1,
              backgroundColor: activeTab === t.k ? `${t.color}0d` : "transparent",
              borderRadius: "6px 6px 0 0",
              transition: "all 0.15s",
            }}>
            <span style={{ fontSize: 13 }}>{t.emoji}</span>{t.l}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "payroll"      && <PayrollTab          employees={employees} setEmployees={setEmployees} flows={flows} onSaveFlows={saveFlows} />}
      {activeTab === "partner_flow" && <PayrollFlowTracker  employees={employees} sharedFlows={flows} onSaveFlows={saveFlows} />}
      {activeTab === "invoices"     && <InvoiceManager employees={employees} setEmployees={setEmployees} />}
      {activeTab === "po_recon"     && <POReconciliationTab  employees={employees} initialFilter={poSearchFilter} />}
      {activeTab === "profit"       && <ProfitPerClientTab   employees={employees} />}
      {activeTab === "settlement"   && <PartnerSettlementReport employees={employees}/>}
      {activeTab === "forecast"     && <ForecastTab employees={employees} />}
    </div>
  );
}

export default FinanceModule;