import React, { useState, useMemo } from "react";
import PartnerSettlementReport from './Partnersettlementreport';
import { InvoiceManager } from './modules/invoiceManager';
import {
  DollarSign, Search, Users, AlertTriangle,
  TrendingUp, FileText, Layers, Download, CheckCircle, Plus, Trash2, Save, Check
} from "lucide-react";
import { isExcluded } from "./utils/helpers";
import { supabase } from "./utils/supabase";

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────
const M   = "#800000";
const MD  = "#5c0000";

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
 
  const start = emp.startDate ? new Date(emp.startDate) : null;
  const end   = emp.endDate   ? new Date(emp.endDate)   : null;
 
  const startsThisMonth = start && start.getFullYear() === year && start.getMonth() === month - 1;
  const endsThisMonth   = end   && end.getFullYear()   === year && end.getMonth()   === month - 1;
 
  let workedDays = DAYS;
  let isJoiner   = false;
  let isLeaver   = false;
 
  if (startsThisMonth && endsThisMonth) {
    // Joined and left same month
    workedDays = Math.max(1, end.getDate() - start.getDate() + 1);
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
  const start = emp.startDate ? new Date(emp.startDate) : null;
  if (!start) return { months: 0, totalDays: 0, accumulated: 0, breakdown: [] };

  // End = endDate if expired and before monthEnd, otherwise end of selected month
  const empEnd = emp.endDate ? new Date(emp.endDate) : null;
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
function PayrollTab({ employees }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [search, setSearch]             = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [viewMode, setViewMode]         = useState("all"); // "all" | "joiners" | "leavers"
  const [filterPO, setFilterPO]         = useState("all"); // "all" | "has_po" | "no_po"
  const [expandedCard, setExpandedCard] = useState(null);  // null | "joiners" | "leavers" | "newpos"
 
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
      if (status === "expired") {
        if (isSela && !hasPO) return true; // Sela expired بدون PO → للـ No-PO view
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
      // PO received this month → always include (accumulated salary due, regardless of endDate)
      if (e.poAddedDate) {
        const d = parseDate(e.poAddedDate);
        if (d && d.getFullYear() === year && d.getMonth() + 1 === month) return true;
      }
      // Expired: include only if contract ends within this month (leaver)
      if (['expired', 'expired_ar', 'منتهي'].includes(st)) {
        const end = parseDate(e.endDate);
        if (!end || end < monthStart) return false;
      }
      const isSela = (e.client || '').toLowerCase() === 'sela';
      const hasPO  = e.poNumbers && String(e.poNumbers).trim() !== '';
      if (isSela && !hasPO) return false;
      const start = parseDate(e.startDate);
      if (start && start > monthEnd) return false;
      const end2 = parseDate(e.endDate);
      if (end2 && end2 < monthStart) return false;
      return true;
    });
  }, [employees, year, month]);

  const { active: _active, joiners, leavers } = useMemo(
    () => classifyMovements(eligibleForPayroll, year, month),
    [eligibleForPayroll, year, month]
  );

  // Employees eligible but dropped by classifyMovements (endDate < monthStart, but PO arrived this month)
  const expiredNewPO = useMemo(() => {
    const activeIds = new Set(_active.map(e => e._id));
    return eligibleForPayroll
      .filter(e => {
        if (activeIds.has(e._id)) return false;
        // Must have PO added this month — these are the only valid "fallen-through" cases
        if (!e.poAddedDate) return false;
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
    if (filterPO === "no_po") {
      return allSelaNoP
        .filter(e => (e.name||"").toLowerCase().includes(search.toLowerCase()))
        .map(e => ({ ...e, _pro: e._pro || calcProration(e, year, month) }))
        .sort((a, b) => (b._accumulated?.accumulated || 0) - (a._accumulated?.accumulated || 0));
    }
    return displayPool.filter(e => {
      const matchClient = filterClient === "all" || (e.client||"").toLowerCase() === filterClient.toLowerCase();
      const matchSearch = (e.name||"").toLowerCase().includes(search.toLowerCase());
      const hasPO = e.poNumbers && String(e.poNumbers).trim() !== "";
      const isSela = (e.client||"").toLowerCase() === "sela";
      const matchPO = filterPO === "all" || !isSela ? true : hasPO;
      return matchClient && matchSearch && matchPO;
    });
  }, [displayPool, allSelaNoP, filterClient, search, filterPO, year, month]);
 
  const totals = useMemo(() => ({
    headcount:     rows.length,
    payroll:       rows.reduce((s, e) => s + e._pro.proratedPkg,    0),
    basic:         rows.reduce((s, e) => s + e._pro.proratedBasic,  0),
    hra:           rows.reduce((s, e) => s + e._pro.proratedHRA,    0),
    tpt:           rows.reduce((s, e) => s + e._pro.proratedTPT,    0),
    fullPayroll:   rows.reduce((s, e) => s + Number(e.totalPackage||0), 0),
    proratedDiff:  rows.reduce((s, e) => s + Number(e.totalPackage||0) - e._pro.proratedPkg, 0),
    gosiTotal:     rows.reduce((s, e) => s + (e._pro.gosiDeduction || 0), 0),
    netTotal:      rows.reduce((s, e) => s + (e._pro.netProrated   || e._pro.proratedPkg), 0),
  }), [rows]);

  // ── Month-over-Month comparison ──────────────────────────────────────────
  const mom = useMemo(() => {
    const prevDate  = new Date(year, month - 2, 1); // الشهر السابق
    const prevYear  = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    const { active: prevActive } = classifyMovements(allEmployees, prevYear, prevMonth);
    const prevPayroll   = prevActive.reduce((s, e) => s + e._pro.proratedPkg, 0);
    const prevHeadcount = prevActive.length;
    const payrollDiff   = totals.payroll - prevPayroll;
    const headcountDiff = totals.headcount - prevHeadcount;
    return { prevPayroll, prevHeadcount, payrollDiff, headcountDiff };
  }, [allEmployees, year, month, totals.payroll, totals.headcount]);

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
                <th style={{ ...th, borderLeft: `4px solid ${M}` }}>Employee</th>
                <th style={th}>Client</th>
                {filterPO === "no_po" ? (<>
                  <th style={{ ...th, textAlign: "right" }}>Package / Month</th>
                  <th style={{ ...th, textAlign: "center" }}>Start Date</th>
                  <th style={{ ...th, textAlign: "center" }}>Months Worked</th>
                  <th style={{ ...th, textAlign: "right", color: "#c2410c" }}>Accumulated ⚠</th>
                </>) : (<>
                  <th style={{ ...th, textAlign: "center", width: 80 }}>Days</th>
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
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No employees found</td></tr>
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
                  <tr key={emp._id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: rowBg }}>
                    <td style={{ ...td, borderLeft: `4px solid ${accentColor}` }}>
                      <div style={{ fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        {emp.name}
                        {isJ   && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#dcfce7", color: "#16a34a", padding: "1px 5px", borderRadius: 999 }}>JOIN</span>}
                        {isL   && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#fef2f2", color: "#dc2626", padding: "1px 5px", borderRadius: 999 }}>LEAVE</span>}
                        {isB   && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#f3f4f6", color: "#6b7280",  padding: "1px 5px", borderRadius: 999 }}>J+L</span>}
                        {isExp && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#fef2f2", color: "#991b1b",  padding: "1px 5px", borderRadius: 999 }}>EXPIRED</span>}
                        {isSela && !hasPO && filterPO !== "no_po" && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: "#fff7ed", color: "#c2410c", padding: "1px 5px", borderRadius: 999 }}>NO PO</span>}
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
                    <td style={{ ...td, fontWeight: 700, color: "#6b7280", fontSize: 12 }} colSpan={4}>{rows.length} employees without PO</td>
                    <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#d97706", fontSize: 12 }}>
                      {rows.reduce((s,e) => s+(e._accumulated?.months||0), 0)} months total
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#c2410c", fontFamily: "monospace", fontSize: 13 }}>
                      SR {fmtPro(rows.reduce((s,e) => s+(e._accumulated?.accumulated||0), 0))}
                    </td>
                  </>) : (<>
                    <td style={{ ...td, fontWeight: 700, color: "#6b7280", fontSize: 12 }} colSpan={3}>{totals.headcount} employees</td>
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
  const active = useMemo(() => employees.filter(e => !isExcluded(e)), [employees]);

  const CLIENT_COLORS = {
    "Sela":               { accent: "#800000", light: "#fff5f5" },
    "SPL":                { accent: "#7c3aed", light: "#f5f3ff" },
    "Channelplay":        { accent: "#2563eb", light: "#eff6ff" },
    "Riva Engineering 2": { accent: "#c2410c", light: "#fff7ed" },
    "Combuzz HR":         { accent: "#d97706", light: "#fffbeb" },
  };

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
              const col = CLIENT_COLORS[r.client] || { accent: M, light: "#fff5f5" };
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
                const col = CLIENT_COLORS[r.client] || { accent: M, light: "#fff5f5" };
                const isExp = expandedClient === r.client;
                return (
                  <>
                    <tr key={r.client}
                      onClick={() => setExpandedClient(isExp ? null : r.client)}
                      style={{ borderBottom: isExp ? "none" : "1px solid #f3f4f6", cursor: "pointer", backgroundColor: isExp ? col.light : i % 2 === 0 ? "white" : "#fafafa", transition: "background 0.15s" }}>
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
                      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: marginColor(r.netPct) }}>{f(r.netProfit)}</td>
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
                                {r.emps.slice(0, 8).map(e => {
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
                                      <td style={{ fontSize: 11, fontFamily: "monospace", textAlign: "right", padding: "5px 8px", color: "#059669", fontWeight: 700 }}>{f(net)}</td>
                                      <td style={{ fontSize: 10, padding: "5px 8px" }}>
                                        {hasPO
                                          ? <span style={{ backgroundColor: "#f0fdf4", color: "#059669", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{String(e.poNumbers).trim()}</span>
                                          : <span style={{ backgroundColor: "#fff7ed", color: "#c2410c", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>No PO</span>}
                                      </td>
                                    </tr>
                                  );
                                })}
                                {r.emps.length > 8 && (
                                  <tr><td colSpan={6} style={{ fontSize: 10, color: "#9ca3af", padding: "4px 8px", textAlign: "center" }}>+{r.emps.length - 8} more employees</td></tr>
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

function PayrollFlowTracker({ employees }) {
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

  // ── Load flows: Supabase أولاً، localStorage كـ fallback ────────────────
  const [flows, setFlows] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fisheye_payroll_flow_v1')) || {}; } catch { return {}; }
  });

  // Load from Supabase on mount
  React.useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('payroll_flows').select('*');
        if (error || !data) return;
        const merged = {};
        data.forEach(row => { merged[row.flow_key] = row.flow_data; });
        setFlows(prev => ({ ...prev, ...merged }));
        localStorage.setItem('fisheye_payroll_flow_v1', JSON.stringify({ ...flows, ...merged }));
      } catch {}
    })();
  }, []);

  const saveFlows = async f => {
    setFlows(f);
    try { localStorage.setItem('fisheye_payroll_flow_v1', JSON.stringify(f)); } catch {}
  };

  // Persist a single flow key to Supabase
  const persistFlow = async (key, data) => {
    try {
      await supabase.from('payroll_flows').upsert(
        { flow_key: key, flow_data: data, updated_at: new Date().toISOString() },
        { onConflict: 'flow_key' }
      );
    } catch {}
  };

  const getFlow  = empId => flows[`${selectedMonth}_${empId}`] || {};
  const allDone  = e => PAYROLL_STEPS.every(s => getFlow(e._id)[s.k]);

  const toggle = async (empId, step) => {
    const key = `${selectedMonth}_${empId}`;
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
      const key = `${selectedMonth}_${e._id}`;
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
      const key = `${selectedMonth}_${e._id}`;
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

    // Resigned → never
    const st2 = (e.status || '').toLowerCase();
    if (['resigned', 'resigned_ar', 'مستقيل'].includes(st2)) return false;

    // Expired: include only if contract ends within this month (leaver)
    if (['expired', 'expired_ar', 'منتهي'].includes(st2)) {
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
    done: filteredByClient.filter(e => getFlow(e._id)[st.k]).length,
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
          const allStepDone = displayedEmps.length > 0 && displayedEmps.every(e => getFlow(e._id)[st.k]);
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
        <button onClick={() => { if (window.confirm(`Mark ALL steps done for ${displayedEmps.length} employee(s)?`)) bulkMarkAll(displayedEmps, true); }}
          style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #16a34a', backgroundColor: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={10} /> All Done
        </button>
        <button onClick={() => { if (window.confirm(`Reset all steps for ${selectedClient}?`)) bulkMarkAll(displayedEmps, false); }}
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
                  const doneCount = PAYROLL_STEPS.filter(st => getFlow(e._id)[st.k]).length;
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
                          <button title={st.desc} onClick={() => toggle(e._id, st.k)}
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              border: `2px solid ${getFlow(e._id)[st.k] ? st.color : '#e5e7eb'}`,
                              backgroundColor: getFlow(e._id)[st.k] ? st.color : 'white',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto', transition: 'all 0.15s',
                            }}>
                            {getFlow(e._id)[st.k]
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
// ─── PartnerFlowTab — wrapper so the render call matches ─────────────────────
function PartnerFlowTab({ employees }) {
  return <PayrollFlowTracker employees={employees} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — FinanceModule
// ═══════════════════════════════════════════════════════════════════════════════
export function FinanceModule({ employees = [], setEmployees = () => {}, operationalIssues = [] }) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("fisheye_finance_tab") || "payroll"
  );
  const [flows, setFlows] = useState([]);

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

    // Prorated = active full-month + joiners + leavers (all movements this month)
    [...activeThisMonth, ...joiners, ...leavers].forEach(emp => {
      proratedPayroll += emp._pro?.proratedPkg ?? Number(emp.totalPackage || 0);
    });

    return {
      totalPayroll, proratedPayroll, totalMargin, totalVat,
      headcount: active.length,
      billableCount: billable.length,
      activeThisMonth: activeThisMonth.length,
    };
  }, [active]);

  const overdueCount    = operationalIssues.filter(i => i.type === "invoice_overdue").length;
  const payrollGapCount = operationalIssues.filter(i => i.type === "payroll_gap").length;

  const TABS = [
    { k: "payroll",      l: "Payroll",             emoji: "💰", color: "#7c3aed" },
    { k: "partner_flow", l: "Payroll Flow",         emoji: "💸", color: "#0ea5e9" },
    { k: "invoices",     l: "Invoices",             emoji: "📄", color: "#ea580c" },
    { k: "profit",       l: "Profit per Client",    emoji: "📊", color: "#059669" },
    { k: "settlement",   l: "Settlements",          emoji: "🤝", color: "#16a34a" },
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

      {/* ── Alert Banner ── */}
      {(overdueCount > 0 || payrollGapCount > 0) && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 10,
          backgroundColor: "#fff7ed", border: "1px solid #fed7aa",
          borderLeft: "4px solid #f97316",
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        }}>
          <AlertTriangle size={14} style={{ color: "#c2410c", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}>Operational Issues</span>
          {overdueCount > 0 && <span style={{ fontSize: 11, color: "#9a3412", padding: "2px 8px", borderRadius: 999, backgroundColor: "#ffedd5", fontWeight: 700 }}>{overdueCount} overdue invoice{overdueCount > 1 ? "s" : ""}</span>}
          {payrollGapCount > 0 && <span style={{ fontSize: 11, color: "#9a3412", padding: "2px 8px", borderRadius: 999, backgroundColor: "#ffedd5", fontWeight: 700 }}>{payrollGapCount} payroll gap{payrollGapCount > 1 ? "s" : ""}</span>}
          <span style={{ fontSize: 11, color: "#b45309", marginLeft: "auto" }}>→ See Action Center</span>
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
      {activeTab === "payroll"      && <PayrollTab          employees={employees} />}
      {activeTab === "partner_flow" && <PartnerFlowTab       employees={employees} />}
      {activeTab === "invoices"     && <InvoiceManager employees={employees} setEmployees={setEmployees} />}
      {activeTab === "profit"       && <ProfitPerClientTab   employees={employees} />}
      {activeTab === "settlement"   && <PartnerSettlementReport employees={employees}/>}
    </div>
  );
}

export default FinanceModule;