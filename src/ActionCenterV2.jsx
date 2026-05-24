// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ ActionCenter — Sprint 1: Central Operational Brain
//
// - يستخدم useOperationalIssues() كمصدر وحيد للـ issues
// - Tabs: Urgent · Follow-ups · Payroll · Approvals · Renewals · Blockers
// - Quick Actions لكل issue: Send reminder · Escalate · Open employee ·
//   Mark resolved · Move workflow
//
// الاستخدام في App.jsx (استبدل الـ ActionCenter الموجود):
//   import { ActionCenter } from './ActionCenterV2';
//   {nav==="action" && <ActionCenter employees={employees} setEmployees={setEmployees} onNavigate={...} />}
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from "react";
import {
  AlertCircle, Clock, DollarSign, CheckCircle, RefreshCw, ShieldAlert,
  Send, ArrowUpCircle, ExternalLink, CheckSquare, GitBranch,
  ChevronDown, ChevronRight, X, Zap, Search, Filter, Users, User,
  Bell, TrendingUp, BarChart2, FileText, Building2,
  Copy, Check, Mail, MessageCircle, Layers,
} from "lucide-react";
import { useOperationalIssues } from "./useOperationalIssues";

// ─── Brand colors (ساعتك matches App.jsx) ─────────────────────────────────
const M  = "#800000";
const MD = "#5c0000";
const ML = "#a83232";

