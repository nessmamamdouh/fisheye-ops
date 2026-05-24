/**
 * ═══════════════════════════════════════════════════════════════════════
 * FISHEYE OPS PRO — INTELLIGENT OPERATIONAL CONTROL CENTER
 * ═══════════════════════════════════════════════════════════════════════
 *
 * NEW MODULES (drop-in additions to App.jsx):
 *
 *  1. useOperationalIssues(employees)
 *     → Single source of truth for ALL operational issues.
 *       Every other view consumes this; nothing duplicates it.
 *
 *  2. <ActionCenter employees={employees} setEmployees={setEmployees} />
 *     → Replace nav="dashboard" render with this.
 *       Main daily workspace: prioritized issues, stuck detector,
 *       AI recommendations, follow-up engine, workload summary.
 *
 *  3. <OperationsCalendar employees={employees} />
 *     → Unified ops calendar. Use as nav="calendar".
 *
 *  4. <ClientCommandCenter employees={employees} />
 *     → Enhanced client view with health scores.
 *       Replace or augment nav="clients" <ClientHub>.
 *
 *  5. <FollowUpEngine employees={employees} issues={issues} />
 *     → Centralized follow-up tracker (use inside ActionCenter or standalone).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * INTEGRATION GUIDE — App.jsx changes needed:
 * ═══════════════════════════════════════════════════════════════════════
 *
 * 1. Import at top of App.jsx:
 *    import { ActionCenter, OperationsCalendar, ClientCommandCenter } from './ActionCenter';
 *
 * 2. Replace navItems array with the one in UPDATED_NAV_ITEMS below.
 *
 * 3. Replace:
 *    {nav==="dashboard" && <DashboardView .../>}
 *    with:
 *    {nav==="action"    && <ActionCenter employees={employees} setEmployees={setEmployees}/>}
 *    {nav==="calendar"  && <OperationsCalendar employees={employees}/>}
 *
 * 4. Replace or augment:
 *    {nav==="clients"   && <ClientHub employees={employees}/>}
 *    with:
 *    {nav==="clients"   && <ClientCommandCenter employees={employees}/>}
 *
 * 5. Keep ALL existing nav renders for: workforce, partners, finance,
 *    billing, onboarding, analytics, escalations, settlement, reports,
 *    tickets, settings — they are preserved as-is.
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, ArrowRight, Zap,
  Users, Building2, TrendingUp, Activity, Calendar,
  MessageCircle, ChevronRight, RefreshCw, Target,
  FileWarning, Flame, Shield, Bell, BarChart3, Filter,
  ChevronDown, ChevronUp, Star, AlertCircle, Circle,
  Play, Pause, MoreHorizontal, Eye, X, Plus,
  CalendarDays, Package, DollarSign, Layers,
  ArrowUpRight, Info, BrainCircuit, Workflow,
  Copy, Check, Mail,
} from "lucide-react";
import { isExcluded, isWFDone } from "./utils/helpers";

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 SHARE HELPERS — build copy/email/WA content from a single issue
// ═══════════════════════════════════════════════════════════════════════════════
function buildShareText(issue) {
  const name  = issue.employee?.name || "Unknown";
  const wf    = issue.employee?.workflowStatus || "";
  const days  = issue.delayDays > 0 ? `${issue.delayDays} day${issue.delayDays===1?"":"s"}` : null;
  const due   = issue.dueDate ? `Contract ends: ${fmt(issue.dueDate)}` : null;

  return [
    `Operational Issue — ${issue.client}`,
    `────────────────────────────`,
    `Employee:   ${name}`,
    wf   ? `Stage:      ${wf}` : null,
    days ? `Waiting:    ${days}` : null,
    due  ? due : null,
    `Issue:      ${issue.reason}`,
    `Action:     ${issue.recommendedAction}`,
  ].filter(Boolean).join("\n");
}

function buildShareWA(issue) {
  const name  = issue.employee?.name || "Unknown";
  const wf    = issue.employee?.workflowStatus || "";
  const days  = issue.delayDays > 0 ? `${issue.delayDays} day${issue.delayDays===1?"":"s"}` : null;
  const due   = issue.dueDate ? `📅 Contract ends: ${fmt(issue.dueDate)}` : null;

  return [
    `⚠️ *Operational Issue — ${issue.client}*`,
    ``,
    `👤 *Employee:* ${name}`,
    wf   ? `📋 *Stage:* ${wf}` : null,
    days ? `⏱ *Waiting:* ${days}` : null,
    due  || null,
    `📌 *Issue:* ${issue.reason}`,
    `💡 *Action:* ${issue.recommendedAction}`,
    ``,
    `_Sent via Fisheye Ops Pro_`,
  ].filter(l => l !== null).join("\n");
}

function buildShareEmail(issue) {
  const name  = issue.employee?.name || "Unknown";
  const wf    = issue.employee?.workflowStatus || "";
  const days  = issue.delayDays > 0 ? `${issue.delayDays} day${issue.delayDays===1?"":"s"}` : null;
  const due   = issue.dueDate ? fmt(issue.dueDate) : null;

  const subject = `Action Required — ${name} — ${issue.client}`;
  const body = [
    `Dear ${issue.client} team,`,
    ``,
    `I'm following up on an operational item that requires attention:`,
    ``,
    `  Employee:  ${name}`,
    wf   ? `  Stage:     ${wf}` : null,
    days ? `  Waiting:   ${days}` : null,
    due  ? `  Contract ends: ${due}` : null,
    `  Issue:     ${issue.reason}`,
    ``,
    `Recommended action: ${issue.recommendedAction}`,
    ``,
    `Best regards,`,
    `Fisheye Ops`,
  ].filter(Boolean).join("\n");

  return { subject, body };
}

// ─── Share Action Bar — 4 inline buttons per issue ───────────────────────────
function IssueShareBar({ issue }) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedWA,   setCopiedWA]   = useState(false);

  const copyToClipboard = (text, setter) => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    });
    setter(true);
    setTimeout(() => setter(false), 2200);
  };

  const { subject, body } = buildShareEmail(issue);
  const waMsg  = buildShareWA(issue);
  const txtMsg = buildShareText(issue);

  const btn = (opts) => ({
    display:"inline-flex", alignItems:"center", gap:4,
    padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:600,
    border:`1px solid ${opts.border || "#e5e7eb"}`,
    backgroundColor: opts.bg || "white",
    color: opts.color || "#374151",
    cursor:"pointer", whiteSpace:"nowrap",
    transition:"opacity 0.15s",
  });

  return (
    <div style={{
      display:"flex", gap:6, flexWrap:"wrap", alignItems:"center",
      marginTop:10, paddingTop:10,
      borderTop:"1px solid rgba(0,0,0,0.06)",
    }}>
      <span style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.05em",marginRight:2}}>
        Share:
      </span>

      {/* Copy plain text */}
      <button
        onClick={() => copyToClipboard(txtMsg, setCopiedText)}
        style={btn({ border: copiedText?"#16a34a":"#e5e7eb", color: copiedText?"#16a34a":"#374151" })}
      >
        {copiedText ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
      </button>

      {/* Open mailto */}
      <button
        onClick={() => window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")}
        style={btn({ border:"#bfdbfe", color:"#1d4ed8" })}
      >
        <Mail size={11}/> Email
      </button>

      {/* Copy WA text */}
      <button
        onClick={() => copyToClipboard(waMsg, setCopiedWA)}
        style={btn({ border:"#86efac", bg:"#f0fdf4", color: copiedWA?"#16a34a":"#15803d" })}
      >
        {copiedWA ? <><Check size={11}/> Copied WA</> : <><MessageCircle size={11}/> Copy WA</>}
      </button>

      {/* Open WhatsApp web */}
      <button
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, "_blank")}
        style={btn({ border:"#86efac", bg:"#f0fdf4", color:"#15803d" })}
      >
        <MessageCircle size={11}/> Send WA
      </button>
    </div>
  );
}

