// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 useOperationalIssues — Central Operational Brain
// Sprint 1: Single source of truth for ALL operational issues
//
// الاستخدام:
//   import { useOperationalIssues } from './useOperationalIssues';
//   const issues = useOperationalIssues(employees);
//
// كل الموديولز (Analytics, Reports, ClientViews, EmployeeViews)
// تقرأ من هنا بدل ما تحسب لوحدها.
// ═══════════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";

// ─── helpers (نفس اللي في App.jsx) ────────────────────────────────────────────
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export const daysUntil = (d) =>
  d ? Math.ceil((new Date(d) - TODAY) / 86400000) : 9999;

export const isExcluded = (e) =>
  ["resigned"].includes((e.status || "").toLowerCase()); // expired موش محذوف — محتاج يظهر في payroll

// موظفين مستبعدون نهائياً من كل الـ tabs (مستقيلين فقط)
const isResigned = (e) =>
  ["resigned", "مستقيل"].includes((e.status || "").toLowerCase());

export const isWFDone = (w) =>
  ["complete", "agreement signed", "iqama transferred"].some(
    (x) => (w || "").toLowerCase().includes(x)
  );

// ─── Priority scoring ──────────────────────────────────────────────────────────
const scorePriority = (issue) => {
  if (issue.tab === "urgent") return 100 + (30 - (issue.daysLeft ?? 30));
  if (issue.tab === "renewals") return 50 + (30 - (issue.daysLeft ?? 30));
  if (issue.tab === "approvals") return 40;
  if (issue.tab === "payroll") return 35;
  if (issue.tab === "blockers") return 30;
  if (issue.tab === "followups") return 20 + (30 - (issue.daysLeft ?? 30));
  return 0;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 THE HOOK
// ═══════════════════════════════════════════════════════════════════════════════
export function useOperationalIssues(employees = []) {
  return useMemo(() => {
    const active  = employees.filter((e) => !isResigned(e) && (e.status || "").toLowerCase() !== "expired");
    const allNonResigned = employees.filter((e) => !isResigned(e)); // includes expired

    // ── 1. URGENT (≤7 days expiry + critical workflow blocks) ─────────────────
    const urgent = [];

    active.forEach((e) => {
      const d = daysUntil(e.endDate);

      // Contract expiring ≤7 days
      if (d >= 0 && d <= 7) {
        urgent.push({
          id: `urg-exp-${e._id}`,
          tab: "urgent",
          subtype: "expiring_critical",
          employee: e,
          daysLeft: d,
          label: d === 0 ? "Expires TODAY 🔴" : `Expires in ${d}d`,
          severity: d <= 3 ? "critical" : "high",
          actions: ["send_reminder", "escalate", "open_employee", "mark_resolved", "move_workflow"],
        });
      }

      // Agreement sent but no signature > 5 days
      const wf = (e.workflowStatus || "").toLowerCase();
      if (wf === "agreement sent") {
        const wfDays = e.wfDate ? daysUntil(e.wfDate) : null;
        const stale = wfDays !== null && wfDays < -5;
        urgent.push({
          id: `urg-agr-${e._id}`,
          tab: "urgent",
          subtype: "agreement_unsigned",
          employee: e,
          daysLeft: null,
          label: stale ? `Agreement unsigned (${Math.abs(wfDays)}d)` : "Agreement Sent — awaiting signature",
          severity: stale ? "critical" : "high",
          actions: ["send_reminder", "escalate", "open_employee", "move_workflow"],
        });
      }

      // Docs requested > 3 days
      if (wf === "docs requested") {
        urgent.push({
          id: `urg-docs-${e._id}`,
          tab: "urgent",
          subtype: "docs_overdue",
          employee: e,
          daysLeft: null,
          label: "Docs Requested — not received",
          severity: "high",
          actions: ["send_reminder", "escalate", "open_employee", "move_workflow"],
        });
      }
    });

    // ── 2. FOLLOW-UPS (8-30 days + pending workflow) ──────────────────────────
    const followups = [];

    active.forEach((e) => {
      const wf = (e.workflowStatus || "").toLowerCase();

      if (wf === "pending") {
        followups.push({
          id: `fol-pnd-${e._id}`,
          tab: "followups",
          subtype: "pending_workflow",
          employee: e,
          daysLeft: null,
          label: "Pending — awaiting action",
          severity: "medium",
          actions: ["send_reminder", "escalate", "open_employee", "move_workflow"],
        });
      }

      if (wf === "onboarding") {
        const steps = Object.values(e.onboardingSteps || {}).filter(Boolean).length;
        if (steps < 5) {
          followups.push({
            id: `fol-onb-${e._id}`,
            tab: "followups",
            subtype: "onboarding_incomplete",
            employee: e,
            daysLeft: null,
            label: `Onboarding incomplete (${steps}/5 steps)`,
            severity: "medium",
            actions: ["open_employee", "move_workflow"],
          });
        }
      }
    });

    // ── 3. PAYROLL RISK ────────────────────────────────────────────────────────
    const payroll = [];

    // Missing PO (Sela only) — يشمل الـ expired كمان
    allNonResigned
      .filter((e) => e.client === "Sela" && !e.poNumbers)
      .forEach((e) => {
        const isExp = (e.status || "").toLowerCase() === "expired";
        payroll.push({
          id: `pay-nopo-${e._id}`,
          tab: "payroll",
          subtype: "missing_po",
          employee: e,
          daysLeft: null,
          label: isExp
            ? "Missing PO (Sela) — expired contract + no invoice 🔴"
            : "Missing PO Number (Sela) — invoice risk",
          severity: isExp ? "critical" : "high",
          actions: ["send_reminder", "open_employee", "mark_resolved"],
        });
      });

  
    // Partner cost missing
    active
      .filter((e) => e.profitMode === "partner" && (!e.partnerCost || e.partnerCost === 0))
      .forEach((e) => {
        payroll.push({
          id: `pay-noc-${e._id}`,
          tab: "payroll",
          subtype: "missing_partner_cost",
          employee: e,
          daysLeft: null,
          label: "Missing partner cost — profit calculation risk",
          severity: "medium",
          actions: ["open_employee", "mark_resolved"],
        });
      });

    // ── 4. APPROVALS (Qiwa submitted/pending approval) ────────────────────────
    const approvals = [];

    active
      .filter((e) => {
        const wf = (e.workflowStatus || "").toLowerCase();
        return wf === "qiwa submitted";
      })
      .forEach((e) => {
        const wfDays = e.wfDate ? Math.abs(daysUntil(e.wfDate)) : 0;
        approvals.push({
          id: `apr-qiwa-${e._id}`,
          tab: "approvals",
          subtype: "qiwa_pending",
          employee: e,
          daysLeft: null,
          daysWaiting: wfDays,
          label: `Qiwa Submitted — pending approval${wfDays > 0 ? ` (${wfDays}d)` : ""}`,
          severity: wfDays > 14 ? "high" : "medium",
          actions: ["escalate", "open_employee", "mark_resolved"],
        });
      });

    active
      .filter((e) => (e.workflowStatus || "").toLowerCase() === "docs received +")
      .forEach((e) => {
        approvals.push({
          id: `apr-docsp-${e._id}`,
          tab: "approvals",
          subtype: "docs_plus_review",
          employee: e,
          daysLeft: null,
          label: "Docs Received+ — awaiting review",
          severity: "medium",
          actions: ["open_employee", "move_workflow", "mark_resolved"],
        });
      });

    // ── 5. RENEWALS (contract expiring 8-60 days, not yet in renewal status) ──
   const renewals = [];

active
  .filter((e) => {
    const d = daysUntil(e.endDate);
    // شلنا شرط e.status !== "renewal" عشان يفضل ظاهر قدامك طول ما العقد قرب يخلص
    return d > 7 && d <= 60; 
  })
  .forEach((e) => {
    const d = daysUntil(e.endDate);
    renewals.push({
      id: `ren-${e._id}`,
      tab: "renewals",
      subtype: "renewal_needed",
      employee: e,
      daysLeft: d,
      label: `Renewal needed — ${d}d remaining`,
      severity: d <= 20 ? "high" : "medium",
      actions: ["send_reminder", "open_employee", "mark_resolved", "move_workflow"],
    });
  });

    // Already in renewal status but no new end date set
    active
      .filter((e) => e.status === "renewal" && !e.endDate)
      .forEach((e) => {
        renewals.push({
          id: `ren-nodate-${e._id}`,
          tab: "renewals",
          subtype: "renewal_no_date",
          employee: e,
          daysLeft: null,
          label: "Renewal — end date not set",
          severity: "medium",
          actions: ["open_employee", "mark_resolved"],
        });
      });

    // ── 6. BLOCKERS (stuck workflow, missing critical data) ───────────────────
    const blockers = [];

    active
      .filter((e) => !e.workflowStatus || e.workflowStatus.trim() === "")
      .forEach((e) => {
        blockers.push({
          id: `blk-nowf-${e._id}`,
          tab: "blockers",
          subtype: "no_workflow",
          employee: e,
          daysLeft: null,
          label: "No workflow status — employee unclassified",
          severity: "medium",
          actions: ["open_employee", "move_workflow"],
        });
      });

    active
      .filter((e) => !e.startDate)
      .forEach((e) => {
        blockers.push({
          id: `blk-nostart-${e._id}`,
          tab: "blockers",
          subtype: "no_start_date",
          employee: e,
          daysLeft: null,
          label: "Missing start date — incomplete data",
          severity: "low",
          actions: ["open_employee", "mark_resolved"],
        });
      });

    active
      .filter((e) => !e.phone && !e.email)
      .forEach((e) => {
        blockers.push({
          id: `blk-nocontact-${e._id}`,
          tab: "blockers",
          subtype: "no_contact",
          employee: e,
          daysLeft: null,
          label: "No phone or email — cannot contact",
          severity: "low",
          actions: ["open_employee"],
        });
      });

    // ── Sort all by priority ───────────────────────────────────────────────────
    const sortFn = (a, b) => scorePriority(b) - scorePriority(a);

    const allIssues = [
      ...urgent,
      ...followups,
      ...payroll,
      ...approvals,
      ...renewals,
      ...blockers,
    ].sort(sortFn);

    // ── Summary counts ─────────────────────────────────────────────────────────
    const counts = {
      urgent: urgent.length,
      followups: followups.length,
      payroll: payroll.length,
      approvals: approvals.length,
      renewals: renewals.length,
      blockers: blockers.length,
      total: allIssues.length,
      critical: allIssues.filter((i) => i.severity === "critical").length,
    };

    // ── Per-client breakdown ───────────────────────────────────────────────────
    const byClient = {};
    allIssues.forEach((issue) => {
      const client = issue.employee?.client || "Unknown";
      if (!byClient[client]) byClient[client] = [];
      byClient[client].push(issue);
    });

    // ── Per-employee (for EmployeeView timeline) ───────────────────────────────
    const byEmployee = {};
    allIssues.forEach((issue) => {
      const id = issue.employee?._id;
      if (id == null) return;
      if (!byEmployee[id]) byEmployee[id] = [];
      byEmployee[id].push(issue);
    });

    return {
      // Tabbed buckets
      urgent,
      followups,
      payroll,
      approvals,
      renewals,
      blockers,
      // All together
      all: allIssues,
      // Summaries
      counts,
      byClient,
      byEmployee,
    };
  }, [employees]);
}