/**
 * ═══════════════════════════════════════════════════════════════════
 * WeeklyReportGenerator.jsx  —  Fisheye Ops Pro
 * ═══════════════════════════════════════════════════════════════════
 *
 * INTEGRATION (App.jsx — 4 lines):
 *
 *   1. Import at top:
 *      import WeeklyReportGenerator from './WeeklyReportGenerator';
 *
 *   2. Add to navItems (under ANALYTICS & OPS section):
 *      { k:"weeklyreport", l:"Weekly Reports", i:Send },
 *
 *   3. Add to labels:
 *      weeklyreport: "📧 Weekly Client Reports",
 *
 *   4. Add render condition:
 *      {nav==="weeklyreport" && <WeeklyReportGenerator employees={employees}/>}
 *
 *   5. Add Send to lucide-react imports (if not already imported):
 *      import { ..., Send } from "lucide-react";
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Mail, Download, Copy, Check, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Users, Building2,
  Send, Eye, FileText, RefreshCw, Layers, X,
  AlertCircle, TrendingUp, Calendar, MessageCircle
} from "lucide-react";
import { isExcluded, isWFDone } from "./utils/helpers";

// ─── Constants (mirrors App.jsx) ─────────────────────────────────────────────
const M   = "#800000";
const MD  = "#5c0000";

const CLIENT_META  = {
  "Sela":               { badge:"#bbf7d0", text:"#14532d", dot:"#16a34a" },
  "SPL":                { badge:"#e9d5ff", text:"#4c1d95", dot:"#7c3aed" },
  "Channelplay":        { badge:"#bfdbfe", text:"#1e3a8a", dot:"#2563eb" },
  "Riva Engineering 2": { badge:"#fecdd3", text:"#881337", dot:M        },
  "Combuzz HR":         { badge:"#fed7aa", text:"#7c2d12", dot:"#ea580c" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TODAY       = new Date(); TODAY.setHours(0,0,0,0);
const daysUntil   = (d, ref = TODAY) => d ? Math.ceil((new Date(d) - ref) / 86400000) : 9999;
const fmt         = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";

const getWeekRange = (anchor = new Date()) => {
  const end = new Date(anchor);
  // Round to nearest Sunday
  end.setDate(end.getDate() + (0 - end.getDay() + 7) % 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { start, end };
};

// ─── Pending stage definitions ────────────────────────────────────────────────
// Each stage uses .includes() matching to handle variants like
// "Docs Received", "Docs Received +", "Docs Received (Verified)", etc.
// Order matters: more specific stages first to avoid false matches.
const PENDING_STAGES = [
  // ── Fully blocked / needs action ────────────────────────────────────────────
  {
    key:   "pending",
    match: w => (w||"").toLowerCase() === "pending",
    label: "Pending — Awaiting Assignment",
    icon:  "⏳",
    color: "#991b1b",
    bg:    "#fee2e2",
    dot:   "#dc2626",
    desc:  () => `Employee has no workflow stage assigned yet.`,
    hint:  "Assign employee to the appropriate workflow stage.",
  },
  {
    key:   "agreement_sent",
    match: w => (w||"").toLowerCase().includes("agreement sent"),
    label: "Agreement Sent — Awaiting Client Signature",
    icon:  "📋",
    color: "#854d0e",
    bg:    "#fef9c3",
    dot:   "#d97706",
    desc:  (e, ref) => {
      const base = e.wfDate || e.startDate;
      const days = base ? Math.floor((ref - new Date(base)) / 86400000) : null;
      return `Agreement has been sent${days !== null ? ` — <strong style="color:#92400e;">${days} day${days===1?"":"s"} waiting</strong>` : ""} — awaiting client signature.`;
    },
    hint:  "Follow up with client to sign the agreement.",
  },
  {
    key:   "docs_requested",
    match: w => {
      const k = (w||"").toLowerCase();
      return k.includes("docs requested") || k.includes("documents requested");
    },
    label: "Documents Requested — Awaiting Submission",
    icon:  "📂",
    color: "#9a3412",
    bg:    "#ffedd5",
    dot:   "#ea580c",
    desc:  (e, ref) => {
      const base = e.wfDate || e.startDate;
      const days = base ? Math.floor((ref - new Date(base)) / 86400000) : null;
      return `Documents requested from ${e.name} — ${days !== null ? `<strong style="color:#9a3412;">${days} day${days===1?"":"s"} with no response</strong>` : "awaiting submission"}.`;
    },
    hint:  "Chase employee or partner for the missing documents.",
  },
  // ── In progress — awaiting next internal step ────────────────────────────────
  {
    key:   "docs_received",
    match: w => {
      const k = (w||"").toLowerCase();
      // "Docs Received", "Docs Received +", "Docs Received (Verified)", etc.
      // But NOT "Docs Requested"
      return k.includes("docs received") || k.includes("documents received");
    },
    label: "Documents Received — Awaiting Agreement",
    icon:  "📄",
    color: "#1e40af",
    bg:    "#dbeafe",
    dot:   "#2563eb",
    desc:  (e, ref) => {
      const base = e.wfDate || e.startDate;
      const days = base ? Math.floor((ref - new Date(base)) / 86400000) : null;
      return `Documents received from ${e.name}${days !== null ? ` <strong style="color:#1e40af;">${days} day${days===1?"":"s"} ago</strong>` : ""}. Agreement preparation is the next step.`;
    },
    hint:  "Prepare and send the employment agreement.",
  },
  {
    key:   "agreement_signed",
    match: w => (w||"").toLowerCase().includes("agreement signed"),
    label: "Agreement Signed — Awaiting Qiwa Submission",
    icon:  "✍️",
    color: "#065f46",
    bg:    "#d1fae5",
    dot:   "#10b981",
    desc:  () => `Agreement has been signed. Qiwa submission is the next required step.`,
    hint:  "Submit to Qiwa portal as soon as possible.",
  },
  {
    key:   "qiwa_submitted",
    match: w => (w||"").toLowerCase().includes("qiwa submitted"),
    label: "Qiwa Submitted — Awaiting Government Approval",
    icon:  "🏛️",
    color: "#581c87",
    bg:    "#f3e8ff",
    dot:   "#7c3aed",
    desc:  (e, ref) => {
      const base = e.wfDate || e.startDate;
      const days = base ? Math.floor((ref - new Date(base)) / 86400000) : null;
      return `Qiwa submitted — pending government approval${days !== null ? `. <strong style="color:#581c87;">${days} day${days===1?"":"s"} in queue</strong>${days >= 7 ? " ⚠️ exceeds 7-day threshold" : ""}` : ""}.`;
    },
    hint:  "Check Qiwa portal for approval status. Escalate to GR team if over 7 days.",
  },
  {
    key:   "onboarding",
    match: w => (w||"").toLowerCase().includes("onboarding"),
    label: "Onboarding In Progress",
    icon:  "🚀",
    color: "#1e40af",
    bg:    "#eff6ff",
    dot:   "#3b82f6",
    desc:  () => `Employee onboarding is currently in progress.`,
    hint:  "Confirm onboarding checklist is fully complete.",
  },
];

// Helper: is a stage considered "done" (no pending workflow action)?
// Stages NOT in PENDING_STAGES and not excluded = done/active
const DONE_STAGES = ["complete","qiwa approved","iqama transferred"];

// ─── Client data builder ──────────────────────────────────────────────────────
function buildClientReport(clientName, employees, weekEnd) {
  const ref   = new Date(weekEnd);
  const pool  = employees.filter(e => e.client === clientName && !isExcluded(e));
  const active    = pool.filter(e => e.status === "active");
  const onTrack   = pool.filter(e => isWFDone(e.workflowStatus));
  // pending = everyone NOT in a done stage
  const pending   = pool.filter(e => !isWFDone(e.workflowStatus));
  const expiring7 = pool.filter(e => { const d = daysUntil(e.endDate, ref); return d >= 0 && d <= 7; });
  const expiring30= pool.filter(e => { const d = daysUntil(e.endDate, ref); return d > 7 && d <= 30; });
  const missingPO = clientName === "Sela" ? pool.filter(e => !e.poNumbers) : [];
  const onboarding= pool.filter(e => (e.workflowStatus||"").toLowerCase() === "onboarding");
  const stuckAgr  = pool.filter(e => (e.workflowStatus||"").toLowerCase() === "agreement sent");
  // needsAction = items requiring urgent human intervention this week
  // stageAge: days in current workflow stage
  // uses wfDate (set when stage changes) → falls back to startDate
  const stageAge = e => {
    const base = e.wfDate || e.startDate;
    return base ? Math.floor((new Date(weekEnd) - new Date(base)) / 86400000) : null;
  };

  const stuckAgreement = pool.filter(e => {
    if (!(e.workflowStatus||"").toLowerCase().includes("agreement sent")) return false;
    const age = stageAge(e);
    return age !== null && age >= 5;
  });
  const stuckQiwa = pool.filter(e => {
    if (!(e.workflowStatus||"").toLowerCase().includes("qiwa submitted")) return false;
    const age = stageAge(e);
    return age !== null && age >= 7;
  });
  const stuckDocs = pool.filter(e => {
    if (!(e.workflowStatus||"").toLowerCase().includes("docs requested")) return false;
    const age = stageAge(e);
    return age !== null && age >= 4;
  });
  const needsAction = [...new Map(
    [...expiring7, ...missingPO, ...stuckAgreement, ...stuckQiwa, ...stuckDocs].map(e=>[e._id,e])
  ).values()];

  // ── Categorise pending employees by stage ──────────────────────────────────
  const matchedIds = new Set();
  const pendingByStage = PENDING_STAGES.map(stage => {
    const emps = pool.filter(e => !isWFDone(e.workflowStatus) && stage.match(e.workflowStatus));
    emps.forEach(e => matchedIds.add(e._id));
    return { ...stage, employees: emps };
  }).filter(s => s.employees.length > 0);

  // Catch-all: pending employees whose stage didn't match any defined stage
  const unmatchedPending = pool.filter(e =>
    !isWFDone(e.workflowStatus) && !matchedIds.has(e._id) && e.workflowStatus
  );
  if (unmatchedPending.length > 0) {
    pendingByStage.push({
      key:   "other",
      label: "Other — In Progress",
      icon:  "🔄",
      color: "#374151",
      bg:    "#f3f4f6",
      dot:   "#9ca3af",
      desc:  (e) => `Current stage: ${e.workflowStatus}`,
      hint:  "Review and advance to the next workflow stage.",
      employees: unmatchedPending,
    });
  }

  // Health: 100 − penalties
  let health = 100;
  health -= expiring7.length  * 15;
  health -= missingPO.length  * 8;
  health -= stuckAgr.length   * 6;
  // Only penalise genuinely blocked stages (not onboarding/agreement signed which are progressing)
  const blockedStages = ["pending","docs requested","agreement sent"];
  health -= pool.filter(e => blockedStages.some(s => (e.workflowStatus||"").toLowerCase().includes(s))).length * 3;
  health = Math.max(0, Math.min(100, health));

  const healthLabel = health >= 80 ? "Healthy" : health >= 60 ? "Attention needed" : health >= 40 ? "At risk" : "Critical";
  const healthColor = health >= 80 ? "#16a34a" : health >= 60 ? "#d97706" : health >= 40 ? "#ea580c" : "#dc2626";

  return {
    clientName, pool, active, onTrack, pending, pendingByStage,
    expiring7, expiring30, missingPO, onboarding, stuckAgr,
    stuckAgreement, stuckQiwa, stuckDocs, stageAge, needsAction,
    health, healthLabel, healthColor,
  };
}

// ─── WF badge colours (inline-safe for email HTML) ───────────────────────────
const WF_COLORS = [
  ["complete",         "#dcfce7","#166534"],
  ["agreement signed", "#dcfce7","#166534"],
  ["iqama transferred","#dcfce7","#166534"],
  ["qiwa approved",    "#f3e8ff","#581c87"],
  ["qiwa submitted",   "#f3e8ff","#581c87"],
  ["agreement sent",   "#fef9c3","#854d0e"],
  ["docs requested",   "#fef9c3","#854d0e"],
  ["docs received",    "#dbeafe","#1e40af"],
  ["onboarding",       "#dbeafe","#1e40af"],
  ["pending",          "#fee2e2","#991b1b"],
];
const wfColor = w => {
  const k = (w||"").toLowerCase();
  for (const [key, bg, tx] of WF_COLORS) if (k.includes(key)) return [bg, tx];
  return ["#f3f4f6","#374151"];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📧 EMAIL HTML BUILDER
// Pure string → fully self-contained HTML suitable for email clients
// ═══════════════════════════════════════════════════════════════════════════════
function buildEmailHTML({ report, weekStart, weekEnd, includeTable, includeAlerts, includeExpiring30, includePendingDetail, senderName }) {
  const { clientName, pool, onTrack, pending, pendingByStage, expiring7, expiring30, missingPO, needsAction, health, healthLabel, healthColor } = report;
  const refDate = new Date(weekEnd);
  const initials = clientName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  // ── Summary row ────────────────────────────────────────────────────────────
  const summaryStats = [
    { l:"Total workforce",   v: pool.length,        c:"#111827" },
    { l:"Fully placed",      v: onTrack.length,     c: onTrack.length === pool.length ? "#16a34a" : "#111827" },
    { l:"In workflow",       v: pending.length,     c: pending.length > 0 ? "#d97706" : "#16a34a" },
    { l:"Urgent attention",  v: needsAction.length, c: needsAction.length > 0 ? "#dc2626" : "#16a34a" },
  ];

  // ── Alert section ──────────────────────────────────────────────────────────
  const alertHTML = includeAlerts ? (() => {
    if (needsAction.length === 0) return `
      <div style="margin:20px 0;padding:14px 18px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#166534;">✓ All items on track this week</p>
        <p style="margin:4px 0 0;font-size:12px;color:#15803d;">No urgent actions required.</p>
      </div>`;
    const stuckAgreementItems = report.stuckAgreement || [];
    const stuckQiwaItems      = report.stuckQiwa      || [];
    const stuckDocsItems      = report.stuckDocs       || [];
    const stageAgeFn          = report.stageAge        || (() => null);

    return `
      <div style="margin:20px 0;padding:14px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#92400e;">⚠️ Items requiring your attention (${needsAction.length})</p>

        ${expiring7.map(e => `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #fde68a;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;flex-shrink:0;margin-top:4px;"></span>
            <div>
              <span style="font-size:12px;font-weight:700;color:#111827;">${e.name}</span>
              <span style="font-size:12px;color:#374151;"> — Contract expires in <strong style="color:#dc2626;">${daysUntil(e.endDate, refDate)} day${daysUntil(e.endDate, refDate)===1?"":"s"}</strong> (${fmt(e.endDate)})</span>
            </div>
          </div>`).join("")}

        ${stuckDocsItems.map(e => {
          const age = stageAgeFn(e);
          return `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #fde68a;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ea580c;flex-shrink:0;margin-top:4px;"></span>
            <div>
              <span style="font-size:12px;font-weight:700;color:#111827;">${e.name}</span>
              <span style="font-size:12px;color:#374151;"> — Documents requested${age !== null ? `, <strong style="color:#9a3412;">${age} day${age===1?"":"s"} with no response</strong>` : " — no response yet"}</span>
              <div style="font-size:11px;color:#9a3412;margin-top:2px;">💡 Chase employee or partner to submit missing documents.</div>
            </div>
          </div>`;
        }).join("")}

        ${stuckAgreementItems.map(e => {
          const age = stageAgeFn(e);
          return `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #fde68a;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d97706;flex-shrink:0;margin-top:4px;"></span>
            <div>
              <span style="font-size:12px;font-weight:700;color:#111827;">${e.name}</span>
              <span style="font-size:12px;color:#374151;"> — Agreement sent${age !== null ? `, <strong style="color:#92400e;">${age} day${age===1?"":"s"} without signature</strong>` : " — awaiting signature"}</span>
              <div style="font-size:11px;color:#92400e;margin-top:2px;">💡 Follow up with ${e.client || "client"} to sign the agreement.</div>
            </div>
          </div>`;
        }).join("")}

        ${stuckQiwaItems.map(e => {
          const age = stageAgeFn(e);
          return `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #fde68a;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#7c3aed;flex-shrink:0;margin-top:4px;"></span>
            <div>
              <span style="font-size:12px;font-weight:700;color:#111827;">${e.name}</span>
              <span style="font-size:12px;color:#374151;"> — Qiwa submitted${age !== null ? `, <strong style="color:#581c87;">${age} day${age===1?"":"s"} awaiting government approval</strong>` : " — awaiting approval"}</span>
              <div style="font-size:11px;color:#581c87;margin-top:2px;">💡 Check Qiwa portal status. Escalate to GR team if no update.</div>
            </div>
          </div>`;
        }).join("")}

        ${missingPO.map(e => `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6b7280;flex-shrink:0;margin-top:4px;"></span>
            <div>
              <span style="font-size:12px;font-weight:700;color:#111827;">${e.name}</span>
              <span style="font-size:12px;color:#374151;"> — PO number missing, required for invoice processing</span>
            </div>
          </div>`).join("")}

      </div>`;
  })() : "";

  // ── Employee table ─────────────────────────────────────────────────────────
  const tableHTML = includeTable ? (() => {
    if (pool.length === 0) return `<p style="text-align:center;color:#9ca3af;font-size:13px;padding:20px 0;">No active employees for this client.</p>`;
    const rows = pool.map(e => {
      const days = daysUntil(e.endDate, new Date(weekEnd));
      const expColor = days <= 0 ? "#9ca3af" : days <= 7 ? "#dc2626" : days <= 30 ? "#d97706" : "#374151";
      const expText  = days < 0 ? "Expired" : days === 0 ? "Today" : `${fmt(e.endDate)}`;
      const [wbg, wtx] = wfColor(e.workflowStatus);
      return `
        <tr>
          <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;">${e.name}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${e.position||"—"}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;">
            <span style="display:inline-block;background:${wbg};color:${wtx};padding:2px 9px;border-radius:999px;font-size:11px;font-weight:600;">${e.workflowStatus||"—"}</span>
          </td>
          <td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:600;color:${expColor};">${expText}</td>
        </tr>`;
    });
    return `
      <p style="font-size:13px;font-weight:600;color:#374151;margin:20px 0 10px;">Employee status overview (${pool.length})</p>
      <table style="width:100%;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <thead>
          <tr style="background:#fdf8f8;">
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;">Name</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;">Position</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;">Workflow status</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;">Contract end</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>`;
  })() : "";

  // ── Pending employees by stage section ───────────────────────────────────────
  const pendingDetailHTML = (includePendingDetail && pendingByStage && pendingByStage.length > 0) ? (() => {
    const stageBlocks = pendingByStage.map(stage => {
      const rows = stage.employees.map(e => {
        const days = daysUntil(e.endDate, refDate);
        const expColor = days <= 0 ? "#9ca3af" : days <= 7 ? "#dc2626" : days <= 30 ? "#d97706" : "#6b7280";
        const expText  = days === 9999 ? "—" : days < 0 ? "Expired" : days === 0 ? "Today" : fmt(e.endDate);
        const desc = stage.desc(e, refDate);
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f9fafb;vertical-align:top;">
              <div style="font-size:13px;font-weight:600;color:#111827;">${e.name}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:1px;">${e.position||"—"}</div>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #f9fafb;vertical-align:top;">
              <div style="font-size:12px;color:#374151;">${desc}</div>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #f9fafb;vertical-align:top;white-space:nowrap;">
              <div style="font-size:12px;font-weight:600;color:${expColor};">${expText}</div>
              <div style="font-size:10px;color:#9ca3af;margin-top:1px;">Contract end</div>
            </td>
          </tr>`;
      }).join("");

      return `
        <div style="margin-bottom:18px;border:1px solid ${stage.bg};border-radius:10px;overflow:hidden;">
          <!-- Stage header -->
          <div style="background:${stage.bg};padding:10px 14px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:15px;">${stage.icon}</span>
            <span style="font-size:12px;font-weight:700;color:${stage.color};flex:1;">${stage.label}</span>
            <span style="font-size:11px;font-weight:700;background:white;color:${stage.color};padding:2px 9px;border-radius:999px;">${stage.employees.length}</span>
          </div>
          <!-- Employees table -->
          <table style="width:100%;border-collapse:collapse;background:white;">
            <thead>
              <tr style="background:#fafafa;">
                <th style="padding:7px 12px;text-align:left;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;width:28%;">Employee</th>
                <th style="padding:7px 12px;text-align:left;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;">Status detail</th>
                <th style="padding:7px 12px;text-align:left;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #f3f4f6;width:18%;">Contract</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <!-- Hint row -->
          <div style="padding:8px 14px;background:#fafafa;border-top:1px solid #f3f4f6;">
            <span style="font-size:11px;color:${stage.color};">💡 ${stage.hint}</span>
          </div>
        </div>`;
    }).join("");

    return `
      <div style="margin:20px 0;">
        <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 12px;display:flex;align-items:center;gap:8px;">
          <span style="display:inline-block;width:3px;height:16px;background:#d97706;border-radius:2px;"></span>
          Pending employees — workflow status detail (${pending.length})
        </p>
        ${stageBlocks}
      </div>`;
  })() : "";

  // ── Expiring 30d section ───────────────────────────────────────────────────
  const expiring30HTML = (includeExpiring30 && expiring30.length > 0) ? `
    <div style="margin:16px 0;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.04em;">Upcoming renewals — next 30 days (${expiring30.length})</p>
      ${expiring30.map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #fef08a;">
          <span style="font-size:12px;font-weight:600;color:#78350f;">${e.name}</span>
          <span style="font-size:12px;color:#92400e;">${fmt(e.endDate)} · ${daysUntil(e.endDate, new Date(weekEnd))} days</span>
        </div>`).join("")}
    </div>` : "";

  // ── Assemble full email ────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Weekly Report — ${clientName}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">

<div style="max-width:620px;margin:0 auto;">

  <!-- HEADER CARD -->
  <div style="background:linear-gradient(135deg,${MD} 0%,${M} 100%);border-radius:14px 14px 0 0;padding:28px 32px;">
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="color:white;font-size:17px;font-weight:700;letter-spacing:-0.5px;">${initials}</span>
      </div>
      <div>
        <p style="margin:0;color:white;font-size:19px;font-weight:700;letter-spacing:-0.3px;">${clientName}</p>
        <p style="margin:3px 0 0;color:rgba(255,205,205,0.85);font-size:12px;">Weekly operations report &nbsp;·&nbsp; ${fmt(weekStart)} — ${fmt(weekEnd)}</p>
      </div>
    </div>
  </div>

  <!-- SUMMARY STRIP -->
  <div style="background:white;display:flex;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
    ${summaryStats.map((s,i) => `
      <div style="flex:1;padding:16px 12px;text-align:center;${i < summaryStats.length-1 ? "border-right:1px solid #f3f4f6;" : ""}">
        <div style="font-size:24px;font-weight:700;color:${s.c};line-height:1;">${s.v}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:3px;white-space:nowrap;">${s.l}</div>
      </div>`).join("")}
  </div>

  <!-- HEALTH BAR -->
  <div style="background:white;padding:14px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #f3f4f6;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Account health</span>
      <span style="font-size:12px;font-weight:700;color:${healthColor};">${healthLabel} &nbsp;${health}/100</span>
    </div>
    <div style="height:6px;border-radius:999px;background:#f3f4f6;overflow:hidden;">
      <div style="height:6px;border-radius:999px;width:${health}%;background:${healthColor};"></div>
    </div>
  </div>

  <!-- MAIN BODY CARD -->
  <div style="background:white;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;border-radius:0 0 14px 14px;padding:20px 28px 28px;">

    ${alertHTML}
    ${pendingDetailHTML}
    ${tableHTML}
    ${expiring30HTML}

    <!-- FOOTER -->
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;">
        Generated by <strong>Fisheye Ops Pro</strong> on ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}.
        ${senderName ? `Prepared by: ${senderName}.` : ""}
      </p>
      <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
        For questions or updates, please reply to this email or contact your Fisheye account manager.
      </p>
    </div>
  </div>

</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════
const sp = {
  card:   { backgroundColor:"white", borderRadius:12, border:"1px solid #e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" },
  cardHd: { padding:"12px 18px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:8 },
  cardBd: { padding:"16px 18px" },
  label:  { display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 },
  inp:    { width:"100%", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  grid4:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 },
  flex:   { display:"flex", alignItems:"center" },
  btn:    (variant="ghost") => ({
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
    border: variant==="primary" ? "none" : "1px solid #e5e7eb",
    backgroundColor: variant==="primary" ? M : variant==="green" ? "#16a34a" : "white",
    color: variant==="primary"||variant==="green" ? "white" : "#374151",
  }),
  btnSm:  { padding:"5px 12px", fontSize:12 },
};

function WCard({ children, style={} }) {
  return <div className="fe-card" style={{...style}}>{children}</div>;
}

function ClientDot({ client }) {
  const m = CLIENT_META[client] || {};
  return <span style={{width:9,height:9,borderRadius:"50%",backgroundColor:m.dot||"#9ca3af",flexShrink:0,display:"inline-block"}}/>;
}

function HealthPill({ score, label, color }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700,
      backgroundColor:`${color}15`, color,
    }}>
      {label} · {score}/100
    </span>
  );
}

function CheckToggle({ checked, onChange, label }) {
  return (
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}
        style={{width:15,height:15,accentColor:M,cursor:"pointer"}}/>
      <span style={{fontSize:13,color:"#374151"}}>{label}</span>
    </label>
  );
}

function CopyBtn({ text, label="Copy HTML" }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    });
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };
  return (
    <button onClick={copy} className="fe-btn fe-btn-ghost" style={{borderColor: done?"#16a34a":"#e5e7eb",color:done?"#16a34a":"#374151"}}>
      {done ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> {label}</>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 ISSUE ACTION HELPERS  — per-issue copy / email / WA
// These build focused messages for a SINGLE operational issue
// ═══════════════════════════════════════════════════════════════════════════════

function buildIssueWA(issue, clientName) {
  const emp   = issue.name       || issue.linkedEmployee || "Unknown";
  const stage = issue.type       || issue.workflowStatus || "";
  const days  = issue.daysOverdue != null ? `${issue.daysOverdue} day${issue.daysOverdue===1?"":"s"}` : null;
  const due   = issue.endDate    ? `Contract ends: ${fmt(new Date(issue.endDate))}` : "";

  const lines = [
    `⚠️ *Operational Issue — ${clientName}*`,
    ``,
    `👤 *Employee:* ${emp}`,
    stage  ? `📋 *Stage:* ${stage}` : null,
    days   ? `⏱ *Waiting:* ${days}` : null,
    due    ? `📅 ${due}` : null,
    issue.reason ? `📌 *Issue:* ${issue.reason}` : null,
    issue.recommendedAction ? `💡 *Action:* ${issue.recommendedAction}` : null,
    ``,
    `_Sent via Fisheye Ops Pro_`,
  ].filter(l => l !== null);

  return lines.join("\n");
}

function buildIssuePlainText(issue, clientName) {
  const emp   = issue.name       || issue.linkedEmployee || "Unknown";
  const stage = issue.type       || issue.workflowStatus || "";
  const days  = issue.daysOverdue != null ? `${issue.daysOverdue} day${issue.daysOverdue===1?"":"s"} waiting` : null;
  const due   = issue.endDate    ? `Contract end: ${fmt(new Date(issue.endDate))}` : "";

  return [
    `Operational Issue — ${clientName}`,
    `──────────────────────────────`,
    `Employee:   ${emp}`,
    stage  ? `Stage:      ${stage}` : null,
    days   ? `Waiting:    ${days}` : null,
    due    ? due : null,
    issue.reason ? `Issue:      ${issue.reason}` : null,
    issue.recommendedAction ? `Action:     ${issue.recommendedAction}` : null,
  ].filter(Boolean).join("\n");
}

function buildIssueEmailBody(issue, clientName, senderName) {
  const emp   = issue.name       || issue.linkedEmployee || "Unknown";
  const stage = issue.type       || issue.workflowStatus || "";
  const days  = issue.daysOverdue != null ? `${issue.daysOverdue} day${issue.daysOverdue===1?"":"s"}` : null;
  const due   = issue.endDate    ? fmt(new Date(issue.endDate)) : null;

  const subject = `Action Required — ${emp} — ${clientName}`;
  const body = [
    `Dear ${clientName} team,`,
    ``,
    `I'm following up regarding an operational item that requires attention:`,
    ``,
    `  Employee:  ${emp}`,
    stage  ? `  Stage:     ${stage}` : null,
    days   ? `  Waiting:   ${days}` : null,
    due    ? `  Contract ends: ${due}` : null,
    issue.reason ? `  Issue:     ${issue.reason}` : null,
    ``,
    issue.recommendedAction ? `Recommended action: ${issue.recommendedAction}` : `Please advise on next steps.`,
    ``,
    `Best regards,`,
    senderName || "Fisheye Ops",
  ].filter(Boolean).join("\n");

  return { subject, body };
}

// ─── IssueActionBar — renders Copy / Email / WhatsApp for one issue ───────────
function IssueActionBar({ issue, clientName, senderName = "" }) {
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [copiedWA,  setCopiedWA]  = useState(false);

  const plainText = buildIssuePlainText(issue, clientName);
  const waMsg     = buildIssueWA(issue, clientName);
  const { subject, body } = buildIssueEmailBody(issue, clientName, senderName);

  const copyText = () => {
    navigator.clipboard.writeText(plainText).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = plainText; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    });
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2200);
  };

  const copyWA = () => {
    navigator.clipboard.writeText(waMsg).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = waMsg; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    });
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2200);
  };

  const openEmail = () =>
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");

  const openWA = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, "_blank");

  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:8}}>
      {/* Copy plain text */}
      <button onClick={copyText} className="fe-btn fe-btn-ghost"
        style={{borderColor:copiedTxt?"#16a34a":"#e5e7eb", color:copiedTxt?"#16a34a":"#374151"}}>
        {copiedTxt ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
      </button>

      {/* Open mailto */}
      <button onClick={openEmail} className="fe-btn fe-btn-ghost" style={{color:"#1d4ed8", borderColor:"#bfdbfe"}}>
        <Mail size={11}/> Email
      </button>

      {/* Copy WA text */}
      <button onClick={copyWA} className="fe-btn fe-btn-ghost"
        style={{borderColor:copiedWA?"#16a34a":"#86efac", color:copiedWA?"#16a34a":"#15803d", backgroundColor:"#f0fdf4"}}>
        {copiedWA ? <><Check size={11}/> Copied WA</> : <><MessageCircle size={11}/> Copy WA</>}
      </button>

      {/* Open WhatsApp */}
      <button onClick={openWA} className="fe-btn fe-btn-ghost"
        style={{borderColor:"#86efac", color:"#15803d", backgroundColor:"#f0fdf4"}}>
        <MessageCircle size={11}/> Send WA
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 CLIENT REPORT CARD (left-side summary)
// ═══════════════════════════════════════════════════════════════════════════════
function ClientReportCard({ report, selected, onClick }) {
  const { clientName, pool, onTrack, needsAction, health, healthColor } = report;
  const m = CLIENT_META[clientName] || {};
  const initials = clientName.split(" ").map(w=>w[0]).join("").slice(0,2);

  return (
    <button
      onClick={onClick}
      style={{
        width:"100%", textAlign:"left", padding:"12px 14px",
        borderRadius:10, cursor:"pointer",
        border: selected ? `1.5px solid ${M}` : "1px solid #e5e7eb",
        backgroundColor: selected ? `${M}06` : "white",
        display:"flex", alignItems:"center", gap:10,
        transition:"all 0.15s",
      }}
    >
      <div style={{
        width:36, height:36, borderRadius:10, flexShrink:0,
        backgroundColor: m.badge||"#e5e7eb",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:12, fontWeight:900, color: m.text||"#374151",
      }}>{initials}</div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:13,fontWeight:700,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{clientName}</p>
        <p style={{margin:"1px 0 0",fontSize:11,color:"#6b7280"}}>{pool.length} employees · {onTrack.length} on track</p>
      </div>
      <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
        <HealthPill score={health} label="" color={healthColor}/>
        {needsAction.length > 0 && (
          <span style={{fontSize:10,padding:"1px 7px",borderRadius:999,backgroundColor:"#fee2e2",color:"#dc2626",fontWeight:700}}>
            {needsAction.length} action{needsAction.length>1?"s":""}
          </span>
        )}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 REPORT STATS ROW
// ═══════════════════════════════════════════════════════════════════════════════
function ReportStats({ report }) {
  const { pool, onTrack, pending, needsAction } = report;
  const stats = [
    { icon:Users,          label:"Total",        value:pool.length,          color:"#111827" },
    { icon:CheckCircle2,   label:"On track",     value:onTrack.length,       color:onTrack.length===pool.length?"#16a34a":"#111827" },
    { icon:Clock,          label:"Pending",      value:pending.length,       color:pending.length>0?"#d97706":"#16a34a" },
    { icon:AlertTriangle,  label:"Action needed",value:needsAction.length,   color:needsAction.length>0?"#dc2626":"#16a34a" },
  ];
  return (
    <div style={sp.grid4}>
      {stats.map(({icon:Icon, label, value, color}) => (
        <div key={label} style={{padding:"12px",borderRadius:10,backgroundColor:"#f9fafb",border:"1px solid #f3f4f6"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <Icon size={13} style={{color:"#9ca3af"}}/>
            <span style={{fontSize:11,color:"#6b7280",fontWeight:600}}>{label}</span>
          </div>
          <div style={{fontSize:22,fontWeight:900,color,lineHeight:1}}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 👁 EMAIL PREVIEW PANE
// ═══════════════════════════════════════════════════════════════════════════════
function EmailPreview({ html }) {
  const iframeRef = useRef(null);

  React.useEffect(() => {
    if (!iframeRef.current || !html) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
  }, [html]);

  return (
    <div style={{
      border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden",
      boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        padding:"8px 14px", backgroundColor:"#f9fafb",
        borderBottom:"1px solid #f3f4f6",
        display:"flex", alignItems:"center", gap:6,
      }}>
        <div style={{width:10,height:10,borderRadius:"50%",backgroundColor:"#fca5a5"}}/>
        <div style={{width:10,height:10,borderRadius:"50%",backgroundColor:"#fde68a"}}/>
        <div style={{width:10,height:10,borderRadius:"50%",backgroundColor:"#86efac"}}/>
        <span style={{fontSize:11,color:"#9ca3af",marginLeft:8}}>Email preview</span>
      </div>
      <iframe
        ref={iframeRef}
        title="Email preview"
        style={{width:"100%",height:580,border:"none",display:"block",backgroundColor:"#f1f5f9"}}
        sandbox="allow-same-origin"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export { IssueActionBar, buildIssueWA, buildIssuePlainText, buildIssueEmailBody };
export default function WeeklyReportGenerator({ employees }) {
  // ── Derive client list dynamically from employees ────────────────────────
  const CLIENTS_LIST = useMemo(() =>
    [...new Set(employees.map(e => e.client).filter(Boolean))].sort(),
    [employees]
  );

  // ── Week state ───────────────────────────────────────────────────────────
  const { end: defaultEnd } = getWeekRange(TODAY);
  const [weekEnd, setWeekEnd]   = useState(defaultEnd.toISOString().split("T")[0]);

  const weekEndDate   = new Date(weekEnd);
  const weekStartDate = new Date(weekEndDate); weekStartDate.setDate(weekStartDate.getDate() - 6);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [selectedClient, setSelectedClient] = useState(() => CLIENTS_LIST[0] || "");
  const [senderName,     setSenderName]     = useState(() => localStorage.getItem("wr_senderName") || "");
  const [includeTable,        setIncludeTable]        = useState(true);
  const [includeAlerts,       setIncludeAlerts]       = useState(true);
  const [incl30d,             setIncl30d]             = useState(true);
  const [includePendingDetail,setIncludePendingDetail] = useState(true);
  const [bulkMode,       setBulkMode]       = useState(false);
  const [bulkSelected,   setBulkSelected]   = useState(() => new Set(CLIENTS_LIST));
  const [bulkDone,       setBulkDone]       = useState(new Set());
  const [showPreview,    setShowPreview]    = useState(true);

  // ── Build all reports ────────────────────────────────────────────────────
  const allReports = useMemo(() =>
    CLIENTS_LIST.reduce((acc, name) => {
      acc[name] = buildClientReport(name, employees, weekEnd);
      return acc;
    }, {}),
  [employees, weekEnd]);

  const selectedReport = allReports[selectedClient];

  // ── Build selected email HTML ────────────────────────────────────────────
  const emailHTML = useMemo(() => buildEmailHTML({
    report: selectedReport,
    weekStart: weekStartDate.toISOString().split("T")[0],
    weekEnd,
    includeTable, includeAlerts,
    includeExpiring30: incl30d,
    includePendingDetail,
    senderName,
  }), [selectedReport, weekEnd, includeTable, includeAlerts, incl30d, includePendingDetail, senderName]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const saveSender = v => {
    setSenderName(v);
    localStorage.setItem("wr_senderName", v);
  };

  const downloadHTML = (clientName, html) => {
    const blob = new Blob([html], { type:"text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `weekly_report_${clientName.replace(/\s+/g,"_")}_${weekEnd}.html`;
    a.click();
  };

  const openMailto = (clientName) => {
    const subject = `Weekly Operations Report — ${clientName} — ${fmt(weekStartDate)} to ${fmt(weekEndDate)}`;
    const body = `Dear ${clientName} team,\n\nPlease find below the weekly operations report for the period ${fmt(weekStartDate)} to ${fmt(weekEndDate)}.\n\n[Paste the HTML report here]\n\nBest regards,\n${senderName || "Fisheye Ops"}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  const waText = (clientName, report) => {
    const { pool, onTrack, needsAction, healthLabel } = report;
    return `📊 *Weekly Report — ${clientName}*\nWeek: ${fmt(weekStartDate)} – ${fmt(weekEndDate)}\n\n👥 Total workforce: *${pool.length}*\n✅ On track: *${onTrack.length}*\n⚠️ Needs attention: *${needsAction.length}*\nHealth: *${healthLabel}*${needsAction.length > 0 ? `\n\n🔴 *Action items:*\n${report.expiring7.map(e=>`• ${e.name} — expires ${fmt(e.endDate)}`).join("\n")}${report.missingPO.map(e=>`• ${e.name} — PO missing`).join("\n")}` : "\n\n✅ All items on track this week."}\n\n_Sent via Fisheye Ops Pro_`;
  };

  const openWA = (report) => {
    const msg = waText(report.clientName, report);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // ── Bulk download all ─────────────────────────────────────────────────────
  const bulkDownloadAll = () => {
    [...bulkSelected].forEach((clientName, i) => {
      setTimeout(() => {
        const r = allReports[clientName];
        const html = buildEmailHTML({
          report:r, weekStart:weekStartDate.toISOString().split("T")[0], weekEnd,
          includeTable, includeAlerts, includeExpiring30:incl30d,
          includePendingDetail, senderName,
        });
        downloadHTML(clientName, html);
        setBulkDone(prev => new Set([...prev, clientName]));
      }, i * 400);
    });
  };

  // ── Aggregate stats (bulk view) ───────────────────────────────────────────
  const totalStats = useMemo(() => {
    const all = Object.values(allReports);
    return {
      total:       all.reduce((s,r)=>s+r.pool.length, 0),
      onTrack:     all.reduce((s,r)=>s+r.onTrack.length, 0),
      needsAction: all.reduce((s,r)=>s+r.needsAction.length, 0),
      critical:    all.filter(r=>r.health<40).length,
    };
  }, [allReports]);

  // ── Date navigation ───────────────────────────────────────────────────────
  const shiftWeek = (dir) => {
    const d = new Date(weekEnd);
    d.setDate(d.getDate() + dir * 7);
    setWeekEnd(d.toISOString().split("T")[0]);
  };

  return (
    <div className="fe-page" style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${MD},${M})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Send size={17} style={{color:"white"}}/>
          </div>
          <div>
            <h2 style={{margin:0,fontSize:19,fontWeight:900,color:"#111827",fontFamily:"var(--font-sans)",letterSpacing:"-0.02em"}}>Weekly Client Reports</h2>
            <p style={{margin:"2px 0 0",fontSize:13,color:"#6b7280",fontFamily:"var(--font-sans)"}}>Client status · WF summaries · Distribution</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>shiftWeek(-1)} className="fe-btn fe-btn-ghost">← Prev week</button>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,border:"1px solid #e5e7eb",backgroundColor:"white"}}>
            <Calendar size={13} style={{color:"#9ca3af"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#374151"}}>{fmt(weekStartDate)} — {fmt(weekEndDate)}</span>
          </div>
          <button onClick={()=>shiftWeek(1)} className="fe-btn fe-btn-ghost">Next week →</button>
          <input type="date" value={weekEnd} onChange={e=>setWeekEnd(e.target.value)}
            className="fe-input" style={{cursor:"pointer"}}/>
        </div>
      </div>

      {/* ── AGGREGATE SUMMARY ─────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {icon:Users,         label:"Total workforce",  value:totalStats.total,       color:"#111827" },
          {icon:CheckCircle2,  label:"On track",         value:totalStats.onTrack,     color:"#16a34a" },
          {icon:AlertTriangle, label:"Action needed",    value:totalStats.needsAction, color:totalStats.needsAction>0?"#dc2626":"#16a34a" },
          {icon:AlertCircle,   label:"Critical clients", value:totalStats.critical,    color:totalStats.critical>0?"#dc2626":"#16a34a" },
        ].map(({icon:Icon,label,value,color})=>(
          <WCard key={label} style={{padding:14}}>
            <Icon size={14} style={{color:"#9ca3af",marginBottom:6,display:"block"}}/>
            <div style={{fontSize:26,fontWeight:900,color,lineHeight:1}}>{value}</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:3}}>{label}</div>
          </WCard>
        ))}
      </div>

      {/* ── SENDER + OPTIONS ROW ──────────────────────────────────────────── */}
      <WCard style={{padding:"14px 18px"}}>
        <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{flex:"1 1 200px",minWidth:0}}>
            <label style={sp.label}>Your name (appears in email footer)</label>
            <input
              className="fe-input"
              style={{maxWidth:260}}
              placeholder="e.g. Nessma Al-Rashid"
              value={senderName}
              onChange={e=>saveSender(e.target.value)}
            />
          </div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"center"}}>
            <CheckToggle checked={includeAlerts}        onChange={setIncludeAlerts}        label="Action alerts"/>
            <CheckToggle checked={includePendingDetail} onChange={setIncludePendingDetail} label="Pending workflow detail"/>
            <CheckToggle checked={includeTable}         onChange={setIncludeTable}         label="Full employee table"/>
            <CheckToggle checked={incl30d}              onChange={setIncl30d}              label="Expiring 30d"/>
          </div>
          <button
            onClick={()=>{ setBulkMode(p=>!p); setBulkDone(new Set()); }}
            className={bulkMode ? "fe-btn fe-btn-primary" : "fe-btn fe-btn-ghost"}
            style={{marginLeft:"auto"}}>
            <Layers size={13}/> {bulkMode ? "Exit bulk" : "Bulk mode"}
          </button>
        </div>
      </WCard>

      {/* ══ BULK MODE ════════════════════════════════════════════════════════ */}
      {bulkMode && (
        <WCard style={{overflow:"hidden"}}>
          <div style={{...sp.cardHd}}>
            <Layers size={15} style={{color:M}}/>
            <span style={{fontWeight:700,fontSize:13,flex:1}}>Bulk Download — All Clients</span>
            <span style={{fontSize:11,color:"#9ca3af"}}>{bulkSelected.size} selected</span>
          </div>
          <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:8}}>
            {CLIENTS_LIST.map(name => {
              const r = allReports[name];
              const checked = bulkSelected.has(name);
              const done = bulkDone.has(name);
              const m = CLIENT_META[name] || {};
              return (
                <div key={name} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                  borderRadius:10, border:`1px solid ${done?"#86efac":checked?"#e5e7eb":"#f3f4f6"}`,
                  backgroundColor: done?"#f0fdf4":checked?"white":"#fafafa",
                  transition:"all 0.2s",
                }}>
                  <input type="checkbox" checked={checked} onChange={ev=>{
                    setBulkSelected(prev=>{const n=new Set(prev);ev.target.checked?n.add(name):n.delete(name);return n;});
                  }} style={{width:15,height:15,accentColor:M,cursor:"pointer"}}/>
                  <div style={{width:8,height:8,borderRadius:"50%",backgroundColor:m.dot||"#9ca3af",flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:600,flex:1,color:"#111827"}}>{name}</span>
                  <span style={{fontSize:11,color:"#6b7280"}}>{r.pool.length} emp · {r.needsAction.length} action</span>
                  <HealthPill score={r.health} label={r.healthLabel} color={r.healthColor}/>
                  {done && <span style={{fontSize:11,color:"#16a34a",fontWeight:700}}>✓ Downloaded</span>}
                  {!done && checked && (
                    <button onClick={()=>{
                      const html = buildEmailHTML({report:r,weekStart:weekStartDate.toISOString().split("T")[0],weekEnd,includeTable,includeAlerts,includeExpiring30:incl30d,includePendingDetail,senderName});
                      downloadHTML(name,html);
                      setBulkDone(prev=>new Set([...prev,name]));
                    }} className="fe-btn fe-btn-ghost">
                      <Download size={12}/> Download
                    </button>
                  )}
                </div>
              );
            })}
            <div style={{display:"flex",gap:8,marginTop:8,paddingTop:12,borderTop:"1px solid #f3f4f6"}}>
              <button onClick={bulkDownloadAll} className="fe-btn fe-btn-primary">
                <Download size={14}/> Download all selected ({bulkSelected.size})
              </button>
              <span style={{fontSize:12,color:"#9ca3af",alignSelf:"center"}}>HTML files, ready to paste into Gmail or Outlook</span>
            </div>
          </div>
        </WCard>
      )}

      {/* ══ SINGLE CLIENT MODE ═══════════════════════════════════════════════ */}
      {!bulkMode && (
        <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:16,alignItems:"start"}}>

          {/* ── Left: client selector ────────────────────────────────────── */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <span style={{...sp.label}}>Select client</span>
            {CLIENTS_LIST.map(name => (
              <ClientReportCard
                key={name}
                report={allReports[name]}
                selected={selectedClient===name}
                onClick={()=>setSelectedClient(name)}
              />
            ))}
          </div>

          {/* ── Right: report panel ──────────────────────────────────────── */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>

            {/* Stats */}
            <WCard>
              <div style={{...sp.cardHd}}>
                <ClientDot client={selectedClient}/>
                <span style={{fontWeight:800,fontSize:14,color:"#111827",flex:1}}>{selectedClient}</span>
                <HealthPill score={selectedReport.health} label={selectedReport.healthLabel} color={selectedReport.healthColor}/>
              </div>
              <div style={{padding:"14px 18px"}}>
                <ReportStats report={selectedReport}/>

                {/* Alert items inline */}
                {selectedReport.needsAction.length > 0 && (
                  <div style={{marginTop:14,padding:"12px 14px",borderRadius:10,backgroundColor:"#fffbeb",border:"1px solid #fde68a"}}>
                    <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#92400e"}}>Action items</p>
                    {selectedReport.expiring7.map(e=>(
                      <div key={e._id} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid #fef08a"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:"#dc2626",flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#374151"}}><strong>{e.name}</strong> — expires in {daysUntil(e.endDate,weekEndDate)}d ({fmt(e.endDate)})</span>
                        </div>
                        <IssueActionBar
                          issue={{ name:e.name, type:"Contract Expiring", endDate:e.endDate, daysOverdue:daysUntil(e.endDate,weekEndDate), reason:`Contract expires in ${daysUntil(e.endDate,weekEndDate)} day(s)`, recommendedAction:"Initiate renewal or notify client immediately." }}
                          clientName={selectedClient}
                          senderName={senderName}
                        />
                      </div>
                    ))}
                    {selectedReport.stuckAgreement.map(e=>(
                      <div key={`agr-${e._id}`} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid #fef08a"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:"#d97706",flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#374151"}}><strong>{e.name}</strong> — Agreement sent, waiting {selectedReport.stageAge(e)} days</span>
                        </div>
                        <IssueActionBar
                          issue={{ name:e.name, type:"Agreement Sent", workflowStatus:e.workflowStatus, daysOverdue:selectedReport.stageAge(e), reason:`Agreement sent ${selectedReport.stageAge(e)} day(s) ago — no signature yet`, recommendedAction:"Follow up with client to sign the agreement." }}
                          clientName={selectedClient}
                          senderName={senderName}
                        />
                      </div>
                    ))}
                    {selectedReport.stuckQiwa.map(e=>(
                      <div key={`qiwa-${e._id}`} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid #fef08a"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:"#7c3aed",flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#374151"}}><strong>{e.name}</strong> — Qiwa submitted, in queue {selectedReport.stageAge(e)} days</span>
                        </div>
                        <IssueActionBar
                          issue={{ name:e.name, type:"Qiwa Pending", workflowStatus:e.workflowStatus, daysOverdue:selectedReport.stageAge(e), reason:`Qiwa submitted ${selectedReport.stageAge(e)} day(s) ago — awaiting approval`, recommendedAction:"Check Qiwa portal. Escalate to GR team if over 7 days." }}
                          clientName={selectedClient}
                          senderName={senderName}
                        />
                      </div>
                    ))}
                    {selectedReport.missingPO.map(e=>(
                      <div key={`po-${e._id}`} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid #fef08a"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:"#6b7280",flexShrink:0}}/>
                          <span style={{fontSize:12,color:"#374151"}}><strong>{e.name}</strong> — PO number missing</span>
                        </div>
                        <IssueActionBar
                          issue={{ name:e.name, type:"Missing PO", workflowStatus:e.workflowStatus, reason:"PO number missing — required for invoice processing", recommendedAction:"Request PO number from client finance team." }}
                          clientName={selectedClient}
                          senderName={senderName}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </WCard>

            {/* Action buttons */}
            <WCard style={{padding:"14px 18px"}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <CopyBtn text={emailHTML} label="Copy HTML"/>
                <button onClick={()=>downloadHTML(selectedClient,emailHTML)} className="fe-btn fe-btn-ghost">
                  <Download size={13}/> Download HTML
                </button>
                <button onClick={()=>openMailto(selectedClient)} className="fe-btn fe-btn-ghost">
                  <Mail size={13}/> Open in mail
                </button>
                <button onClick={()=>openWA(selectedReport)} className="fe-btn fe-btn-ghost" style={{borderColor:"#25d366",color:"#16a34a"}}>
                  <MessageCircle size={13}/> WhatsApp summary
                </button>
                <button onClick={()=>setShowPreview(p=>!p)} className="fe-btn fe-btn-ghost" style={{marginLeft:"auto"}}>
                  <Eye size={13}/> {showPreview ? "Hide" : "Show"} preview
                </button>
              </div>
              <p style={{margin:"8px 0 0",fontSize:11,color:"#9ca3af"}}>
                Copy HTML → open Gmail/Outlook → compose new email → switch to HTML/source mode → paste. The email renders perfectly in all clients.
              </p>
            </WCard>

            {/* ── Issues Hub: per-issue share actions ──────────────────────── */}
            {selectedReport.needsAction.length > 0 && (
              <WCard style={{overflow:"hidden"}}>
                <div style={{...sp.cardHd,borderBottom:"1px solid #f3f4f6"}}>
                  <AlertTriangle size={15} style={{color:"#d97706"}}/>
                  <span style={{fontWeight:700,fontSize:13,flex:1}}>
                    Issues Hub — {selectedClient}
                  </span>
                  <span style={{fontSize:11,color:"#9ca3af"}}>
                    {selectedReport.needsAction.length} item{selectedReport.needsAction.length>1?"s":""} · copy, email, or WhatsApp each
                  </span>
                </div>

                {/* ── Send entire client summary ── */}
                <div style={{padding:"12px 18px",borderBottom:"1px solid #f3f4f6",backgroundColor:"#fafafa"}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#374151",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>
                    Full client summary
                  </p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <CopyBtn text={buildIssuePlainText({
                      name: `${selectedReport.needsAction.length} issue(s)`,
                      type: `Weekly Summary`,
                      reason: selectedReport.needsAction.map(e=>e.name).join(", "),
                      recommendedAction: `Review all ${selectedReport.needsAction.length} open items for ${selectedClient}`,
                    }, selectedClient)} label="Copy summary text"/>
                    <button onClick={()=>openMailto(selectedClient)} className="fe-btn fe-btn-ghost" style={{color:"#1d4ed8",borderColor:"#bfdbfe"}}>
                      <Mail size={12}/> Email client
                    </button>
                    <button onClick={()=>openWA(selectedReport)} className="fe-btn fe-btn-ghost" style={{borderColor:"#86efac",color:"#15803d",backgroundColor:"#f0fdf4"}}>
                      <MessageCircle size={12}/> WA full summary
                    </button>
                  </div>
                </div>

                {/* ── Per-issue rows ── */}
                <div style={{padding:"12px 18px",display:"flex",flexDirection:"column",gap:12}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#374151",margin:0,textTransform:"uppercase",letterSpacing:"0.05em"}}>
                    Per issue
                  </p>

                  {/* Expiring contracts */}
                  {selectedReport.expiring7.map(e => (
                    <div key={`hub-exp-${e._id}`} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #fecaca",backgroundColor:"#fff5f5"}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                            <span style={{width:7,height:7,borderRadius:"50%",backgroundColor:"#dc2626",flexShrink:0,display:"inline-block"}}/>
                            <span style={{fontSize:13,fontWeight:700,color:"#1f2937"}}>{e.name}</span>
                            <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,backgroundColor:"#fee2e2",color:"#991b1b"}}>Expiring</span>
                          </div>
                          <span style={{fontSize:11,color:"#6b7280"}}>Contract ends {fmt(e.endDate)} · {daysUntil(e.endDate,weekEndDate)} day{daysUntil(e.endDate,weekEndDate)===1?"":"s"} remaining · {e.position||""}</span>
                        </div>
                      </div>
                      <IssueActionBar
                        issue={{ name:e.name, type:"Contract Expiring", endDate:e.endDate, daysOverdue:daysUntil(e.endDate,weekEndDate), reason:`Contract expires in ${daysUntil(e.endDate,weekEndDate)} day(s)`, recommendedAction:"Initiate renewal or notify client immediately." }}
                        clientName={selectedClient}
                        senderName={senderName}
                      />
                    </div>
                  ))}

                  {/* Stuck agreements */}
                  {selectedReport.stuckAgreement.map(e => (
                    <div key={`hub-agr-${e._id}`} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #fde68a",backgroundColor:"#fffbeb"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{width:7,height:7,borderRadius:"50%",backgroundColor:"#d97706",flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontSize:13,fontWeight:700,color:"#1f2937"}}>{e.name}</span>
                        <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,backgroundColor:"#fef9c3",color:"#854d0e"}}>Agreement Delayed</span>
                      </div>
                      <span style={{fontSize:11,color:"#6b7280"}}>Agreement sent — waiting {selectedReport.stageAge(e)} day{selectedReport.stageAge(e)===1?"":"s"} without signature</span>
                      <IssueActionBar
                        issue={{ name:e.name, type:"Agreement Sent", workflowStatus:e.workflowStatus, daysOverdue:selectedReport.stageAge(e), reason:`Agreement sent ${selectedReport.stageAge(e)} day(s) ago — no signature yet`, recommendedAction:"Follow up with client to sign the agreement." }}
                        clientName={selectedClient}
                        senderName={senderName}
                      />
                    </div>
                  ))}

                  {/* Stuck Qiwa */}
                  {selectedReport.stuckQiwa.map(e => (
                    <div key={`hub-qiwa-${e._id}`} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #ddd6fe",backgroundColor:"#f5f3ff"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{width:7,height:7,borderRadius:"50%",backgroundColor:"#7c3aed",flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontSize:13,fontWeight:700,color:"#1f2937"}}>{e.name}</span>
                        <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,backgroundColor:"#ede9fe",color:"#5b21b6"}}>Qiwa Delayed</span>
                      </div>
                      <span style={{fontSize:11,color:"#6b7280"}}>Qiwa submitted — {selectedReport.stageAge(e)} day{selectedReport.stageAge(e)===1?"":"s"} in queue</span>
                      <IssueActionBar
                        issue={{ name:e.name, type:"Qiwa Pending", workflowStatus:e.workflowStatus, daysOverdue:selectedReport.stageAge(e), reason:`Qiwa submitted ${selectedReport.stageAge(e)} day(s) ago — awaiting government approval`, recommendedAction:"Check Qiwa portal. Escalate to GR team if over 7 days." }}
                        clientName={selectedClient}
                        senderName={senderName}
                      />
                    </div>
                  ))}

                  {/* Stuck docs */}
                  {selectedReport.stuckDocs.map(e => (
                    <div key={`hub-docs-${e._id}`} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #fed7aa",backgroundColor:"#fff7ed"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{width:7,height:7,borderRadius:"50%",backgroundColor:"#ea580c",flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontSize:13,fontWeight:700,color:"#1f2937"}}>{e.name}</span>
                        <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,backgroundColor:"#ffedd5",color:"#9a3412"}}>Docs Delayed</span>
                      </div>
                      <span style={{fontSize:11,color:"#6b7280"}}>Documents requested — {selectedReport.stageAge(e)} day{selectedReport.stageAge(e)===1?"":"s"} with no response</span>
                      <IssueActionBar
                        issue={{ name:e.name, type:"Docs Requested", workflowStatus:e.workflowStatus, daysOverdue:selectedReport.stageAge(e), reason:`Documents requested ${selectedReport.stageAge(e)} day(s) ago — no submission yet`, recommendedAction:"Chase employee or partner for the missing documents." }}
                        clientName={selectedClient}
                        senderName={senderName}
                      />
                    </div>
                  ))}

                  {/* Missing PO */}
                  {selectedReport.missingPO.map(e => (
                    <div key={`hub-po-${e._id}`} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #e5e7eb",backgroundColor:"#f9fafb"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{width:7,height:7,borderRadius:"50%",backgroundColor:"#6b7280",flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontSize:13,fontWeight:700,color:"#1f2937"}}>{e.name}</span>
                        <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,backgroundColor:"#f3f4f6",color:"#374151"}}>Missing PO</span>
                      </div>
                      <span style={{fontSize:11,color:"#6b7280"}}>PO number missing — required for invoice processing</span>
                      <IssueActionBar
                        issue={{ name:e.name, type:"Missing PO", workflowStatus:e.workflowStatus, reason:"PO number missing — required for invoice processing", recommendedAction:"Request PO number from client finance team." }}
                        clientName={selectedClient}
                        senderName={senderName}
                      />
                    </div>
                  ))}
                </div>
              </WCard>
            )}

            {/* Email preview */}
            {showPreview && <EmailPreview html={emailHTML}/>}

          </div>
        </div>
      )}

    </div>
  );
}