// ─── Constants (mirrors App.jsx) ─────────────────────────────────────────────
const M  = "#800000";
const MD = "#5c0000";
const ML = "#a83232";
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const CLIENTS_LIST = ["Sela","SPL","Channelplay","Riva Engineering 2","Combuzz HR"];
const CLIENT_META = {
  "Sela":               { badge:"#bbf7d0", text:"#14532d", dot:"#16a34a" },
  "SPL":                { badge:"#e9d5ff", text:"#4c1d95", dot:"#7c3aed" },
  "Channelplay":        { badge:"#bfdbfe", text:"#1e3a8a", dot:"#2563eb" },
  "Riva Engineering 2": { badge:"#fecdd3", text:"#881337", dot:M },
  "Combuzz HR":         { badge:"#fed7aa", text:"#7c2d12", dot:"#ea580c" },
};

// ─── Utility (mirrors App.jsx) ────────────────────────────────────────────────
const daysUntil = d => d ? Math.ceil((new Date(d) - TODAY) / 86400000) : 9999;
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const waHref = phone => {
  const c = (phone||"").replace(/[^0-9+]/g,"").replace(/^\+/,"");
  return c.length>6 ? `https://wa.me/${c}` : null;
};

// ─── PRIORITY LEVELS ─────────────────────────────────────────────────────────
const PRIORITY = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 };
const PRIORITY_META = {
  0: { label:"CRITICAL", color:"#dc2626", bg:"#fee2e2", border:"#fca5a5", dot:"#dc2626" },
  1: { label:"HIGH",     color:"#d97706", bg:"#fef9c3", border:"#fde047", dot:"#f59e0b" },
  2: { label:"MEDIUM",   color:"#2563eb", bg:"#dbeafe", border:"#93c5fd", dot:"#3b82f6" },
  3: { label:"LOW",      color:"#16a34a", bg:"#dcfce7", border:"#86efac", dot:"#22c55e" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 SINGLE SOURCE OF TRUTH — useOperationalIssues
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Central issue generator. All views import from here — nothing duplicates.
 * Returns { issues, metrics, stuckItems, aiRecommendations, workloadScore }
 */
export function useOperationalIssues(employees) {
  return useMemo(() => {
    const pool = employees.filter(e => !isExcluded(e));
    const issues = [];

    // ── Contract Expiry ──────────────────────────────────────────────────────
    pool.forEach(e => {
      const days = daysUntil(e.endDate);
      if (days >= 0 && days <= 7) {
        issues.push({
          id: `exp-crit-${e._id}`,
          type: "contract_expiry",
          priority: PRIORITY.CRITICAL,
          employee: e,
          client: e.client,
          title: `Contract expires in ${days === 0 ? "TODAY" : `${days} day${days===1?"":"s"}`}`,
          detail: `${e.name} · ${e.position} · ${e.client}`,
          reason: "Contract end date is imminent. Renewal or offboarding required immediately.",
          recommendedAction: "Start renewal process or notify client of offboarding",
          dueDate: e.endDate,
          delayDays: 0,
          actions: ["renew","notify_client","open_employee"],
          category: "renewal",
        });
      } else if (days > 7 && days <= 30) {
        issues.push({
          id: `exp-high-${e._id}`,
          type: "contract_expiry_soon",
          priority: PRIORITY.HIGH,
          employee: e,
          client: e.client,
          title: `Contract expires in ${days} days`,
          detail: `${e.name} · ${e.position} · ${e.client}`,
          reason: "Contract approaching expiry. Proactive renewal recommended.",
          recommendedAction: "Initiate renewal conversation with client",
          dueDate: e.endDate,
          delayDays: 0,
          actions: ["renew","remind"],
          category: "renewal",
        });
      }
    });

    // ── Stuck Workflow Detector ───────────────────────────────────────────────
    const stuckThresholds = {
      "Agreement Sent":   { days: 5, priority: PRIORITY.HIGH,     label: "Agreement unsigned for" },
      "Docs Requested":   { days: 4, priority: PRIORITY.HIGH,     label: "Docs pending for" },
      "Pending":          { days: 7, priority: PRIORITY.MEDIUM,   label: "Stuck in Pending for" },
      "Qiwa Submitted":   { days: 7, priority: PRIORITY.MEDIUM,   label: "Qiwa awaiting approval for" },
      "Onboarding":       { days: 5, priority: PRIORITY.MEDIUM,   label: "Onboarding in progress for" },
    };

    pool.forEach(e => {
      const wf = e.workflowStatus || "";
      const cfg = stuckThresholds[wf];
      if (!cfg) return;

      // wfDate = date when this stage was entered (set by handleUpdateField)
      // fallback: last auditLog entry → startDate
      let stageAge = 0;
      if (e.wfDate) {
        stageAge = Math.floor((TODAY - new Date(e.wfDate)) / 86400000);
      } else {
        const auditLog = Array.isArray(e.auditLog) ? e.auditLog : [];
        const wfEntry = [...auditLog].reverse().find(l =>
          l.action && l.action.toLowerCase().includes(wf.toLowerCase())
        );
        if (wfEntry) {
          stageAge = Math.floor((TODAY - new Date(wfEntry.ts)) / 86400000);
        } else if (e.startDate) {
          stageAge = Math.min(Math.floor((TODAY - new Date(e.startDate)) / 86400000), 14);
        }
      }

      if (stageAge >= cfg.days) {
        issues.push({
          id: `stuck-${e._id}-${wf}`,
          type: "stuck_workflow",
          priority: cfg.priority,
          employee: e,
          client: e.client,
          title: `${cfg.label} ${stageAge} day${stageAge===1?"":"s"}`,
          detail: `${e.name} · ${wf} · ${e.client}`,
          reason: `Employee has been in "${wf}" stage for ${stageAge} days — exceeds ${cfg.days}-day threshold.`,
          recommendedAction: wf === "Agreement Sent"
            ? "Send follow-up reminder or escalate to client"
            : wf === "Docs Requested"
            ? "Chase missing documents from partner or employee"
            : wf === "Qiwa Submitted"
            ? "Check Qiwa portal status and follow up with GR team"
            : "Review and advance workflow stage",
          dueDate: null,
          delayDays: stageAge,
          actions: ["remind","escalate","open_employee"],
          category: "workflow",
          stageAge,
        });
      }
    });

    // ── Missing PO Numbers (Sela) ─────────────────────────────────────────────
    pool.filter(e => e.client === "Sela" && !e.poNumbers).forEach(e => {
      issues.push({
        id: `nopo-${e._id}`,
        type: "missing_po",
        priority: PRIORITY.HIGH,
        employee: e,
        client: "Sela",
        title: "Missing PO Number",
        detail: `${e.name} · Sela · ${e.status}`,
        reason: "Sela employees require PO numbers for invoicing. Missing PO will block billing.",
        recommendedAction: "Request PO number from Sela finance team",
        dueDate: null,
        delayDays: 0,
        actions: ["follow_finance","notify_client"],
        category: "finance",
      });
    });

    // ── Pending Approvals (Agreement Sent) ───────────────────────────────────
    pool.filter(e => (e.workflowStatus||"").toLowerCase() === "agreement sent").forEach(e => {
      const alreadyStuck = issues.find(i => i.id === `stuck-${e._id}-Agreement Sent`);
      if (!alreadyStuck) {
        issues.push({
          id: `agr-${e._id}`,
          type: "pending_agreement",
          priority: PRIORITY.MEDIUM,
          employee: e,
          client: e.client,
          title: "Agreement awaiting signature",
          detail: `${e.name} · ${e.client}`,
          reason: "Agreement has been sent but not yet signed.",
          recommendedAction: "Send reminder to client for signature",
          dueDate: null,
          delayDays: 0,
          actions: ["remind","escalate","open_employee"],
          category: "workflow",
        });
      }
    });

    // ── Incomplete Onboarding ────────────────────────────────────────────────
    pool.filter(e => e.workflowStatus === "Onboarding").forEach(e => {
      const steps = Object.values(e.onboardingSteps || {}).filter(Boolean).length;
      const totalSteps = 5;
      if (steps < totalSteps) {
        const alreadyStuck = issues.find(i => i.id === `stuck-${e._id}-Onboarding`);
        if (!alreadyStuck) {
          issues.push({
            id: `onb-${e._id}`,
            type: "incomplete_onboarding",
            priority: steps === 0 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
            employee: e,
            client: e.client,
            title: `Onboarding incomplete (${steps}/${totalSteps} steps)`,
            detail: `${e.name} · ${e.client}`,
            reason: `${totalSteps - steps} onboarding step${totalSteps-steps===1?"":"s"} not yet completed.`,
            recommendedAction: "Complete remaining onboarding steps in onboarding module",
            dueDate: null,
            delayDays: 0,
            actions: ["open_onboarding","open_employee"],
            category: "onboarding",
            completedSteps: steps,
            totalSteps,
          });
        }
      }
    });

    // Sort by priority then delay
    issues.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.delayDays - a.delayDays;
    });

    // ── Stuck Items Summary ──────────────────────────────────────────────────
    const stuckItems = issues.filter(i => i.type === "stuck_workflow");

    // ── Workload Score ────────────────────────────────────────────────────────
    const critCount   = issues.filter(i => i.priority === PRIORITY.CRITICAL).length;
    const highCount   = issues.filter(i => i.priority === PRIORITY.HIGH).length;
    const medCount    = issues.filter(i => i.priority === PRIORITY.MEDIUM).length;
    const workloadScore = Math.min(100, critCount * 15 + highCount * 8 + medCount * 3);

    // ── Metrics ──────────────────────────────────────────────────────────────
    const metrics = {
      total:       issues.length,
      critical:    critCount,
      high:        highCount,
      medium:      medCount,
      low:         issues.filter(i => i.priority === PRIORITY.LOW).length,
      byCategory:  issues.reduce((acc, i) => { acc[i.category] = (acc[i.category]||0)+1; return acc; }, {}),
      byClient:    issues.reduce((acc, i) => { acc[i.client] = (acc[i.client]||0)+1; return acc; }, {}),
      workloadScore,
      activeEmployees: pool.length,
      onTrack:         pool.filter(e => isWFDone(e.workflowStatus)).length,
    };

    // ── AI Recommendations (rule-based) ──────────────────────────────────────
    const aiRecommendations = [];

    // Most urgent client
    const clientByLoad = Object.entries(metrics.byClient).sort((a,b) => b[1]-a[1]);
    if (clientByLoad.length > 0) {
      const [topClient, count] = clientByLoad[0];
      aiRecommendations.push({
        id: "ai-1",
        icon: "🎯",
        title: `Focus on ${topClient} today`,
        detail: `${count} open issue${count===1?"":"s"} — highest operational load across clients.`,
        type: "focus",
      });
    }

    // Stuck agreements
    const stuckAgreements = issues.filter(i => i.type === "stuck_workflow" && i.employee.workflowStatus === "Agreement Sent");
    if (stuckAgreements.length >= 2) {
      aiRecommendations.push({
        id: "ai-2",
        icon: "📋",
        title: "Agreement bottleneck detected",
        detail: `${stuckAgreements.length} agreements unsigned for 5+ days. Consider bulk follow-up or escalation.`,
        type: "bottleneck",
      });
    }

    // Payroll risk
    const nopo = issues.filter(i => i.type === "missing_po");
    if (nopo.length >= 3) {
      aiRecommendations.push({
        id: "ai-3",
        icon: "💰",
        title: "Payroll/invoicing at risk",
        detail: `${nopo.length} Sela employees missing PO numbers — billing will be blocked.`,
        type: "risk",
      });
    }

    // Expiry wave
    const expiringThis7 = issues.filter(i => i.type === "contract_expiry").length;
    if (expiringThis7 >= 3) {
      aiRecommendations.push({
        id: "ai-4",
        icon: "⏰",
        title: "Renewal wave incoming",
        detail: `${expiringThis7} contracts expiring this week. Prioritize renewal conversations.`,
        type: "risk",
      });
    }

    // High workload warning
    if (workloadScore >= 60) {
      aiRecommendations.push({
        id: "ai-5",
        icon: "🔥",
        title: "High operational load",
        detail: `Workload score ${workloadScore}/100. Consider delegating low-priority follow-ups.`,
        type: "workload",
      });
    }

    return { issues, metrics, stuckItems, aiRecommendations, workloadScore };
  }, [employees]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════
function ACCard({ children, style={}, border, onClick }) {
  return (
    <div
      className="fe-card"
      style={{ border: border || undefined, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function PriorityDot({ priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:800,
      backgroundColor: meta.bg, color: meta.color, border:`1px solid ${meta.border}`,
      textTransform:"uppercase", letterSpacing:"0.04em",
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:meta.dot,flexShrink:0}}/>
      {meta.label}
    </span>
  );
}

function ClientTag({ client }) {
  const m = CLIENT_META[client] || { badge:"#e5e7eb", text:"#374151", dot:"#6b7280" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:700,
      backgroundColor: m.badge, color: m.text,
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",backgroundColor:m.dot}}/>
      {client}
    </span>
  );
}

function SectionHeader({ icon:Icon, title, count, color=M, action }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"14px 18px", borderBottom:"1px solid #f3f4f6",
    }}>
      <div style={{padding:7,borderRadius:10,backgroundColor:`${color}12`,flexShrink:0}}>
        <Icon size={15} style={{color}}/>
      </div>
      <span style={{fontWeight:800,fontSize:13,color:"#111827",flex:1,fontFamily:"var(--font-sans)",letterSpacing:"-0.01em"}}>{title}</span>
      {count !== undefined && (
        <span style={{
          fontSize:11,fontWeight:900,padding:"2px 9px",borderRadius:999,
          backgroundColor:color,color:"white",
        }}>{count}</span>
      )}
      {action}
    </div>
  );
}

function WAButton({ phone }) {
  const link = waHref(phone);
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
      style={{
        display:"inline-flex",alignItems:"center",gap:4,
        fontSize:11,fontWeight:700,color:"white",
        padding:"4px 10px",borderRadius:8,
        backgroundColor:"#16a34a",textDecoration:"none",whiteSpace:"nowrap",flexShrink:0,
      }}>
      <MessageCircle size={10}/> WA
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 WORKLOAD GAUGE
// ═══════════════════════════════════════════════════════════════════════════════
function WorkloadGauge({ score }) {
  const color = score >= 75 ? "#dc2626" : score >= 50 ? "#d97706" : score >= 25 ? "#2563eb" : "#16a34a";
  const label = score >= 75 ? "Critical Load" : score >= 50 ? "High Load" : score >= 25 ? "Moderate" : "Manageable";
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Workload</span>
        <span style={{fontSize:11,fontWeight:800,color}}>{label}</span>
      </div>
      <div style={{height:6,borderRadius:999,backgroundColor:"#f3f4f6",overflow:"hidden"}}>
        <div style={{
          height:"100%", borderRadius:999,
          width:`${score}%`,
          backgroundColor:color,
          transition:"width 0.5s ease",
        }}/>
      </div>
      <span style={{fontSize:10,color:"#9ca3af",textAlign:"right"}}>{score}/100</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🃏 ISSUE CARD
// ═══════════════════════════════════════════════════════════════════════════════
function IssueCard({ issue, onAction, expanded, onToggle }) {
  const meta = PRIORITY_META[issue.priority];
  const waBg = meta.bg;

  return (
    <div
      style={{
        borderLeft:`3px solid ${meta.color}`,
        padding:"12px 16px",
        borderBottom:"1px solid #f9fafb",
        cursor:"pointer",
        backgroundColor: expanded ? "#fafafa" : "white",
        transition:"background 0.1s",
      }}
      onClick={onToggle}
    >
      {/* Row 1: priority + title + client */}
      <div style={{display:"flex",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
        <PriorityDot priority={issue.priority}/>
        <ClientTag client={issue.client}/>
        <span style={{
          fontSize:12,fontWeight:700,color:"#111827",flex:1,minWidth:200,lineHeight:1.4,
        }}>
          {issue.title}
        </span>
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          {issue.employee?.phone && <WAButton phone={issue.employee.phone}/>}
          {expanded ? <ChevronUp size={14} style={{color:"#9ca3af"}}/> : <ChevronDown size={14} style={{color:"#9ca3af"}}/>}
        </div>
      </div>

      {/* Row 2: detail */}
      <div style={{fontSize:11,color:"#6b7280",marginTop:4,paddingLeft:2}}>
        {issue.detail}
        {issue.delayDays > 0 && (
          <span style={{marginLeft:8,color:meta.color,fontWeight:700}}>
            · {issue.delayDays}d delayed
          </span>
        )}
        {issue.dueDate && (
          <span style={{marginLeft:8,color:"#6b7280"}}>
            · Due {fmt(issue.dueDate)}
          </span>
        )}
      </div>

      {/* Expanded: reason + recommended + action buttons */}
      {expanded && (
        <div style={{
          marginTop:10,
          padding:12,
          borderRadius:10,
          backgroundColor:meta.bg,
          border:`1px solid ${meta.border}`,
        }}>
          <div style={{marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:800,color:meta.color,textTransform:"uppercase",letterSpacing:"0.05em"}}>Why it matters</span>
            <p style={{fontSize:12,color:"#374151",margin:"3px 0 0",lineHeight:1.5}}>{issue.reason}</p>
          </div>
          <div style={{marginBottom:10}}>
            <span style={{fontSize:10,fontWeight:800,color:meta.color,textTransform:"uppercase",letterSpacing:"0.05em"}}>Recommended action</span>
            <p style={{fontSize:12,color:"#374151",margin:"3px 0 0",fontWeight:600,lineHeight:1.5}}>→ {issue.recommendedAction}</p>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {issue.actions.map(action => (
              <ActionButton key={action} action={action} issue={issue} onAction={onAction}/>
            ))}
          </div>
          {/* ── Share Bar (Copy / Email / WhatsApp) ── */}
          <IssueShareBar issue={issue}/>
        </div>
      )}
    </div>
  );
}

const ACTION_LABELS = {
  renew:           { label:"🔄 Start Renewal",    color:M },
  notify_client:   { label:"📧 Notify Client",    color:"#2563eb" },
  open_employee:   { label:"👤 Open Employee",    color:"#6b7280" },
  remind:          { label:"💬 Send Reminder",    color:"#16a34a" },
  escalate:        { label:"🚨 Escalate",         color:"#dc2626" },
  follow_finance:  { label:"💰 Follow Finance",   color:"#d97706" },
  open_onboarding: { label:"🚀 Go to Onboarding", color:"#7c3aed" },
};

function ActionButton({ action, issue, onAction }) {
  const cfg = ACTION_LABELS[action] || { label:action, color:"#6b7280" };
  return (
    <button
      onClick={e => { e.stopPropagation(); onAction(action, issue); }}
      style={{
        padding:"5px 12px", borderRadius:8, border:`1px solid ${cfg.color}30`,
        backgroundColor:"white", color:cfg.color,
        fontSize:11, fontWeight:700, cursor:"pointer",
        display:"inline-flex", alignItems:"center", gap:4,
        transition:"all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor=`${cfg.color}10`; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor="white"; }}
    >
      {cfg.label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI RECOMMENDATION STRIP
// ═══════════════════════════════════════════════════════════════════════════════
function AIRecommendations({ recommendations }) {
  const [dismissed, setDismissed] = useState([]);
  const visible = recommendations.filter(r => !dismissed.includes(r.id));
  if (visible.length === 0) return null;
  const typeColors = { focus:"#7c3aed", bottleneck:"#d97706", risk:"#dc2626", workload:"#f59e0b" };

  return (
    <ACCard border={`1px solid #e9d5ff`} style={{backgroundColor:"#faf5ff",overflow:"hidden"}}>
      <SectionHeader
        icon={BrainCircuit}
        title="Smart Recommendations"
        color="#7c3aed"
        count={visible.length}
        action={
          <span style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>AI · Rule-based</span>
        }
      />
      <div style={{padding:"4px 0"}}>
        {visible.map(r => (
          <div key={r.id} style={{
            display:"flex",alignItems:"flex-start",gap:12,
            padding:"10px 16px",borderBottom:"1px solid #f3e8ff",
          }}>
            <span style={{fontSize:20,flexShrink:0,marginTop:1}}>{r.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontWeight:700,fontSize:12,color:"#3b0764"}}>{r.title}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:"#6b21a8"}}>{r.detail}</p>
            </div>
            <button
              onClick={() => setDismissed(d => [...d, r.id])}
              style={{background:"none",border:"none",cursor:"pointer",color:"#c4b5fd",padding:2,flexShrink:0,marginTop:2}}>
              <X size={13}/>
            </button>
          </div>
        ))}
      </div>
    </ACCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 METRICS BAR
// ═══════════════════════════════════════════════════════════════════════════════
function MetricsBar({ metrics, employees }) {
  const cats = [
    { k:"renewal",    label:"Renewals",   color:"#dc2626", icon:"📋" },
    { k:"workflow",   label:"Workflow",   color:"#d97706", icon:"⚙️" },
    { k:"finance",    label:"Finance",    color:"#7c3aed", icon:"💰" },
    { k:"onboarding", label:"Onboarding", color:"#2563eb", icon:"🚀" },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {cats.map(c => (
        <div key={c.k} className="fe-stat-card" style={{padding:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:16}}>{c.icon}</span>
            <span className="fe-label">{c.label}</span>
          </div>
          <div className="fe-kpi-value" style={{fontSize:26,fontWeight:900,color:metrics.byCategory[c.k]>0?c.color:"#d1d5db",lineHeight:1}}>
            {metrics.byCategory[c.k] || 0}
          </div>
          <div style={{fontSize:10,color:"#9ca3af",marginTop:3}}>open issues</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 ISSUE FILTERS
// ═══════════════════════════════════════════════════════════════════════════════
function IssueFilters({ filter, setFilter, clientFilter, setClientFilter, issues }) {
  const priorities = [
    { k:"all",      label:"All Issues" },
    { k:"0",        label:"Critical" },
    { k:"1",        label:"High" },
    { k:"2",        label:"Medium" },
  ];

  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid #f3f4f6",backgroundColor:"#fafafa"}}>
      <Filter size={12} style={{color:"#9ca3af"}}/>
      {priorities.map(p => {
        const count = p.k === "all"
          ? issues.length
          : issues.filter(i => String(i.priority) === p.k).length;
        const meta = p.k !== "all" ? PRIORITY_META[Number(p.k)] : null;
        const active = filter === p.k;
        return (
          <button key={p.k} onClick={() => setFilter(p.k)}
            style={{
              padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",
              border:`1px solid ${active ? (meta?.color || M) : "#e5e7eb"}`,
              backgroundColor: active ? (meta ? meta.bg : `${M}10`) : "white",
              color: active ? (meta?.color || M) : "#6b7280",
            }}>
            {p.label} {count > 0 && <span style={{opacity:0.7}}>({count})</span>}
          </button>
        );
      })}
      <div style={{width:1,height:16,backgroundColor:"#e5e7eb",margin:"0 4px"}}/>
      <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="fe-select" style={{fontSize:11,cursor:"pointer"}}>
        <option value="all">All Clients</option>
        {CLIENTS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ACTION CENTER — MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function ActionCenter({ employees, setEmployees, onNavigate }) {
  const { issues, metrics, stuckItems, aiRecommendations, workloadScore } = useOperationalIssues(employees);
  const [filter, setFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ac_dismissed") || "[]"); } catch { return []; }
  });
  const [actionLog, setActionLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ac_actionlog") || "[]"); } catch { return []; }
  });

  const persistDismissed = (ids) => {
    setDismissedIds(ids);
    localStorage.setItem("ac_dismissed", JSON.stringify(ids));
  };

  const logAction = (action, issue) => {
    const entry = {
      id: `${Date.now()}`,
      ts: new Date().toISOString(),
      action,
      employee: issue.employee?.name,
      client: issue.client,
      issueType: issue.type,
    };
    const next = [entry, ...actionLog].slice(0, 50);
    setActionLog(next);
    localStorage.setItem("ac_actionlog", JSON.stringify(next));
  };

  const handleAction = useCallback((action, issue) => {
    logAction(action, issue);
    if (action === "remind" && issue.employee?.phone) {
      const link = waHref(issue.employee.phone);
      if (link) window.open(link, "_blank");
    }
    if (action === "escalate") {
      onNavigate?.("escalations");
    }
    if (action === "open_employee") {
      onNavigate?.("workforce");
    }
    if (action === "renew") {
      onNavigate?.("workforce");
    }
    if (action === "open_onboarding") {
      onNavigate?.("onboarding");
    }
    if (action === "follow_finance") {
      onNavigate?.("finance");
    }
    if (action === "notify_client") {
      onNavigate?.("clients");
    }
  }, [onNavigate, actionLog]);

  const filteredIssues = useMemo(() => {
    return issues
      .filter(i => !dismissedIds.includes(i.id))
      .filter(i => filter === "all" || String(i.priority) === filter)
      .filter(i => clientFilter === "all" || i.client === clientFilter);
  }, [issues, dismissedIds, filter, clientFilter]);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday:"long", day:"2-digit", month:"long", year:"numeric"
  });

  return (
    <div className="fe-page" style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:12,background:`linear-gradient(135deg,${MD},${M})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Target size={18} style={{color:"white"}}/>
            </div>
            <div>
              <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#111827",fontFamily:"var(--font-sans)",letterSpacing:"-0.02em"}}>Action Center</h2>
              <p style={{margin:"2px 0 0",fontSize:13,color:"#6b7280",fontFamily:"var(--font-sans)"}}>Issues · Flags · Expiries</p>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <WorkloadStatus score={workloadScore}/>
          {dismissedIds.length > 0 && (
            <button onClick={() => persistDismissed([])} className="fe-btn fe-btn-ghost">
              Restore {dismissedIds.length} dismissed
            </button>
          )}
        </div>
      </div>

      {/* ── Metric tiles ───────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          { n:metrics.critical, label:"Critical",    color:"#dc2626", bg:"#fee2e2", border:"#fca5a5",  icon:Flame },
          { n:metrics.high,     label:"High",        color:"#d97706", bg:"#fef9c3", border:"#fde047",  icon:AlertTriangle },
          { n:metrics.medium,   label:"Medium",      color:"#2563eb", bg:"#dbeafe", border:"#93c5fd",  icon:Activity },
          { n:metrics.onTrack,  label:"On Track",    color:"#16a34a", bg:"#dcfce7", border:"#86efac",  icon:CheckCircle2 },
        ].map(({ n, label, color, bg, border, icon: Icon }) => (
          <div key={label} className="fe-stat-card" style={{
            padding:14, backgroundColor:bg,
            border:`1px solid ${border}`, textAlign:"center",
          }}>
            <Icon size={16} style={{color, margin:"0 auto 6px",display:"block"}}/>
            <div className="fe-kpi-value" style={{fontSize:28,fontWeight:900,color,lineHeight:1}}>{n}</div>
            <div className="fe-label" style={{color,marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Workload Gauge ─────────────────────────────────────────────── */}
      <ACCard style={{padding:16}}>
        <WorkloadGauge score={workloadScore}/>
      </ACCard>

      {/* ── AI Recommendations ─────────────────────────────────────────── */}
      {aiRecommendations.length > 0 && (
        <AIRecommendations recommendations={aiRecommendations}/>
      )}

      {/* ── Category summary ───────────────────────────────────────────── */}
      <MetricsBar metrics={metrics} employees={employees}/>

      {/* ── Issue Queue ────────────────────────────────────────────────── */}
      <ACCard style={{overflow:"hidden"}}>
        <SectionHeader
          icon={Layers}
          title="Operational Queue"
          count={filteredIssues.length}
          color={M}
          action={
            <span style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>
              {metrics.total - filteredIssues.length > 0 ? `${metrics.total - filteredIssues.length} filtered/dismissed` : ""}
            </span>
          }
        />
        <IssueFilters
          filter={filter} setFilter={setFilter}
          clientFilter={clientFilter} setClientFilter={setClientFilter}
          issues={issues.filter(i => !dismissedIds.includes(i.id))}
        />
        <div style={{maxHeight:520,overflowY:"auto"}}>
          {filteredIssues.length === 0 ? (
            <div style={{padding:"48px 24px",textAlign:"center",color:"#9ca3af"}}>
              <CheckCircle2 size={36} style={{color:"#d1d5db",margin:"0 auto 12px",display:"block"}}/>
              <p style={{fontSize:13,fontWeight:600,margin:"0 0 4px"}}>No issues match this filter</p>
              <p style={{fontSize:12,margin:0}}>
                {metrics.total === 0 ? "All caught up! No operational issues detected." : "Try removing filters to see all issues."}
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <div key={issue.id} style={{position:"relative"}}>
                <IssueCard
                  issue={issue}
                  onAction={handleAction}
                  expanded={expandedId === issue.id}
                  onToggle={() => setExpandedId(p => p === issue.id ? null : issue.id)}
                />
                {/* Dismiss button (subtle) */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    persistDismissed([...dismissedIds, issue.id]);
                  }}
                  title="Dismiss"
                  style={{
                    position:"absolute", top:10, right:expandedId === issue.id ? 40 : 10,
                    background:"none", border:"none", cursor:"pointer",
                    color:"#d1d5db", padding:2, lineHeight:1,
                    opacity:0, transition:"opacity 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity="1"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity="0"; }}
                >
                  <X size={11}/>
                </button>
              </div>
            ))
          )}
        </div>
      </ACCard>

      {/* ── Stuck Items Detector ────────────────────────────────────────── */}
      {stuckItems.length > 0 && (
        <StuckItemsPanel items={stuckItems} onAction={handleAction}/>
      )}

      {/* ── Action Log ─────────────────────────────────────────────────── */}
      {actionLog.length > 0 && (
        <ActionLogPanel log={actionLog}/>
      )}
    </div>
  );
}

function WorkloadStatus({ score }) {
  const color = score >= 75 ? "#dc2626" : score >= 50 ? "#d97706" : score >= 25 ? "#2563eb" : "#16a34a";
  const label = score >= 75 ? "🔥 Critical Load" : score >= 50 ? "⚡ High Load" : score >= 25 ? "📊 Moderate" : "✅ Manageable";
  return (
    <div style={{
      padding:"6px 14px",borderRadius:8,border:`1px solid ${color}30`,
      backgroundColor:`${color}08`,color,fontWeight:700,fontSize:12,
    }}>
      {label}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚨 STUCK ITEMS PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function StuckItemsPanel({ items, onAction }) {
  const [open, setOpen] = useState(true);
  return (
    <ACCard border="1px solid #fde047" style={{overflow:"hidden"}}>
      <div
        style={{
          display:"flex",alignItems:"center",gap:10,padding:"12px 16px",
          cursor:"pointer",backgroundColor:"#fef9c3",borderBottom:open?"1px solid #fde047":"none",
        }}
        onClick={() => setOpen(p=>!p)}
      >
        <AlertTriangle size={15} style={{color:"#d97706"}}/>
        <span style={{fontWeight:800,fontSize:13,color:"#78350f",flex:1}}>
          Stuck Items Detector
        </span>
        <span style={{fontSize:11,fontWeight:900,color:"white",backgroundColor:"#d97706",padding:"2px 9px",borderRadius:999}}>{items.length}</span>
        {open ? <ChevronUp size={14} style={{color:"#d97706"}}/> : <ChevronDown size={14} style={{color:"#d97706"}}/>}
      </div>
      {open && (
        <div style={{maxHeight:280,overflowY:"auto"}}>
          {items.map(item => (
            <div key={item.id} style={{
              borderBottom:"1px solid #fffbeb",
              padding:"10px 16px",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{
                  flexShrink:0,width:36,height:36,borderRadius:10,
                  backgroundColor:"#fef9c3",border:"1px solid #fde047",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontWeight:900,fontSize:11,color:"#d97706",
                }}>
                  {item.stageAge}d
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontWeight:700,fontSize:12,color:"#111827"}}>{item.employee?.name}</p>
                  <p style={{margin:"1px 0 0",fontSize:11,color:"#854d0e"}}>
                    {item.employee?.workflowStatus} · <ClientTag client={item.client}/>
                  </p>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  {item.employee?.phone && <WAButton phone={item.employee.phone}/>}
                  <button
                    onClick={() => onAction("escalate", item)}
                    style={{padding:"4px 10px",borderRadius:8,border:"1px solid #fca5a5",backgroundColor:"#fee2e2",color:"#dc2626",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                    Escalate
                  </button>
                </div>
              </div>
              <IssueShareBar issue={item}/>
            </div>
          ))}
        </div>
      )}
    </ACCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 ACTION LOG PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function ActionLogPanel({ log }) {
  const [open, setOpen] = useState(false);
  const ACTION_EMOJIS = { remind:"💬", escalate:"🚨", renew:"🔄", notify_client:"📧", open_employee:"👤", follow_finance:"💰", open_onboarding:"🚀" };
  return (
    <ACCard style={{overflow:"hidden"}}>
      <div
        style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer",borderBottom:open?"1px solid #f3f4f6":"none"}}
        onClick={() => setOpen(p=>!p)}
      >
        <Clock size={14} style={{color:"#9ca3af"}}/>
        <span style={{fontWeight:700,fontSize:12,color:"#374151",flex:1}}>Action Log</span>
        <span style={{fontSize:11,color:"#9ca3af"}}>{log.length} actions</span>
        {open ? <ChevronUp size={13} style={{color:"#9ca3af"}}/> : <ChevronDown size={13} style={{color:"#9ca3af"}}/>}
      </div>
      {open && (
        <div style={{maxHeight:240,overflowY:"auto"}}>
          {log.slice(0,20).map(entry => (
            <div key={entry.id} style={{display:"flex",gap:10,padding:"8px 16px",borderBottom:"1px solid #f9fafb",alignItems:"flex-start"}}>
              <span style={{fontSize:14,flexShrink:0}}>{ACTION_EMOJIS[entry.action]||"▶"}</span>
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{entry.employee || "—"}</span>
                <span style={{fontSize:11,color:"#9ca3af",marginLeft:6}}>{entry.action.replace(/_/g," ")} · <ClientTag client={entry.client}/></span>
              </div>
              <span style={{fontSize:10,color:"#9ca3af",flexShrink:0,whiteSpace:"nowrap"}}>
                {new Date(entry.ts).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
              </span>
            </div>
          ))}
        </div>
      )}
    </ACCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 OPERATIONS CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════
export function OperationsCalendar({ employees }) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const events = useMemo(() => {
    const pool = employees.filter(e => !isExcluded(e));
    const evts = [];

    pool.forEach(e => {
      // Contract expiry
      if (e.endDate) {
        const d = daysUntil(e.endDate);
        if (d >= -7 && d <= 60) {
          evts.push({
            date: e.endDate,
            type: "expiry",
            label: `${e.name} contract expires`,
            client: e.client,
            priority: d <= 7 ? "critical" : d <= 30 ? "high" : "medium",
            color: d <= 7 ? "#dc2626" : d <= 30 ? "#d97706" : "#2563eb",
          });
        }
      }
      // Onboarding
      if (e.workflowStatus === "Onboarding" && e.startDate) {
        evts.push({
          date: e.startDate,
          type: "onboarding",
          label: `${e.name} onboarding`,
          client: e.client,
          priority: "medium",
          color: "#7c3aed",
        });
      }
    });

    return evts;
  }, [employees]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return events.filter(e => e.date && e.date.startsWith(dateStr));
  };

  const monthStr = viewMonth.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div className="fe-page" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"space-between",flexWrap:"wrap"}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#111827",fontFamily:"var(--font-sans)",letterSpacing:"-0.02em"}}>Operations Calendar</h2>
          <p style={{margin:"2px 0 0",fontSize:13,color:"#6b7280",fontFamily:"var(--font-sans)"}}>Renewals, onboarding, payroll, SLA deadlines</p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setViewMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} className="fe-btn fe-btn-ghost">‹</button>
          <span style={{fontWeight:800,fontSize:14,color:"#111827",minWidth:160,textAlign:"center"}}>{monthStr}</span>
          <button onClick={()=>setViewMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} className="fe-btn fe-btn-ghost">›</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[
          {color:"#dc2626",label:"Critical expiry (≤7d)"},
          {color:"#d97706",label:"Expiring soon (≤30d)"},
          {color:"#2563eb",label:"Future expiry"},
          {color:"#7c3aed",label:"Onboarding"},
        ].map(({color,label}) => (
          <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6b7280"}}>
            <span style={{width:10,height:10,borderRadius:3,backgroundColor:color,flexShrink:0}}/>
            {label}
          </div>
        ))}
      </div>

      <ACCard style={{overflow:"hidden"}}>
        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #f3f4f6"}}>
          {days.map(d => (
            <div key={d} style={{padding:"10px 4px",textAlign:"center",fontSize:11,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.05em"}}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {/* Empty cells before month start */}
          {Array.from({length:firstDay}).map((_,i) => (
            <div key={`e${i}`} style={{minHeight:80,borderRight:"1px solid #f9fafb",borderBottom:"1px solid #f9fafb",backgroundColor:"#fafafa"}}/>
          ))}
          {/* Day cells */}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(day => {
            const dayEvents = getEventsForDay(day);
            const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday = dateStr === TODAY.toISOString().split("T")[0];
            return (
              <div key={day} style={{
                minHeight:80,padding:"6px 6px 4px",
                borderRight:"1px solid #f9fafb",borderBottom:"1px solid #f9fafb",
                backgroundColor: isToday ? `${M}06` : "white",
              }}>
                <div style={{
                  fontSize:11,fontWeight:isToday?900:600,
                  color:isToday?M:"#374151",
                  marginBottom:4,
                  ...(isToday ? {
                    width:20,height:20,borderRadius:"50%",
                    backgroundColor:M,color:"white",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,
                  } : {}),
                }}>
                  {day}
                </div>
                {dayEvents.slice(0,2).map((evt,i) => (
                  <div key={i} style={{
                    fontSize:9,fontWeight:700,padding:"2px 4px",borderRadius:4,
                    backgroundColor:evt.color,color:"white",
                    marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                    lineHeight:1.4,
                  }} title={evt.label}>
                    {evt.label}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:600}}>+{dayEvents.length-2} more</div>
                )}
              </div>
            );
          })}
        </div>
      </ACCard>

      {/* Upcoming events list */}
      <ACCard style={{overflow:"hidden"}}>
        <SectionHeader icon={CalendarDays} title="Upcoming Events (30 days)" count={events.filter(e=>daysUntil(e.date)>=0&&daysUntil(e.date)<=30).length} color={M}/>
        <div style={{maxHeight:320,overflowY:"auto"}}>
          {events
            .filter(e => daysUntil(e.date) >= 0 && daysUntil(e.date) <= 30)
            .sort((a,b) => new Date(a.date)-new Date(b.date))
            .map((evt,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid #f9fafb"}}>
                <div style={{width:8,height:8,borderRadius:"50%",backgroundColor:evt.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:12,fontWeight:600,color:"#1f2937"}}>{evt.label}</p>
                  <p style={{margin:"1px 0 0",fontSize:11,color:"#6b7280"}}>{fmt(evt.date)} · <ClientTag client={evt.client}/></p>
                </div>
                <span style={{
                  fontSize:11,fontWeight:800,flexShrink:0,
                  color:evt.color,
                }}>
                  {daysUntil(evt.date) === 0 ? "TODAY" : `${daysUntil(evt.date)}d`}
                </span>
              </div>
            ))}
          {events.filter(e=>daysUntil(e.date)>=0&&daysUntil(e.date)<=30).length===0 && (
            <div style={{padding:"32px",textAlign:"center",color:"#9ca3af",fontSize:12}}>No upcoming events in the next 30 days.</div>
          )}
        </div>
      </ACCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 CLIENT COMMAND CENTER (with Health Score)
// ═══════════════════════════════════════════════════════════════════════════════

function calcClientHealth(clientName, employees, issues) {
  const clientEmps = employees.filter(e => e.client === clientName && !isExcluded(e));
  const clientIssues = issues.filter(i => i.client === clientName);

  // Scoring factors (higher = healthier)
  let score = 100;

  // Penalize per critical issue
  const critIssues = clientIssues.filter(i => i.priority === PRIORITY.CRITICAL).length;
  const highIssues = clientIssues.filter(i => i.priority === PRIORITY.HIGH).length;
  const stuckIssues = clientIssues.filter(i => i.type === "stuck_workflow").length;
  const missingPO = clientIssues.filter(i => i.type === "missing_po").length;
  const expiringContracts = clientIssues.filter(i => i.type === "contract_expiry").length;

  score -= critIssues * 20;
  score -= highIssues * 10;
  score -= stuckIssues * 8;
  score -= missingPO * 5;
  score -= expiringContracts * 12;

  // Bonus for having workforce
  const hasWorkforce = clientEmps.length > 0;
  if (!hasWorkforce) score -= 10;

  const finalScore = Math.max(0, Math.min(100, score));
  const label = finalScore >= 80 ? "Healthy" : finalScore >= 60 ? "Attention" : finalScore >= 40 ? "At Risk" : "Critical";
  const color = finalScore >= 80 ? "#16a34a" : finalScore >= 60 ? "#d97706" : finalScore >= 40 ? "#ea580c" : "#dc2626";

  return { score: finalScore, label, color, issues: clientIssues, employees: clientEmps };
}

export function ClientCommandCenter({ employees }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const { issues } = useOperationalIssues(employees);

  const clientData = useMemo(() => {
    return CLIENTS_LIST.map(name => ({
      name,
      ...calcClientHealth(name, employees, issues),
      meta: CLIENT_META[name],
    }));
  }, [employees, issues]);

  const selected = selectedClient ? clientData.find(c => c.name === selectedClient) : null;

  return (
    <div className="fe-page" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:12,background:`linear-gradient(135deg,${MD},${M})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Building2 size={18} style={{color:"white"}}/>
        </div>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#111827",fontFamily:"var(--font-sans)",letterSpacing:"-0.02em"}}>Client Command Center</h2>
          <p style={{margin:"2px 0 0",fontSize:13,color:"#6b7280",fontFamily:"var(--font-sans)"}}>Operational health, issues, and headcount per client</p>
        </div>
      </div>

      {/* Health Score Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {clientData.map(cd => {
          const m = cd.meta || {};
          const isSelected = selectedClient === cd.name;
          return (
            <ACCard
              key={cd.name}
              border={isSelected ? `2px solid ${M}` : undefined}
              style={{cursor:"pointer",overflow:"hidden",transition:"box-shadow 0.15s",
                boxShadow: isSelected ? `0 0 0 2px ${M}20` : undefined,
              }}
              onClick={() => setSelectedClient(p => p === cd.name ? null : cd.name)}
            >
              {/* Header */}
              <div style={{padding:"14px 16px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12}}>
                <div style={{
                  width:40,height:40,borderRadius:12,
                  backgroundColor: m.badge || "#e5e7eb",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontWeight:900,fontSize:14,color:m.text||"#374151",flexShrink:0,
                }}>
                  {cd.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontWeight:800,fontSize:14,color:"#111827"}}>{cd.name}</p>
                  <p style={{margin:"1px 0 0",fontSize:11,color:"#6b7280"}}>{cd.employees.length} employees · {cd.issues.length} issue{cd.issues.length!==1?"s":""}</p>
                </div>
                <ChevronRight size={14} style={{color:"#9ca3af",flexShrink:0,transform:isSelected?"rotate(90deg)":"none",transition:"transform 0.2s"}}/>
              </div>

              {/* Health Score */}
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Health Score</span>
                  <span style={{fontSize:12,fontWeight:800,color:cd.color}}>{cd.label} · {cd.score}/100</span>
                </div>
                <div style={{height:7,borderRadius:999,backgroundColor:"#f3f4f6",overflow:"hidden"}}>
                  <div style={{
                    height:"100%",borderRadius:999,
                    width:`${cd.score}%`,backgroundColor:cd.color,transition:"width 0.5s",
                  }}/>
                </div>
                {cd.issues.length > 0 && (
                  <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                    {cd.issues.slice(0,3).map(iss => (
                      <span key={iss.id} style={{
                        fontSize:10,padding:"2px 7px",borderRadius:999,fontWeight:700,
                        backgroundColor: PRIORITY_META[iss.priority].bg,
                        color: PRIORITY_META[iss.priority].color,
                      }}>
                        {iss.title.length > 30 ? iss.title.slice(0,30)+"…" : iss.title}
                      </span>
                    ))}
                    {cd.issues.length > 3 && (
                      <span style={{fontSize:10,color:"#9ca3af"}}>+{cd.issues.length-3} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded: employees list */}
              {isSelected && cd.employees.length > 0 && (
                <div style={{borderTop:"1px solid #f3f4f6",maxHeight:280,overflowY:"auto"}}>
                  {cd.employees.map(e => {
                    const days = daysUntil(e.endDate);
                    return (
                      <div key={e._id} style={{
                        display:"flex",alignItems:"center",gap:10,
                        padding:"9px 16px",borderBottom:"1px solid #f9fafb",
                      }}>
                        <div style={{
                          width:28,height:28,borderRadius:8,
                          backgroundColor:`${M}12`,display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:10,fontWeight:900,color:M,flexShrink:0,
                        }}>
                          {(e.name||"?")[0]}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:0,fontSize:12,fontWeight:700,color:"#111827"}}>{e.name}</p>
                          <p style={{margin:"1px 0 0",fontSize:10,color:"#6b7280",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                            {e.position} · {e.workflowStatus||"—"}
                          </p>
                        </div>
                        {e.endDate && (
                          <span style={{
                            fontSize:10,fontWeight:800,flexShrink:0,
                            color: days<=7?"#dc2626":days<=30?"#d97706":"#9ca3af",
                          }}>
                            {days<0?"EXPIRED":days===0?"TODAY":`${days}d`}
                          </span>
                        )}
                        {e.phone && <WAButton phone={e.phone}/>}
                      </div>
                    );
                  })}
                </div>
              )}
            </ACCard>
          );
        })}
      </div>

      {/* Detailed issue view for selected client */}
      {selected && selected.issues.length > 0 && (
        <ACCard style={{overflow:"hidden"}}>
          <SectionHeader
            icon={AlertCircle}
            title={`${selected.name} — Open Issues`}
            count={selected.issues.length}
            color={selected.color}
          />
          <div style={{maxHeight:360,overflowY:"auto"}}>
            {selected.issues.map(issue => (
              <div key={issue.id} style={{
                display:"flex",alignItems:"flex-start",gap:12,padding:"10px 16px",
                borderBottom:"1px solid #f9fafb",
              }}>
                <div style={{width:3,alignSelf:"stretch",borderRadius:999,backgroundColor:PRIORITY_META[issue.priority].color,flexShrink:0,marginTop:2}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <PriorityDot priority={issue.priority}/>
                    <span style={{fontSize:12,fontWeight:700,color:"#111827"}}>{issue.title}</span>
                  </div>
                  <p style={{margin:"3px 0 0",fontSize:11,color:"#6b7280"}}>{issue.reason}</p>
                  <p style={{margin:"3px 0 0",fontSize:11,fontWeight:600,color:M}}>→ {issue.recommendedAction}</p>
                </div>
                {issue.employee?.phone && <WAButton phone={issue.employee.phone}/>}
              </div>
            ))}
          </div>
        </ACCard>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 UPDATED NAV ITEMS — Replace navItems in App.jsx FisheyeOpsPro component
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * COPY THIS into FisheyeOpsPro, replacing the existing navItems array.
 * Also import the missing icons at the top of App.jsx:
 * import { Target, CalendarDays } from "lucide-react";
 *
 * And import the new components:
 * import { ActionCenter, OperationsCalendar, ClientCommandCenter } from './ActionCenter';
 *
 * Then add these render conditions in the content section:
 *   {nav==="action"    && <ActionCenter employees={employees} setEmployees={setEmployees} onNavigate={k => { setNav(k); localStorage.setItem("fisheye_nav", k); }}/>}
 *   {nav==="calendar"  && <OperationsCalendar employees={employees}/>}
 *   {nav==="clients"   && <ClientCommandCenter employees={employees}/>}
 *
 * The existing DashboardView (Command Center) can be kept as nav="dashboard"
 * or removed if you want ActionCenter to fully replace it.
 *
 * UPDATED_NAV_ITEMS:
 *
 * const navItems = [
 *   { k:"action",      l:"Action Center",       i:Target         },  ← NEW PRIMARY
 *   { k:"calendar",    l:"Ops Calendar",         i:CalendarDays   },  ← NEW
 *   { k:"report",      l:"Morning Report",       i:ClipboardList  },
 *   { k:"workforce",   l:"Workforce",            i:Users          },
 *   { k:"clients",     l:"Clients",              i:Building2      },
 *   { k:"partners",    l:"Partners",             i:Briefcase      },
 *   { k:"finance",     l:"Finance",              i:DollarSign     },
 *   { k:"billing",     l:"Billing",              i:FileText       },
 *   { k:"onboarding",  l:"Onboarding",           i:UserPlus       },
 *   { k:"analytics",   l:"Analytics",            i:BarChart2      },
 *   { k:"escalations", l:"Escalations",          i:AlertCircle    },
 *   { k:"settlement",  l:"Settlements",          i:TrendingUp     },
 *   { k:"reports",     l:"Reports",              i:ClipboardList  },
 *   { k:"tickets",     l:"Tickets",              i:Ticket         },
 *   { k:"settings",    l:"Settings",             i:Settings       },
 * ];
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════
export default ActionCenter;