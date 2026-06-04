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
import { isExcluded } from "./utils/helpers"; // single source of truth: excludes expired + resigned

// ─── helpers ──────────────────────────────────────────────────────────────────
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export const daysUntil = (d) =>
  d ? Math.ceil((new Date(d) - TODAY) / 86400000) : 9999;

// re-export so any file that already imports daysUntil from here still works
export { isExcluded };

// Resigned = permanently gone. Expired = contract ended — still needs PO/payroll attention.
// active pool: excludes BOTH expired + resigned (via isExcluded from helpers)
// allNonResigned: excludes resigned only — used for the expired-with-missing-PO alert
const isResigned = (e) =>
  ["resigned", "resigned_ar", "مستقيل"].includes((e.status || "").toLowerCase());

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
    // active: excludes expired + resigned — used for all normal issue checks
    const active  = employees.filter((e) => !isExcluded(e));
    // allNonResigned: excludes resigned only, KEEPS expired — used only for the
    // "expired + missing PO" payroll alert (expired employees still need PO resolution)
    const allNonResigned = employees.filter((e) => !isResigned(e));

    // ── 1. URGENT (≤7 days expiry + critical workflow blocks) ─────────────────
    const urgent = [];

    active.forEach((e) => {
      const d = daysUntil(e.endDate);

      // Contract expiring ≤7 days — show as urgent "take action" warning
      // Employee is still active (not yet expired) but renewal must happen NOW
      if (d >= 0 && d <= 7) {
        urgent.push({
          id: `urg-exp-${e._id}`,
          tab: "urgent",
          subtype: "expiring_critical",
          employee: e,
          daysLeft: d,
          label: d === 0
            ? "Expires TODAY — take action immediately 🔴"
            : `Expires in ${d}d — renew or extend now ⚠️`,
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

      // Docs requested > 3 days (only flag after 3+ days waiting, not immediately)
      if (wf === "docs requested") {
        const docsWfDays = e.wfDate ? Math.abs(daysUntil(e.wfDate)) : null;
        const docsOverdue = docsWfDays === null || docsWfDays > 3; // no wfDate = unknown → flag anyway
        if (docsOverdue) {
          urgent.push({
            id: `urg-docs-${e._id}`,
            tab: "urgent",
            subtype: "docs_overdue",
            employee: e,
            daysLeft: null,
            daysWaiting: docsWfDays,
            label: docsWfDays
              ? `Docs Requested — not received (${docsWfDays}d)`
              : "Docs Requested — not received",
            severity: docsWfDays && docsWfDays > 7 ? "critical" : "high",
            actions: ["send_reminder", "escalate", "open_employee", "move_workflow"],
          });
        }
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

    // Missing PO (Sela only) — Sela is the only client that uses PO numbers
    // Includes expired Sela employees: expired + no PO = salary paid but can't invoice
    allNonResigned
      .filter((e) => e.client === "Sela" && (!e.poNumbers || String(e.poNumbers).trim() === ""))
      .forEach((e) => {
        const isExp = (e.status || "").toLowerCase() === "expired";
        payroll.push({
          id: `pay-nopo-${e._id}`,
          tab: "payroll",
          subtype: "missing_po",
          employee: e,
          daysLeft: null,
          label: isExp
            ? "Missing PO (Sela) — expired contract, invoice pending 🔴"
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

    // Grace period: new employees (started ≤7 days ago) don't need a workflow yet
    const BLOCKER_GRACE_DAYS = 7;
    const isNewEmployee = (e) => {
      if (!e.startDate) return false;
      return daysUntil(e.startDate) >= -BLOCKER_GRACE_DAYS;
    };

    active
      .filter((e) => (!e.workflowStatus || e.workflowStatus.trim() === "") && !isNewEmployee(e))
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

    // ── 7. PARTNER OPS (Qiwa Approved → route by profitMode) ─────────────────
    const partner = [];

    active
      .filter((e) => (e.workflowStatus || "").toLowerCase() === "qiwa approved")
      .forEach((e) => {
        const isPartnerMode = e.profitMode === "partner" && e.partnerAssigned;
        partner.push({
          id:       `iqama_pending_${e._id}`,
          tab:      "partner",
          subtype:  isPartnerMode ? "iqama_transfer" : "followup_iqama",
          label:    isPartnerMode
            ? "Iqama Transfer Pending — Partner Action"
            : "Iqama Transfer Pending — Follow Up",
          severity: "high",
          daysLeft: null,
          employee: e,
          recommendedAction: isPartnerMode
            ? `Contact ${e.partnerAssigned} to initiate Iqama transfer`
            : "Follow up with employee — confirm Iqama transfer is in progress",
          actions: isPartnerMode
            ? ["contact_partner", "send_reminder", "open_employee", "mark_resolved"]
            : ["send_reminder", "follow_up", "open_employee", "mark_resolved"],
          partnerPhone: e.partnerPhone || null,
          partnerName:  e.partnerAssigned || null,
          // _tab used by ActionCenter to route to correct sub-bucket
          _tab: isPartnerMode ? "partner" : "followups",
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
      // partner issues are NOT included in `all` to avoid double-counting
      // in followups tab (the followup_iqama subtype ones already land in followups)
    ].sort(sortFn);

    // ── Summary counts ─────────────────────────────────────────────────────────
    const counts = {
      urgent:    urgent.length,
      followups: followups.length,
      payroll:   payroll.length,
      approvals: approvals.length,
      renewals:  renewals.length,
      blockers:  blockers.length,
      partner:   partner.filter(i => i._tab === "partner").length,
      total:     allIssues.length,
      critical:  allIssues.filter((i) => i.severity === "critical").length,
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
      partner,
      // All together
      all: allIssues,
      // Summaries
      counts,
      byClient,
      byEmployee,
    };
  }, [employees]);
}