const waHref = (phone) => {
  const c = (phone || "").replace(/[^0-9+]/g, "").replace(/^\+/, "");
  return c.length > 6 ? `https://wa.me/${c}` : null;
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT SHARE BAR — بيشارك كل الـ issues اللي شايفاهم دلوقتي كـ report واحد
// ═══════════════════════════════════════════════════════════════════════════════
function buildReport(issues, label, exportType = "internal") {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const byClient = {};
  issues.forEach(i => {
    const c = i.employee?.client || "Unknown";
    if (!byClient[c]) byClient[c] = [];
    byClient[c].push(i);
  });

  if (exportType === "client") {
    // ── Client-Ready Export: clean, no internal noise ──────────────────────
    const lines = [
      `📋 Operational Status Report`,
      `📅 ${date}`,
      ``,
    ];
    Object.entries(byClient).forEach(([client, items]) => {
      lines.push(`── ${client} ──`);
      items.forEach(i => {
        const emp   = i.employee?.name || "—";
        const stage = i.employee?.workflowStatus || "";
        const label = stdLabel(i.label);
        const days  = i.daysLeft != null ? ` · ${i.daysLeft}d remaining` : "";
        lines.push(`• ${emp}${days}`);
        lines.push(`  Status: ${stage}`);
        lines.push(`  Action Required: ${label}`);
        lines.push("");
      });
    });
    lines.push("Fisheye Ops Pro");
    return lines.join("\n");
  }

  // ── Internal Export: full details ─────────────────────────────────────────
  const lines = [
    `📋 ${label} — Internal Ops Report`,
    `📅 ${date}  |  🔢 ${issues.length} issues`,
    ``,
  ];
  Object.entries(byClient).forEach(([client, items]) => {
    const owner = resolveOwner(client);
    lines.push(`── ${client} (${items.length}) · Owner: ${owner} ──`);
    items.forEach(i => {
      const emp      = i.employee?.name || "—";
      const severity = (i.severity || "").toUpperCase();
      const label    = stdLabel(i.label);
      const days     = i.daysLeft != null ? ` · ${i.daysLeft}d` : "";
      lines.push(`  [${severity}] ${emp}${days}`);
      lines.push(`  Issue: ${label}`);
    });
    lines.push("");
  });
  lines.push("_Fisheye Ops Pro — Internal Use Only_");
  return lines.join("\n");
}

function buildReportEmail(issues, label) {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const byClient = {};
  issues.forEach(i => {
    const c = i.employee?.client || "Unknown";
    if (!byClient[c]) byClient[c] = [];
    byClient[c].push(i);
  });
  const subject = `${label} — ${date}`;
  const bodyLines = [`${label}`, `Date: ${date}`, `Total: ${issues.length} issue${issues.length===1?"":"s"}`, ""];
  Object.entries(byClient).forEach(([client, items]) => {
    bodyLines.push(`${client} (${items.length})`);
    bodyLines.push("─".repeat(36));
    items.forEach(i => {
      const days = i.daysLeft != null ? ` — ${i.daysLeft}d remaining` : "";
      bodyLines.push(`  ${i.employee?.name || "—"}${days}`);
      bodyLines.push(`  ${i.label}`);
      bodyLines.push("");
    });
  });
  bodyLines.push("Best regards,\nFisheye Ops");
  return { subject, body: bodyLines.join("\n") };
}

function exportToExcel(issues, label) {
  const date = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  const headers = [
    "Employee", "Client", "Project", "Position",
    "Issue", "Severity", "Days Left", "Contract End",
    "Workflow Status", "Owner", "Recommended Action", "Phone"
  ];
  const rows = issues.map(i => {
    const e = i.employee || {};
    return [
      e.name || "—",
      e.client || "—",
      e.project || "—",
      e.position || "—",
      stdLabel(i.label),
      i.severity || "—",
      i.daysLeft != null ? i.daysLeft : "—",
      e.endDate || "—",
      e.workflowStatus || "—",
      resolveOwner(e.client),
      i.recommendedAction || i.nextAction || "—",
      e.phone || "—",
    ];
  });

  const escape = v => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [
    `${label} — ${date}`,
    "",
    headers.map(escape).join(","),
    ...rows.map(r => r.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${label.replace(/[^a-zA-Z0-9]/g, "_")}_${date.replace(/ /g,"_")}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ReportShareBar({ issues, label, color }) {
  const [copiedInt, setCopiedInt] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  if (!issues || issues.length === 0) return null;

  const copy = (text, setter) => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    });
    setter(true);
    setTimeout(() => setter(false), 2400);
  };

  const { subject, body } = buildReportEmail(issues, label);

  const bs = (active, _baseColor) => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700,
    border: `1.5px solid ${active ? "#16a34a" : "#d1d5db"}`,
    backgroundColor: active ? "#f0fdf4" : "white",
    color: active ? "#16a34a" : "#374151",
    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: color, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Export:
      </span>
      <button onClick={() => copy(buildReport(issues, label, "internal"), setCopiedInt)} style={bs(copiedInt, "rgba(255,255,255,0.6)")}>
        {copiedInt ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Internal</>}
      </button>
      <button onClick={() => copy(buildReport(issues, label, "client"), setCopiedCli)} style={bs(copiedCli, "rgba(255,255,255,0.6)")}>
        {copiedCli ? <><Check size={11}/> Copied!</> : <><Building2 size={11}/> Client View</>}
      </button>
      <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")} style={bs(false, "rgba(255,255,255,0.6)")}>
        <Mail size={11}/> Email
      </button>
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildReport(issues, label, "internal"))}`, "_blank")} style={bs(false, "rgba(255,255,255,0.6)")}>
        <MessageCircle size={11}/> WA
      </button>
      <button onClick={() => exportToExcel(issues, label)} style={bs(false, "#86efac")}>
        <FileText size={11}/> Excel
      </button>
    </div>
  );
}

// ─── Workflow options (same as App.jsx) ───────────────────────────────────────
const WORKFLOW_OPTS = [
  "Docs Requested", "Docs Received", "Docs Received +", "Agreement Sent",
  "Agreement Signed", "Pending", "Complete", "Rejected",
  "Qiwa Submitted", "Qiwa Approved", "Onboarding", "Iqama Transferred",
];

// ═══════════════════════════════════════════════════════════════════════════════
// TAB CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  {
    key: "urgent",
    label: "Urgent",
    emoji: "🔴",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fca5a5",
    icon: AlertCircle,
    desc: "Action required today",
  },
  {
    key: "followups",
    label: "Follow-ups",
    emoji: "🟡",
    color: "#d97706",
    bg: "#fef9c3",
    border: "#fde047",
    icon: Clock,
    desc: "Awaiting response",
  },
  {
    key: "payroll",
    label: "Payroll",
    emoji: "💰",
    color: "#7c3aed",
    bg: "#f3e8ff",
    border: "#c4b5fd",
    icon: DollarSign,
    desc: "Financial blockers",
  },
  {
    key: "approvals",
    label: "Approvals",
    emoji: "✅",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    icon: CheckCircle,
    desc: "Pending sign-off",
  },
  {
    key: "renewals",
    label: "Renewals",
    emoji: "🔄",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
    icon: RefreshCw,
    desc: "Expiring contracts",
  },
  {
    key: "partner",
    label: "Partner Ops",
    emoji: "🤝",
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    icon: Users,
    desc: "Partner & transfer tracking",
  },
  {
    key: "blockers",
    label: "Blockers",
    emoji: "🚫",
    color: "#374151",
    bg: "#f3f4f6",
    border: "#d1d5db",
    icon: ShieldAlert,
    desc: "Missing data",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const ACTION_META = {
  send_reminder:   { label: "Send Reminder",    icon: Send,          color: "#2563eb", bg: "#dbeafe" },
  follow_up:       { label: "Follow Up",         icon: Bell,          color: "#d97706", bg: "#fef9c3" },
  escalate:        { label: "Escalate",          icon: ArrowUpCircle, color: "#dc2626", bg: "#fee2e2" },
  open_employee:   { label: "Open Employee",     icon: ExternalLink,  color: M,         bg: "#fff5f5" },
  mark_resolved:   { label: "Resolve Issue",     icon: CheckSquare,   color: "#16a34a", bg: "#dcfce7" },
  move_workflow:   { label: "Update Workflow",   icon: GitBranch,     color: "#7c3aed", bg: "#f3e8ff" },
  request_po:      { label: "Request PO",        icon: FileText,      color: "#0891b2", bg: "#ecfeff" },
  start_renewal:   { label: "Start Renewal",     icon: RefreshCw,     color: "#16a34a", bg: "#dcfce7" },
  verify_payroll:  { label: "Verify Payroll",    icon: DollarSign,    color: "#7c3aed", bg: "#f3e8ff" },
  contact_partner: { label: "Contact Partner",   icon: Users,         color: "#0369a1", bg: "#e0f2fe" },
};

// ─── Severity badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const cfg = {
    critical: ["#fee2e2", "#991b1b", "🔴 Critical"],
    high:     ["#ffedd5", "#9a3412", "🟠 High"],
    medium:   ["#fef9c3", "#854d0e", "🟡 Medium"],
    low:      ["#f3f4f6", "#374151", "⚪ Low"],
  }[severity] || ["#f3f4f6", "#374151", severity];

  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
      backgroundColor: cfg[0], color: cfg[1],
    }}>
      {cfg[2]}
    </span>
  );
}

// ─── Client Badge ─────────────────────────────────────────────────────────────
const CLIENT_META = {
  "Sela":               { badge: "#bbf7d0", text: "#14532d", dot: "#16a34a" },
  "SPL":                { badge: "#e9d5ff", text: "#4c1d95", dot: "#7c3aed" },
  "Channelplay":        { badge: "#bfdbfe", text: "#1e3a8a", dot: "#2563eb" },
  "Riva Engineering 2": { badge: "#fecdd3", text: "#881337", dot: M },
  "Combuzz HR":         { badge: "#fed7aa", text: "#7c2d12", dot: "#ea580c" },
};

function ClientBadge({ client }) {
  const m = CLIENT_META[client] || { badge: "#e5e7eb", text: "#374151", dot: "#6b7280" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700,
      backgroundColor: m.badge, color: m.text,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: m.dot }} />
      {client}
    </span>
  );
}

// ─── Workflow Picker (inline dropdown for Move Workflow action) ───────────────
function WorkflowPicker({ onPick, onClose }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
      backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 200, overflow: "hidden",
    }}>
      <div style={{
        padding: "7px 12px", borderBottom: "1px solid #f3f4f6",
        fontSize: 10, fontWeight: 700, color: "#6b7280", backgroundColor: "#fdf8f8",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        Set Workflow
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
          <X size={11} />
        </button>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {WORKFLOW_OPTS.map((opt) => (
          <button key={opt} onClick={() => onPick(opt)} style={{
            width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 12,
            border: "none", backgroundColor: "transparent", cursor: "pointer",
            color: "#374151",
          }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Standardize any Arabic text coming from the hook ────────────────────────
const REASON_MAP = {
  "ينتهي خلال": "Expires in",
  "يوم": "day(s)",
  "أيام": "days",
  "انتهى": "Expired",
  "في انتظار": "Pending",
  "متأخر": "Delayed",
  "مطلوب": "Required",
  "ناقص": "Missing",
  "معلق": "Pending",
  "لم يتم": "Not completed",
};
function stdText(text) {
  if (!text) return text;
  // already English
  if (!/[\u0600-\u06FF]/.test(text)) return text;
  // try LABEL_MAP first
  if (LABEL_MAP[text]) return LABEL_MAP[text];
  // replace known patterns
  let out = text;
  Object.entries(REASON_MAP).forEach(([ar, en]) => {
    out = out.replace(new RegExp(ar, "g"), en);
  });
  return out;
}
const CLIENT_OWNER = {
  "Sela":               "Nessma Mamdouh",
  "SPL":                "Nessma Mamdouh",
  "Channelplay":        "Nessma Mamdouh",
  "Riva Engineering 2": "Nessma Mamdouh",
  "Combuzz HR":         "Nessma Mamdouh",
};
function resolveOwner(client) { return CLIENT_OWNER[client] || "Ops Team"; }

// ─── Standardize issue label → English ───────────────────────────────────────
const LABEL_MAP = {
  "مطلوب تجديد":        "Renewal Required",
  "مفيش تجديد":         "Renewal Not Confirmed",
  "خطر فاتورة":         "Missing PO",
  "عقد قرب ينتهي":     "Contract Expiring",
  "نقل إقامة متأخر":   "Iqama Transfer Delayed",
  "مستندات ناقصة":     "Missing Documents",
  "لم يتم إصدار فاتورة":"Invoice Pending",
  "موافقة معلقة":      "Approval Pending",
};
function stdLabel(label) {
  if (!label) return label;
  return LABEL_MAP[label] || label;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ISSUE CARD — redesigned Sprint 1
// ═══════════════════════════════════════════════════════════════════════════════
function IssueCard({
  issue,
  tabCfg,
  resolvedIds,
  onResolve,
  onUpdateWorkflow,
  onOpenEmployee,
  onSendReminder,
  onEscalate,
  resolvePartnerContact,
}) {
  const [showWFPicker, setShowWFPicker] = useState(false);
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);
  const { employee: e, severity, actions } = issue;
  const label = stdText(stdLabel(issue.label));
  const isResolved = resolvedIds.has(issue.id);
  const owner = resolveOwner(e?.client);
  const wa = waHref(e?.phone);

  // Resolve full partner record for contact picker
  const partnerKey     = issue.partnerName || e?.partnerAssigned;
  const partnerRecord  = resolvePartnerContact?.(partnerKey, true); // full record
  const partnerContacts = partnerRecord?.contacts || [];

  const handleAction = (action) => {
    switch (action) {
      case "send_reminder":   onSendReminder(issue); break;
      case "follow_up":       onSendReminder(issue); break;
      case "escalate":        onEscalate(issue); break;
      case "open_employee":   onOpenEmployee(issue); break;
      case "mark_resolved":   onResolve(issue.id); break;
      case "move_workflow":   setShowWFPicker(true); break;
      case "start_renewal":   onOpenEmployee(issue); break;
      case "request_po":      onOpenEmployee(issue); break;
      case "verify_payroll":  onOpenEmployee(issue); break;
      case "contact_partner": {
        if (partnerContacts.length > 0) {
          setShowPartnerPicker(true);
        } else {
          // no contacts registered — open employee as fallback
          onOpenEmployee(issue);
        }
        break;
      }
    }
  };

  if (isResolved) return null;

  const severityColor = severity === "critical" ? "#dc2626" : severity === "high" ? "#ea580c" : tabCfg.color;

  return (
    <div style={{
      backgroundColor: "white",
      border: `1px solid #e5e7eb`,
      borderLeft: `3px solid ${severityColor}`,
      borderRadius: 10,
    }}>
      {/* ── Main row ── */}
      <div style={{ padding: "11px 14px" }}>
        {/* Row 1: Name + badges + WA */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{e?.name || "—"}</span>
              {e?.client && <ClientBadge client={e.client} />}
              <SeverityBadge severity={severity} />
              {issue.daysLeft != null && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                  backgroundColor: issue.daysLeft <= 3 ? "#fee2e2" : "#fff7ed",
                  color: issue.daysLeft <= 3 ? "#991b1b" : "#9a3412",
                }}>
                  {issue.daysLeft === 0 ? "Today" : `${issue.daysLeft}d`}
                </span>
              )}
            </div>
            {/* Row 2: Issue label */}
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#374151" }}>
              {label}
            </p>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
              color: "white", padding: "5px 10px", borderRadius: 8,
              backgroundColor: "#16a34a", textDecoration: "none", flexShrink: 0,
            }}>
              💬 WA
            </a>
          )}
        </div>

        {/* Row 3: Meta */}
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9ca3af", flexWrap: "wrap", marginBottom: 8 }}>
          {e?.position && <span>{e.position}</span>}
          {e?.project  && <span>· {e.project}</span>}
          {e?.endDate  && <span>· Ends {fmt(e.endDate)}</span>}
          <span style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
            <User size={10}/> {owner}
          </span>
        </div>

        {/* ── WorkflowPicker ── */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", position: "relative" }}>
          {(actions || []).map((action) => {
            const meta = ACTION_META[action];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div key={action} style={{ position: "relative" }}>
                <button
                  onClick={() => handleAction(action)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${meta.color}40`,
                    backgroundColor: meta.bg, color: meta.color, cursor: "pointer",
                  }}
                >
                  <Icon size={11} /> {meta.label}
                </button>
                {action === "move_workflow" && showWFPicker && (
                  <WorkflowPicker
                    onPick={(wf) => { onUpdateWorkflow(e._id, wf); setShowWFPicker(false); }}
                    onClose={() => setShowWFPicker(false)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Partner Contact Picker modal ── */}
      {showPartnerPicker && (
        <PartnerContactPicker
          partnerName={partnerKey}
          contacts={partnerContacts}
          partnerEmail={partnerRecord?.email}
          employee={e}
          onClose={() => setShowPartnerPicker(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB NAV BAR — horizontal strip like Finance module
// ═══════════════════════════════════════════════════════════════════════════════
function TabNavBar({ counts, activeTab, setActiveTab }) {
  return (
    <div style={{ display: "flex", gap: 1, borderBottom: "1px solid #e5e7eb", marginBottom: 0 }}>
      {TABS.map((tab) => {
        const count = counts[tab.key] || 0;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "10px 16px",
              fontSize: 12, fontWeight: isActive ? 800 : 500,
              color: isActive ? tab.color : "#6b7280",
              background: isActive ? `${tab.color}0d` : "transparent",
              border: "none",
              borderBottom: `3px solid ${isActive ? tab.color : "transparent"}`,
              borderRadius: "6px 6px 0 0",
              cursor: "pointer",
              marginBottom: -1,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 13 }}>{tab.emoji}</span>
            {tab.label}
            {count > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 18, height: 18, borderRadius: 999, padding: "0 5px",
                backgroundColor: isActive ? tab.color : (count > 0 && tab.key === "urgent" ? "#dc2626" : "#e5e7eb"),
                color: isActive ? "white" : (tab.key === "urgent" && count > 0 ? "white" : "#6b7280"),
                fontSize: 10, fontWeight: 800, lineHeight: 1,
              }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTNER CONTACT PICKER — choose who to contact + WA or Email
// ═══════════════════════════════════════════════════════════════════════════════
function PartnerContactPicker({ partnerName, contacts, partnerEmail, employee: e, onClose }) {
  const [selected, setSelected] = useState(contacts[0]?.name || "");

  const contact = contacts.find(c => c.name === selected) || contacts[0];
  const empName = e?.name || "the employee";

  const buildMsg = () => [
    `Hello ${contact?.name || partnerName},`,
    ``,
    `Please be advised that Qiwa has been *approved* for *${empName}* (${e?.client || ""}).`,
    ``,
    `Kindly proceed with the *Iqama Transfer* at your earliest convenience.`,
    ``,
    `Fisheye Ops Pro`,
  ].join("\n");

  const sendWA = () => {
    const phone = (contact?.phone || "").replace(/\D/g, "");
    if (!phone) { alert("No phone number for this contact."); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildMsg())}`, "_blank");
    onClose();
  };

  const sendEmail = () => {
    const email = contact?.email || partnerEmail || "";
    if (!email) { alert("No email address for this contact."); return; }
    const subject = `Iqama Transfer Required — ${empName}`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMsg())}`, "_blank");
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, zIndex: 200,
    }} onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div style={{
        backgroundColor: "white", borderRadius: 14, width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderRadius: "14px 14px 0 0",
          background: `linear-gradient(135deg, #0c4a6e, #0369a1)`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white" }}>
              🤝 Contact Partner
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(200,230,255,0.85)" }}>
              {partnerName} · re: {empName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
            <X size={16}/>
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Issue context */}
          <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#e0f2fe", border: "1px solid #7dd3fc", fontSize: 12, color: "#0369a1", fontWeight: 600 }}>
            Iqama Transfer Pending — Qiwa Approved for {empName}
          </div>

          {/* Contact selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select Contact
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {contacts.map(c => (
                <button key={c.name} onClick={() => setSelected(c.name)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${selected === c.name ? "#0369a1" : "#e5e7eb"}`,
                  backgroundColor: selected === c.name ? "#e0f2fe" : "white",
                  textAlign: "left",
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{c.name}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 11, color: "#6b7280" }}>{c.role}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {c.phone && <p style={{ margin: 0, fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{c.phone}</p>}
                    {selected === c.name && <span style={{ fontSize: 10, color: "#0369a1", fontWeight: 700 }}>Selected ✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb",
              backgroundColor: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={sendEmail} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              backgroundColor: "#2563eb", color: "white", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Mail size={13}/> Send Email
            </button>
            <button onClick={sendWA} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              backgroundColor: "#16a34a", color: "white", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <MessageCircle size={13}/> Send WA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
function EscalationModal({ issue, onClose, onConfirm, clients = [] }) {
  const e   = issue.employee;
  const clientRecord = clients.find(c => c.name === e?.client);
  const clientContacts = clientRecord?.contacts || [];
  const clientEmail    = clientRecord?.email || "";

  const [to,          setTo]          = useState("client_contact");
  const [selectedContact, setSelectedContact] = useState(
    clientContacts[0]?.name || ""
  );
  const [externalName,  setExternalName]  = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalPhone, setExternalPhone] = useState("");
  const [note,          setNote]          = useState("");
  const [sending,       setSending]       = useState(false);

  const label = stdText(stdLabel(issue.label));

  const resolvedContact = (() => {
    if (to === "client_contact") {
      const c = clientContacts.find(c => c.name === selectedContact);
      return c ? { name: c.name, role: c.role, phone: c.phone, email: clientEmail } : null;
    }
    if (to === "external") return { name: externalName, phone: externalPhone, email: externalEmail };
    return null;
  })();

  const buildEscalationEmail = () => {
    const subject = `Escalation: ${label} — ${e?.name} (${e?.client})`;
    const body = [
      `Dear ${resolvedContact?.name || "Team"},`,
      ``,
      `This is an escalation notice regarding an operational issue that requires your attention.`,
      ``,
      `Employee:   ${e?.name || "—"}`,
      `Client:     ${e?.client || "—"}`,
      `Issue:      ${label}`,
      `Severity:   ${(issue.severity || "—").toUpperCase()}`,
      e?.endDate ? `Contract ends: ${fmt(e.endDate)}` : null,
      ``,
      note ? `Notes: ${note}` : null,
      ``,
      `Please advise on next steps.`,
      ``,
      `Fisheye Ops Pro`,
    ].filter(l => l !== null).join("\n");
    return { subject, body };
  };

  const handleSendEmail = () => {
    const recipient = resolvedContact?.email || externalEmail;
    if (!recipient) { alert("No email address available for this recipient."); return; }
    const { subject, body } = buildEscalationEmail();
    window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  const handleSendWA = () => {
    const phone = (resolvedContact?.phone || externalPhone || "").replace(/\D/g, "");
    if (!phone) { alert("No phone number available."); return; }
    const { subject, body } = buildEscalationEmail();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, "_blank");
  };

  const inp = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 13, boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, zIndex: 100,
    }} onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div style={{
        backgroundColor: "white", borderRadius: 14, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderRadius: "14px 14px 0 0",
          background: `linear-gradient(135deg, ${MD}, ${M})`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white" }}>🚨 Escalate Issue</h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,200,200,0.85)" }}>
              {e?.name} · {e?.client}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
            <X size={16}/>
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Issue pill */}
          <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#fff5f5", border: "1px solid #fecaca", fontSize: 12, color: "#991b1b", fontWeight: 600 }}>
            {label}
          </div>

          {/* ── Escalate To ── */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Escalate To
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                ["client_contact", `${e?.client || "Client"} Contact`],
                ["ops_manager",    "Operations Manager"],
                ["partner",        "Partner"],
                ["payroll",        "Payroll Team"],
                ["legal",          "Legal Team"],
                ["external",       "External Recipient"],
              ].map(([val, lbl]) => (
                <button key={val} onClick={() => setTo(val)} style={{
                  padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                  border: `1.5px solid ${to === val ? M : "#e5e7eb"}`,
                  backgroundColor: to === val ? `${M}12` : "white",
                  color: to === val ? M : "#6b7280", cursor: "pointer",
                }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* ── Client contacts dropdown ── */}
          {to === "client_contact" && clientContacts.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Contact
              </label>
              <select value={selectedContact} onChange={ev => setSelectedContact(ev.target.value)} style={inp}>
                {clientContacts.map(c => (
                  <option key={c.name} value={c.name}>{c.name} — {c.role} {c.phone ? `· ${c.phone}` : ""}</option>
                ))}
              </select>
              {resolvedContact?.email && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b7280" }}>📧 {resolvedContact.email}</p>
              )}
            </div>
          )}

          {to === "client_contact" && clientContacts.length === 0 && (
            <p style={{ fontSize: 12, color: "#9ca3af", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              No contacts registered for {e?.client}. Add them in the Clients section.
            </p>
          )}

          {/* ── External recipient ── */}
          {to === "external" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                External Recipient
              </label>
              <input style={inp} placeholder="Full name" value={externalName}  onChange={ev => setExternalName(ev.target.value)}/>
              <input style={inp} placeholder="Email address" type="email" value={externalEmail} onChange={ev => setExternalEmail(ev.target.value)}/>
              <input style={inp} placeholder="Phone (with country code)" value={externalPhone} onChange={ev => setExternalPhone(ev.target.value)}/>
            </div>
          )}

          {/* ── Note ── */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Note (Optional)
            </label>
            <textarea
              rows={3} value={note} onChange={ev => setNote(ev.target.value)}
              placeholder="Any additional details or context..."
              style={{ ...inp, resize: "none" }}
            />
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", paddingTop: 4 }}>
            <button onClick={onClose} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb",
              backgroundColor: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Cancel
            </button>
            <button onClick={handleSendWA} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              backgroundColor: "#16a34a", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <MessageCircle size={13}/> Send WA
            </button>
            <button onClick={handleSendEmail} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              backgroundColor: "#2563eb", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Mail size={13}/> Send Email
            </button>
            <button onClick={() => { onConfirm({ to, note, contact: resolvedContact }); }} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              backgroundColor: "#dc2626", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <ArrowUpCircle size={13}/> Log Escalation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ACTION CENTER
// ═══════════════════════════════════════════════════════════════════════════════
export function ActionCenter({ employees = [], setEmployees, onNavigate, clients = [], partners = [] }) {

  // ─── Resolve partner phone from partners array ────────────────────────────
  const resolvePartnerContact = useCallback((partnerAssigned, fullRecord = false) => {
    if (!partnerAssigned) return null;
    const p = partners.find(p =>
      p.id === partnerAssigned || p.name === partnerAssigned
    );
    if (!p) return null;
    if (fullRecord) return { name: p.name, email: p.email, contacts: p.contacts || [] };
    const contact = (p.contacts || []).find(c => c.phone);
    return {
      name:  contact?.name || p.name,
      phone: contact?.phone || null,
      email: p.email || null,
    };
  }, [partners]);
  const issues = useOperationalIssues(employees);

  const [activeTab, setActiveTab] = useState("urgent");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [resolvedIds, setResolvedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("fisheye_resolved_issues");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [escalationIssue, setEscalationIssue] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [toast, setToast] = useState(null);

  const tabCfg = TABS.find((t) => t.key === activeTab) || TABS[0];

  // ─── Partner tab issues ─────────────────────────────────────────────────────
  const partnerIssues = useMemo(() => {
    // 1. Existing issues flagged as partner/iqama from the hook
    const fromHook = (issues.all || []).filter(i => {
      const lbl = (i.label || "").toLowerCase();
      const wf  = (i.employee?.workflowStatus || "").toLowerCase();
      return (
        lbl.includes("iqama") || lbl.includes("transfer") ||
        lbl.includes("partner") || lbl.includes("missing doc") ||
        lbl.includes("settlement") || lbl.includes("payroll confirm") ||
        wf.includes("iqama") || wf.includes("qiwa") ||
        i.type === "iqama_transfer" || i.type === "partner"
      );
    });

    // 2. Employees with "Qiwa Approved" → route by profitMode
    const qiwaApproved = employees
      .filter(e =>
        !["expired","resigned"].includes((e.status||"").toLowerCase()) &&
        (e.workflowStatus||"").toLowerCase() === "qiwa approved"
      )
      .map(e => {
        const isPartner = e.profitMode === "partner" && e.partnerAssigned;
        return {
          id:       `iqama_pending_${e._id}`,
          type:     isPartner ? "iqama_transfer" : "followup_iqama",
          label:    isPartner ? "Iqama Transfer Pending — Partner Action" : "Iqama Transfer Pending — Follow Up",
          severity: "high",
          daysLeft: null,
          employee: e,
          client:   e.client,
          reason:   isPartner
            ? `Qiwa approved — partner (${e.partnerAssigned}) must complete Iqama transfer`
            : "Qiwa approved — awaiting Iqama transfer confirmation",
          recommendedAction: isPartner
            ? `Contact ${e.partnerAssigned} to initiate Iqama transfer`
            : "Follow up with employee — confirm Iqama transfer is in progress",
          actions: isPartner
            ? ["contact_partner", "send_reminder", "open_employee", "mark_resolved"]
            : ["send_reminder", "follow_up", "open_employee", "mark_resolved"],
          partnerPhone: e.partnerPhone || null,
          partnerName:  e.partnerAssigned || null,
          // used to route to correct tab
          _tab: isPartner ? "partner" : "followups",
        };
      });

    // Merge, deduplicate by id
    const seen = new Set(fromHook.map(i => i.id));
    const merged = [...fromHook];
    qiwaApproved.forEach(i => { if (!seen.has(i.id)) merged.push(i); });
    return merged;
  }, [issues, employees]);

  // ─── Filter issues for active tab ─────────────────────────────────────────
  const tabIssues = useMemo(() => {
    let raw;
    if (activeTab === "partner") {
      // partner tab: hook partner issues + qiwa approved with partner
      raw = partnerIssues.filter(i => i._tab === "partner" || !i._tab);
    } else if (activeTab === "followups") {
      // followups tab: hook followups + qiwa approved direct
      const hookFollowups = issues["followups"] || [];
      const qiwaDirect = partnerIssues.filter(i => i._tab === "followups");
      raw = [...hookFollowups, ...qiwaDirect];
    } else {
      raw = issues[activeTab] || [];
    }

    let list = raw;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.employee?.name || "").toLowerCase().includes(q) ||
        (i.employee?.project || "").toLowerCase().includes(q) ||
        (i.label || "").toLowerCase().includes(q)
      );
    }
    if (severityFilter !== "all") list = list.filter(i => i.severity === severityFilter);
    if (clientFilter !== "all")   list = list.filter(i => i.employee?.client === clientFilter);
    return list;
  }, [issues, activeTab, partnerIssues, search, severityFilter, clientFilter]);

  const visibleIssues = tabIssues.filter((i) => !resolvedIds.has(i.id));

  // ── Counts after subtracting resolved ─────────────────────────────────────
  const adjustedCounts = useMemo(() => {
    const result = { ...issues.counts };
    // For each tab, count how many of its issues are resolved
    TABS.forEach(t => {
      let tabList;
      if (t.key === "partner") {
        tabList = partnerIssues.filter(i => i._tab === "partner" || !i._tab);
      } else if (t.key === "followups") {
        const hookFollowups = issues["followups"] || [];
        const qiwaDirect = partnerIssues.filter(i => i._tab === "followups");
        tabList = [...hookFollowups, ...qiwaDirect];
      } else {
        tabList = issues[t.key] || [];
      }
      const resolvedInTab = tabList.filter(i => resolvedIds.has(i.id)).length;
      result[t.key] = Math.max(0, (result[t.key] || 0) - resolvedInTab);
    });
    // recalc partner count
    const partnerList = partnerIssues.filter(i => i._tab === "partner" || !i._tab);
    result.partner = Math.max(0, partnerList.filter(i => !resolvedIds.has(i.id)).length);
    // recalc critical badge
    result.critical = Math.max(0, (issues.counts.critical || 0) -
      (issues.all || []).filter(i => resolvedIds.has(i.id) && i.severity === "critical").length);
    result.total = Math.max(0, (issues.counts.total || 0) - resolvedIds.size);
    return result;
  }, [issues, partnerIssues, resolvedIds]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, color = "#16a34a") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleResolve = useCallback((id) => {
    setResolvedIds((prev) => {
      const next = new Set([...prev, id]);
      try {
        // store as [{id, ts}] — auto-expire after 48h
        const stored = JSON.parse(localStorage.getItem("fisheye_resolved_meta") || "[]");
        stored.push({ id, ts: Date.now() });
        // purge entries older than 48h
        const fresh = stored.filter(e => Date.now() - e.ts < 172800000);
        localStorage.setItem("fisheye_resolved_meta", JSON.stringify(fresh));
        localStorage.setItem("fisheye_resolved_issues", JSON.stringify([...next]));
      } catch {}
      return next;
    });
    showToast("✅ Marked as Resolved");
  }, [showToast]);

  const handleUpdateWorkflow = useCallback((empId, newWF) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e._id === empId
          ? {
              ...e,
              workflowStatus: newWF,
              wfDate: new Date().toISOString().split("T")[0],
              auditLog: [
                ...(Array.isArray(e.auditLog) ? e.auditLog : []),
                { ts: new Date().toISOString(), action: `Workflow → ${newWF} (from ActionCenter)` },
              ],
            }
          : e
      )
    );
    showToast(`🔄 Workflow updated → ${newWF}`);
  }, [setEmployees, showToast]);

  const handleOpenEmployee = useCallback((issue) => {
    // Navigate to workforce view — in the real app this could open the profile modal
    if (onNavigate) onNavigate("workforce");
    showToast(`📂 Opening ${issue.employee?.name}`);
  }, [onNavigate, showToast]);

  const handleSendReminder = useCallback((issue) => {
    const e  = issue.employee;
    const wa = waHref(e?.phone);
    if (wa) {
      const isIqama = issue.type === "iqama_transfer" ||
        (issue.label || "").toLowerCase().includes("iqama");
      const msg = isIqama
        ? `Hello ${e?.name},\n\nYour Qiwa request has been *approved*. The next step is to complete your *Iqama Transfer*.\n\nPlease coordinate with your partner or contact the Fisheye Ops team.\n\nFisheye Ops Pro`
        : `Hello ${e?.name},\n\nThis is a follow-up regarding: ${stdLabel(issue.label)}\n\nPlease contact the Fisheye Ops team at your earliest convenience.\n\nFisheye Ops Pro`;
      window.open(`https://wa.me/${(e?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
      showToast(`💬 Reminder sent to ${e?.name}`);
    } else {
      showToast("⚠️ No phone number on file for this employee", "#d97706");
    }
  }, [showToast]);

  const handleEscalate = useCallback((issue) => {
    setEscalationIssue(issue);
  }, []);

  const handleEscalateConfirm = useCallback(({ to, note }) => {
    const e = escalationIssue?.employee;
    console.log("ESCALATED:", { issue: escalationIssue?.id, to, note, employee: e?.name });
    showToast(`🚨 Escalated to ${to}`);
    setEscalationIssue(null);
  }, [escalationIssue, showToast]);

  const clientsInIssues = useMemo(() => {
    const set = new Set(issues.all.map((i) => i.employee?.client).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [issues]);

  // ─── Stats for stats panel ─────────────────────────────────────────────────
  const topClients = useMemo(() => {
    return Object.entries(issues.byClient)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
  }, [issues.byClient]);

  const resolvedCount = resolvedIds.size;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: M, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={15} style={{ color: "white" }} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
              Action Center
            </h1>
            {adjustedCounts.critical > 0 && (
              <span style={{ fontSize: 11, fontWeight: 900, padding: "2px 9px", borderRadius: 999, backgroundColor: "#dc2626", color: "white" }}>
                {adjustedCounts.critical} critical
              </span>
            )}
          </div>
          <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
            {adjustedCounts.total} open issues · {resolvedCount} resolved this session
          </p>
        </div>
        <button
          onClick={() => setShowStats((s) => !s)}
          style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1px solid ${showStats ? M : "#e5e7eb"}`,
            backgroundColor: showStats ? `${M}10` : "white",
            color: showStats ? M : "#6b7280", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <BarChart2 size={13} /> Stats
        </button>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Issues",    value: adjustedCounts.total || 0,    color: M,         accent: M,         bg: "#fff5f5", border: `${M}22`  },
          { label: "Critical",        value: adjustedCounts.critical || 0, color: "#dc2626", accent: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
          { label: "Resolved",        value: resolvedCount,                color: "#059669", accent: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Payroll Blockers",value: adjustedCounts.payroll || 0,  color: "#7c3aed", accent: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
        ].map(k => (
          <div key={k.label} style={{ padding: "13px 15px", borderRadius: 10, backgroundColor: k.bg, border: `1px solid ${k.border}`, borderLeft: `4px solid ${k.accent}` }}>
            <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</p>
            <p style={{ color: k.color, margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Stats Panel ─────────────────────────────────────────────────────── */}
      {showStats && (
        <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "white", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Issues by Category</p>
            {TABS.map((tab) => {
              const count = adjustedCounts[tab.key] || 0;
              const pct = issues.counts.total ? Math.round(count / issues.counts.total * 100) : 0;
              return (
                <div key={tab.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 11, width: 90, color: tab.color, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {tab.emoji} {tab.label}
                  </span>
                  <div style={{ flex: 1, height: 5, backgroundColor: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: tab.color, borderRadius: 999, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af", width: 22, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Top Clients with Issues</p>
            {topClients.map(([client, clientIssues]) => (
              <div key={client} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
                <ClientBadge client={client} />
                <span style={{ fontSize: 12, fontWeight: 800, color: M, backgroundColor: `${M}10`, padding: "2px 9px", borderRadius: 999, fontFamily: "monospace" }}>
                  {clientIssues.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <TabNavBar counts={adjustedCounts} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Filters row ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        padding: "10px 14px", backgroundColor: "#f9fafb",
        border: "1px solid #f3f4f6", borderTop: "none", borderRadius: "0 0 0 0",
        marginBottom: 12,
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#d1d5db" }} />
          <input
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder="Search employee, project, issue..."
            style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 12, boxSizing: "border-box", backgroundColor: "white", outline: "none" }}
          />
        </div>

        {/* Severity pills */}
        <div style={{ display: "flex", gap: 2, backgroundColor: "#e5e7eb", borderRadius: 7, padding: 2 }}>
          {["all", "critical", "high", "medium", "low"].map((sev) => {
            const sevColor = sev === "critical" ? "#dc2626" : sev === "high" ? "#ea580c" : sev === "medium" ? "#d97706" : "#6b7280";
            return (
              <button key={sev} onClick={() => setSeverityFilter(sev)} style={{
                padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                backgroundColor: severityFilter === sev ? "white" : "transparent",
                color: severityFilter === sev ? (sev === "all" ? "#111827" : sevColor) : "#9ca3af",
                boxShadow: severityFilter === sev ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s", textTransform: "capitalize",
              }}>
                {sev === "all" ? "All" : sev}
              </button>
            );
          })}
        </div>

        {/* Client filter */}
        <select value={clientFilter} onChange={(ev) => setClientFilter(ev.target.value)}
          style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #e5e7eb", backgroundColor: "white", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
          {clientsInIssues.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Clients" : c}</option>
          ))}
        </select>

        {(search || severityFilter !== "all" || clientFilter !== "all") && (
          <button onClick={() => { setSearch(""); setSeverityFilter("all"); setClientFilter("all"); }}
            style={{ fontSize: 11, color: M, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
            ✕ Clear
          </button>
        )}

        <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto", fontWeight: 600 }}>
          {visibleIssues.length} issue{visibleIssues.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Active Tab Content ──────────────────────────────────────────────── */}
      <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {/* Tab content header */}
        <div style={{
          padding: "10px 16px", backgroundColor: tabCfg.bg,
          borderBottom: `1px solid ${tabCfg.border}`,
          display: "flex", alignItems: "center", gap: 10,
          borderLeft: `4px solid ${tabCfg.color}`,
        }}>
          <span style={{ fontSize: 16 }}>{tabCfg.emoji}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: tabCfg.color }}>{tabCfg.label}</span>
            <span style={{ marginLeft: 8, fontWeight: 900, fontSize: 14, color: tabCfg.color, backgroundColor: "white", padding: "1px 8px", borderRadius: 999, border: `1px solid ${tabCfg.border}` }}>
              {visibleIssues.length}
            </span>
            <span style={{ fontSize: 11, color: tabCfg.color, marginLeft: 8, opacity: 0.75 }}>{tabCfg.desc}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <ReportShareBar
              issues={visibleIssues}
              label={`${tabCfg.emoji} ${tabCfg.label} Report${clientFilter !== "all" ? ` — ${clientFilter}` : ""}`}
              color={tabCfg.color}
            />
            {visibleIssues.length > 0 && (
              <button
                onClick={() => {
                  const ids = visibleIssues.map((i) => i.id);
                  setResolvedIds((prev) => new Set([...prev, ...ids]));
                  showToast(`✅ Resolved all ${ids.length} items`);
                }}
                style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${tabCfg.color}`, backgroundColor: "white", color: tabCfg.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                ✅ Resolve All
              </button>
            )}
          </div>
        </div>

        {/* Issue list */}
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
          {visibleIssues.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af" }}>
              <CheckCircle size={32} style={{ color: "#4ade80", margin: "0 auto 10px", display: "block" }} />
              <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>
                {tabIssues.length === 0 ? `✅ No ${tabCfg.label} issues` : "All filtered out — clear filters to see more"}
              </p>
            </div>
          ) : (
            visibleIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                tabCfg={tabCfg}
                resolvedIds={resolvedIds}
                onResolve={handleResolve}
                onUpdateWorkflow={handleUpdateWorkflow}
                onOpenEmployee={handleOpenEmployee}
                onSendReminder={handleSendReminder}
                onEscalate={handleEscalate}
                resolvePartnerContact={resolvePartnerContact}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Escalation Modal ─────────────────────────────────────────────────── */}
      {escalationIssue && (
        <EscalationModal
          issue={escalationIssue}
          clients={clients}
          onClose={() => setEscalationIssue(null)}
          onConfirm={handleEscalateConfirm}
        />
      )}

      {/* ── Toast notification ───────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          padding: "12px 18px", borderRadius: 10,
          backgroundColor: toast.color, color: "white",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// Re-export for convenience
export { useOperationalIssues };