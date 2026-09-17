import React, { useState, useCallback, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StyleGuide from './StyleGuide.jsx';
import { FinanceModule } from './FinanceModule';
import ClientPortal from './ClientPortal';
import PartnerPortal from './PartnerPortal';
import BonusSIP from './BonusSIP';
import { OnboardingModule } from './modules/onboarding';
import WeeklyMonthlyReports from './Weeklymonthlyreports';
import WeeklyReportGenerator from './Weeklyreportgenerator';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { supabase, testConnection } from './utils/supabase';
import { isExcluded, isWFDone, hasMissingPO, hasValidPO, getClientsList } from './utils/helpers';
import { getEffectiveClientsList, getEffectiveClientMeta, getEffectiveMappingRules, CLIENT_COLOR_PALETTE, CONFIG_KEY, classifyProject, classifyProjectStrict, sanitizeClientName, clientRequiresPO, DEFAULT_CLIENTS_LIST, DEFAULT_CLIENT_META, loadAppConfig, getEffectiveMargin, dealHasAnyValue, computeDealMargin } from './utils/appConfig';
import {
  LayoutDashboard, Users, DollarSign, Ticket, Settings, Building2,
  Bell, Clock, FileText, Upload, Plus, X, Send, Eye,
  Search, Shield, User, TrendingUp, CheckCircle,
  Download, MessageCircle, Calendar, AlertCircle, Trash2,
  Menu, ChevronDown, Copy, Check, Mail, Filter, FileUp,
  Edit3, Save, Hash, Zap, ClipboardList, Briefcase, Archive, Globe, Link, Inbox, UserPlus, Database,
  Target, CalendarDays, Receipt, AlertTriangle, RefreshCw, GitBranch, Award, LogOut, Wallet,
  ChevronRight, ChevronLeft
} from "lucide-react";
import { ActionCenter } from './ActionCenterV2';
import AuthGate, { useAuth } from './AuthGate';

// ملاحظة: إضافة الموظفين تتم من خلال handleAddSingle داخل WorkforceView
// WhatsApp Helper for Client Communications
const sendWhatsAppMessage = async (phone, message, clientName) => {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.length < 7) return;
  
  // CallMeBot Integration (Free WhatsApp API)
  // يمكنك الحصول على API key من: https://www.callmebot.com/en/
  const apiKey = localStorage.getItem('fisheye_wa_apikey') || '3635248';
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = img.onerror = () => { console.log(`✅ WhatsApp sent to ${clientName}`); resolve(true); };
    img.src = url;
  });
};
 
const M  = "#A02843";  // Fisheye Crimson — Pantone 194C
const MD = "#00293A";  // Fisheye Navy    — Pantone 303C
const ML = "#c04060";  // Crimson light tint
// Design System v3 "Refined Editorial Enterprise" type stack. Scope-applied via
// inline style (CSS custom-property override of --font-sans, which every legacy
// .fe-* class already reads through var()) rather than editing global CSS, so
// modules can opt in one at a time without touching screens not yet redone.
const FE_SANS  = "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FE_SERIF = "'Piazzolla', Georgia, serif";
const FE_MONO  = "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace";
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const CLIENTS_LIST = getEffectiveClientsList();
const CLIENT_META = getEffectiveClientMeta();

// Keeps CLIENTS_LIST / CLIENT_META in sync with whatever client names are
// actually present on employee records, even when a client reaches
// employees_master without ever being "registered" via Configuration (e.g.
// a bulk edit typed straight into the client field). Mutates the two
// module-level constants above IN PLACE -- every place in this file that
// reads CLIENTS_LIST/CLIENT_META sees the update immediately on its next
// render, with no prop changes needed anywhere. Called from a useEffect on
// `employees` in the top-level component, so it runs after every load,
// CSV import, bulk edit, Reconcile, etc.
function syncClientRosterWithEmployees(emps) {
  if (!Array.isArray(emps) || !emps.length) return;
  const known = new Set(CLIENTS_LIST);
  const distinct = [...new Set(emps.map(e => (e.client || "").trim()).filter(Boolean))];
  distinct.forEach(name => {
    if (known.has(name)) return;
    CLIENTS_LIST.push(name);
    known.add(name);
    if (!CLIENT_META[name]) {
      CLIENT_META[name] = CLIENT_COLOR_PALETTE[CLIENTS_LIST.length % CLIENT_COLOR_PALETTE.length];
    }
  });
}
const WORKFLOW_OPTS = [
  "Docs Requested","Docs Received","Docs Received +","Agreement Sent",
  "Agreement Signed","Pending","Complete","Rejected","Qiwa Submitted","Qiwa Approved", "Onboarding", "Iqama Transferred"
];
const STATUS_OPTS = ["active","new","renewal","transfer","expired","resigned","منتهي","مستقيل"];
const QIWA_FIELDS = ["Name","Project","Job Title","Contract Type","Iqama","Sponsor","Start Date","Mobile","Sex","Nationality","D.O.B","IBAN","Email","Bank","Period","Probation","Vacation Days","Basic","HRA","TPT","Total Salary"];

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 HEADCOUNT CALCULATIONS (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════════
function calculateHeadcountByClient(employees) {
  const headcount = {};
  getClientsList(employees).forEach(client => {
    const active = employees.filter(e => e.client === client && !isExcluded(e));
    headcount[client] = {
      total: active.length,
      active: active.filter(e => e.status === "active").length,
      new: active.filter(e => e.status === "new").length,
      renewal: active.filter(e => e.status === "renewal").length,
      transfer: active.filter(e => e.status === "transfer").length,
      pending: active.filter(e => !isWFDone(e.workflowStatus)).length,
    };
  });
  return headcount;
}

function mapClient(project = "") {
  return classifyProject(project);
}

function parseCSVLine(line) {
  const res = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { res.push(cur); cur = ""; }
    else cur += ch;
  }
  res.push(cur);
  return res;
}

function parseCSV(raw) {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const hdrs = parseCSVLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map((line, i) => {
    const v = parseCSVLine(line);
    const row = Object.fromEntries(hdrs.map((h, j) => [h, (v[j]||"").trim()]));
    const project = row["Project Name"] || "";
    const pkg = parseFloat(row["Total Package"]) || 0;
    const status = (row["Status"] || "").toLowerCase().trim();
    return {
      _id: i,
      employeeId: row["Employee ID"] || "",
      contractId: row["Contract ID"] || "",
      name: row["Candidate Name"] || "",
      email: row["Email"] || "",
      phone: (row["Phone Number"] || "").replace(/\s+/g,""),
      idNumber: row["ID Number"] || "",
      position: row["Position"] || "",
      project, client: classifyProjectStrict(project) || "",
      sourcingThrough: row["Sourcing Through"] || "",
      nationalityType: row["Nationality Type"] || "",
      startDate: row["Start Date"] || "",
      endDate: row["End Date"] || "",
      totalPackage: pkg, status,
      workflowStatus: row["Workflow Status"] || "",
      poNumbers: row["PO Numbers"] || "",
      invoiceNumbers: row["Invoice Numbers"] || "",
      profitMode: "partner",
      clientPrice: Math.round(pkg * 1.15),
      partnerCost: Math.round(pkg * 0.92),
      fisheyeMargin: 15,
      iqama:"", sponsor:"", sex:"", dob:"", iban:"",
      bank:"", contractType:"", probation:"14 days", vacationDays:"21",
      basic: Math.round(pkg*0.60), hra: Math.round(pkg*0.25), tpt: Math.round(pkg*0.15),
      partnerAssigned:"", notes:"", auditLog:[], gosiOption:"",
    };
  }).filter(e => e.name.trim());
}

const daysUntil = d => d ? Math.ceil((new Date(d) - TODAY) / 86400000) : 9999;
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtSAR = n => n ? `SAR ${Number(n).toLocaleString()}` : "—";
const fmtNum = n => {
  if (!n || n === 0) return "0";
  if (n >= 1000000) return `${(n/1000000).toFixed(n%1000000===0?0:1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(n%1000===0?0:1)}K`;
  return n.toLocaleString();
};
const fmtSARShort = n => n ? `SAR ${fmtNum(n)}` : "—";
const waHref = phone => { const c=(phone||"").replace(/[^0-9+]/g,"").replace(/^\+/,""); return c.length>6?`https://wa.me/${c}`:null; };
const isContractExpired = e => e.endDate && daysUntil(e.endDate) < 0;
const calcProfit = e => {
  if (e.profitMode === "direct") {
    // Direct mode: the margin comes fully computed from getEffectiveMargin --
    // the employee's own typed-in value if there is one, else the matching
    // client Deal (percentage of monthly/annual salary, a flat amount, and a
    // Saudization fee, all combined -- see utils/appConfig.js).
    return Math.round(getEffectiveMargin(e).amount);
  } else {
    // Partner mode: Client Price - Partner Cost
    if (e.clientPriceType === "percent") {
      const cp = Math.round((e.clientPrice / 100) * e.totalPackage);
      const pp = (e.partnerCostType === "percent") ? Math.round((e.partnerCost / 100) * e.totalPackage) : e.partnerCost;
      return cp - pp;
    } else {
      const cp = e.clientPrice;
      const pp = (e.partnerCostType === "percent") ? Math.round((e.partnerCost / 100) * e.totalPackage) : e.partnerCost;
      return cp - pp;
    }
  }
};

function buildReport(employees) {
  const pool = employees.filter(e => !isExcluded(e) && e.client !== "Combuzz HR");
  const pending = pool.filter(e => !isWFDone(e.workflowStatus));
  const byProject = {};
  pending.forEach(e => { if(!byProject[e.project]) byProject[e.project]=[]; byProject[e.project].push(e); });
  const selaPoAlert = employees.filter(e => clientRequiresPO(e.client) && !isExcluded(e) && hasMissingPO(e));
  const expiring = employees.filter(e => { const d=daysUntil(e.endDate); return d>=0&&d<=30&&!isExcluded(e); });
return { byProject, selaPoAlert, expiring, pendingCount: pending.length };
}

function exportQiwaCSV(employees) {
  const rows = [QIWA_FIELDS, ...employees.map(e=>[
    e.name,e.project,e.position,e.contractType||"",e.iqama||"",e.sponsor||"",
    e.startDate||"",e.phone||"",e.sex||"",e.nationalityType||"",e.dob||"",
    e.iban||"",e.email||"",e.bank||"",
    `${e.startDate||""} - ${e.endDate||""}`,e.probation||"14 days",
    e.vacationDays||"21",e.basic||"",e.hra||"",e.tpt||"",e.totalPackage||""
  ])];
  const csv = rows.map(r=>r.map(v=>`"${v||""}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `qiwa_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// ─── STYLES ────────────────────────────────────────────────────────────
const s = {
  // Layout
  appShell: { display:"flex", height:"100vh", overflow:"hidden", fontFamily:"var(--font-sans,'Plus Jakarta Sans',-apple-system,sans-serif)", backgroundColor:"var(--surface-sub,#f8f8f9)" },
  sidebar: (open) => ({ width: open ? 220 : 60, flexShrink:0, display:"flex", flexDirection:"column", background:"#00293A", borderRight:"1px solid rgba(255,255,255,0.06)", transition:"width 280ms cubic-bezier(0.4,0,0.2,1)", overflow:"hidden" }),
  sidebarHeader: { padding:"16px 14px 14px", display:"flex", alignItems:"center", gap:11, flexShrink:0 },
  sidebarLogo: { width:34, height:34, background:"#A02843", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.35)` },
  sidebarBadge: { padding:"7px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 },
  sidebarBadgeInner: { display:"flex", alignItems:"center", gap:8, backgroundColor:"rgba(255,255,255,0.06)", borderRadius:7, padding:"6px 10px", border:"1px solid rgba(255,255,255,0.08)" },
  sidebarDot: { width:6, height:6, borderRadius:"50%", backgroundColor:"oklch(70% 0.12 152)", flexShrink:0, boxShadow:"0 0 6px oklch(70% 0.12 152 / 0.7)" },
  sidebarNav: { flex:1, overflowY:"auto", padding:"8px 8px" },
  navBtn: (active) => ({ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, fontWeight: active ? 700 : 500, marginBottom:1, backgroundColor: active ? "#A02843" : "transparent", color: active ? "white" : "rgba(180,210,220,0.65)", whiteSpace:"nowrap", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)", transition:"all 0.15s" }),
  navBadgeTotal: { fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:999, backgroundColor:"#A02843", color:"white", marginLeft:"auto", letterSpacing:"0", fontFamily:"var(--font-mono)" },
  navBadgeWarn:  { fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:999, backgroundColor:"oklch(54% 0.13 78)", color:"white", marginLeft:"auto", letterSpacing:"0", fontFamily:"var(--font-mono)" },
  navBadgeCount: { fontSize:10, fontWeight:700, padding:0, borderRadius:0, backgroundColor:"transparent", color:"rgba(180,210,220,0.6)", marginLeft:"auto", letterSpacing:"0", fontFamily:"var(--font-mono)" },
  sidebarFooter: { padding:"10px 10px 12px", borderTop:"1px solid rgba(255,255,255,0.07)", flexShrink:0 },
  sidebarToggle: { padding:"6px 8px", borderTop:"1px solid rgba(255,255,255,0.07)", flexShrink:0 },
  toggleBtn: { width:"100%", padding:7, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"transparent", border:"none", cursor:"pointer", color:"rgba(255,200,200,0.35)", borderRadius:7, fontFamily:"inherit", transition:"color 0.15s" },
  main: { flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" },
  topbar: { backgroundColor:"rgba(255,255,255,0.88)", borderBottom:"1px solid rgba(228,228,231,0.7)", padding:"11px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" },
  content: { flex:1, overflowY:"auto", padding:"20px 24px", background:"var(--surface-sub,#f8f8f9)" },
  // Cards
  card: { backgroundColor:"white", borderRadius:13, border:"1px solid var(--border,#e5e7eb)", boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)" },
  statCard: { backgroundColor:"white", borderRadius:13, border:"1px solid var(--border,#e5e7eb)", boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)", padding:16 },
  // Buttons
  btnPrimary: { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", backgroundColor:M, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)" },
  btnGhost:   { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", backgroundColor:"white", color:"#374151", border:"1px solid var(--border,#e5e7eb)", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)" },
  btnDanger:  { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", backgroundColor:"#b91c1c", color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)" },
  btnSm: { padding:"5px 11px", fontSize:12 },
  // Table
  table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th: { padding:"11px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", backgroundColor:"#f9fafb", borderBottom:"1px solid #f0eff1", whiteSpace:"nowrap" },
  td: { padding:"11px 12px", borderBottom:"1px solid #f5f5f6", verticalAlign:"middle", fontSize:13, color:"#1f2937" },
  // Form
  inp: { width:"100%", border:"1px solid var(--border,#e5e7eb)", borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"var(--font-sans)", color:"#111827" },
  sel: { width:"100%", border:"1px solid var(--border,#e5e7eb)", borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", backgroundColor:"white", boxSizing:"border-box", fontFamily:"var(--font-sans)", color:"#111827" },
  label: { display:"block", fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4, fontFamily:"var(--font-sans)" },
  // Modal
  overlay: { position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, zIndex:50 },
  modalBox: (wide) => ({ backgroundColor:"white", borderRadius:18, boxShadow:"0 24px 64px rgba(0,0,0,0.16),0 8px 24px rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", maxHeight:"92vh", width:"100%", maxWidth: wide ? 900 : 520 }),
  modalHeader: { padding:"18px 24px", borderRadius:"18px 18px 0 0", background:`linear-gradient(135deg,${MD} 0%,${M} 55%,#8a1818 100%)`, flexShrink:0 },
  modalBody: { flex:1, overflowY:"auto", padding:24 },
  // Badges
  badge: (bg,color) => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, backgroundColor:bg, color, letterSpacing:"0.01em" }),
  // Grid helpers
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  grid3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 },
  grid4: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16 },
  flexRow: { display:"flex", alignItems:"center", gap:8 },
  flexBetween: { display:"flex", alignItems:"center", justifyContent:"space-between" },
};

// ─── PRIMITIVES ────────────────────────────────────────────────────────
function Btn({ children, onClick, variant="primary", size="md", disabled, full, style={} }) {
  const base = variant==="primary" ? s.btnPrimary : variant==="ghost" ? s.btnGhost : variant==="danger" ? s.btnDanger : s.btnPrimary;
  const sz   = size==="sm" ? s.btnSm : {};
  const cls  = `fe-btn fe-btn-${variant==="danger"?"danger":variant==="ghost"?"ghost":"primary"}`;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={{ ...base, ...sz, width:full?"100%":"auto", justifyContent:full?"center":"flex-start", opacity:disabled?0.4:1, ...style }}
    >
      {children}
    </button>
  );
}

function Card({ children, style={}, interactive=false, className="" }) {
  return (
    <div
      className={`fe-card${interactive?" fe-card-interactive":""} ${className}`}
      style={{ ...s.card, ...style }}
    >
      {children}
    </div>
  );
}

function ClientBadge({ client, small }) {
  const m = CLIENT_META[client] || { badge:"#e5e7eb", text:"#374151", dot:"#6b7280" };
  return (
    <span style={{...s.badge(m.badge,m.text), fontSize: small?10:11}}>
      <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:m.dot,display:"inline-block"}}/>
      {client}
    </span>
  );
}

function WFBadge({ status }) {
  if (!status) return <span style={{fontSize:12,color:"#9ca3af"}}>—</span>;
  const sl = status.toLowerCase();
  const bg = sl.includes("signed")||sl==="complete" ? "#dcfce7" : sl.includes("pending")||sl==="rejected" ? "#fee2e2" : sl.includes("received") ? "#dbeafe" : sl.includes("sent")||sl.includes("requested") ? "#fef9c3" : sl.includes("qiwa") ? "#f3e8ff" : "#f3f4f6";
  const color = sl.includes("signed")||sl==="complete" ? "#166534" : sl.includes("pending")||sl==="rejected" ? "#991b1b" : sl.includes("received") ? "#1e40af" : sl.includes("sent")||sl.includes("requested") ? "#854d0e" : sl.includes("qiwa") ? "#581c87" : "#374151";
  return <span style={{...s.badge(bg,color), whiteSpace:"nowrap"}}>{status}</span>;
}

function StatusBadge({ status }) {
  const sl = (status||"").toLowerCase();
  const cfg = sl==="active"?["#dcfce7","#166534"]:sl==="renewal"?["#dbeafe","#1e40af"]:sl==="new"?["#f3e8ff","#581c87"]:sl==="transfer"?["#ffedd5","#7c2d12"]:sl==="expired"?["#f3f4f6","#6b7280"]:sl==="resigned"?["#fee2e2","#991b1b"]:["#f3f4f6","#374151"];
  return <span style={{...s.badge(cfg[0],cfg[1]), textTransform:"capitalize"}}>{status||"—"}</span>;
}

function StatCard({ icon:Icon, label, value, sub, color }) {
  const c = color||M;
  return (
    <div className="fe-stat-card" style={s.statCard}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <div style={{padding:10,borderRadius:11,backgroundColor:`${c}12`,flexShrink:0}}><Icon size={18} style={{color:c}}/></div>
        <div>
          <p className="fe-label" style={{margin:0}}>{label}</p>
          <p className="fe-kpi-value" style={{fontSize:24,fontWeight:800,color:"#111827",margin:"5px 0 0",lineHeight:1}}>{value}</p>
          {sub&&<p style={{fontSize:11,color:"#9ca3af",margin:"5px 0 0",fontFamily:"var(--font-sans)"}}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function WABtn({ phone, label }) {
  const link = waHref(phone);
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
      style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"white",padding:"5px 10px",borderRadius:8,backgroundColor:"#16a34a",textDecoration:"none",whiteSpace:"nowrap"}}>
      <MessageCircle size={11}/>{label||"WA"}
    </a>
  );
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div style={s.overlay} className="fe-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modalBox(wide)} className="fe-modal-box">
        <div style={s.modalHeader}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"white",letterSpacing:"-0.02em",fontFamily:"var(--font-sans)"}}>{title}</h2>
              {subtitle&&<p style={{margin:"3px 0 0",fontSize:11,color:"rgba(255,200,200,0.75)",fontFamily:"var(--font-sans)"}}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.8)",padding:6,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 130ms"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
            ><X size={16}/></button>
          </div>
        </div>
        <div style={s.modalBody}>{children}</div>
      </div>
    </div>
  );
}

function Inp({ label, value, onChange, type="text", placeholder }) {
  return (
    <div>
      {label&&<label className="fe-label" style={s.label}>{label}</label>}
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="fe-input" style={s.inp}/>
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div>
      {label&&<label className="fe-label" style={s.label}>{label}</label>}
      <select value={value||""} onChange={e=>onChange(e.target.value)} className="fe-select" style={s.sel}>
        {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function UploadScreen({ onUpload }) {
  const [file, setFile] = useState(null);
 
  const handle = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = parseCSV(ev.target.result);
        const unresolved = data.filter(d => !d.client);
        if (unresolved.length) {
          const projects = [...new Set(unresolved.map(d => d.project || "(no project)"))];
          alert(
            `⚠️ ${unresolved.length} موظف مشروعهم مش متعرّف عليه، فاتحفظوا من غير Client (محتاجين تحديد يدوي بعد كده من صفحة الموظفين أو الإعدادات):\n\n` +
            projects.map(p => `• ${p}`).join('\n')
          );
        }
        onUpload(data);
      } catch (error) {
        alert("Parse error: " + error.message);
      }
    };
    reader.readAsText(f);
  };
 
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${M} 0%, ${MD} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ maxWidth: 600, padding: 60, textAlign: "center" }}>
        <Eye size={48} style={{ color: M, margin: "0 auto 20px", display: "block" }} />
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: M }}>Fisheye Ops Pro</h1>
        <p style={{ margin: "8px 0 24px", fontSize: 16, color: "#6b7280" }}>KSA Staffing Operations & Finance</p>
 
        <div style={{ position: "relative", padding: 40, border: `2px dashed ${M}`, borderRadius: 12, backgroundColor: M + "05", cursor: "pointer", marginBottom: 20 }}>
          <input type="file" accept=".csv" onChange={handle} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: "pointer" }} />
          <Upload size={32} style={{ color: M, margin: "0 auto 12px", display: "block" }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: M }}>Upload Master CSV</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>or drag file here</p>
        </div>
 
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "20px 0 0" }}>📊 Required columns: Candidate Name, Email, Phone Number, Project Name, Total Package, Status, Workflow Status</p>
      </Card>
    </div>
  );
}

// ─── WF DROPDOWN ───────────────────────────────────────────────────────
function WFDropdown({ emp, onUpdate }) {
  const [open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div ref={ref} style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setOpen(o=>!o)} title="Update workflow"
        style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:7,border:"1px solid #e5e7eb",backgroundColor:"white",cursor:"pointer",color:"#6b7280",flexShrink:0}}
        onMouseEnter={ev=>ev.currentTarget.style.backgroundColor="#f9fafb"}
        onMouseLeave={ev=>ev.currentTarget.style.backgroundColor="white"}>
        <Edit3 size={13}/>
      </button>
      {open&&(
        <div style={{position:"absolute",zIndex:40,left:0,top:"calc(100% + 4px)",width:208,backgroundColor:"white",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:"1px solid #e5e7eb",overflow:"hidden"}}>
          <div style={{padding:"8px 12px",borderBottom:"1px solid #f3f4f6",fontSize:11,fontWeight:700,color:"#6b7280",backgroundColor:`${M}08`}}>Set Workflow</div>
          <div style={{maxHeight:240,overflowY:"auto",padding:"4px 0"}}>
            {WORKFLOW_OPTS.map(opt=>{
              const active=emp.workflowStatus===opt;
              return (
                <button key={opt} onClick={()=>{onUpdate(emp._id,"workflowStatus",opt);setOpen(false);}}
                  style={{width:"100%",textAlign:"left",padding:"8px 12px",fontSize:12,border:"none",backgroundColor:active?`${M}10`:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontWeight:active?700:400,color:active?M:"#374151"}}>
                  {opt}{active&&<Check size={10} style={{color:M}}/>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EMPLOYEE MODAL ─────────────────────────────────────────────────────
const deriveSalary = (pkg) => {
  const basic = Math.round(Number(pkg || 0) / 1.35);
  return { basic, hra: Math.round(basic * 0.25), tpt: Math.round(basic * 0.10) };
};

function EmployeeModal({ emp, onClose, onSave, partners, allEmployees = [], useOperationalIssues: useOpsIssues }) {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState(() => {
    const derived = deriveSalary(emp.totalPackage);
    return {
      ...emp,
      ...derived,
      auditLog: Array.isArray(emp.auditLog)
        ? emp.auditLog
        : emp.auditLog
          ? [{ ts: new Date().toISOString(), action: emp.auditLog }]
          : []
    };
  });
  const upd = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === "totalPackage") Object.assign(next, deriveSalary(v));
    return next;
  });
  const wa = waHref(form.phone);
  const profit = useMemo(() => calcProfit(form), [form]);
  const effMargin = useMemo(() => getEffectiveMargin(form), [form.fisheyeMargin, form.fisheyeMarginType, form.client, form.project]);

  // Operational issues for this employee (from Sprint 1 hook if available)
  const empIssues = useMemo(() => {
    if (!useOpsIssues || !allEmployees.length) return [];
    try {
      const allIssues = useOpsIssues(allEmployees);
      return allIssues.byEmployee?.[emp._id] || [];
    } catch { return []; }
  }, [allEmployees, emp._id, useOpsIssues]);

  const save = () => {
    const original    = allEmployees.find(e => e._id === form._id) || {};
    const hadPO       = original.poNumbers && String(original.poNumbers).trim() !== "";
    const hasPO       = form.poNumbers  && String(form.poNumbers).trim()  !== "";
    const poJustAdded = hasPO && !hadPO;
    const ts          = new Date().toISOString();

    // Build detailed change log
    const changes = [];
    const track = (field, label, fmt = v => v || '—') => {
      const oldV = original[field]; const newV = form[field];
      if (String(oldV ?? '') !== String(newV ?? ''))
        changes.push({ ts, field, action: `${label}: "${fmt(oldV)}" → "${fmt(newV)}"` });
    };

    track('workflowStatus', 'Workflow');
    track('status',         'Status');
    track('totalPackage',   'Package',     v => v ? `SAR ${Number(v).toLocaleString()}` : '—');
    track('poNumbers',      'PO');
    track('partnerAssigned','Partner');
    track('client',         'Client');
    track('startDate',      'Start Date');
    track('endDate',        'End Date');
    track('jobTitle',       'Job Title');
    track('profitMode',     'Profit Mode');

    // If nothing tracked (minor field), add a generic entry
    if (!changes.length) changes.push({ ts, field: 'other', action: 'Profile updated' });

    const updated = {
      ...form,
      ...(form.workflowStatus !== original.workflowStatus
        ? { wfDate: new Date().toISOString().split("T")[0] }
        : {}),
      ...(poJustAdded ? { poAddedDate: new Date().toISOString().split("T")[0] } : {}),
      auditLog: [
        ...(Array.isArray(form.auditLog) ? form.auditLog : []),
        ...changes,
      ]
    };
    onSave(updated);
    onClose();
  };

  const clientField = (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, display: "block" }}>
        CLIENT
      </label>
      <select
        value={form.client || ""}
        onChange={e => upd("client", e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
      >
        <option value="">— Select Client —</option>
        {CLIENTS_LIST.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );

  // ── Timeline entries built from auditLog
  const timelineEntries = useMemo(() => {
    const entries = [];
    const log = Array.isArray(form.auditLog) ? form.auditLog : [];
    log.forEach(l => entries.push({ ts: l.ts, label: l.action, type: "log", field: l.field || 'other' }));
    if (form.startDate) entries.push({ ts: form.startDate + "T00:00:00Z", label: "Contract started", type: "contract" });
    if (form.endDate)   entries.push({ ts: form.endDate   + "T00:00:00Z", label: "Contract ends",   type: daysUntil(form.endDate) < 0 ? "expired" : "contract" });
    return entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [form.auditLog, form.startDate, form.endDate]);

  const tabs=[
    {k:"info",     l:"Profile",  i:User},
    {k:"context",  l:"Context",  i:ClipboardList},
    {k:"contract", l:"Contract", i:FileText},
    {k:"handover", l:"Handover", i:Briefcase},
    {k:"log",      l:"Timeline", i:Clock},
  ];
  return (
    <Modal title={form.name} subtitle={`${form.employeeId} · ${form.client}`} onClose={onClose} wide>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
        {wa&&<WABtn phone={form.phone} label="WhatsApp"/>}
        {form.email&&<a href={`mailto:${form.email}`} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"white",padding:"5px 10px",borderRadius:8,backgroundColor:"#2563eb",textDecoration:"none"}}><Mail size={11}/> Email</a>}
        <ClientBadge client={form.client}/>
        <StatusBadge status={form.status}/>
        <WFBadge status={form.workflowStatus}/>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid #e5e7eb",marginBottom:20,flexWrap:"wrap"}}>
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",fontSize:12,fontWeight:600,border:"none",borderBottom:`2px solid ${tab===t.k?M:"transparent"}`,backgroundColor:"transparent",cursor:"pointer",color:tab===t.k?M:"#6b7280",marginBottom:-1}}>
            <t.i size={12}/>{t.l}
          </button>
        ))}
      </div>

      {/* ── CONTEXT TAB (Sprint 3 addition) ── */}
      {tab==="context"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Pending Issues from hook */}
          {empIssues.length > 0 && (
            <div style={{padding:14,borderRadius:12,border:"1px solid #fee2e2",backgroundColor:"#fff5f5"}}>
              <p style={{fontSize:11,fontWeight:700,color:"#991b1b",textTransform:"uppercase",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}>
                <AlertCircle size={12}/> Pending Issues ({empIssues.length})
              </p>
              {empIssues.map((issue,i)=>(
                <div key={i} style={{padding:"8px 12px",borderRadius:8,backgroundColor:"white",border:"1px solid #fecaca",marginBottom:6,fontSize:12}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontWeight:600,color:"#374151"}}>{issue.reason || issue.type}</span>
                    {issue.severity==="critical"
                      ? <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,backgroundColor:"#fee2e2",color:"#991b1b"}}>Critical</span>
                      : <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,backgroundColor:"#fef9c3",color:"#854d0e"}}>Warning</span>
                    }
                  </div>
                  {issue.recommendedAction && <p style={{fontSize:11,color:"#6b7280",margin:"4px 0 0"}}>{issue.recommendedAction}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div style={{padding:"12px 14px",borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"#f9fafb"}}>
              <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 4px"}}>Contract Ends</p>
              <p style={{fontSize:14,fontWeight:700,color: daysUntil(form.endDate)<0?"#dc2626":daysUntil(form.endDate)<=30?"#d97706":"#374151",margin:0}}>
                {form.endDate ? (daysUntil(form.endDate)<0 ? "Expired" : `${daysUntil(form.endDate)}d`) : "—"}
              </p>
            </div>
            <div style={{padding:"12px 14px",borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"#f9fafb"}}>
              <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 4px"}}>Gross Profit</p>
              <p style={{fontSize:14,fontWeight:700,color:"#16a34a",margin:0}}>{profit>0?`+${profit.toLocaleString()} SAR`:"—"}</p>
            </div>
            <div style={{padding:"12px 14px",borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"#f9fafb"}}>
              <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 4px"}}>Partner</p>
              <p style={{fontSize:13,fontWeight:600,color:"#374151",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{form.partnerAssigned||"—"}</p>
            </div>
          </div>

          {/* Workflow Stage */}
          <div style={{padding:14,borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"white"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",margin:"0 0 10px"}}>Workflow Journey</p>
            <JourneyBar workflowStatus={form.workflowStatus} status={form.status}/>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
              <WFBadge status={form.workflowStatus}/>
              <StatusBadge status={form.status}/>
              {form.wfDate && <span style={{fontSize:11,color:"#9ca3af"}}>since {fmt(form.wfDate)}</span>}
            </div>
          </div>

          {/* Onboarding Steps */}
          {form.onboardingSteps && Object.keys(form.onboardingSteps).length > 0 && (
            <div style={{padding:14,borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"white"}}>
              <p style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",margin:"0 0 10px"}}>Onboarding Checklist</p>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {Object.entries(form.onboardingSteps).map(([step,done])=>(
                  <div key={step} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                    <div style={{width:18,height:18,borderRadius:"50%",backgroundColor:done?"#16a34a":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {done ? <Check size={10} style={{color:"white"}}/> : null}
                    </div>
                    <span style={{color:done?"#374151":"#9ca3af",textTransform:"capitalize"}}>{step.replace(/_/g," ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Dates */}
          <div style={{padding:14,borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"white"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",margin:"0 0 10px"}}>Key Information</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
              {[["Start Date",fmt(form.startDate)],["End Date",fmt(form.endDate)],["Project",form.project||"—"],["Sourcing",form.sourcingThrough||"—"],["Nationality",form.nationalityType||"—"],["Profit Mode",form.profitMode||"partner"]].map(([l,v])=>(
                <div key={l}>
                  <p style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",margin:"0 0 2px"}}>{l}</p>
                  <p style={{fontSize:12,color:"#374151",margin:0,fontWeight:500,textTransform:"capitalize"}}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {form.notes && (
            <div style={{padding:14,borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"#fffbf5"}}>
              <p style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",margin:"0 0 6px"}}>Notes</p>
              <p style={{fontSize:12,color:"#374151",margin:0,lineHeight:1.6}}>{form.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab==="info"&&(
        <div style={s.grid2}>
          {[["Name","name"],["Position","position"],["Project","project"],["Email","email"],["Phone","phone"],["ID Number","idNumber"],["Nationality","nationalityType"],["Sourcing","sourcingThrough"]].map(([l,k])=><Inp key={k} label={l} value={form[k]||""} onChange={v=>upd(k,v)}/>)}
          {/* Client dropdown بدل الـ text input */}
          {clientField}
          <div>
            <label style={s.label}>Assigned Partner</label>
           <select 
  value={form.partnerAssigned || ""} 
  onChange={e => upd("partnerAssigned", e.target.value)} 
  style={s.sel}
>
  <option value="">— Select Partner —</option>
 {partners.map(p => (
  <option key={p.id} value={p.name}> {/* غيري p.id لـ p.name هنا فقط في الـ value */}
    {p.name}
  </option>
))}
</select>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={s.label}>Notes</label>
            <textarea rows={3} value={form.notes||""} onChange={e=>upd("notes",e.target.value)} style={{...s.inp,resize:"none"}}/>
          </div>
        </div>
      )}
      {tab==="contract"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{padding:12,borderRadius:12,border:"1px solid #e5e7eb",backgroundColor:"#f9fafb"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",margin:"0 0 10px"}}>Profit Mode</p>
            <div style={{display:"flex",gap:8}}>
              {["direct","partner"].map(mode=>(
                <button key={mode} onClick={()=>upd("profitMode",mode)} style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${form.profitMode===mode?M:"#e5e7eb"}`,backgroundColor:form.profitMode===mode?M:"white",color:form.profitMode===mode?"white":"#6b7280",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {mode==="direct"?"⚡ Direct (No Partner)":"🤝 With Partner"}
                </button>
              ))}
            </div>
          </div>
          <div style={s.grid3}>
            <Sel label="Status" value={form.status} onChange={v=>upd("status",v)} options={STATUS_OPTS}/>
            <Sel label="Workflow" value={form.workflowStatus} onChange={v=>upd("workflowStatus",v)} options={["",...WORKFLOW_OPTS]}/>
            <Inp label="Client Price (SAR)" value={String(form.clientPrice||"")} onChange={v=>upd("clientPrice",parseFloat(v)||0)} type="number"/>
          </div>
          <div style={s.grid2}>
            <Inp label="Start Date" value={form.startDate} onChange={v=>upd("startDate",v)} type="date"/>
            <Inp label="End Date" value={form.endDate} onChange={v=>upd("endDate",v)} type="date"/>
          </div>
          <div style={s.grid3}>
            <Inp label="Total Package" value={String(form.totalPackage)} onChange={v=>upd("totalPackage",parseFloat(v)||0)} type="number"/>
            {form.profitMode==="partner"
              ?<Inp label="Partner Cost (SAR)" value={String(form.partnerCost||"")} onChange={v=>upd("partnerCost",parseFloat(v)||0)} type="number"/>
              :<div>
                  <Inp label="Fisheye Margin (%)" value={form.fisheyeMargin?String(form.fisheyeMargin):""} onChange={v=>upd("fisheyeMargin",parseFloat(v)||0)} type="number"
                    placeholder={effMargin.source==="deal" ? `${effMargin.display} = ${fmtSAR(Math.round(effMargin.amount))} (client deal)` : "15"}/>
                  {!form.fisheyeMargin && effMargin.source==="deal" && (
                    <p style={{fontSize:10,color:MD,margin:"4px 0 0",fontWeight:600,lineHeight:1.5}}>
                      مستخدمة مارجن الـ Deal بتاع العميل تلقائي ({effMargin.display} = {fmtSAR(Math.round(effMargin.amount))}) — اكتبي رقم هنا لو عايزة تخصيص مختلف لهذا الموظف بس.
                    </p>
                  )}
                </div>
            }
            <Inp label="PO Numbers" value={form.poNumbers} onChange={v=>upd("poNumbers",v)}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,padding:16,borderRadius:12,backgroundColor:`${M}08`,border:`1px solid ${M}20`}}>
            {[["Days Left",daysUntil(form.endDate)<0?"EXPIRED":`${daysUntil(form.endDate)} days`],["Profit",fmtSAR(profit)],["Cost",fmtSAR(form.profitMode==="partner"?form.partnerCost:form.totalPackage)]].map(([l,v])=>(
              <div key={l}><p style={{fontSize:11,color:"#9ca3af",margin:"0 0 2px"}}>{l}</p><p style={{fontWeight:700,color:"#1f2937",margin:0}}>{v}</p></div>
            ))}
          </div>
          {/* GOSI Registration */}
          <div style={{ padding: "14px 16px", borderRadius: 12, backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
              🏛 GOSI Registration
            </p>
            <Sel
              label="GOSI Option"
              value={form.gosiOption || ""}
              onChange={v => upd("gosiOption", v)}
              options={[
                { v: "",                                   l: "— Select —"                        },
                { v: "GOSI on Jobeye - Paid by Fisheye",  l: "GOSI on Jobeye — Paid by Fisheye"  },
                { v: "GOSI on Fisheye - Paid by Fisheye", l: "GOSI on Fisheye — Paid by Fisheye" },
                { v: "GOSI on Jobeye - Paid by Client",   l: "GOSI on Jobeye — Paid by Client"   },
                { v: "GOSI on Fisheye - Paid by Client",  l: "GOSI on Fisheye — Paid by Client"  },
                { v: "On Partner's GOSI",                 l: "On Partner's GOSI"                 },
                { v: "Not Registered to GOSI",            l: "Not Registered to GOSI"            },
              ]}
            />
            {form.gosiOption && form.gosiOption !== "Not Registered to GOSI" && form.basic > 0 && (
              <p style={{ fontSize: 11, color: "#a16207", margin: "8px 0 0", fontWeight: 600 }}>
                {form.gosiOption === "On Partner's GOSI"
                  ? "🤝 GOSI managed by partner — no Fisheye deduction"
                  : `Employee deduction: SR ${Math.round((Number(form.basic||0) + Number(form.hra||0)) * 0.0975).toLocaleString()} / month (9.75% of Basic + HRA)`}
              </p>
            )}
          </div>
        </div>
      )}
      {tab==="handover"&&(
        <div>
          <div style={s.grid3}>
            {[["Contract Type","contractType"],["Iqama","iqama"],["Sponsor","sponsor"],["Sex","sex"],["Date of Birth","dob"],["IBAN","iban"],["Bank","bank"],["Probation","probation"],["Vacation Days","vacationDays"],["Basic","basic"],["HRA","hra"],["TPT","tpt"]].map(([l,k])=><Inp key={k} label={l} value={String(form[k]||"")} onChange={v=>upd(k,v)}/>)}
          </div>
          <div style={{marginTop:16}}>
            <Btn variant="ghost" onClick={()=>exportQiwaCSV([form])} style={s.btnSm}><Download size={12}/> Export Handover CSV</Btn>
          </div>
        </div>
      )}
      {tab==="log"&&(
        <div>
          <p style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",margin:"0 0 12px",display:"flex",alignItems:"center",gap:6}}>
            <Clock size={12}/> Communication & Activity Timeline
          </p>
          {!timelineEntries.length
            ? <p style={{textAlign:"center",color:"#9ca3af",padding:"32px 0"}}>No timeline entries yet.</p>
            : <div style={{display:"flex",flexDirection:"column",gap:0,position:"relative"}}>
                <div style={{position:"absolute",left:12,top:8,bottom:8,width:1,backgroundColor:"#e5e7eb"}}/>
                {timelineEntries.map((entry,i)=>{
                  const isContract = entry.type==="contract";
                  const isExpired  = entry.type==="expired";
                  const field      = entry.field || '';
                  const isWorkflow = field==="workflowStatus";
                  const isPackage  = field==="totalPackage";
                  const isPO       = field==="poNumbers" || field==="po";
                  const isStatus   = field==="status";
                  const dotColor   = isExpired?"#dc2626":isContract?"#2563eb":isWorkflow?"#7c3aed":isPackage?"#059669":isPO?"#0369a1":isStatus?"#ea580c":M;
                  const Icon = isExpired?AlertCircle:isContract?FileText:isWorkflow?Zap:isPackage?DollarSign:isPO?Hash:Clock;
                  return (
                    <div key={i} style={{display:"flex",gap:16,padding:"8px 0",paddingLeft:4,position:"relative"}}>
                      <div style={{width:24,height:24,borderRadius:"50%",backgroundColor:dotColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,marginTop:2}}>
                        <Icon size={10} style={{color:"white"}}/>
                      </div>
                      <div style={{flex:1,paddingBottom:12,borderBottom:i<timelineEntries.length-1?"1px solid #f3f4f6":"none"}}>
                        <p style={{fontWeight:600,fontSize:13,margin:"0 0 2px",color:"#1f2937"}}>{entry.label}</p>
                        <p style={{fontSize:11,color:"#9ca3af",margin:0}}>{new Date(entry.ts).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end",gap:12,marginTop:24,paddingTop:20,borderTop:"1px solid #e5e7eb"}}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}><Save size={14}/> Save Changes</Btn>
      </div>
    </Modal>
  );
}

// ─── MUTED STATUS TOKENS ──────────────────────────────────────────────────
// Softer, de-saturated versions of the shared status colors — originally built for
// the Workforce Explorer redesign, now the app's shared palette for any new/restyled
// success/warning/error/info accent (Settings, etc.). The OLD global WFBadge/StatusBadge/
// CLIENT_META colors are left as they are everywhere they're already used — this is only
// applied to sections deliberately restyled to match the newer, calmer visual language.
const WF_TOKENS = {
  success:        "oklch(34% 0.045 152)",
  successBg:      "oklch(94.5% 0.02 152)",
  successBgHover: "oklch(90% 0.035 152)",
  successSolid:   "oklch(46% 0.09 152)",
  warning:      "oklch(40% 0.06 80)",
  warningBg:    "oklch(95% 0.03 80)",
  warningSolid: "oklch(52% 0.12 80)",
  error:        "oklch(40% 0.08 25)",
  errorBg:      "oklch(94.5% 0.03 25)",
  errorSolid:   "oklch(50% 0.15 25)",
  info:         "oklch(38% 0.06 235)",
  infoBg:       "oklch(94.5% 0.02 235)",
  infoSolid:    "oklch(50% 0.11 235)",
  violet:       "oklch(38% 0.07 305)",
  violetBg:     "oklch(94.5% 0.025 305)",
  violetSolid:  "oklch(50% 0.13 305)",
  neutral:      "oklch(40% 0.01 260)",
  neutralBg:    "oklch(95% 0.005 260)",
};

// ─── EMPLOYEE JOURNEY BAR ────────────────────────────────────────────────
function JourneyBar({ workflowStatus, status }) {
  const steps = [
    { k: 'docs',      l: 'Docs',   s: 'Docs' },
    { k: 'agreement', l: 'Agreement', s: 'Agr' },
    { k: 'qiwa',      l: 'Qiwa',   s: 'Qiwa' },
    { k: 'active',    l: 'Active', s: 'Act' },
    { k: 'payroll',   l: 'Payroll',s: 'Pay' },
    { k: 'iqama',     l: 'Transferred', s: 'Tfr' },
  ];
  const wf = (workflowStatus || '').toLowerCase();
  const st = (status || '').toLowerCase();
  const getStep = () => {
    if (wf === 'iqama transferred' || wf.includes('iqama')) return 5;
    if (wf.includes('qiwa approved')) return 4;
    if (wf.includes('qiwa submitted')) return 3;
    if (wf.includes('agreement')) return 2;
    if (wf.includes('received')) return 1;
    if (wf.includes('requested')) return 0;
    if (st === 'active') return 4;
    return 0;
  };
  const cur = getStep();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Current stage label */}
      <div style={{ fontSize: 11, fontWeight: 700, color: M }}>
        {steps[cur]?.l} {cur > 0 ? `· step ${cur + 1} of ${steps.length}` : `· step 1 of ${steps.length}`}
      </div>
      {/* Track */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {steps.map((step, i) => {
          const done    = i < cur;
          const current = i === cur;
          return (
            <React.Fragment key={step.k}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  backgroundColor: done ? WF_TOKENS.successSolid : current ? M : '#e5e7eb',
                  color: done || current ? 'white' : '#9ca3af',
                  border: current ? `2px solid ${MD}` : 'none',
                }}>
                  {done ? <Check size={9}/> : i + 1}
                </div>
                <span style={{ fontSize: 8, fontWeight: 600, color: done ? WF_TOKENS.success : current ? M : '#9ca3af', whiteSpace: 'nowrap' }}>{step.s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 12, height: 2, backgroundColor: done ? WF_TOKENS.successSolid : '#e5e7eb', flexShrink: 0, marginTop: 9 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── EMPLOYEE TABLE — SCOPED STYLE OVERRIDES (Workforce Explorer only) ─────
// Crimson-masthead header + top-aligned rows with consistent spacing, matching the
// approved mockup. Layered on top of the shared s.th / s.td / s.badge so Clients Hub,
// Partners Hub and the Employee edit Modal keep their original look — s.th / s.td /
// WFBadge / StatusBadge themselves are never modified.
const wfTh = {
  ...s.th,
  color: "rgba(255,255,255,0.85)",
  backgroundColor: M,
  borderBottom: `2px solid ${MD}`,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.06em",
};
const wfTd = {
  ...s.td,
  verticalAlign: "top",
  lineHeight: 1.4,
};

function wfBadgeStyle(bg, color) {
  return {
    ...s.badge(bg, color),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minWidth: 68,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    fontSize: 10.5,
    fontWeight: 800,
    whiteSpace: "nowrap",
  };
}
// Mirrors StatusBadge's classification exactly, muted palette only.
function WFStatusBadgeMuted({ status }) {
  const sl = (status || "").toLowerCase();
  const cfg =
    sl === "active"   ? [WF_TOKENS.successBg, WF_TOKENS.success] :
    sl === "renewal"  ? [WF_TOKENS.infoBg, WF_TOKENS.info] :
    sl === "new"      ? [WF_TOKENS.violetBg, WF_TOKENS.violet] :
    sl === "transfer" ? [WF_TOKENS.warningBg, WF_TOKENS.warning] :
    sl === "expired"  ? [WF_TOKENS.neutralBg, WF_TOKENS.neutral] :
    sl === "resigned" ? [WF_TOKENS.errorBg, WF_TOKENS.error] :
    [WF_TOKENS.neutralBg, WF_TOKENS.neutral];
  return <span style={{...wfBadgeStyle(cfg[0], cfg[1]), textTransform: "capitalize"}}>{status || "—"}</span>;
}
// Mirrors WFBadge's classification exactly, muted palette; shortens the long
// "Iqama Transferred" label to "Transferred" per the approved mockup.
function WFWorkflowBadgeMuted({ status }) {
  if (!status) return <span style={{fontSize:12,color:"#9ca3af"}}>—</span>;
  const sl = status.toLowerCase();
  const bg = sl.includes("signed")||sl==="complete" ? WF_TOKENS.successBg : sl.includes("pending")||sl==="rejected" ? WF_TOKENS.errorBg : sl.includes("received") ? WF_TOKENS.infoBg : sl.includes("sent")||sl.includes("requested") ? WF_TOKENS.warningBg : sl.includes("qiwa") ? WF_TOKENS.violetBg : WF_TOKENS.neutralBg;
  const color = sl.includes("signed")||sl==="complete" ? WF_TOKENS.success : sl.includes("pending")||sl==="rejected" ? WF_TOKENS.error : sl.includes("received") ? WF_TOKENS.info : sl.includes("sent")||sl.includes("requested") ? WF_TOKENS.warning : sl.includes("qiwa") ? WF_TOKENS.violet : WF_TOKENS.neutral;
  const label = sl.includes("iqama") && sl.includes("transfer") ? "Transferred" : status;
  return <span style={wfBadgeStyle(bg, color)}>{label}</span>;
}
// Plain dot + text — deliberately NOT a pill. Client names vary too much in length
// for a fixed-shape badge to ever look tidy or consistent; a small identity dot plus
// plain text stays legible and calm at any length. Kept local to Workforce Explorer —
// the real global ClientBadge (vivid CLIENT_META fill) stays untouched for Clients Hub,
// Partners Hub, etc.
function WFClientTag({ client }) {
  const dot = CLIENT_META[client]?.dot || M;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
      {client || "—"}
    </span>
  );
}

// ─── EMPLOYEE TABLE ─────────────────────────────────────────────────────
function EmployeeTable({ rows, onSelect, selected, setSelected, onUpdateField, onRenew, activeSideId }) {
  const [sCol,setSCol]=useState("name");
  const [sDir,setSDir]=useState(1);
  const sorted=useMemo(()=>[...rows].sort((a,b)=>String(a[sCol]||"").localeCompare(String(b[sCol]||""))*sDir),[rows,sCol,sDir]);
  const allChk=sorted.length>0&&sorted.every(r=>selected.includes(r._id));
  const sort=col=>{if(sCol===col)setSDir(d=>-d);else{setSCol(col);setSDir(1);}};
  const Th=({col,label})=>(
    <th onClick={()=>sort(col)} style={{...wfTh,cursor:"pointer"}}>
      <span style={{display:"flex",alignItems:"center",gap:4}}>{label}{sCol===col&&<ChevronDown size={9} style={{transform:sDir<0?"rotate(180deg)":"none"}}/>}</span>
    </th>
  );
  return (
    <Card style={{overflow:"hidden"}}>
      <div style={{overflowX:"auto", maxHeight:"calc(100vh - 280px)", overflowY:"auto"}}>
        <table className="fe-table" style={{...s.table,minWidth:900}}>
          <thead style={{position:"sticky",top:0,zIndex:2}}>
            <tr>
              <th style={{...wfTh,width:36,paddingRight:0,verticalAlign:"middle"}}>
                <input type="checkbox" checked={allChk} onChange={()=>setSelected(allChk?[]:sorted.map(r=>r._id))}/>
              </th>
              <th onClick={()=>sort("name")} style={{...wfTh,cursor:"pointer",width:"1%",whiteSpace:"nowrap"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}>Employee{sCol==="name"&&<ChevronDown size={9} style={{transform:sDir<0?"rotate(180deg)":"none"}}/>}</span>
              </th>
              <Th col="position"     label="Position"/>
              <Th col="client"       label="Client"/>
              <Th col="startDate"    label="Start Date"/>
              <Th col="endDate"      label="End Date"/>
              <Th col="totalPackage" label="Package / Profit"/>
              <th style={wfTh}>Status</th>
              <th style={wfTh}>Workflow</th>
              <th style={{...wfTh,textAlign:"right",verticalAlign:"middle"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(e=>{
              const days=daysUntil(e.endDate);
              const urgent=days>=0&&days<=30;
              const expired=days<0;
              const profit=calcProfit(e);
              const isActive=activeSideId===e._id;
              const isSelected=selected.includes(e._id);
              return (
                <tr key={e._id} onClick={()=>onSelect(e)}
                  style={{
                    cursor:"pointer",
                    backgroundColor:isActive?`${M}08`:isSelected?"#fff5f5":"white",
                    borderLeft:`3px solid ${isActive?M:isSelected?`${M}40`:"transparent"}`,
                    transition:"background 0.12s",
                  }}
                  onMouseEnter={ev=>{ if(!isActive) ev.currentTarget.style.backgroundColor=isSelected?"#fff0f0":"#f9fafb"; }}
                  onMouseLeave={ev=>{ ev.currentTarget.style.backgroundColor=isActive?`${M}08`:isSelected?"#fff5f5":"white"; }}>

                  {/* Checkbox */}
                  <td style={{...wfTd,paddingRight:0,width:36,verticalAlign:"middle"}} onClick={ev=>ev.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={()=>setSelected(sel=>sel.includes(e._id)?sel.filter(x=>x!==e._id):[...sel,e._id])}/>
                  </td>

                  {/* Employee: name + ID */}
                  <td style={{...wfTd,whiteSpace:"nowrap",width:"1%"}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#111827"}}>{e.name}</div>
                    {e.idNumber&&<div style={{fontSize:11,color:"#9ca3af",fontFamily:"monospace",marginTop:3}}>{e.idNumber}</div>}
                  </td>

                  {/* Position + Project */}
                  <td style={{...wfTd,maxWidth:160}}>
                    <div style={{fontSize:12,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{e.position||"—"}</div>
                    {e.project&&<div style={{fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:3}}>{e.project}</div>}
                  </td>

                  {/* Client */}
                  <td style={wfTd}><WFClientTag client={e.client}/></td>

                  {/* Start Date */}
                  <td style={wfTd}>
                    <span style={{fontSize:12,color:"#6b7280",whiteSpace:"nowrap",fontFamily:"var(--font-mono, monospace)"}}>{fmt(e.startDate)}</span>
                  </td>

                  {/* End Date */}
                  <td style={wfTd}>
                    <span style={{fontSize:12,fontWeight:500,color:urgent?WF_TOKENS.warningSolid:expired?"#9ca3af":"#374151",whiteSpace:"nowrap",fontFamily:"var(--font-mono, monospace)"}}>
                      {fmt(e.endDate)}
                    </span>
                    {urgent&&<div style={{fontSize:10,color:WF_TOKENS.warningSolid,fontWeight:700,marginTop:3}}>{days}d left</div>}
                    {expired&&<div style={{fontSize:10,color:"#9ca3af",marginTop:3}}>Expired</div>}
                  </td>

                  {/* Package + Profit */}
                  <td style={wfTd}>
                    <div style={{fontSize:12,fontFamily:"monospace",fontWeight:700,color:"#111827"}}>{e.totalPackage?`SAR ${e.totalPackage.toLocaleString()}`:"—"}</div>
                    {profit>0&&<div style={{fontSize:11,color:WF_TOKENS.success,fontWeight:600,marginTop:3}}>+{profit.toLocaleString()}</div>}
                  </td>

                  {/* Status badge */}
                  <td style={wfTd}><WFStatusBadgeMuted status={e.status}/></td>

                  {/* Workflow badge */}
                  <td style={wfTd}><WFWorkflowBadgeMuted status={e.workflowStatus}/></td>

                  {/* Actions */}
                  <td style={{...wfTd,whiteSpace:"nowrap",verticalAlign:"middle"}} onClick={ev=>ev.stopPropagation()}>
                    <div style={{display:"flex",gap:4,alignItems:"center",justifyContent:"flex-end"}}>
                      {/* Renew — left */}
                      {days<=30&&(
                        <button onClick={()=>onRenew(e)} title="Renew contract"
                          style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:7,border:`1px solid ${M}40`,backgroundColor:`${M}08`,color:M,cursor:"pointer",flexShrink:0}}
                          onMouseEnter={ev=>ev.currentTarget.style.backgroundColor=`${M}15`}
                          onMouseLeave={ev=>ev.currentTarget.style.backgroundColor=`${M}08`}>
                          <RefreshCw size={13}/>
                        </button>
                      )}
                      {/* WA — right; always occupies the slot so row widths stay consistent */}
                      {waHref(e.phone)?(
                        <a href={waHref(e.phone)} target="_blank" rel="noreferrer" onClick={ev=>ev.stopPropagation()}
                          title="WhatsApp"
                          style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:7,border:`1px solid ${WF_TOKENS.successBg}`,backgroundColor:WF_TOKENS.successBg,color:WF_TOKENS.successSolid,cursor:"pointer",textDecoration:"none",flexShrink:0}}
                          onMouseEnter={ev=>ev.currentTarget.style.backgroundColor=WF_TOKENS.successBgHover}
                          onMouseLeave={ev=>ev.currentTarget.style.backgroundColor=WF_TOKENS.successBg}>
                          <MessageCircle size={13}/>
                        </a>
                      ):(
                        <span title="No phone on file"
                          style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:7,border:"1px solid #f0eff1",backgroundColor:"#f9fafb",color:"#d1d5db",flexShrink:0}}>
                          <MessageCircle size={13}/>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length===0&&(
          <div style={{padding:"56px 0",textAlign:"center",color:"#9ca3af"}}>
            <Users size={32} style={{margin:"0 auto 10px",opacity:0.2,display:"block"}}/>
            <p style={{fontSize:13,fontWeight:600,margin:0}}>No employees found</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── EMPLOYEE CONTEXT PANEL — Sprint 3 ──────────────────────────────────────
function EmployeeContextPanel({ emp, onClose, onOpenFull, onUpdateField }) {
  const [panelTab, setPanelTab] = useState("context");
  const profit = useMemo(() => calcProfit(emp), [emp]);
  const days = daysUntil(emp.endDate);
  const wa = waHref(emp.phone);

  // Timeline from existing auditLog + contract dates — no re-computation
  const timeline = useMemo(() => {
    const entries = [];
    const log = Array.isArray(emp.auditLog) ? emp.auditLog : [];
    log.forEach(l => entries.push({ ts: l.ts, label: l.action, type: "log" }));
    if (emp.startDate) entries.push({ ts: emp.startDate + "T00:00:00Z", label: "Contract started", type: "contract" });
    if (emp.endDate)   entries.push({ ts: emp.endDate   + "T00:00:00Z", label: "Contract ends",   type: days < 0 ? "expired" : "contract" });
    return entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [emp.auditLog, emp.startDate, emp.endDate, days]);

  // Comms = auditLog entries that look like communication events
  const commLog = useMemo(() =>
    timeline.filter(e => /whatsapp|message|email|call|sent|reminder|escalat/i.test(e.label)),
    [timeline]
  );

  const infoRows = [
    ["Employee ID",  emp.employeeId || "—"],
    ["Position",     emp.position   || "—"],
    ["Project",      emp.project    || "—"],
    ["Client",       emp.client     || "—"],
    ["Sourcing",     emp.sourcingThrough || "—"],
    ["Partner",      emp.partnerAssigned || "—"],
    ["Nationality",  emp.nationalityType || "—"],
    ["PO Numbers",   emp.poNumbers  || "—"],
    ["Start Date",   fmt(emp.startDate)],
    ["End Date",     fmt(emp.endDate)],
  ];

  return (
    <div style={{
      width: 300, flexShrink: 0,
      backgroundColor: "white", borderRadius: 14,
      border: `2px solid ${M}20`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
      display: "flex", flexDirection: "column",
      maxHeight: "calc(100vh - 120px)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", background: `linear-gradient(135deg,${MD},${M})`, borderRadius: "12px 12px 0 0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,220,220,0.9)", marginTop: 2 }}>{emp.position || "—"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 0 0 8px" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {/* Translucent-white badges — the header's own crimson/navy gradient already
              carries the color, so the muted semantic palette would clash here. */}
          <span style={{...wfBadgeStyle("rgba(255,255,255,0.18)","white"), textTransform:"capitalize", border:"1px solid rgba(255,255,255,0.28)"}}>{emp.status || "—"}</span>
          <span style={{...wfBadgeStyle("rgba(255,255,255,0.18)","white"), border:"1px solid rgba(255,255,255,0.28)"}}>
            {(emp.workflowStatus||"").toLowerCase().includes("iqama") && (emp.workflowStatus||"").toLowerCase().includes("transfer") ? "Transferred" : (emp.workflowStatus || "—")}
          </span>
          {emp.gosiOption && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 999, backgroundColor: "rgba(253,224,71,0.25)", color: "#fef08a", border: "1px solid rgba(253,224,71,0.4)" }}>
              🏛 GOSI
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        {[
          { l: "Days Left",  v: days < 0 ? "Expired" : `${days}d`,                          c: days < 0 ? "#dc2626" : days <= 30 ? "#d97706" : "#374151" },
          { l: "Package",    v: emp.totalPackage ? `SAR ${emp.totalPackage.toLocaleString()}` : "—", c: "#1d4ed8" },
          { l: "Profit",     v: profit > 0 ? `+${profit.toLocaleString()}` : "—",                  c: WF_TOKENS.success },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ padding: "10px 6px", textAlign: "center", borderRight: "1px solid #f3f4f6" }}>
            <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        <button onClick={onOpenFull} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${M}`, backgroundColor: M, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Edit3 size={12}/> Edit Profile
        </button>
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${WF_TOKENS.successSolid}`, backgroundColor: WF_TOKENS.successBg, color: WF_TOKENS.successSolid, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <MessageCircle size={12}/> WhatsApp
          </a>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        {[{ k: "context", l: "Context" }, { k: "history", l: "History" }, { k: "timeline", l: "Timeline" }, { k: "comms", l: "Comms" }].map(t => (
          <button key={t.k} onClick={() => setPanelTab(t.k)} style={{
            flex: 1, padding: "9px 0", fontSize: 11,
            fontWeight: panelTab === t.k ? 800 : 700,
            border: "none", borderBottom: panelTab === t.k ? "3px solid" : "2px solid transparent",
            borderImage: panelTab === t.k ? `linear-gradient(90deg, ${M}, ${MD}) 1` : "none",
            cursor: "pointer",
            backgroundColor: "transparent", color: panelTab === t.k ? M : "#9ca3af",
          }}>{t.l}</button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

        {panelTab === "context" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Journey bar */}
            <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 8 }}>Workflow Journey</div>
              <JourneyBar workflowStatus={emp.workflowStatus} status={emp.status} />
            </div>
            {/* Info rows */}
            <div>
              {infoRows.map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f9fafb", fontSize: 12 }}>
                  <span style={{ color: "#9ca3af", fontWeight: 600 }}>{l}</span>
                  <span style={{ color: "#374151", fontWeight: 600, textAlign: "right", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Onboarding checklist */}
            {emp.onboardingSteps && Object.keys(emp.onboardingSteps).length > 0 && (
              <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 8 }}>Onboarding</div>
                {Object.entries(emp.onboardingSteps).map(([step, done]) => (
                  <div key={step} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, marginBottom: 5 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: done ? WF_TOKENS.successSolid : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {done && <span style={{ fontSize: 8, color: "white", fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ color: done ? "#374151" : "#9ca3af", textTransform: "capitalize" }}>{step.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Notes */}
            {emp.notes && (
              <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #fef9c3", backgroundColor: "#fefce8" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#854d0e", marginBottom: 4 }}>NOTES</div>
                <p style={{ fontSize: 11, color: "#374151", margin: 0, lineHeight: 1.6 }}>{emp.notes}</p>
              </div>
            )}
          </div>
        )}

        {panelTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Current contract */}
            <div style={{ padding: "10px 12px", borderRadius: 10, border: `2px solid ${M}30`, backgroundColor: `${M}06`, borderLeft: `4px solid ${M}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Contract</span>
                <WFStatusBadgeMuted status={emp.status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  ["Start", fmt(emp.startDate)],
                  ["End",   fmt(emp.endDate)],
                  ["Package", emp.totalPackage ? `SAR ${emp.totalPackage.toLocaleString()}` : "—"],
                  ["Client", emp.client || "—"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Previous contracts */}
            {Array.isArray(emp.contractHistory) && emp.contractHistory.length > 0
              ? [...emp.contractHistory].reverse().map((c, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", borderLeft: "4px solid #d1d5db" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Contract {emp.contractHistory.length - i}</span>
                    <span style={{ fontSize: 9, color: "#d1d5db" }}>
                      Renewed {c.renewedAt ? new Date(c.renewedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {[
                      ["Start", fmt(c.startDate)],
                      ["End",   fmt(c.endDate)],
                      ["Package", c.totalPackage ? `SAR ${c.totalPackage.toLocaleString()}` : "—"],
                      ["Status", c.status || "—"],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "capitalize" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
              : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Archive size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.2, color: "#6b7280" }} />
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>No previous contracts.</p>
                  <p style={{ fontSize: 11, color: "#c4c4c4", margin: "4px 0 0" }}>History saved automatically on each renewal.</p>
                </div>
              )
            }
          </div>
        )}

        {panelTab === "timeline" && (
          <div>
            {timeline.length === 0
              ? <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, padding: "24px 0" }}>No activity yet.</p>
              : (
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 8, top: 6, bottom: 6, width: 1, backgroundColor: "#e5e7eb" }} />
                  {timeline.map((entry, i) => {
                    const dotColor = entry.type === "expired" ? "#dc2626" : entry.type === "contract" ? "#2563eb" : M;
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 17, height: 17, borderRadius: "50%", backgroundColor: dotColor, flexShrink: 0, zIndex: 1, marginTop: 1 }} />
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 12, margin: 0, color: "#1f2937" }}>{entry.label}</p>
                          <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>
                            {new Date(entry.ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        )}

        {panelTab === "comms" && (
          <div>
            {commLog.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <MessageCircle size={28} style={{ margin: "0 auto 8px", display: "block", opacity: 0.2, color: "#6b7280" }} />
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>No communication recorded.</p>
                <p style={{ fontSize: 11, color: "#c4c4c4", margin: "6px 0 0", lineHeight: 1.4 }}>WA messages, escalations & reminders logged via Action Center appear here.</p>
              </div>
            ) : commLog.map((entry, i) => (
              <div key={i} style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid #e5e7eb", marginBottom: 8, backgroundColor: "#f9fafb" }}>
                <p style={{ fontWeight: 600, fontSize: 12, margin: 0, color: "#374151" }}>{entry.label}</p>
                <p style={{ fontSize: 10, color: "#9ca3af", margin: "3px 0 0" }}>
                  {new Date(entry.ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "9px 12px", borderRadius: 9, border: `1px solid ${WF_TOKENS.successSolid}`, backgroundColor: WF_TOKENS.successBg, color: WF_TOKENS.successSolid, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                💬 Open WhatsApp
              </a>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── EXPIRY CALENDAR ──────────────────────────────────────────────────
function ExpiryCalendar({ employees, calOffset, setCalOffset, onSelect, clients=[] }) {
  const MONTHS_SHOWN = 4;
  const now = new Date();
  const [calChecked, setCalChecked] = useState([]);
  const [calClient, setCalClient] = useState("");
  const [listCopied, setListCopied] = useState(false);
  const [clientListCopied, setClientListCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);

  const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + calOffset + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // All employees visible in this window
  const windowEmps = useMemo(() => {
    return employees.filter(e => {
      if (!e.endDate) return false;
      const ed = new Date(e.endDate);
      return months.some(({ year, month }) => ed.getFullYear() === year && ed.getMonth() === month);
    });
  }, [employees, calOffset]);

  const getEmpsForMonth = (year, month) =>
    windowEmps.filter(e => {
      const ed = new Date(e.endDate);
      const matchMonth = ed.getFullYear() === year && ed.getMonth() === month;
      const matchClient = !calClient || e.client === calClient;
      return matchMonth && matchClient;
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  const urgencyColor = (endDate) => {
    const d = daysUntil(endDate);
    if (d < 0)   return { bg: "#f3f4f6", dot: "#9ca3af", text: "#6b7280" };
    if (d <= 7)  return { bg: "#fef2f2", dot: "#dc2626", text: "#991b1b" };
    if (d <= 30) return { bg: "#fffbeb", dot: "#d97706", text: "#92400e" };
    return       { bg: "#f0fdf4", dot: "#16a34a", text: "#166534" };
  };

  const totalExpiring = windowEmps.length;
  const checkedEmps   = windowEmps.filter(e => calChecked.includes(e._id));

  // Client list for the selector (clients present in this window)
  const windowClients = useMemo(() =>
    [...new Set(windowEmps.map(e => e.client).filter(Boolean))].sort(),
    [windowEmps]
  );
  const clientListEmps = calClient
    ? windowEmps.filter(e => e.client === calClient).sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    : [];

  const toggle = (id) => setCalChecked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setCalChecked(calChecked.length === windowEmps.length ? [] : windowEmps.map(e => e._id));

  const buildList = (emps) => emps.map(e =>
    `${e.name}${e.phone ? ` — ${e.phone}` : ""}${e.endDate ? ` (${fmt(e.endDate)})` : ""}`
  ).join("\n");

  return (
    <div>
      {/* Navigator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "8px 14px", borderRadius: 10, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
        <button onClick={() => { setCalOffset(o => o - MONTHS_SHOWN); setCalChecked([]); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "4px 8px", fontSize: 18, lineHeight: 1 }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>
            {new Date(now.getFullYear(), now.getMonth() + calOffset).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            {" — "}
            {new Date(now.getFullYear(), now.getMonth() + calOffset + MONTHS_SHOWN - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{totalExpiring} contracts in window{calChecked.length > 0 ? ` · ${calChecked.length} selected` : ""}</div>
        </div>
        <button onClick={() => { setCalOffset(o => o + MONTHS_SHOWN); setCalChecked([]); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: "4px 8px", fontSize: 18, lineHeight: 1 }}>›</button>
      </div>

      {/* Client filter pills */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        {calOffset !== 0 && (
          <button onClick={() => { setCalOffset(0); setCalChecked([]); }}
            style={{ fontSize: 11, color: M, background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "5px 0", whiteSpace: "nowrap" }}>
            ↩ Today
          </button>
        )}
        {/* All pill */}
        <button onClick={() => setCalClient("")} style={{
          padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
          backgroundColor: !calClient ? M : "#f3f4f6", color: !calClient ? "white" : "#6b7280",
        }}>All</button>
        {/* Per-client pills */}
        {windowClients.map(c => {
          const meta = CLIENT_META[c] || {};
          const active = calClient === c;
          return (
            <button key={c} onClick={() => setCalClient(active ? "" : c)} style={{
              padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${active ? meta.dot || M : "#e5e7eb"}`,
              backgroundColor: active ? (meta.dot || M) : "white",
              color: active ? "white" : "#374151",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: active ? "rgba(255,255,255,0.7)" : (meta.dot || "#9ca3af"), flexShrink: 0 }} />
              {c}
            </button>
          );
        })}
      </div>

      {/* Client WA action bar — shown when a client is selected */}
      {calClient && (() => {
        const meta = CLIENT_META[calClient] || {};
        const clientRecord = clients.find(c => c.name === calClient);
        const contacts = clientRecord?.contacts || [];
        const clientEmpsInWindow = windowEmps.filter(e => e.client === calClient)
          .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const waMsg = `*${calClient} — Contract Expiry Update*\n_${today}_\n\n` +
          clientEmpsInWindow.map(e => {
            const d = daysUntil(e.endDate);
            return `• ${e.name} — ${fmt(e.endDate)} (${d < 0 ? "Expired" : d === 0 ? "Today" : `${d}d left`})`;
          }).join("\n") +
          "\n\nPlease advise on renewal. Thank you 🙏";
        return (
          <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${meta.dot || M}30`, backgroundColor: `${meta.dot || M}06`, borderLeft: `4px solid ${meta.dot || M}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: contacts.length > 0 ? 8 : 0 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: meta.dot || M }}>{calClient}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>{clientEmpsInWindow.length} employees in window</span>
              </div>
              {/* Copy message */}
              <button onClick={() => {
                navigator.clipboard.writeText(waMsg);
                setMsgCopied(true);
                setTimeout(() => setMsgCopied(false), 2000);
              }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11, fontWeight: 700, cursor: "pointer", backgroundColor: msgCopied ? "#f0fdf4" : "white", color: msgCopied ? "#16a34a" : "#374151" }}>
                {msgCopied ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy msg</>}
              </button>
            </div>
            {/* Contacts list with individual WA buttons */}
            {contacts.length > 0
              ? <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {contacts.map((co, i) => {
                    const cleanPhone = (co.phone || "").replace(/[^0-9+]/g,"").replace(/^\+/,"");
                    const link = cleanPhone.length > 6 ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}` : null;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, backgroundColor: "white", border: "1px solid #f3f4f6" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: meta.dot || M, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                          {co.name?.charAt(0) || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{co.name}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{co.role}{co.phone ? ` · ${co.phone}` : ""}</div>
                        </div>
                        {link
                          ? <a href={link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", backgroundColor: "#16a34a", color: "white", textDecoration: "none", whiteSpace: "nowrap" }}>
                              <MessageCircle size={10}/> Send WA
                            </a>
                          : <span style={{ fontSize: 10, color: "#d1d5db" }}>no phone</span>
                        }
                      </div>
                    );
                  })}
                </div>
              : <span style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>No contacts in Client Hub for this client.</span>
            }
          </div>
        );
      })()}

      {/* Action bar — shown when employees are checked */}
      {calChecked.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 12px", borderRadius: 10, backgroundColor: `${M}08`, border: `1px solid ${M}30` }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: M, flex: 1 }}>{calChecked.length} selected</span>
          {/* Copy name + phone list */}
          <button onClick={() => {
            navigator.clipboard.writeText(buildList(checkedEmps));
            setListCopied(true);
            setTimeout(() => setListCopied(false), 2000);
          }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", backgroundColor: listCopied ? "#f0fdf4" : "white", color: listCopied ? "#16a34a" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            {listCopied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy list</>}
          </button>
          <button onClick={() => setCalChecked([])} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}>✕</button>
        </div>
      )}

      {/* Month columns */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${MONTHS_SHOWN}, 1fr)`, gap: 10, alignItems: "start" }}>
        {months.map(({ year, month }) => {
          const emps = getEmpsForMonth(year, month);
          const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
          const allMonthChecked = emps.length > 0 && emps.every(e => calChecked.includes(e._id));
          return (
            <div key={`${year}-${month}`} style={{
              borderRadius: 10, border: `1px solid ${isCurrentMonth ? `${M}40` : "#e5e7eb"}`,
              overflow: "hidden",
              boxShadow: isCurrentMonth ? `0 0 0 2px ${M}18` : "none",
            }}>
              {/* Month header */}
              <div style={{ padding: "8px 12px", backgroundColor: isCurrentMonth ? M : "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={allMonthChecked}
                  onChange={() => {
                    if (allMonthChecked) setCalChecked(p => p.filter(id => !emps.map(e => e._id).includes(id)));
                    else setCalChecked(p => [...new Set([...p, ...emps.map(e => e._id)])]);
                  }}
                  style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: isCurrentMonth ? "white" : "#374151" }}>
                    {new Date(year, month).toLocaleDateString("en-GB", { month: "long" })}
                    {isCurrentMonth && <span style={{ fontSize: 9, fontWeight: 600, marginLeft: 5, opacity: 0.8 }}>THIS MONTH</span>}
                  </div>
                  <div style={{ fontSize: 10, color: isCurrentMonth ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>
                    {year} · {emps.length} contract{emps.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              {/* Employee cards */}
              {emps.length === 0
                ? <div style={{ padding: "16px 12px", textAlign: "center", fontSize: 11, color: "#d1d5db" }}>No expirations</div>
                : emps.map(e => {
                    const d = daysUntil(e.endDate);
                    const col = urgencyColor(e.endDate);
                    const checked = calChecked.includes(e._id);
                    return (
                      <div key={e._id} style={{
                        padding: "7px 10px", backgroundColor: checked ? `${M}08` : col.bg,
                        borderBottom: "1px solid #f3f4f6", borderLeft: `3px solid ${checked ? M : col.dot}`,
                        display: "flex", alignItems: "flex-start", gap: 6,
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(e._id)}
                          style={{ marginTop: 2, flexShrink: 0 }} onClick={ev => ev.stopPropagation()} />
                        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onSelect(e)}>
                          <div style={{ fontWeight: 700, fontSize: 11, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                          <div style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.client || "—"}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: col.text, marginTop: 2 }}>
                            {d < 0 ? "Expired" : d === 0 ? "Today" : `${d}d`}{d >= 0 ? ` · ${fmt(e.endDate)}` : ""}
                          </div>
                        </div>
                        {e.phone && (
                          <a href={waHref(e.phone)} target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 6, backgroundColor: "#16a34a", color: "white", textDecoration: "none", flexShrink: 0, marginTop: 1 }}>
                            <MessageCircle size={10} />
                          </a>
                        )}
                      </div>
                    );
                  })
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WORKFORCE VIEW ────────────────────────────────────────────────────
// ── Persistent filter helpers ──────────────────────────────────────────────
const WF_FILTERS_KEY = "fisheye_wf_filters_v1";
const loadWFFilters = () => {
  try { return JSON.parse(localStorage.getItem(WF_FILTERS_KEY) || "{}"); }
  catch { return {}; }
};
const saveWFFilter = (key, val) => {
  try {
    const cur = loadWFFilters();
    localStorage.setItem(WF_FILTERS_KEY, JSON.stringify({ ...cur, [key]: val }));
  } catch {}
};

function WorkforceView({employees, setEmployees, partners, clients=[], exportCSV, pendingOpenEmpId, onPendingOpenHandled}) {
  const { profile: __profile } = useAuth();
  const isViewer = __profile?.role === 'viewer';
  const _f = loadWFFilters(); // read once at mount
  const [client, setClient] = useState(_f.client || "All");
  const [search, setSearch] = useState("");   // search is intentionally not persisted
  const [fStatus, setFStatus] = useState(_f.fStatus || "");
  const [fWF, setFWF] = useState(_f.fWF || "");
  const [fProject, setFPrj] = useState(_f.fProject || "");
  // ── Sprint 3: Advanced filters
  const [fPO, setFPO] = useState(_f.fPO || "");
  const [fSourcing, setFSourcing] = useState(_f.fSourcing || "");
  const [fPartner, setFPartner] = useState(_f.fPartner || "");
  const [fNationality, setFNationality] = useState(_f.fNationality || "");
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showClientMenu, setShowClientMenu] = useState(false); // client chip dropdown (replaces the old always-visible client rail)
  const [pendingCSVDiff, setPendingCSVDiff] = useState(null); // { changes, notFound, skipped, applyFn }
  const [importBackup, setImportBackup] = useState(null);     // snapshot for rollback
  const [csvApplying, setCsvApplying] = useState(false);      // loading state for apply btn
  const [csvUnchecked, setCsvUnchecked] = useState(new Set()); // row keys to skip in diff preview
  const [pendingAddCSV, setPendingAddCSV] = useState(null);   // { resolved, needsClient }
  const [csvClientAssign, setCsvClientAssign] = useState({}); // { [project]: clientName }
  const csvAddRef    = useRef(null); // file input for "Add from CSV"
  const csvUpdateRef = useRef(null); // file input for "Update from CSV"
  // ── Sprint 3: Side panel
  const [sideEmp, setSideEmp] = useState(null);
  const [selected, setSelected] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showBulk, setShowBulk] = useState(false);

  // Open employee directly from global search
  useEffect(() => {
    if (!pendingOpenEmpId) return;
    const emp = employees.find(e => e._id === pendingOpenEmpId);
    if (emp) { setProfile(emp); onPendingOpenHandled?.(); }
  }, [pendingOpenEmpId, employees, onPendingOpenHandled]);
  const [showWAPanel, setShowWAPanel] = useState(false);
  const [waCopied, setWACopied] = useState({});
  const [showProfitMode, setShowProfitMode] = useState({
    mode: "partner",
    clientType: "percent",
    partnerType: "percent",
    fisheyeType: "percent"
  });
  const [showFilt, setShowFilt] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" | "calendar"
  const [calOffset, setCalOffset] = useState(0); // months from today
  const [bulkPartner, setBulkPartner] = useState("");
  const [bulkClient, setBulkClient] = useState("");
  const [bulkGosi, setBulkGosi] = useState("");

  // ── Lightweight toast ─────────────────────────────────────────────────────
  const [wfToast, setWFToast] = useState(null); // { msg, color }
  const showWFToast = useCallback((msg, color = "#16a34a") => {
    setWFToast({ msg, color });
    setTimeout(() => setWFToast(null), 3000);
  }, []);

  // 1. الحسابات والفلترة
  const projects = useMemo(() =>
    ["", ...new Set(employees.map(e => e.project).filter(Boolean).sort())],
    [employees]
  );
  const sourcingOpts = useMemo(() =>
    ["", ...new Set(employees.map(e => e.sourcingThrough).filter(Boolean).sort())],
    [employees]
  );
  const nationalityOpts = useMemo(() =>
    ["", ...new Set(employees.map(e => e.nationalityType).filter(Boolean).sort())],
    [employees]
  );
  const partnerOpts = useMemo(() =>
    ["", ...new Set(employees.map(e => e.partnerAssigned).filter(Boolean).sort())],
    [employees]
  );
  // Dynamic client list — derived from actual employee data
  const clientsList = useMemo(() =>
    [...new Set(employees.map(e => e.client).filter(Boolean))].sort(),
    [employees]
  );
  const counts = useMemo(() =>
    clientsList.reduce((a, c) => ({ ...a, [c]: employees.filter(e => e.client === c && !isExcluded(e)).length }), {}),
    [employees, clientsList]
  );
  const filtered = useMemo(() =>
    employees.filter(e => {
      const cOk = client === "All" || e.client === client;
      const q = search.toLowerCase();
      const sOk = !q ||
        (e.name || "").toLowerCase().includes(q) ||
        (e.idNumber || "").includes(q) ||
        (e.project || "").toLowerCase().includes(q) ||
        (e.employeeId || "").toLowerCase().includes(q);
      const hasPO = e.poNumbers && String(e.poNumbers).trim() !== "";
      const poOk = !fPO || (fPO === "has" ? hasPO : !hasPO);
      const sourcingOk = !fSourcing || (e.sourcingThrough || "") === fSourcing;
      const partnerOk = !fPartner || (e.partnerAssigned || "") === fPartner;
      const natOk = !fNationality || (e.nationalityType || "") === fNationality;
      return cOk && sOk && poOk && sourcingOk && partnerOk && natOk &&
        (!fStatus || e.status === fStatus) &&
        (!fWF || (e.workflowStatus || "").toLowerCase().includes(fWF.toLowerCase())) &&
        (!fProject || e.project === fProject);
    }),
    [employees, client, search, fStatus, fWF, fProject, fPO, fSourcing, fPartner, fNationality]
  );
  const activeFilterCount = [fStatus, fWF, fProject, fPO, fSourcing, fPartner, fNationality].filter(Boolean).length;

  // Persist-aware setters — save to localStorage on every change
  const setClientP      = v => { setClient(v);      saveWFFilter("client",      v); };
  const setFStatusP     = v => { setFStatus(v);     saveWFFilter("fStatus",     v); };
  const setFWFP         = v => { setFWF(v);         saveWFFilter("fWF",         v); };
  const setFPrjP        = v => { setFPrj(v);        saveWFFilter("fProject",    v); };
  const setFPOP         = v => { setFPO(v);         saveWFFilter("fPO",         v); };
  const setFSourcingP   = v => { setFSourcing(v);   saveWFFilter("fSourcing",   v); };
  const setFPartnerP    = v => { setFPartner(v);    saveWFFilter("fPartner",    v); };
  const setFNationalityP= v => { setFNationality(v);saveWFFilter("fNationality",v); };

  const clearAllFilters = () => {
    setFStatusP(""); setFWFP(""); setFPrjP(""); setFPOP("");
    setFSourcingP(""); setFPartnerP(""); setFNationalityP("");
  };

  // ── KPI values for header strip ──────────────────────────────────────────
  const kpiTotal    = useMemo(() => employees.filter(e => !isExcluded(e)).length, [employees]);
  const kpiNew      = useMemo(() => employees.filter(e => (e.status||"").toLowerCase()==="new").length, [employees]);
  const kpiExpiring = useMemo(() => employees.filter(e => { const d=daysUntil(e.endDate); return d>=0&&d<=30&&!isExcluded(e); }).length, [employees]);
  const kpiNoPO     = useMemo(() => employees.filter(e =>
    clientRequiresPO(e.client) && !isExcluded(e) && hasMissingPO(e)
  ).length, [employees]);
  // ─── handleUpdateField: تحديث حقل واحد لموظف محدد (كان مفقود من props!) ───
  const handleUpdateField = async (id, field, value) => {
    const extraFields = {};

    // Capture old snapshot before any state update — used for rollback if Supabase fails
    const oldEmp = employees.find(e => e._id === id);

    if (field === "workflowStatus") {
      extraFields.wfDate = new Date().toISOString().split("T")[0];
      setEmployees(prev => prev.map(e => {
        if (e._id !== id) return e;
        const logEntry = { ts: new Date().toISOString(), action: `Workflow changed: ${e.workflowStatus || "—"} → ${value}` };
        const updatedLog = [...(Array.isArray(e.auditLog) ? e.auditLog : []), logEntry];
        return { ...e, [field]: value, wfDate: extraFields.wfDate, auditLog: updatedLog };
      }));
    } else if (field === "poNumbers") {
      // سجّل تاريخ إضافة الـ PO لأول مرة (أو أي تعديل عليها)
      const hadPO = oldEmp?.poNumbers && String(oldEmp.poNumbers).trim() !== "";
      const hasPO = value && String(value).trim() !== "";
      if (hasPO && !hadPO) {
        // PO جديدة — سجّل اليوم
        extraFields.poAddedDate = new Date().toISOString().split("T")[0];
      }
      setEmployees(prev => prev.map(e => e._id === id ? { ...e, [field]: value, ...extraFields } : e));
    } else {
      setEmployees(prev => prev.map(e => e._id === id ? { ...e, [field]: value } : e));
    }
    // حفظ في Supabase
    try {
      const { error } = await supabase
        .from('employees_master')
        .update({ [field]: value, ...extraFields })
        .eq('_id', Number(id));
      if (error) throw error;
    } catch (err) {
      console.error("handleUpdateField error:", err.message);
      // rollback محلي لو فشل الحفظ — نرجع الـ snapshot القديمة
      if (oldEmp) setEmployees(prev => prev.map(e => e._id === id ? oldEmp : e));
      alert("❌ فشل التحديث: " + err.message);
    }
  };

  // 2. إضافة موظف واحد
  const handleAddSingle = async () => {
  // 1. تجهيز بيانات الموظف (بدون _id)
  const tempEmployeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  const newEmpData = {
    employeeId: tempEmployeeId,
    contractId: "PENDING",
    name: "موظف جديد",
    email: "",
    phone: "", // 
    idNumber: "N/A",
    position: "Position",
    project: "General",
    client: (client !== "All") ? client : "Sela", 
    sourcingThrough: "Our Company", 
    nationalityType: "expat",
    startDate: new Date().toISOString().split('T')[0],
    status: "active",
    workflowStatus: "Onboarding",
    auditLog: [{ ts: new Date().toISOString(), action: `Created manually on ${new Date().toLocaleString()}` }]
  };

  try {
    // 2. الحفظ في Supabase أولاً
    const { data, error } = await supabase
      .from('employees_master')
      .insert([newEmpData])
      .select(); // اطلبي من السيرفر إعادة السطر المحفوظ بما في ذلك الـ ID الجديد

    if (error) throw error;

    // 3. تحديث الشاشة بالبيانات الحقيقية التي عادت من السيرفر
    if (data && data.length > 0) {
      const savedEmployee = data[0];
      setEmployees(prev => [savedEmployee, ...prev]);
      alert("تم إضافة الموظف بنجاح في قاعدة البيانات ✅");
      await supabase
  .from('employees_master')
  .update({ onboardingSteps: {}, uploadedDocuments: [] })
  .eq('_id', Number(savedEmployee._id));
    }
  } catch (err) {
    console.error("Error adding employee:", err.message);
    alert("فشل الحفظ في قاعدة البيانات: " + err.message);
  }
};
  // 3. رفع CSV
  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const text = await file.text();
    const allLines = text.replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const dataLines = allLines.slice(1);

    const records = dataLines.map((line, index) => {
      const col = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v?.replace(/^"|"$/g, '').trim());
      if (col.length < 3) return null;
      return {
        _id:             String(Date.now()) + String(index),
        employeeId:      col[0]  || `EMP-${index + 1}`,
        contractId:      col[1]  || "",
        name:            col[2]  || "Unknown",
        email:           col[3]  || "",
        phone:           col[4]  || "",
        idNumber:        col[5]  || "",
        position:        col[6]  || "",
        project:         col[7]  || "",
        sourcingThrough: col[8]  || "Client",
        nationalityType: col[9]  || "expat",
        startDate:       col[10] || new Date().toISOString().split('T')[0],
        endDate:         col[11] || null,
        totalPackage:    parseFloat(String(col[12]).replace(/[^0-9.]/g, '')) || 0,
        status:          col[13]?.toLowerCase() || "active",
        workflowStatus:  col[14] || "Onboarding",
        poNumbers:       col[15] || "",
        invoiceNumbers:  col[16] || "",
        auditLog: [{ ts: new Date().toISOString(), action: `Imported via CSV` }]
      };
    }).filter(Boolean);

    if (records.length === 0) { alert('❌ No valid rows found in CSV'); return; }

    // ── auto-map project → client from existing employees ──
    const projectClientMap = {};
    employees.forEach(e => { if (e.project && e.client) projectClientMap[e.project.trim().toLowerCase()] = e.client; });

    const resolved = []; // { record, client }
    const needsClient = []; // records whose project isn't found

    records.forEach(r => {
      const proj = (r.project || "").trim().toLowerCase();
      const mapped = projectClientMap[proj];
      const ruleMatch = mapped ? null : classifyProjectStrict(r.project);
      if (mapped) {
        resolved.push({ ...r, client: mapped });
      } else if (ruleMatch) {
        // A configured mapping rule (Settings > Configuration) explicitly
        // recognizes this project — e.g. "contains SPL" -> SPL — so this
        // isn't really an unknown project, just one with no employees yet.
        resolved.push({ ...r, client: ruleMatch });
      } else {
        // Truly unknown project, no rule covers it either — NEVER silently
        // assign it to whichever Workforce tab happens to be open. Always
        // surface it in the "Assign Client to Projects" popup so a new
        // client/project requires an explicit, visible confirmation
        // instead of quietly being filed under the active tab's client.
        needsClient.push(r);
      }
    });

    if (needsClient.length === 0) {
      // كل الموظفين اتحددلهم client تلقائياً (المشروع معروف مسبقاً)
      await doInsertCSV(resolved);
    } else {
      // فيه موظفين محتاجين اختيار client يدوي — نقترح الـ tab المفتوح
      // حالياً كقيمة افتراضية (تقدري تغيريها)، لكن لازم تأكيد صريح
      // بالضغط على "Save & Insert".
      if (client && client !== "All") {
        const projectsNeedingClient = [...new Set(needsClient.map(r => r.project || "Unknown"))];
        setCsvClientAssign(Object.fromEntries(projectsNeedingClient.map(p => [p, client])));
      }
      setPendingAddCSV({ resolved, needsClient });
    }
  };

  const doInsertCSV = async (records) => {
    try {
      // Strip temp _id so Supabase auto-generates the real one
      const clean = records.map(({ _id, ...rest }) => rest);

      // ── Guard: never silently create TWO RECORDS FOR THE SAME PERSON ──
      // A Contract ID should belong to exactly one employee. But Fisheye's
      // own manually-added Contract IDs and getonboarded.net's Contract IDs
      // are two independent numbering sequences (each starts from ~1), so
      // the SAME number can coincidentally land on two completely different
      // real people — that's a numbering coincidence, not a duplicate. Only
      // block a row when the Contract ID matches AND the name also matches
      // (a real re-upload of the same person). getonboarded.net is the
      // source of truth for numbering (per Nessma), so a coincidental clash
      // with an older, independently-numbered Fisheye record does not block
      // the new, correct employee — it goes in, tagged with a note so the
      // clash is visible instead of silently risking a future PO/contract
      // lookup landing on the wrong person.
      const normName = (n) => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const existingByContractId = new Map();
      employees.forEach(e => {
        const cid = String(e.contractId || '').trim();
        if (cid) existingByContractId.set(cid, e);
      });
      const seenInBatch = new Map();
      const toInsert = [];
      const blocked = [];
      const collided = [];
      clean.forEach(r => {
        const cid = String(r.contractId || '').trim();
        const existing = cid ? existingByContractId.get(cid) : null;
        const batchDupe = cid ? seenInBatch.get(cid) : null;
        const sameAsExisting = existing && normName(existing.name) === normName(r.name);
        const sameAsBatch = batchDupe && normName(batchDupe) === normName(r.name);
        if (cid && (sameAsExisting || sameAsBatch)) {
          blocked.push({ name: r.name, contractId: cid });
          return;
        }
        if (cid && (existing || batchDupe)) {
          // Same Contract ID, different person — numbering coincidence, not
          // a duplicate. Insert, but flag it so Nessma can renumber the
          // older non-getonboarded record if she wants full uniqueness.
          collided.push({ name: r.name, contractId: cid, existingName: existing ? existing.name : batchDupe });
          r = { ...r, auditLog: [...(r.auditLog || []), { ts: new Date().toISOString(), action: `⚠️ Contract ID ${cid} already used by a different existing employee (${existing ? existing.name : batchDupe}) — inserted anyway since getonboarded.net numbering is authoritative; consider renumbering the older record.` }] };
        }
        if (cid) seenInBatch.set(cid, r.name);
        toInsert.push(r);
      });

      if (toInsert.length === 0) {
        alert(`❌ اتوقف الرفع بالكامل — كل الـ Contract IDs في الملف ده مستخدمة بالفعل لنفس الموظفين دول:\n` +
          blocked.map(b => `• ${b.name} — ${b.contractId}`).join('\n'));
        return;
      }

      // Insert in chunks of 50
      let allInserted = [];
      for (let i = 0; i < toInsert.length; i += 50) {
        const { data, error } = await supabase.from('employees_master').insert(toInsert.slice(i, i + 50)).select();
        if (error) throw error;
        allInserted = [...allInserted, ...data];
      }
      setEmployees(prev => [...allInserted, ...prev]);
      setPendingAddCSV(null);
      let msg = `✅ تم رفع ${allInserted.length} موظف بنجاح!`;
      if (collided.length > 0) {
        msg += `\n\n⚠️ ${collided.length} موظف اتسجلوا برقم عقد اتصادف نفسه مع موظف تاني قديم (شخص مختلف تمامًا) — راجعي ترقيم العقود القديمة لو حابة توحديها:\n` +
          collided.map(b => `• ${b.name} (${b.contractId}) — نفس رقم ${b.existingName}`).join('\n');
      }
      if (blocked.length > 0) {
        msg += `\n\n🚫 اتجاهل ${blocked.length} صف لأنهم نفس الموظف اتكرر (نفس الاسم ونفس الـ Contract ID):\n` +
          blocked.map(b => `• ${b.name} — ${b.contractId}`).join('\n');
      }
      alert(msg);
    } catch (err) {
      console.error("CSV Insert Error:", err);
      alert(`❌ خطأ: ${err.message}`);
    }
  };
   // 4. الدوال المساعدة
  const save = async (updated) => {
  const { _id, ...fieldsToUpdate } = updated;

  // Snapshot the old record so we can roll back if the save fails
  const oldEmp = employees.find(e => e._id === _id);

  // تحديث محلي سريع بـ _id الصح
  setEmployees(prev => prev.map(e => (e._id === _id ? updated : e)));

  // حفظ في Supabase
 try {
  const response = await supabase
    .from('employees_master')
    .update(fieldsToUpdate)
    .eq('_id', Number(_id))
    .select();

  if (response.error) throw response.error;

} catch (err) {
  console.error("Save Error:", err.message);
  // فشل الحفظ فعليًا -- رجّعي البيانات القديمة عشان الشاشة متوريش تعديل ماتسجلش
  if (oldEmp) setEmployees(prev => prev.map(e => e._id === _id ? oldEmp : e));
  alert("❌ فشل الحفظ: " + err.message);
}
};
  const bulkUpd = async (field, value) => {
  // إضافة wfDate تلقائياً لو الـ field هو workflowStatus (نفس منطق handleUpdateField)
  const today = new Date().toISOString().split("T")[0];
  const extraFields = field === "workflowStatus" ? { wfDate: today } : {};

  // Snapshot the affected employees so we can roll back if the save fails
  const prevById = new Map(
    employees.filter(e => selected.includes(e._id)).map(e => [e._id, e])
  );

  // 1. تحديث محلي سريع
  setEmployees(prev => prev.map(e =>
    selected.includes(e._id) ? { ...e, [field]: value, ...extraFields } : e
  ));

  // 2. حفظ في Supabase
  try {
    const { error } = await supabase
      .from('employees_master')
      .update({ [field]: value, ...extraFields })
      .in('_id', selected.map(Number));

    if (error) throw error;
    setShowBulk(false);
    setSelected([]);
    showWFToast(`✅ Updated ${selected.length} employee${selected.length !== 1 ? "s" : ""}`);
  } catch (err) {
    console.error("Bulk Save Error:", err.message);
    // فشل الحفظ فعليًا -- رجّعي كل الموظفين المتأثرين لبياناتهم القديمة
    setEmployees(prev => prev.map(e => prevById.has(e._id) ? prevById.get(e._id) : e));
    showWFToast(`❌ فشل الحفظ: ${err.message}`, "#dc2626");
  }
  };
  const selectedEmps = employees.filter(e => selected.includes(e._id));
  const [renewEmp, setRenewEmp] = useState(null);
const [renewForm, setRenewForm] = useState({});

const handleRenew = (emp) => {
  setRenewForm({
    startDate: emp.endDate || "",
    endDate: "",
    totalPackage: emp.totalPackage || 0,
    clientPrice: emp.clientPrice || 0,
    partnerCost: emp.partnerCost || 0,
  });
  setRenewEmp(emp);
};

const submitRenew = async () => {
  const prevContract = {
    startDate: renewEmp.startDate,
    endDate: renewEmp.endDate,
    totalPackage: renewEmp.totalPackage,
    clientPrice: renewEmp.clientPrice,
    partnerCost: renewEmp.partnerCost,
    status: renewEmp.status,
    renewedAt: new Date().toISOString(),
  };
  const updated = {
    ...renewEmp, ...renewForm, status: "renewal",
    contractHistory: [...(Array.isArray(renewEmp.contractHistory) ? renewEmp.contractHistory : []), prevContract],
    auditLog: [...(Array.isArray(renewEmp.auditLog) ? renewEmp.auditLog : []),
      { ts: new Date().toISOString(), action: "Contract renewed" }]
  };
  const { _id, ...fields } = updated;
  const oldEmp = renewEmp; // snapshot before renewal, in case the save fails
  setEmployees(prev => prev.map(e => e._id === _id ? updated : e));
  const { error } = await supabase.from('employees_master').update(fields).eq('_id', Number(_id));
  setRenewEmp(null);
  if (error) {
    // فشل الحفظ فعليًا -- رجّعي الموظف للحالة قبل التجديد
    setEmployees(prev => prev.map(e => e._id === _id ? oldEmp : e));
    showWFToast(`❌ Renewal failed: ${error.message}`, "#dc2626");
  } else {
    showWFToast(`🔄 Contract renewed for ${renewEmp.name}`);
  }
};
  return (
    <div style={{ display: "flex", gap: 16 }}>

      {/* ── Toast ── */}
      {wfToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, backgroundColor: wfToast.color, color: "white",
          padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)", pointerEvents: "none",
          animation: "fadeIn 0.2s ease",
        }}>
          {wfToast.msg}
        </div>
      )}

      {/* ── Main content: table + side panel ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 16 }}>

        {/* ── Table column ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Page Header ── */}
          <div style={{ marginBottom: 4 }}>
            {/* Title row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: M, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={15} style={{ color: "white" }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                    {client === "All" ? "Employees" : client}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                    {filtered.length} contracts
                    {selected.length > 0 && <span style={{ color: M, fontWeight: 700 }}> · {selected.length} selected</span>}
                    {activeFilterCount > 0 && <span style={{ color: "#d97706", fontWeight: 700 }}> · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}</span>}
                  </p>
                </div>
              </div>
              {/* Primary action */}
              {!isViewer && (
              <Btn onClick={handleAddSingle} style={{ backgroundColor: M, color: "white" }}>
                <UserPlus size={14} /> New Employee
              </Btn>
              )}
            </div>

            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
              {[
                { label: "Total Active",    value: kpiTotal,    color: M,         bg: "#fff5f5", border: `${M}22`,    accent: M         },
                { label: "New / Onboarding", value: kpiNew,      color: "#0369a1", bg: "#eff6ff", border: "#bfdbfe",  accent: "#0369a1" },
                { label: "Expiring ≤30d",   value: kpiExpiring, color: "#d97706", bg: "#fffbeb", border: "#fde68a",  accent: "#d97706" },
                { label: "Sela Missing PO", value: kpiNoPO,     color: "#dc2626", bg: "#fef2f2", border: "#fca5a5",  accent: "#dc2626" },
              ].map(k => (
                <div key={k.label} style={{ padding: "12px 14px", borderRadius: 10, backgroundColor: k.bg, border: `1px solid ${k.border}`, borderLeft: `4px solid ${k.accent}` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</p>
                  <p style={{ color: k.color, margin: 0, fontSize: 20, fontWeight: 900, lineHeight: 1, fontFamily: "monospace" }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Client selector — chip + dropdown; replaces the old always-visible client rail */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowClientMenu(m => !m)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${M}40`, backgroundColor: `${M}0e`, color: M, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  <Building2 size={13} /> {client === "All" ? "All Clients" : client} <ChevronDown size={11} style={{ marginLeft: 1 }} />
                </button>
                {showClientMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 220, maxHeight: 320, overflowY: "auto", overflowX: "hidden" }}
                    onMouseLeave={() => setShowClientMenu(false)}>
                    {["All", ...clientsList].map(c => {
                      const isA = client === c;
                      const count = c === "All" ? employees.filter(e => !isExcluded(e)).length : counts[c] || 0;
                      const dotColor = CLIENT_META[c]?.dot || M;
                      return (
                        <button key={c} onClick={() => { setClientP(c); setShowClientMenu(false); }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = isA ? `${M}14` : "#f9fafb"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = isA ? `${M}0e` : "transparent"}
                          style={{
                            width: "100%", textAlign: "left", padding: "9px 12px",
                            border: "none", borderBottom: "1px solid #f3f4f6",
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            backgroundColor: isA ? `${M}0e` : "transparent",
                            color: isA ? M : "#374151",
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                            {c !== "All" && <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: isA ? M : dotColor, flexShrink: 0 }} />}
                            {c === "All" && <Users size={11} style={{ color: isA ? M : "#9ca3af", flexShrink: 0 }} />}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c}</span>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                            backgroundColor: isA ? M : "#f3f4f6",
                            color: isA ? "white" : "#6b7280", flexShrink: 0, marginLeft: 8,
                            fontFamily: "monospace",
                          }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ width: 1, height: 22, backgroundColor: "#e5e7eb", flexShrink: 0 }} />
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#d1d5db" }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, ID, project…"
                  style={{ ...s.inp, paddingLeft: 30, fontSize: 12 }} />
              </div>
              <Btn variant="ghost" onClick={() => setShowFilt(f => !f)}
                style={{ ...s.btnSm, ...(activeFilterCount > 0 ? { backgroundColor: `${M}12`, color: M, border: `1px solid ${M}40` } : {}) }}>
                <Filter size={13} /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Btn>
              <Btn variant="ghost" onClick={() => exportCSV(selected.length > 0 ? filtered.filter(e => selected.includes(e._id)) : filtered)} style={s.btnSm}><Download size={13} /> Export{selected.length > 0 ? ` (${selected.length})` : ""}</Btn>
              <Btn variant="ghost" onClick={() => setShowWAPanel(true)} style={{
                ...s.btnSm,
                backgroundColor: selected.length > 0 ? "#f0fdf4" : "white",
                color: selected.length > 0 ? "#16a34a" : "#374151",
                border: `1px solid ${selected.length > 0 ? "#bbf7d0" : "#e5e7eb"}`,
              }}>
                <MessageCircle size={13} /> WA{selected.length > 0 ? ` (${selected.length})` : ""}
              </Btn>
              {/* View toggle */}
              <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                {[{ k: "table", icon: <Database size={13}/> }, { k: "calendar", icon: <CalendarDays size={13}/> }].map(({ k, icon }) => (
                  <button key={k} onClick={() => setViewMode(k)} style={{
                    padding: "5px 10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                    backgroundColor: viewMode === k ? M : "white",
                    color: viewMode === k ? "white" : "#9ca3af",
                  }}>{icon}</button>
                ))}
              </div>
              {/* ── Hidden file inputs — OUTSIDE dropdown so they survive menu close ── */}
              <input ref={csvAddRef} type="file" accept=".csv" style={{ display:"none" }}
                onChange={e => { handleCSVImport(e); setShowImportMenu(false); }} />
              <input ref={csvUpdateRef} type="file" accept=".csv" style={{ display:"none" }}
                onChange={async (e) => {
                        setShowImportMenu(false);
                        const file = e.target.files[0];
                        if (!file) return;
                        const text = await file.text();
                        const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
                        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
                        const ALLOWED = {
                          'workflow status': 'workflowStatus', 'id number': 'idNumber',
                          'project name': 'project',
                          'phone number': 'phone', 'email': 'email',
                          'po numbers': 'poNumbers', 'invoice numbers': 'invoiceNumbers',
                          'requester name': 'requesterName',
                          'bank name': 'bank',
                          'iban number': 'iban',
                          'contract id': 'contractId',   // تصحيح رقم العقد
                          'full name': 'name',            // تصحيح الاسم
                        };
                        const empIdIdx      = headers.indexOf('employee id');
                        const contractIdIdx = headers.indexOf('contract id');
                        const nameIdx       = ['candidate name','full name','name','employee name'].reduce((found, h) => found !== -1 ? found : headers.indexOf(h), -1);
                        const startIdx      = ['contract start date', 'start date', 'startdate', 'start'].reduce((found, h) => found !== -1 ? found : headers.indexOf(h), -1);
                        const endIdx        = ['contract end date', 'end date', 'enddate', 'end'].reduce((found, h) => found !== -1 ? found : headers.indexOf(h), -1);
                        if (empIdIdx === -1) { alert('❌ CSV must contain an Employee ID column'); return; }
                        const normalizeDate = d => {
                          if (!d) return null;
                          const clean = d.trim();
                          if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
                          const parts = clean.split(/[\/\-]/);
                          if (parts.length !== 3) return clean;
                          if (parseInt(parts[0]) > 12) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                          return `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
                        };
                        // ── CALCULATE DIFF (don't apply yet) ──────────────────
                        const changes = []; const notFound = []; let skippedCount = 0;
                        for (let i = 1; i < lines.length; i++) {
                          const cols  = parseCSVLine(lines[i]).map(c => c.trim());
                          const empId = cols[empIdIdx];
                          if (!empId) continue;
                          const candidates = employees.filter(emp => emp.employeeId === empId);
                          if (candidates.length === 0) { notFound.push(empId); continue; }
                          let emp = null;
                          let matchedBy = 'unique';
                          // Match ONLY by Contract ID — it's now unique in the DB
                          const csvContractId = contractIdIdx !== -1 ? cols[contractIdIdx]?.trim() : null;
                          if (candidates.length === 1 && !csvContractId) {
                            emp = candidates[0];
                          } else {
                            if (!csvContractId) { skippedCount++; console.warn(`⚠️ No Contract ID in CSV row for ${empId} — skipped`); continue; }
                            emp = employees.find(c => String(c.contractId||'').trim() === csvContractId);
                            if (!emp) { skippedCount++; console.warn(`⚠️ Contract ID ${csvContractId} not found in DB — skipped`); continue; }
                            matchedBy = `contract:${csvContractId}`;
                          }
                          // Safety check: the row's own Employee ID should belong to the same
                          // person as the Contract ID we matched on. If it doesn't, the CSV row
                          // and the DB record disagree about who this is — flag it loudly instead
                          // of silently writing this row's data onto the wrong employee.
                          const idMismatch = matchedBy.startsWith('contract:') &&
                            String(emp.employeeId || '').trim() !== String(empId).trim();
                          const fieldsToUpdate = {};
                          headers.forEach((h, idx) => {
                            const field = ALLOWED[h]; if (!field) return;
                            const val = cols[idx];
                            if (field === 'poNumbers') {
                              if (!val || !String(val).trim()) return;
                              fieldsToUpdate[field] = val.trim();
                              if (!emp.poNumbers || !String(emp.poNumbers).trim()) fieldsToUpdate.poAddedDate = new Date().toISOString().split('T')[0];
                              return;
                            }
                            // Skip invalid phone (just country code with no number)
                            if (field === 'phone' && val && /^\+\d{1,4}$/.test(val.trim())) return;
                            if (val) fieldsToUpdate[field] = val;
                          });
                          if (fieldsToUpdate.workflowStatus) {
                            if (['Qiwa Submitted','Qiwa Approved','Iqama Transferred'].includes(emp.workflowStatus))
                              delete fieldsToUpdate.workflowStatus;
                          }
                          // contractId is the match key — never update it
                          delete fieldsToUpdate.contractId;
                          if (Object.keys(fieldsToUpdate).length === 0) continue;
                          // Build field-level diff — only show fields that actually changed
                          const fieldDiffs = Object.entries(fieldsToUpdate)
                            .map(([field, newVal]) => ({ field, oldVal: emp[field] ?? '—', newVal }))
                            .filter(({ oldVal, newVal }) => String(oldVal).trim() !== String(newVal).trim());
                          if (fieldDiffs.length === 0) continue;
                          // Only keep fieldsToUpdate entries that actually changed
                          const realFields = {};
                          fieldDiffs.forEach(({ field, newVal }) => { realFields[field] = newVal; });
                          changes.push({ emp, fieldsToUpdate: realFields, fieldDiffs, matchedBy, idMismatch, csvEmployeeId: empId });
                        }
                        if (changes.length === 0 && notFound.length === 0) {
                          alert('No changes detected in this CSV.'); e.target.value = ''; return;
                        }
                        // ── Show diff preview modal ───────────────────────────
                        const applyFn = async (filteredChanges) => {
                          const EXTENDED_FIELDS = ['iban', 'bank', 'requesterName', 'poAddedDate'];
                          let updated = 0; let errors = 0;
                          for (const { emp, fieldsToUpdate } of filteredChanges) {
                            const coreFields = {}; const extFields = {};
                            Object.entries(fieldsToUpdate).forEach(([k, v]) => {
                              if (EXTENDED_FIELDS.includes(k)) extFields[k] = v; else coreFields[k] = v;
                            });
                            let coreOk = true;
                            if (Object.keys(coreFields).length > 0) {
                              const { error } = await supabase.from('employees_master').update(coreFields).eq('_id', Number(emp._id));
                              if (error) { errors++; coreOk = false; }
                              else { setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, ...coreFields } : e)); updated++; }
                            }
                            if (Object.keys(extFields).length > 0) {
                              const { error: extErr } = await supabase.from('employees_master').update(extFields).eq('_id', Number(emp._id));
                              if (extErr) {
                                errors++;
                              } else {
                                setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, ...extFields } : e));
                                // count this row as updated even if it had no core-field
                                // changes at all (e.g. only the IBAN changed)
                                if (Object.keys(coreFields).length === 0) updated++;
                              }
                            }
                          }
                          setPendingCSVDiff(null);
                          setCsvUnchecked(new Set());
                          alert(`✅ Applied: ${updated} employees updated${errors > 0 ? `\n❌ Errors: ${errors}` : ''}`);
                        };
                        const initialUnchecked = new Set();
                        changes.forEach(({ emp, fieldDiffs, idMismatch }) => {
                          if (idMismatch) fieldDiffs.forEach(({ field }) => initialUnchecked.add(`${emp._id}:${field}`));
                        });
                        setCsvUnchecked(initialUnchecked);
                        setPendingCSVDiff({ changes, notFound, skippedCount, applyFn });
                        e.target.value = '';
                      }} />

              {/* Import dropdown — buttons only, no file inputs inside */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowImportMenu(m => !m)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <Upload size={13} /> Import <ChevronDown size={11} style={{ marginLeft: 1 }} />
                </button>
                {showImportMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50, backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", width: 180, overflow: "hidden" }}
                    onMouseLeave={() => setShowImportMenu(false)}>
                    <button onClick={() => { csvAddRef.current?.click(); setShowImportMenu(false); }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor="#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", width: "100%", border: "none", backgroundColor: "transparent", textAlign: "left" }}>
                      <FileUp size={13} style={{ color: M }} /> Add from CSV
                    </button>
                    <button onClick={() => { csvUpdateRef.current?.click(); setShowImportMenu(false); }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor="#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", width: "100%", border: "none", borderTop: "1px solid #f3f4f6", backgroundColor: "transparent", textAlign: "left" }}>
                      <Upload size={13} style={{ color: "#0369a1" }} /> Update from CSV
                    </button>
                  </div>
                )}
              </div>
              {selected.length > 0 && (
                <Btn onClick={() => setShowBulk(true)} style={s.btnSm}><Zap size={13} /> Bulk ({selected.length})</Btn>
              )}
            </div>
          </div>

          {/* ── Filters inline row ── */}
          {showFilt && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "7px 10px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10 }}>
              {[
                { label: "Status",      value: fStatus,      set: setFStatusP,      opts: [["", "Status"], ...STATUS_OPTS.map(o=>[o,o])] },
                { label: "Workflow",    value: fWF,          set: setFWFP,          opts: [["", "Workflow"], ...WORKFLOW_OPTS.map(o=>[o,o])] },
                { label: "Project",     value: fProject,     set: setFPrjP,         opts: [["", "Project"], ...projects.filter(Boolean).map(o=>[o,o])] },
                { label: "Sourcing",    value: fSourcing,    set: setFSourcingP,    opts: [["", "Sourcing"], ...sourcingOpts.filter(Boolean).map(o=>[o,o])] },
                { label: "Partner",     value: fPartner,     set: setFPartnerP,     opts: [["", "Partner"], ...partnerOpts.filter(Boolean).map(o=>[o,o])] },
                { label: "Nationality", value: fNationality, set: setFNationalityP, opts: [["", "Nationality"], ...nationalityOpts.filter(Boolean).map(o=>[o,o])] },
              ].map(({ label, value, set, opts }) => (
                <select key={label} value={value} onChange={e => set(e.target.value)} style={{
                  padding: "5px 8px", borderRadius: 7, fontSize: 12, fontWeight: value ? 700 : 400,
                  border: `1px solid ${value ? M : "#e5e7eb"}`,
                  backgroundColor: value ? `${M}08` : "white",
                  color: value ? M : "#6b7280",
                  cursor: "pointer", outline: "none",
                }}>
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              {/* PO Status pills */}
              <div style={{ display: "flex", gap: 2, backgroundColor: "#e5e7eb", borderRadius: 7, padding: 2 }}>
                {[["", "PO: All"], ["has", "Has PO"], ["missing", "No PO"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFPOP(v)} style={{
                    padding: "4px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                    backgroundColor: fPO === v ? "white" : "transparent",
                    color: fPO === v ? (v === "missing" ? "#dc2626" : v === "has" ? "#16a34a" : "#374151") : "#9ca3af",
                    boxShadow: fPO === v ? "0 1px 2px rgba(0,0,0,0.08)" : "none", whiteSpace: "nowrap",
                  }}>{l}</button>
                ))}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} style={{ fontSize: 11, color: M, background: "none", border: "none", cursor: "pointer", fontWeight: 700, marginLeft: "auto", whiteSpace: "nowrap" }}>
                  ✕ Clear ({activeFilterCount})
                </button>
              )}
            </div>
          )}

          {viewMode === "table"
            ? <EmployeeTable rows={filtered} onSelect={emp => setSideEmp(emp)} selected={selected}
                setSelected={setSelected} onUpdateField={handleUpdateField} onRenew={handleRenew}
                activeSideId={sideEmp?._id} />
            : <ExpiryCalendar employees={employees} calOffset={calOffset} setCalOffset={setCalOffset} onSelect={emp => setSideEmp(emp)} clients={clients} />
          }

        </div>{/* end table column */}

        {/* ── Sprint 3: Contextual Side Panel ── */}
        {sideEmp && (
          <EmployeeContextPanel
            emp={sideEmp}
            onClose={() => setSideEmp(null)}
            onOpenFull={() => { setProfile(sideEmp); setSideEmp(null); }}
            onUpdateField={handleUpdateField}
          />
        )}

      </div>{/* end main content */}
      {/* Profile Modal */}
      {profile && <EmployeeModal emp={profile} onClose={() => setProfile(null)} onSave={save} partners={partners} allEmployees={employees} />}
{renewEmp && (
  <Modal title={`🔄 Renew · ${renewEmp.name}`} onClose={() => setRenewEmp(null)}>
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={s.grid2}>
        <div>
          <label style={s.label}>Start Date (New)</label>
          <input type="date" value={renewForm.startDate} onChange={e=>setRenewForm(f=>({...f,startDate:e.target.value}))} style={s.inp}/>
        </div>
        <div>
          <label style={s.label}>End Date (New)</label>
          <input type="date" value={renewForm.endDate} onChange={e=>setRenewForm(f=>({...f,endDate:e.target.value}))} style={s.inp}/>
        </div>
      </div>
      <div style={s.grid3}>
        <div>
          <label style={s.label}>Total Package</label>
          <input type="number" value={renewForm.totalPackage} onChange={e=>setRenewForm(f=>({...f,totalPackage:parseFloat(e.target.value)||0}))} style={s.inp}/>
        </div>
        <div>
          <label style={s.label}>Client Price</label>
          <input type="number" value={renewForm.clientPrice} onChange={e=>setRenewForm(f=>({...f,clientPrice:parseFloat(e.target.value)||0}))} style={s.inp}/>
        </div>
        <div>
          <label style={s.label}>Partner Cost</label>
          <input type="number" value={renewForm.partnerCost} onChange={e=>setRenewForm(f=>({...f,partnerCost:parseFloat(e.target.value)||0}))} style={s.inp}/>
        </div>
      </div>
      <div style={{padding:12,borderRadius:12,backgroundColor:"#f9fafb",border:"1px solid #e5e7eb"}}>
        <p style={{margin:0,fontSize:12,color:"#6b7280"}}>
          الموظف هيتغير status بتاعه لـ <strong>renewal</strong> وهيتحفظ في Supabase تلقائياً.
        </p>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:12}}>
        <Btn variant="ghost" onClick={() => setRenewEmp(null)}>Cancel</Btn>
        <Btn onClick={submitRenew}><Save size={14}/> Confirm Renewal</Btn>
      </div>
    </div>
  </Modal>
)}
      {/* Bulk Modal */}
      
      {showBulk && (
        <Modal title={`Bulk Action · ${selected.length} selected`} onClose={() => setShowBulk(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
{/* Save Button */}
<div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
  <Btn onClick={() => { setShowBulk(false); setSelected([]); }} style={{ backgroundColor: M, color: "white" }}>
  💾 حفظ وإغلاق
</Btn>
</div>
{/* Assign Partner */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={14} style={{ color: M }} /> Assign to Partner
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <select 
  value={bulkPartner} 
  onChange={e => setBulkPartner(e.target.value)} 
  style={{ ...s.sel, flex: 1 }}
>
  <option value="">— Select Partner —</option>
  {partners.map(p => (
    <option key={p.id} value={p.name}> {/* التعديل هنا: نرسل الاسم name وليس الـ id */}
      {p.name}
    </option>
  ))}
</select>
                <Btn disabled={!bulkPartner} onClick={() => bulkUpd("partnerAssigned", bulkPartner)} style={{
                  ...s.btnSm, backgroundColor: bulkPartner ? M : "#e5e7eb",
                  color: bulkPartner ? "white" : "#9ca3af", border: "none", opacity: 1,
                }}>
                  <Check size={12} /> Assign
                </Btn>
              </div>
            </div>
            {/* Change Client */}
<div style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
  <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
    <Building2 size={14} style={{ color: M }} /> Change Client
  </p>
  <div style={{ display: "flex", gap: 8 }}>
    <select
      value={bulkClient}
      onChange={e => setBulkClient(e.target.value)}
      style={{ ...s.sel, flex: 1 }}
    >
      <option value="">— Select Client —</option>
      {clientsList.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
    <Btn disabled={!bulkClient} onClick={() => { bulkUpd("client", bulkClient); setBulkClient(""); }} style={{
      ...s.btnSm, backgroundColor: bulkClient ? M : "#e5e7eb",
      color: bulkClient ? "white" : "#9ca3af", border: "none", opacity: 1,
    }}>
      <Check size={12} /> Apply
    </Btn>
  </div>
</div>

            {/* GOSI Option */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6, color: "#92400e" }}>
                🏛 GOSI Registration
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <select
                  value={bulkGosi}
                  onChange={e => setBulkGosi(e.target.value)}
                  className="fe-select"
                  style={{ flex: 1 }}
                >
                  <option value="">— Select GOSI option —</option>
                  <option value="GOSI on Jobeye - Paid by Fisheye">GOSI on Jobeye — Paid by Fisheye</option>
                  <option value="GOSI on Fisheye - Paid by Fisheye">GOSI on Fisheye — Paid by Fisheye</option>
                  <option value="GOSI on Jobeye - Paid by Client">GOSI on Jobeye — Paid by Client</option>
                  <option value="GOSI on Fisheye - Paid by Client">GOSI on Fisheye — Paid by Client</option>
                  <option value="On Partner's GOSI">On Partner's GOSI</option>
                  <option value="Not Registered to GOSI">Not Registered to GOSI</option>
                </select>
                <Btn disabled={!bulkGosi} onClick={() => { bulkUpd("gosiOption", bulkGosi); setBulkGosi(""); }} style={{
                  ...s.btnSm, backgroundColor: bulkGosi ? "#92400e" : "#e5e7eb",
                  color: bulkGosi ? "white" : "#9ca3af", border: "none", opacity: 1,
                }}>
                  <Check size={12} /> Apply
                </Btn>
              </div>
              <button
                onClick={() => bulkUpd("gosiOption", "")}
                style={{ fontSize: 11, color: "#a16207", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                Clear GOSI from selected employees
              </button>
            </div>

            {/* Export Qiwa */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #bfdbfe", backgroundColor: "#eff6ff" }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#1e3a8a", margin: "0 0 4px" }}>
                <Download size={13} style={{ display: "inline", marginRight: 4 }} /> Export for Qiwa
              </p>
              <p style={{ fontSize: 12, color: "#3b82f6", margin: "0 0 12px" }}>
                21-field CSV for {selected.length} employee(s)
              </p>
              <Btn variant="ghost" onClick={() => { exportQiwaCSV(selectedEmps); setShowBulk(false); }} style={s.btnSm}>
                <Download size={12} /> Download Qiwa CSV
              </Btn>
            </div>
{/* Workflow Status */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <GitBranch size={14} style={{ color: M }} /> Update Workflow Status
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {WORKFLOW_OPTS.map(o =>
                  <button key={o} onClick={() => bulkUpd("workflowStatus", o)} style={{
                    padding: "6px 8px", borderRadius: 8, textAlign: "center",
                    border: "1px solid #d1d5db", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", backgroundColor: "white", color: "#374151",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${M}10`; e.currentTarget.style.borderColor = M; e.currentTarget.style.color = M; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#374151"; }}
                  >{o}</button>
                )}
              </div>
            </div>

            {/* Contract Status */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={14} style={{ color: M }} /> Update Contract Status
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STATUS_OPTS.map(o => {
                  const statusColor = { active:"#16a34a", new:"#0369a1", renewal:"#7c3aed", transfer:"#d97706", expired:"#6b7280", resigned:"#dc2626" }[o] || "#374151";
                  return (
                    <button key={o} onClick={() => bulkUpd("status", o)} style={{
                      padding: "5px 11px", borderRadius: 999,
                      border: `1px solid ${statusColor}30`, fontSize: 11, fontWeight: 600,
                      cursor: "pointer", backgroundColor: `${statusColor}10`, color: statusColor,
                      textTransform: "capitalize", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${statusColor}25`; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${statusColor}10`; }}
                    >{o}</button>
                  );
                })}
              </div>
            </div>
            {/* Profit Calculation */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign size={13} style={{ color: M }} /> Profit Calculation Mode
              </p>

              {/* Mode Toggle */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={() => setShowProfitMode(prev => ({ ...prev, mode: "partner" }))}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: showProfitMode?.mode === "partner" ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                    backgroundColor: showProfitMode?.mode === "partner" ? "#dbeafe" : "white",
                    color: showProfitMode?.mode === "partner" ? "#1e40af" : "#6b7280"
                  }}>Partner Mode</button>
                <button onClick={() => setShowProfitMode(prev => ({ ...prev, mode: "direct" }))}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: showProfitMode?.mode === "direct" ? "2px solid #ec4899" : "1px solid #e5e7eb",
                    backgroundColor: showProfitMode?.mode === "direct" ? "#fbf1f8" : "white",
                    color: showProfitMode?.mode === "direct" ? "#be185d" : "#6b7280"
                  }}>Direct Mode</button>
              </div>

              {showProfitMode?.mode === "partner" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {/* Client Price */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, display: "block" }}>CLIENT PRICE</label>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {["percent", "fixed"].map(t =>
                        <button key={t} onClick={() => setShowProfitMode(prev => ({ ...prev, clientType: t }))}
                          style={{
                            flex: 1, padding: "6px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                            border: showProfitMode?.clientType === t ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                            backgroundColor: showProfitMode?.clientType === t ? "#dbeafe" : "white"
                          }}>{t === "percent" ? "%" : "SAR"}</button>
                      )}
                    </div>
                    <input type="number" id="clientValue" defaultValue="115" placeholder="115"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                    <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0" }}>
                      {showProfitMode?.clientType === "percent" ? "النسبة %" : "المبلغ الثابت SAR"}
                    </p>
                  </div>
                  {/* Partner Cost */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, display: "block" }}>PARTNER COST</label>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {["percent", "fixed"].map(t =>
                        <button key={t} onClick={() => setShowProfitMode(prev => ({ ...prev, partnerType: t }))}
                          style={{
                            flex: 1, padding: "6px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                            border: showProfitMode?.partnerType === t ? "2px solid #ec4899" : "1px solid #e5e7eb",
                            backgroundColor: showProfitMode?.partnerType === t ? "#fbf1f8" : "white"
                          }}>{t === "percent" ? "%" : "SAR"}</button>
                      )}
                       </div>
                    <input type="number" id="partnerValue" defaultValue="92" placeholder="92"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                    <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0" }}>
                      {showProfitMode?.partnerType === "percent" ? "النسبة %" : "المبلغ الثابت SAR"}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, display: "block" }}>FISHEYE MARGIN</label>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {["percent", "fixed"].map(t =>
                      <button key={t} onClick={() => setShowProfitMode(prev => ({ ...prev, fisheyeType: t }))}
                        style={{
                          flex: 1, padding: "6px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                          border: showProfitMode?.fisheyeType === t ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                          backgroundColor: showProfitMode?.fisheyeType === t ? "#fef3c7" : "white"
                        }}>{t === "percent" ? "%" : "SAR"}</button>
                    )}
                  </div>
                  <input type="number" id="fisheyeValue" defaultValue="15" placeholder="15"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0" }}>
                    {showProfitMode?.fisheyeType === "percent" ? "هامش النسبة %" : "الربح الثابت SAR"}
                  </p>
                </div>
              )}
              {/* Apply */}
<button onClick={async () => {
  const mode = showProfitMode?.mode || "partner";
  
  if (mode === "partner") {
    const clientType = showProfitMode?.clientType || "percent";
    const clientVal = parseFloat(document.getElementById("clientValue")?.value || 115);
    const partnerType = showProfitMode?.partnerType || "percent";
    const partnerVal = parseFloat(document.getElementById("partnerValue")?.value || 92);

    // احفظي القيم القديمة عشان نرجعلها لو الحفظ فشل
    const prevById = new Map(
      employees.filter(emp => selected.includes(emp._id)).map(emp => [emp._id, {
        clientPrice: emp.clientPrice, clientPriceType: emp.clientPriceType,
        partnerCost: emp.partnerCost, partnerCostType: emp.partnerCostType, profitMode: emp.profitMode,
      }])
    );

    // تحديث محلي
    setEmployees(emps => emps.map(emp =>
      selected.includes(emp._id)
        ? { ...emp, clientPrice: clientVal, clientPriceType: clientType, partnerCost: partnerVal, partnerCostType: partnerType, profitMode: "partner" }
        : emp
    ));

    // حفظ في Supabase
    const { error } = await supabase
      .from('employees_master')
      .update({ clientPrice: clientVal, clientPriceType: clientType, partnerCost: partnerVal, partnerCostType: partnerType, profitMode: "partner" })
      .in('_id', selected.map(Number));

    if (error) {
      // فشل الحفظ فعليًا -- رجّعي الأرقام القديمة عشان الشاشة متوريش قيم اتسجلتش
      setEmployees(emps => emps.map(emp => prevById.has(emp._id) ? { ...emp, ...prevById.get(emp._id) } : emp));
      alert("❌ فشل الحفظ: " + error.message);
    }
    else alert("✅ تم الحفظ بنجاح");

  } else {
    const fisheyeType = showProfitMode?.fisheyeType || "percent";
    const fisheyeVal = parseFloat(document.getElementById("fisheyeValue")?.value || 15);

    // احفظي القيم القديمة عشان نرجعلها لو الحفظ فشل
    const prevById = new Map(
      employees.filter(emp => selected.includes(emp._id)).map(emp => [emp._id, {
        fisheyeMargin: emp.fisheyeMargin, fisheyeMarginType: emp.fisheyeMarginType, profitMode: emp.profitMode,
      }])
    );

    // تحديث محلي
    setEmployees(emps => emps.map(emp =>
      selected.includes(emp._id)
        ? { ...emp, fisheyeMargin: fisheyeVal, fisheyeMarginType: fisheyeType, profitMode: "direct" }
        : emp
    ));

    // حفظ في Supabase
    const { error } = await supabase
      .from('employees_master')
      .update({ fisheyeMargin: fisheyeVal, fisheyeMarginType: fisheyeType, profitMode: "direct" })
      .in('_id', selected.map(Number));

    if (error) {
      setEmployees(emps => emps.map(emp => prevById.has(emp._id) ? { ...emp, ...prevById.get(emp._id) } : emp));
      alert("❌ فشل الحفظ: " + error.message);
    }
    else alert("✅ تم الحفظ بنجاح");
  }
}} style={{
  width: "100%", padding: "10px 12px", borderRadius: 12, border: "none",
  backgroundColor: "#16a34a", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer"
}}>
  ✅ Apply Profit Calculation
</button>
            </div>

            {/* Delete */}
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid #fca5a5", backgroundColor: "#fff5f5" }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6, color: "#dc2626" }}>
                <Trash2 size={13} /> Delete Employees
              </p>
              <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 12px", opacity: 0.8 }}>
                Permanently remove {selected.length} selected employee(s)
              </p>
              <Btn onClick={async () => {
                if (window.confirm("هل أنت متأكد من حذف الموظفين المحددين؟")) {
                  try {
                    const { error } = await supabase.from('employees_master').delete().in('_id', selected);
                    if (error) throw error;
                    setEmployees(prev => prev.filter(emp => !selected.includes(emp._id)));
                    setSelected([]);
                    setShowBulk(false);
                    alert("تم الحذف بنجاح ✅");
                  } catch (err) {
                    console.error(err);
                  }
                }
              }} full style={s.btnSm}>
                <Trash2 size={12} /> Delete Selected
              </Btn>
            </div>

          </div>
        </Modal>
      )}

      {/* ── WA Message Panel ── */}
      {showWAPanel && (() => {
        const pool = selected.length > 0 ? filtered.filter(e => selected.includes(e._id)) : filtered;
        const byClient = clientsList.reduce((acc, c) => {
          const emps = pool.filter(e => e.client === c);
          if (emps.length > 0) acc[c] = emps;
          return acc;
        }, {});
        const otherEmps = pool.filter(e => !clientsList.includes(e.client));
        if (otherEmps.length > 0) byClient["Other"] = otherEmps;

        const buildMsg = (clientName, emps) => {
          const today = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
          const lines = emps.map(e => {
            const d = daysUntil(e.endDate);
            const dStr = d < 0 ? "Expired" : d === 0 ? "Today" : `${d}d left`;
            return `• ${e.name}${e.position ? ` — ${e.position}` : ""} (${dStr})`;
          });
          return `*${clientName} — Contract Update*\n_${today}_\n\n${lines.join("\n")}\n\nPlease review and confirm. Thank you 🙏`;
        };

        return (
          <Modal title={`WhatsApp Messages · ${pool.length} employee${pool.length !== 1 ? "s" : ""}`} onClose={() => { setShowWAPanel(false); setWACopied({}); }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {selected.length === 0 && (
                <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "#fffbeb", border: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
                  Showing all <strong>{pool.length}</strong> filtered employees. Select specific rows to narrow down.
                </div>
              )}
              {Object.entries(byClient).map(([clientName, emps]) => {
                const msg = buildMsg(clientName, emps);
                const copied = waCopied[clientName];
                return (
                  <div key={clientName} style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                    {/* Client header */}
                    <div style={{ padding: "10px 14px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: CLIENT_META[clientName]?.dot || M, display: "inline-block" }} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{clientName}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{emps.length} employee{emps.length !== 1 ? "s" : ""}</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg);
                          setWACopied(p => ({ ...p, [clientName]: true }));
                          setTimeout(() => setWACopied(p => ({ ...p, [clientName]: false })), 2000);
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: "none",
                          backgroundColor: copied ? "#f0fdf4" : "#16a34a",
                          color: copied ? "#16a34a" : "white",
                          transition: "all 0.2s",
                        }}
                      >
                        {copied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy</>}
                      </button>
                    </div>
                    {/* Message preview */}
                    <pre style={{ margin: 0, padding: "12px 14px", fontSize: 12, color: "#374151", backgroundColor: "white", whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>
                      {msg}
                    </pre>
                  </div>
                );
              })}
              {Object.keys(byClient).length === 0 && (
                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "24px 0" }}>No employees in current view.</p>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── CSV Diff Preview Modal ── */}
      {pendingCSVDiff && (() => {
        const { changes, notFound, skippedCount, applyFn } = pendingCSVDiff;
        const applying = csvApplying;

        // Flatten rows: one row per (employee × changed field), each with a unique key
        const rows = changes.flatMap(({ emp, fieldDiffs, matchedBy, idMismatch, csvEmployeeId }) =>
          fieldDiffs.map(({ field, oldVal, newVal }) => ({
            key: `${emp._id}:${field}`,
            empId: emp._id,
            name: emp.name,
            contractId: emp.contractId || '—',
            matchedBy: matchedBy || 'unique',
            idMismatch: !!idMismatch,
            csvEmployeeId,
            dbEmployeeId: emp.employeeId,
            field,
            oldVal: oldVal === undefined || oldVal === null ? '—' : String(oldVal),
            newVal: String(newVal),
          }))
        );

        const allKeys = rows.map(r => r.key);
        const checkedCount = allKeys.filter(k => !csvUnchecked.has(k)).length;
        const allChecked = checkedCount === allKeys.length;
        const noneChecked = checkedCount === 0;

        const toggleRow = (key) => setCsvUnchecked(prev => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key); else next.add(key);
          return next;
        });
        const toggleAll = () => setCsvUnchecked(allChecked ? new Set(allKeys) : new Set());

        // Build filteredChanges — only include employees that have at least one checked field
        const filteredChanges = changes.map(({ emp, fieldsToUpdate, fieldDiffs, matchedBy }) => {
          const checkedFields = fieldDiffs.filter(({ field }) => !csvUnchecked.has(`${emp._id}:${field}`));
          if (checkedFields.length === 0) return null;
          const newFieldsToUpdate = {};
          checkedFields.forEach(({ field, newVal }) => { newFieldsToUpdate[field] = newVal; });
          return { emp, fieldsToUpdate: newFieldsToUpdate, fieldDiffs: checkedFields, matchedBy };
        }).filter(Boolean);

        const FIELD_LABEL = {
          workflowStatus: 'Workflow Status', idNumber: 'ID Number', project: 'Project',
          phone: 'Phone', email: 'Email', poNumbers: 'PO Numbers', poAddedDate: 'PO Added Date',
          invoiceNumbers: 'Invoice Numbers', requesterName: 'Requester Name',
          bank: 'Bank', iban: 'IBAN',
          contractId: '🔑 Contract ID', name: '👤 Name',
        };

        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.55)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{
              backgroundColor: "white", borderRadius: 16, width: "100%", maxWidth: 820,
              maxHeight: "88vh", display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}>
              {/* Header */}
              <div style={{
                padding: "18px 22px", borderBottom: "1px solid #e5e7eb",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexShrink: 0,
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                    📋 CSV Update Preview
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                    راجع التغييرات — {checkedCount} من {rows.length} تعديل محدد
                    {skippedCount > 0 && ` · ${skippedCount} skipped`}
                  </p>
                </div>
                <button onClick={() => { setPendingCSVDiff(null); setCsvUnchecked(new Set()); }} disabled={applying}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>

              {/* Body — scrollable */}
              <div style={{ overflowY: "auto", flex: 1, padding: "16px 22px" }}>

                {/* Changes table */}
                {rows.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f9fafb" }}>
                          {/* Select All checkbox */}
                          <th style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb", width: 32 }}>
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={el => { if (el) el.indeterminate = !allChecked && !noneChecked; }}
                              onChange={toggleAll}
                              style={{ cursor: "pointer", width: 14, height: 14 }}
                            />
                          </th>
                          {["Employee", "Contract ID", "Matched By", "Field", "Old Value", "New Value"].map(h => (
                            <th key={h} style={{
                              padding: "8px 10px", textAlign: "left", fontWeight: 700,
                              color: "#374151", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => {
                          const isChecked = !csvUnchecked.has(r.key);
                          const isWeakMatch = r.matchedBy !== 'unique' && !r.matchedBy.startsWith('contract:');
                          return (
                            <tr key={r.key} style={{
                              backgroundColor: !isChecked ? "#f9fafb" : r.idMismatch ? "#fef2f2" : isWeakMatch ? "#fffbeb" : (i % 2 === 0 ? "white" : "#f9fafb"),
                              opacity: isChecked ? 1 : 0.45,
                            }}>
                              <td style={{ padding: "7px 10px", borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleRow(r.key)}
                                  style={{ cursor: "pointer", width: 14, height: 14 }}
                                />
                              </td>
                              <td style={{ padding: "7px 10px", color: "#111827", fontWeight: 600, borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>{r.name}</td>
                              <td style={{ padding: "7px 10px", color: "#6b7280", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.contractId}</td>
                              <td style={{ padding: "7px 10px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                                <span title={r.idMismatch ? `CSV Employee ID: ${r.csvEmployeeId}  —  DB Employee ID: ${r.dbEmployeeId}` : undefined} style={{
                                  padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                                  backgroundColor: r.idMismatch ? "#fee2e2" : r.matchedBy.startsWith('contract:') ? "#dcfce7" : isWeakMatch ? "#fef3c7" : "#f3f4f6",
                                  color: r.idMismatch ? "#991b1b" : r.matchedBy.startsWith('contract:') ? "#15803d" : isWeakMatch ? "#92400e" : "#6b7280",
                                }}>
                                  {r.idMismatch ? '❌ ID Mismatch' : r.matchedBy.startsWith('contract:') ? '✅ Contract' : isWeakMatch ? '⚠️ '+r.matchedBy : '—'}
                                </span>
                              </td>
                              <td style={{ padding: "7px 10px", color: "#374151", fontWeight: 600, borderBottom: "1px solid #f3f4f6" }}>{FIELD_LABEL[r.field] || r.field}</td>
                              <td style={{ padding: "7px 10px", color: "#dc2626", borderBottom: "1px solid #f3f4f6", textDecoration: "line-through", opacity: 0.8 }}>{r.oldVal}</td>
                              <td style={{ padding: "7px 10px", color: "#16a34a", fontWeight: 700, borderBottom: "1px solid #f3f4f6" }}>{r.newVal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ID mismatches — CSV row's Employee ID disagrees with the DB owner of that Contract ID */}
                {rows.some(r => r.idMismatch) && (
                  <div style={{
                    padding: "12px 14px", borderRadius: 10, backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca", marginBottom: 16,
                  }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: "#991b1b" }}>
                      ❌ {new Set(rows.filter(r => r.idMismatch).map(r => r.empId)).size} صف الـ Employee ID بتاعه في الـ CSV مش نفس صاحب الـ Contract ID ده في النظام — اتمنعوا تلقائيًا من التحديد.
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#7f1d1d" }}>
                      يعني ممكن الملف يكون بتاع شخص تاني أو فيه Contract ID اتكرر/اتغيّر. راجعيهم كويس قبل ما تحطيهم ✔️ يدويًا.
                    </p>
                  </div>
                )}

                {/* Not found */}
                {notFound.length > 0 && (
                  <div style={{
                    padding: "12px 14px", borderRadius: 10, backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a", marginBottom: 16,
                  }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: "#92400e" }}>
                      ⚠️ {notFound.length} Contract ID{notFound.length > 1 ? "s" : ""} not found in system:
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#78350f", fontFamily: "monospace", lineHeight: 1.8 }}>
                      {notFound.join(" · ")}
                    </p>
                  </div>
                )}

                {changes.length === 0 && (
                  <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>
                    No changes to apply.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: "14px 22px", borderTop: "1px solid #e5e7eb",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexShrink: 0, backgroundColor: "#f9fafb", borderRadius: "0 0 16px 16px",
              }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {checkedCount} تعديل محدد{csvUnchecked.size > 0 ? ` · ${csvUnchecked.size} متجاهل` : ''}
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setPendingCSVDiff(null); setCsvUnchecked(new Set()); }} disabled={applying}
                    style={{
                      padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: "1px solid #e5e7eb", backgroundColor: "white", cursor: "pointer",
                      color: "#374151", opacity: applying ? 0.5 : 1,
                    }}>❌ Cancel</button>
                  <button
                    disabled={applying || noneChecked}
                    onClick={async () => { setCsvApplying(true); await applyFn(filteredChanges); setCsvApplying(false); }}
                    style={{
                      padding: "8px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                      border: "none", cursor: noneChecked ? "not-allowed" : "pointer",
                      backgroundColor: noneChecked ? "#e5e7eb" : M,
                      color: noneChecked ? "#9ca3af" : "white",
                      opacity: applying ? 0.7 : 1,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {applying ? "⏳ Applying..." : `✅ Apply ${checkedCount} Changes`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add CSV: Client Selector Modal (for unrecognized projects) ── */}
      {pendingAddCSV && (()=>{
        const { resolved = [], needsClient = [] } = pendingAddCSV;
        const byProject = {};
        needsClient.forEach(r => { const p = r.project || "Unknown"; if (!byProject[p]) byProject[p] = []; byProject[p].push(r); });
        const projects = Object.keys(byProject);
        const allAssigned = projects.every(p => csvClientAssign[p]);
        const total = resolved.length + needsClient.length;
        return (
          <div style={{ position:"fixed", inset:0, zIndex:9999, backgroundColor:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ backgroundColor:"white", borderRadius:16, width:"100%", maxWidth:480, maxHeight:"85vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
              <h3 style={{ margin:"0 0 4px", fontSize:16, fontWeight:700, color:"#111827" }}>📂 تعيين Client للبروجكتات</h3>
              <p style={{ margin:"0 0 20px", fontSize:12, color:"#6b7280" }}>
                {resolved.length > 0 && <span style={{color:"#16a34a", fontWeight:600}}>{resolved.length} موظف اتعرفوا تلقائياً ✅&nbsp;&nbsp;</span>}
                {needsClient.length > 0 && <span>{needsClient.length} موظف في {projects.length} بروجكت — اختاري الـ Client:</span>}
              </p>
              {projects.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
                  {projects.map(proj => (
                    <div key={proj} style={{ padding:"12px 14px", borderRadius:10, border:"1px solid #e5e7eb", backgroundColor:"#f9fafb" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:"#111827" }}>{proj}</span>
                        <span style={{ fontSize:11, color:"#9ca3af" }}>{byProject[proj].length} موظف</span>
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {CLIENTS_LIST.map(c => {
                          const meta = CLIENT_META[c] || {};
                          const sel = csvClientAssign[proj] === c;
                          return (
                            <button key={c} onClick={() => setCsvClientAssign(a => ({ ...a, [proj]: c }))} style={{
                              padding:"5px 11px", borderRadius:999, fontSize:11, fontWeight:700, cursor:"pointer",
                              border:`1px solid ${sel ? (meta.dot||M) : "#e5e7eb"}`,
                              backgroundColor: sel ? (meta.badge||`${M}15`) : "white",
                              color: sel ? (meta.text||M) : "#6b7280",
                            }}>{c}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => { setPendingAddCSV(null); setCsvClientAssign({}); }} style={{
                  flex:1, padding:"9px", borderRadius:8, border:"1px solid #e5e7eb",
                  backgroundColor:"white", cursor:"pointer", fontSize:13, color:"#6b7280", fontWeight:600,
                }}>❌ Cancel</button>
                <button onClick={async () => {
                  const withClients = needsClient.map(r => ({ ...r, client: csvClientAssign[r.project || "Unknown"] || "Unknown" }));
                  await doInsertCSV([...resolved, ...withClients]);
                  setCsvClientAssign({});
                }} disabled={!allAssigned && needsClient.length > 0} style={{
                  flex:2, padding:"9px", borderRadius:8, border:"none",
                  backgroundColor: (allAssigned || needsClient.length === 0) ? M : "#e5e7eb",
                  color: (allAssigned || needsClient.length === 0) ? "white" : "#9ca3af",
                  cursor: (allAssigned || needsClient.length === 0) ? "pointer" : "not-allowed",
                  fontSize:13, fontWeight:700,
                }}>✅ رفع {total} موظف</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}


// ─── FINANCE VIEW ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// 💸 MONTHLY PAYROLL FLOW TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
const PAYROLL_STEPS = [
  { k: 'timesheet', l: 'Timesheet وصل',    short: '📋 TS',  color: '#3b82f6', desc: 'Timesheet استلمته من العميل' },
  { k: 'salary',    l: 'Salary اتدفع',      short: '💰 SAL', color: '#7c3aed', desc: 'Salary اتدفع للموظف / البارتنر' },
  { k: 'invoice',   l: 'Invoice اتبعت',     short: '📄 INV', color: '#d97706', desc: 'Invoice اتبعت للعميل (1-7 الشهر)' },
  { k: 'payment',   l: 'Payment وصل',       short: '✅ PAY', color: '#16a34a', desc: 'Payment استلمته من العميل' },
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

  const [selectedMonth, setSelectedMonth] = useState(months[0].key);
  const [selectedClient, setSelectedClient] = useState('All');
  const [filterDone, setFilterDone] = useState(false);
  const [flows, setFlows] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fisheye_payroll_flow_v1')) || {}; } catch { return {}; }
  });

  const saveFlows = f => {
    setFlows(f);
    try { localStorage.setItem('fisheye_payroll_flow_v1', JSON.stringify(f)); } catch {}
  };

  // Persist a single flow key to Supabase (fisheye_payroll_flows: month=key, data=flowData)
  const persistFlowToSupabase = async (key, data) => {
    try {
      await supabase.from('fisheye_payroll_flows').upsert(
        { month: key, data },
        { onConflict: 'month' }
      );
    } catch {}
  };

  const getFlow  = empId => flows[`${selectedMonth}_${empId}`] || {};
  const allDone  = e => PAYROLL_STEPS.every(s => getFlow(e._id)[s.k]);

  const toggle = (empId, step) => {
    const key = `${selectedMonth}_${empId}`;
    const cur = flows[key] || {};
    const updated = { ...cur, [step]: !cur[step] };
    saveFlows({ ...flows, [key]: updated });
    persistFlowToSupabase(key, updated); // sync to Supabase so refresh doesn't lose data
  };

  // ── Bulk: mark a STEP as done for ALL visible employees ─────────────────
  const bulkMarkStep = (emps, step, value) => {
    const updated = { ...flows };
    emps.forEach(e => {
      const key = `${selectedMonth}_${e._id}`;
      updated[key] = { ...(updated[key] || {}), [step]: value };
    });
    saveFlows(updated);
    // sync each changed key to Supabase
    emps.forEach(e => {
      const key = `${selectedMonth}_${e._id}`;
      persistFlowToSupabase(key, updated[key]);
    });
  };

  // ── Bulk: mark ALL steps done/undone for ALL visible employees ───────────
  const bulkMarkAll = (emps, value) => {
    const updated = { ...flows };
    emps.forEach(e => {
      const key = `${selectedMonth}_${e._id}`;
      const cur = { ...(updated[key] || {}) };
      PAYROLL_STEPS.forEach(s => { cur[s.k] = value; });
      updated[key] = cur;
    });
    saveFlows(updated);
    // sync every changed key to Supabase so refresh doesn't lose the bulk action
    emps.forEach(e => {
      const key = `${selectedMonth}_${e._id}`;
      persistFlowToSupabase(key, updated[key]);
    });
  };

  const activeEmps = employees.filter(e => !isExcluded(e));

  // Client filter list — show clients that have employees
  const clientsWithEmps = ['All', ...CLIENTS_LIST.filter(c => activeEmps.some(e => e.client === c))];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Row 1: Month selector ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>الشهر:</span>
        {months.map(m => (
          <button key={m.key} onClick={() => setSelectedMonth(m.key)}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${selectedMonth === m.key ? M : '#e5e7eb'}`, backgroundColor: selectedMonth === m.key ? M : 'white', color: selectedMonth === m.key ? 'white' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Row 2: Client filter ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>العميل:</span>
        {clientsWithEmps.map(c => {
          const meta  = c === 'All' ? null : CLIENT_META[c];
          const isAct = selectedClient === c;
          return (
            <button key={c} onClick={() => setSelectedClient(c)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${isAct ? (meta ? meta.dot : M) : '#e5e7eb'}`,
                backgroundColor: isAct ? (meta ? meta.badge : `${M}15`) : 'white',
                color: isAct ? (meta ? meta.text : M) : '#374151',
              }}>
              {c === 'All' ? '🌐 All Clients' : c}
              {c !== 'All' && (
                <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                  {activeEmps.filter(e => e.client === c).length}
                </span>
              )}
            </button>
          );
        })}
        <button onClick={() => setFilterDone(f => !f)}
          style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: `1px solid ${filterDone ? M : '#e5e7eb'}`, backgroundColor: filterDone ? `${M}10` : 'white', color: filterDone ? M : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {filterDone ? '👁 Show All' : '🔍 Pending Only'}
        </button>
      </div>

      {/* ── Step progress bars (for selected client) ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {stepCounts.map((st, i) => {
          const pct = st.total ? Math.round(st.done / st.total * 100) : 0;
          return (
            <div key={st.k} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${st.color}30`, backgroundColor: `${st.color}08` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.short}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: st.color }}>{st.done}/{st.total}</span>
              </div>
              <div style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: st.color, borderRadius: 999, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{pct}% done</div>
            </div>
          );
        })}
      </div>

      {/* ── Bulk Actions bar ───────────────────────────────────────────── */}
      <Card style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginRight: 4 }}>
            ⚡ Bulk — {selectedClient === 'All' ? 'All Clients' : selectedClient} ({displayedEmps.length} موظف):
          </span>

          {/* Mark each step for all */}
          {PAYROLL_STEPS.map(st => {
            const allStepDone = displayedEmps.length > 0 && displayedEmps.every(e => getFlow(e._id)[st.k]);
            return (
              <button key={st.k} onClick={() => bulkMarkStep(displayedEmps, st.k, !allStepDone)}
                title={allStepDone ? `Unmark ${st.l} for all` : `Mark ${st.l} for all`}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${allStepDone ? st.color : '#e5e7eb'}`,
                  backgroundColor: allStepDone ? st.color : 'white',
                  color: allStepDone ? 'white' : st.color,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                {allStepDone ? <Check size={10} /> : null}
                {st.short}
              </button>
            );
          })}

          <div style={{ width: 1, height: 24, backgroundColor: '#e5e7eb', margin: '0 4px' }} />

          {/* Mark ALL complete */}
          <button onClick={() => bulkMarkAll(displayedEmps, true)}
            style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #16a34a', backgroundColor: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={10} /> كل الخطوات ✅
          </button>

          {/* Clear all */}
          <button onClick={() => { if (window.confirm(`مسح كل الخطوات لـ ${selectedClient}؟`)) bulkMarkAll(displayedEmps, false); }}
            style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#9ca3af' }}>
            🔄 Reset
          </button>
        </div>
      </Card>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {displayedEmps.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>✅ كل الموظفين خلصوا لهذا الشهر!</p>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="fe-table" style={{ ...s.table, minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={s.th}>Employee</th>
                  <th style={s.th}>Client</th>
                  <th style={s.th}>Mode</th>
                  {PAYROLL_STEPS.map(st => (
                    <th key={st.k} style={{ ...s.th, textAlign: 'center' }}>
                      <div style={{ color: st.color, fontSize: 11 }}>{st.short}</div>
                    </th>
                  ))}
                  <th style={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedEmps.map(e => {
                  const done      = allDone(e);
                  const doneCount = PAYROLL_STEPS.filter(st => getFlow(e._id)[st.k]).length;
                  return (
                    <tr key={e._id} style={{ backgroundColor: done ? '#f0fdf4' : 'white' }}>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.position}</div>
                      </td>
                      <td style={s.td}><ClientBadge client={e.client} small /></td>
                      <td style={s.td}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: e.profitMode === 'direct' ? '#dbeafe' : '#f3e8ff', color: e.profitMode === 'direct' ? '#1e40af' : '#581c87' }}>
                          {e.profitMode === 'direct' ? '⚡ Direct' : '🤝 Partner'}
                        </span>
                      </td>
                      {PAYROLL_STEPS.map(st => (
                        <td key={st.k} style={{ ...s.td, textAlign: 'center' }}>
                          <button title={st.desc} onClick={() => toggle(e._id, st.k)}
                            style={{
                              width: 30, height: 30, borderRadius: '50%',
                              border: `2px solid ${getFlow(e._id)[st.k] ? st.color : '#e5e7eb'}`,
                              backgroundColor: getFlow(e._id)[st.k] ? st.color : 'white',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto', transition: 'all 0.15s',
                            }}>
                            {getFlow(e._id)[st.k]
                              ? <Check size={12} style={{ color: 'white' }} />
                              : <span style={{ fontSize: 9, color: '#d1d5db' }}>○</span>}
                          </button>
                        </td>
                      ))}
                      <td style={s.td}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                          backgroundColor: done ? '#dcfce7' : doneCount > 0 ? '#fef9c3' : '#f3f4f6',
                          color: done ? '#166534' : doneCount > 0 ? '#854d0e' : '#9ca3af',
                        }}>
                          {done ? '✅ Done' : `${doneCount}/${PAYROLL_STEPS.length}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Step legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PAYROLL_STEPS.map((st, i) => (
          <div key={st.k} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, backgroundColor: `${st.color}10`, border: `1px solid ${st.color}25` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: st.color }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: st.color }}>Step {i + 1}: {st.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── CLIENT HEALTH SCORE ────────────────────────────────────────────────
// A client's PROFILE record (name/color/contacts, in the `clients` table) and an employee's
// `client` free-text field are two independently-edited values that happen to usually agree —
// but "SELA" (the profile) vs "Sela" (what's actually on employee records) is exactly the kind of
// drift that silently breaks every `===` comparison between them and makes a client with hundreds
// of real employees look like it has none ("No Data"). Case/whitespace-insensitive on purpose;
// still exact otherwise (this is not the "contains" fuzzy matching classifyProject does).
const sameClientName = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

function calcClientHealth(clientName, employees) {
  const clientEmps = employees.filter(e => sameClientName(e.client, clientName) && !isExcluded(e));
  if (!clientEmps.length) return { score: 100, label: "No Data", color: "#9ca3af" };

  let score = 100;
  const total = clientEmps.length;

  // Expiring contracts penalty
  const expiring = clientEmps.filter(e => { const d = daysUntil(e.endDate); return d >= 0 && d <= 14; }).length;
  score -= Math.round((expiring / total) * 30);

  // Pending workflows penalty
  const pending = clientEmps.filter(e => !isWFDone(e.workflowStatus)).length;
  score -= Math.round((pending / total) * 25);

  // Missing PO penalty (only for clients whose billing requires a PO on file)
  if (clientRequiresPO(clientName)) {
    const missingPO = clientEmps.filter(hasMissingPO).length;
    score -= Math.round((missingPO / total) * 20);
  }

  // Onboarding delays penalty
  const onbDelayed = clientEmps.filter(e => {
    if (e.workflowStatus !== "Onboarding") return false;
    const done = Object.values(e.onboardingSteps || {}).filter(Boolean).length;
    return done < 3;
  }).length;
  score -= Math.round((onbDelayed / total) * 25);

  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? "Healthy" : score >= 60 ? "At Risk" : score >= 40 ? "Warning" : "Critical";
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : score >= 40 ? "#dc2626" : "#7f1d1d";
  return { score, label, color };
}

// ─── CLIENT HUB ─────────────────────────────────────────────────────────
const DEF_CLIENTS=[
  {id:"C-01",name:"Sela",region:"Riyadh",email:"contact@sela.sa",status:"active",contacts:[{name:"Ahmed Al-Saleh",role:"HR Director",phone:"+966501234567"},{name:"Layla Al-Rashid",role:"Finance",phone:"+966502345678"}],notes:"Primary client · Multiple projects",requestLog:[{ts:"2026-04-20T10:00:00Z",type:"Invoice",employee:"Batch A",status:"Completed"},{ts:"2026-04-28T15:00:00Z",type:"Contract Update",employee:"Batch B",status:"Pending"}]},
  {id:"C-03",name:"Channel Play",region:"Eastern Province",email:"admin@Channel Play.sa",status:"active",contacts:[{name:"Sara Mohammed",role:"HR Manager",phone:"+966507654321"}],notes:"Tech company · SILQFI projects",requestLog:[]},
  {id:"C-04",name:"Riva Engineering 2",region:"Riyadh",email:"ops@riva.sa",status:"active",contacts:[{name:"Mohammed CEO",role:"Executive",phone:"+966501111111"}],notes:"CEO projects",requestLog:[]},
];

function ClientHub({ employees, clients, saveClients }) {
  if (!clients) clients = [];
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("active");
  const [search,setSearch]=useState("");
  const [openId,setOpenId]=useState(null);
  const [detailTab,setDetailTab]=useState("overview");
  const [editingInfo,setEditingInfo]=useState(false);
  const [infoForm,setInfoForm]=useState({name:"",region:"",email:"",notes:""});
  const [nC,setNC]=useState({name:"",region:"",email:"",notes:""});
  const [showNewAction,setShowNewAction]=useState(false);
  const [newAction,setNewAction]=useState({desc:"",type:"Invoice"});
  const [actionsFilter,setActionsFilter]=useState("pending");
  const [notesVal,setNotesVal]=useState("");
  const notesTimer=useRef(null);
  const [showAllProjects,setShowAllProjects]=useState(false);
  const [confirmDeleteId,setConfirmDeleteId]=useState(null);

  const save=c=>{ if(saveClients) saveClients(c); else { localStorage.setItem("fisheyeClients_v1",JSON.stringify(c)); } };
  const add=()=>{
    // Use timestamp-based ID to avoid collisions after deletions
    const newId = `C-${Date.now().toString(36).toUpperCase()}`;
    save([...clients,{...nC,id:newId,status:"active",contacts:[],requestLog:[]}]);
    setShowAdd(false);
    setNC({name:"",region:"",email:"",notes:""});
  };
  const archive=id=>save(clients.map(c=>c.id===id?{...c,status:"archived"}:c));
  const unarchive=id=>save(clients.map(c=>c.id===id?{...c,status:"active"}:c));
  const deleteC=id=>{ save(clients.filter(c=>c.id!==id)); setConfirmDeleteId(null); if(openId===id) setOpenId(null); };
  const addContact=cid=>save(clients.map(c=>c.id===cid?{...c,contacts:[...(c.contacts||[]),{name:"New Contact",role:"",phone:""}]}:c));
  const updContact=(cid,ci,f,v)=>save(clients.map(c=>c.id===cid?{...c,contacts:c.contacts.map((co,i)=>i===ci?{...co,[f]:v}:co)}:c));
  const delContact=(cid,ci)=>save(clients.map(c=>c.id===cid?{...c,contacts:c.contacts.filter((_,i)=>i!==ci)}:c));
  const addRequest=(cid,req)=>save(clients.map(c=>c.id===cid?{...c,requestLog:[...c.requestLog,req]}:c));
  const updReqStatus=(cid,ri,st)=>save(clients.map(c=>c.id===cid?{...c,requestLog:c.requestLog.map((r,i)=>i===ri?{...r,status:st}:r)}:c));
  // Pre-compute health + headcount for ALL clients once — avoids re-computing inside map()
  // An employee with no Profit Mode set has, by definition, no margin math running for them at
  // all (Direct/Partner math both key off profitMode) — they contribute 0 SAR to any margin total
  // downstream (the CRM's "Fill from Fisheye Ops" / Financial Overview, this app's own Finance
  // tab) even though their contract is real and their salary is on file. That's an unreviewed
  // gap, not a real zero, so it's worth surfacing per-client rather than only discovering it by
  // opening every employee one at a time.
  const hasNoMarginData = e => !e.profitMode;
  const clientStats = useMemo(() => {
    const m = {};
    clients.forEach(c => {
      m[c.id] = {
        hc:       employees.filter(e => sameClientName(e.client, c.name) && !isExcluded(e)).length,
        noMargin: employees.filter(e => sameClientName(e.client, c.name) && !isExcluded(e) && hasNoMarginData(e)).length,
        health:   calcClientHealth(c.name, employees),
      };
    });
    return m;
  }, [clients, employees]);

  const displayed = useMemo(() =>
    clients.filter(c => {
      const matchFilter = filter === "all" || (filter === "archived" ? c.status === "archived" : c.status !== "archived");
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    }),
  [clients, filter, search]);

  const totalPending=clients.reduce((s,c)=>s+(c.requestLog||[]).filter(r=>r.status==="Pending").length,0);
  // PO issues: include expired (same as Action Center) — expired Sela employees still need PO for invoicing
  const isResignedEmp=e=>["resigned","resigned_ar","مستقيل"].includes((e.status||"").toLowerCase().trim());
  const totalPOIssues=employees.filter(e=>clientRequiresPO(e.client)&&!isResignedEmp(e)&&hasMissingPO(e)).length;
  const totalNoMargin=Object.values(clientStats).reduce((s,st)=>s+st.noMargin,0);
  const totalOverdue=clients.reduce((s,c)=>s+(c.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/(864e5))>5).length,0);

  // ── detail modal data ──
  const openClient=clients.find(c=>c.id===openId)||null;
  // Normalise potentially missing arrays on the client object
  const safeClient = openClient ? {
    ...openClient,
    contacts:   Array.isArray(openClient.contacts)   ? openClient.contacts   : [],
    requestLog: Array.isArray(openClient.requestLog) ? openClient.requestLog : [],
  } : null;
  const selEmps=safeClient?employees.filter(e=>sameClientName(e.client,safeClient.name)&&!isExcluded(e)):[];
  const selHealth=safeClient ? (clientStats[safeClient.id]?.health || calcClientHealth(safeClient.name,employees)) : null;
  const isSela=safeClient?.name==="Sela";
  // For PO tab: include expired (can't invoice without PO) — exclude only resigned
  const selEmpsForPO=safeClient?employees.filter(e=>sameClientName(e.client,safeClient.name)&&!isResignedEmp(e)):[];
  const missingPO=selEmpsForPO.filter(hasMissingPO);
  const hasPO=selEmpsForPO.filter(hasValidPO);
  const byProject=useMemo(()=>{const m={};selEmps.forEach(e=>{const p=e.project||"Unassigned";if(!m[p])m[p]=[];m[p].push(e);});return Object.entries(m).sort((a,b)=>b[1].length-a[1].length);},[selEmps]);
  const noMarginEmps=useMemo(()=>selEmps.filter(hasNoMarginData),[selEmps]);
  const pendingActions=safeClient?safeClient.requestLog.map((r,i)=>({...r,i,dw:Math.floor((Date.now()-new Date(r.ts))/864e5)})).filter(r=>r.status==="Pending").sort((a,b)=>b.dw-a.dw):[];

  // Sync local notes value when selected client changes
  useEffect(() => { setNotesVal(safeClient?.notes || ""); }, [openId]);

  const handleNotesChange = (val) => {
    setNotesVal(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      save(clients.map(c => c.id === openId ? { ...c, notes: val } : c));
    }, 500);
  };

  const TABS=[
    {k:"overview", l:"Overview"},
    {k:"actions",  l:`Actions${pendingActions.length?` (${pendingActions.length})`:""}`},
    {k:"projects", l:"Projects"},
    ...(isSela?[{k:"po",l:`PO${missingPO.length?` (${missingPO.length})`:""}`}]:[]),
    {k:"contacts", l:"Contacts"},
  ];

  return (
    <div style={{ display:"flex", height:"calc(100vh - 140px)", gap:0, backgroundColor:"#f3f4f6", borderRadius:16, border:"1px solid #e5e7eb", overflow:"hidden" }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width:256, flexShrink:0, display:"flex", flexDirection:"column", borderRight:"1px solid #e5e7eb", backgroundColor:"white" }}>

        {/* Sidebar header */}
        <div style={{ padding:"16px 16px 12px", background:`linear-gradient(135deg,${MD},${M})`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <Building2 size={16} style={{ color:"white" }}/>
              <span style={{ fontWeight:800, fontSize:15, color:"white", letterSpacing:"-0.01em" }}>Client Hub</span>
            </div>
            <button onClick={()=>setShowAdd(true)} title="Add Client" style={{ width:26, height:26, borderRadius:7, border:"1px solid rgba(255,255,255,0.35)", backgroundColor:"rgba(255,255,255,0.15)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
              <Plus size={13}/>
            </button>
          </div>
          {/* Mini KPI strip inside header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
            {[
              { l:"Clients",   v:clients.filter(c=>c.status==="active").length, alert:false },
              { l:"Pending",   v:totalPending,   alert:totalOverdue>0 },
              { l:"No PO",     v:totalPOIssues,  alert:totalPOIssues>0 },
              { l:"No Margin", v:totalNoMargin,  alert:totalNoMargin>0 },
            ].map(k => (
              <div key={k.l} style={{ backgroundColor:"rgba(255,255,255,0.13)", borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"rgba(255,210,210,0.85)", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{k.l}</div>
                <div style={{ fontSize:17, fontWeight:900, color:k.alert?"#fca5a5":"white", fontFamily:"monospace", lineHeight:1 }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding:"8px 10px", borderBottom:"1px solid #f3f4f6", display:"flex", gap:4 }}>
          {[["active","Active"],["archived","Archived"],["all","All"]].map(([k,l]) => (
            <button key={k} onClick={()=>setFilter(k)} style={{ flex:1, padding:"4px 0", border:"none", fontSize:10, fontWeight:700, cursor:"pointer", borderRadius:6, backgroundColor:filter===k?M:"#f3f4f6", color:filter===k?"white":"#9ca3af", transition:"all 0.12s" }}>{l}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding:"6px 10px", borderBottom:"1px solid #f3f4f6" }}>
          <div style={{ position:"relative" }}>
            <Search size={11} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", pointerEvents:"none" }}/>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search clients…"
              style={{ width:"100%", padding:"5px 8px 5px 24px", borderRadius:7, border:"1px solid #e5e7eb", fontSize:11, outline:"none", backgroundColor:"white", boxSizing:"border-box" }}
            />
          </div>
        </div>

        {/* Client list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {displayed.length===0 && (
            <div style={{ textAlign:"center", padding:"32px 16px", color:"#9ca3af" }}>
              <Building2 size={24} style={{ opacity:0.25, margin:"0 auto 8px", display:"block" }}/>
              <p style={{ fontSize:12, margin:0 }}>No clients</p>
            </div>
          )}
          {displayed.map(c => {
            const { hc, health, noMargin } = clientStats[c.id] || { hc: 0, health: { label: "—", color: "#9ca3af", score: 0 }, noMargin: 0 };
            const pending = (c.requestLog||[]).filter(r=>r.status==="Pending").length;
            const overdue = (c.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length;
            const isArchived = c.status === "archived";
            const meta = CLIENT_META[c.name] || {};
            const accentColor = isArchived ? "#d1d5db" : (meta.dot || M);
            const isSelected = openId === c.id;

            return (
              <div key={c.id}
                onClick={()=>{ setOpenId(c.id===openId?null:c.id); setDetailTab("overview"); setEditingInfo(false); }}
                style={{ padding:"10px 14px", cursor:"pointer", borderLeft:`3px solid ${isSelected?accentColor:"transparent"}`, backgroundColor:isSelected?`${accentColor}14`:"transparent", transition:"background 0.1s, border-color 0.1s", borderBottom:"1px solid #f9fafb" }}
                onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.backgroundColor="#f9fafb"; }}
                onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.backgroundColor="transparent"; }}>

                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  {/* Avatar */}
                  <div style={{ width:33, height:33, borderRadius:9, background:isArchived?"#e5e7eb":`linear-gradient(135deg,${MD},${M})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:11, flexShrink:0, opacity:isArchived?0.5:1 }}>
                    {c.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:isArchived?"#9ca3af":"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                      {!isArchived && <span style={{ width:6, height:6, borderRadius:"50%", backgroundColor:health.color, flexShrink:0, display:"inline-block" }}/>}
                      <span style={{ fontSize:10, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {isArchived ? "Archived" : `${hc} employees · ${health.label}`}
                      </span>
                    </div>
                  </div>
                  {/* Alert badges */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
                    {overdue>0 && <span style={{ fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:999, backgroundColor:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>{overdue}!</span>}
                    {pending>0 && overdue===0 && <span style={{ fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:999, backgroundColor:"#fffbeb", color:"#d97706", border:"1px solid #fde68a" }}>{pending}</span>}
                    {noMargin>0 && (
                      <span title={`${noMargin} employee${noMargin!==1?'s':''} with no Profit Mode/margin set`} style={{ fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:999, backgroundColor:"#faf5ff", color:"#7e22ce", border:"1px solid #e9d5ff" }}>{noMargin} no margin</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT DETAIL PANEL ── */}
      {!openClient ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
          <Building2 size={44} style={{ color:"#e5e7eb" }}/>
          <p style={{ fontSize:14, fontWeight:600, margin:0, color:"#9ca3af" }}>Select a client to view details</p>
          <p style={{ fontSize:11, margin:0, color:"#d1d5db" }}>{clients.filter(c=>c.status==="active").length} active clients</p>
        </div>
      ) : (
        <div key={`detail-${openId}`} style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", backgroundColor:"white" }}>

          {/* Detail Header */}
          <div style={{ padding:"18px 24px 14px", background:`linear-gradient(135deg,${MD},${M})`, flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              {editingInfo ? (
                <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1, marginRight:12 }}>
                  <input
                    autoFocus
                    value={infoForm.name}
                    onChange={e=>setInfoForm(f=>({...f,name:e.target.value}))}
                    placeholder="Client name"
                    style={{ fontSize:17, fontWeight:800, color:"white", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.35)", borderRadius:8, padding:"5px 10px", outline:"none", letterSpacing:"-0.01em", fontFamily:"inherit" }}
                  />
                  <div style={{ display:"flex", gap:7 }}>
                    <input
                      value={infoForm.region}
                      onChange={e=>setInfoForm(f=>({...f,region:e.target.value}))}
                      placeholder="Region"
                      style={{ flex:1, fontSize:12, color:"white", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:7, padding:"4px 9px", outline:"none", fontFamily:"inherit" }}
                    />
                    <input
                      value={infoForm.email}
                      onChange={e=>setInfoForm(f=>({...f,email:e.target.value}))}
                      placeholder="Email"
                      type="email"
                      style={{ flex:2, fontSize:12, color:"white", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:7, padding:"4px 9px", outline:"none", fontFamily:"inherit" }}
                    />
                  </div>
                  <input
                    value={infoForm.notes}
                    onChange={e=>setInfoForm(f=>({...f,notes:e.target.value}))}
                    placeholder="Notes…"
                    style={{ fontSize:12, color:"white", background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.20)", borderRadius:7, padding:"4px 9px", outline:"none", fontFamily:"inherit", width:"100%" }}
                  />
                </div>
              ) : (
                <div style={{ flex:1, minWidth:0 }}>
                  <h3 style={{ margin:0, fontSize:19, fontWeight:800, color:"white", letterSpacing:"-0.01em" }}>{safeClient.name}</h3>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"rgba(255,210,210,0.9)" }}>
                    {[safeClient.region, safeClient.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              )}
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {editingInfo ? (
                  <>
                    <button onClick={()=>{ if(infoForm.name.trim()) save(clients.map(c=>c.id===openId?{...c,...infoForm}:c)); setEditingInfo(false); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.5)", backgroundColor:"rgba(255,255,255,0.22)", color:"white", cursor:"pointer" }}>Save</button>
                    <button onClick={()=>setEditingInfo(false)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.2)", backgroundColor:"transparent", color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>{ setInfoForm({name:safeClient.name||"",region:safeClient.region||"",email:safeClient.email||"",notes:safeClient.notes||""}); setEditingInfo(true); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>safeClient.status==="archived"?unarchive(openId):archive(openId)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>
                      {safeClient.status==="archived" ? "Restore" : "Archive"}
                    </button>
                    <button onClick={()=>setConfirmDeleteId(openId)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,100,100,0.4)", backgroundColor:"rgba(255,100,100,0.15)", color:"#fca5a5", cursor:"pointer" }}>Delete</button>
                  </>
                )}
              </div>
            </div>
            {/* Health bar */}
            {selHealth && (
              <div style={{ marginTop:13 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:"rgba(255,210,210,0.85)", fontWeight:600 }}>Health Score</span>
                  <span style={{ fontSize:12, fontWeight:800, color:"white" }}>{selHealth.label} · {selHealth.score}/100</span>
                </div>
                <div style={{ height:5, backgroundColor:"rgba(255,255,255,0.2)", borderRadius:999, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${selHealth.score}%`, backgroundColor:"white", borderRadius:999 }}/>
                </div>
              </div>
            )}
          </div>

          {/* Quick stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", borderBottom:"1px solid #f3f4f6", flexShrink:0, backgroundColor:"white" }}>
            {[
              { l:"Employees",    v:selEmps.length,                                                               c:"#374151" },
              { l:"Expiring ≤30d",v:selEmps.filter(e=>{const d=daysUntil(e.endDate);return d>=0&&d<=30;}).length, c:"#d97706" },
              { l:"WF Pending",   v:selEmps.filter(e=>{ const wf=(e.workflowStatus||"").trim(); return wf && !isWFDone(wf); }).length, c:"#7c3aed" },
              { l:isSela?"Missing PO":"Projects", v:isSela?missingPO.length:byProject.length,                     c:isSela&&missingPO.length>0?"#dc2626":"#374151" },
            ].map(({l,v,c})=>(
              <div key={l} style={{ padding:"11px 8px", textAlign:"center", borderRight:"1px solid #f3f4f6" }}>
                <div style={{ fontSize:9, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:19, fontWeight:900, color:c, lineHeight:1 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6", flexShrink:0, overflowX:"auto", backgroundColor:"white" }}>
            {TABS.map(t=>(
              <button key={t.k} onClick={()=>setDetailTab(t.k)} style={{ padding:"10px 16px", fontSize:11, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, backgroundColor:"transparent", color:detailTab===t.k?M:"#9ca3af", borderBottom:`2px solid ${detailTab===t.k?M:"transparent"}`, transition:"color 0.1s" }}>{t.l}</button>
            ))}
            <div style={{ flex:1, display:"flex", justifyContent:"flex-end", alignItems:"center", padding:"0 16px" }}>
              <button onClick={()=>{
                setShowNewAction(true);
              }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:`1px solid ${M}`, backgroundColor:M, color:"white", cursor:"pointer" }}>
                + New Action
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ flex:1, overflowY:"auto", padding:"18px 24px" }}>

            {/* OVERVIEW */}
            {detailTab==="overview" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {noMarginEmps.length>0 && (
                  <div style={{ padding:"10px 14px", borderRadius:10, backgroundColor:"#faf5ff", border:"1px solid #e9d5ff" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#7e22ce", marginBottom:6 }}>
                      ⚠ {noMarginEmps.length} EMPLOYEE{noMarginEmps.length!==1?"S":""} WITH NO PROFIT MODE / MARGIN SET
                    </div>
                    <p style={{ fontSize:11, color:"#6b21a8", margin:"0 0 8px", lineHeight:1.5 }}>
                      These have a salary on file but no Direct/Partner terms — they count as 0 SAR margin everywhere
                      (this app's Finance tab, the CRM's Financial Overview) until a real Profit Mode + rate is set.
                    </p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {noMarginEmps.map(e=>(
                        <span key={e._id} style={{ fontSize:11, padding:"2px 8px", borderRadius:999, backgroundColor:"white", border:"1px solid #e9d5ff", color:"#6b21a8" }}>{e.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ padding:"10px 14px", borderRadius:10, backgroundColor:"#fefce8", border:"1px solid #fef9c3" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#854d0e", marginBottom:6 }}>NOTES</div>
                  <textarea
                    value={notesVal}
                    onChange={e=>handleNotesChange(e.target.value)}
                    placeholder="Add notes about this client…"
                    rows={3}
                    style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:12, color:"#374151", lineHeight:1.6, resize:"vertical", outline:"none", fontFamily:"inherit", padding:0, margin:0 }}
                  />
                </div>
                {(showAllProjects ? byProject : byProject.slice(0,4)).map(([prj,emps])=>(
                  <div key={prj} style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #f3f4f6", backgroundColor:"#f9fafb" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{prj}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:`${M}15`, color:M }}>{emps.length}</span>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {emps.slice(0,6).map(e=>{
                        const d=daysUntil(e.endDate);
                        const urg=d>=0&&d<=14;
                        return <span key={e._id} style={{ fontSize:11, padding:"2px 8px", borderRadius:999, backgroundColor:urg?"#fff7ed":"white", border:`1px solid ${urg?"#fed7aa":"#e5e7eb"}`, color:urg?"#c2410c":"#374151" }}>{e.name}{urg?` ⚠${d}d`:""}</span>;
                      })}
                      {emps.length>6 && <span style={{ fontSize:11, color:"#9ca3af" }}>+{emps.length-6}</span>}
                    </div>
                  </div>
                ))}
                {byProject.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"32px 0", fontSize:13 }}>No employees assigned.</p>}
                {byProject.length>4 && (
                  <button onClick={()=>setShowAllProjects(v=>!v)} style={{ fontSize:11, fontWeight:700, color:M, background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>
                    {showAllProjects ? "▲ Show less" : `▼ Show all ${byProject.length} projects`}
                  </button>
                )}
              </div>
            )}

            {/* ACTIONS */}
            {detailTab==="actions" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {/* Filter pills */}
                {(() => {
                  const allActions = safeClient.requestLog.map((r,i)=>({...r,i,dw:Math.floor((Date.now()-new Date(r.ts))/864e5)}));
                  const pendingCnt = allActions.filter(r=>r.status==="Pending").length;
                  const completedCnt = allActions.filter(r=>r.status==="Completed").length;
                  const shown = actionsFilter==="all" ? allActions : allActions.filter(r=>r.status===(actionsFilter==="pending"?"Pending":"Completed"));
                  return (
                    <>
                      <div style={{ display:"flex", gap:5, marginBottom:2 }}>
                        {[["pending",`Pending · ${pendingCnt}`],["completed",`Completed · ${completedCnt}`],["all","All"]].map(([k,l])=>(
                          <button key={k} onClick={()=>setActionsFilter(k)} style={{ padding:"4px 11px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", border:`1.5px solid ${actionsFilter===k?M:"#e5e7eb"}`, backgroundColor:actionsFilter===k?`${M}10`:"white", color:actionsFilter===k?M:"#6b7280" }}>{l}</button>
                        ))}
                      </div>
                      {shown.length===0 && (
                        <div style={{ textAlign:"center", padding:"32px 0" }}>
                          <CheckCircle size={28} style={{ margin:"0 auto 8px", display:"block", color:"#16a34a", opacity:0.4 }}/>
                          <p style={{ fontWeight:600, fontSize:13, color:"#374151", margin:"0 0 4px" }}>No {actionsFilter==="all"?"":actionsFilter} actions</p>
                        </div>
                      )}
                      {shown.map(r=>(
                        <div key={r.i} style={{ padding:"12px 14px", borderRadius:12, border:`1px solid ${r.status==="Completed"?"#bbf7d0":r.dw>5?"#fecaca":"#f3f4f6"}`, backgroundColor:r.status==="Completed"?"#f0fdf4":r.dw>5?"#fef2f2":"#f9fafb", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#e0f2fe", color:"#0369a1" }}>{r.type}</span>
                              {r.status==="Pending" && r.dw>5 && <span style={{ fontSize:10, fontWeight:700, color:"#dc2626" }}>⚠ Delayed {r.dw}d</span>}
                              {r.status==="Completed" && <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#dcfce7", color:"#166534" }}>✓ Done</span>}
                            </div>
                            <p style={{ fontWeight:600, fontSize:13, margin:"0 0 2px", color:"#1f2937" }}>{r.employee}</p>
                            <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>
                              {new Date(r.ts).toLocaleDateString("en-GB")}
                              {r.status==="Pending" && r.dw>0 && <span style={{ marginLeft:6, fontWeight:700, color:r.dw>5?"#dc2626":"#d97706" }}>· {r.dw}d waiting</span>}
                            </p>
                          </div>
                          {r.status==="Pending" && (
                            <button onClick={()=>updReqStatus(safeClient.id,r.i,"Completed")} style={{ fontSize:11, fontWeight:700, padding:"5px 10px", borderRadius:8, border:"1px solid #bbf7d0", backgroundColor:"#f0fdf4", color:"#16a34a", cursor:"pointer", whiteSpace:"nowrap" }}>✓ Done</button>
                          )}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}

            {/* PROJECTS */}
            {detailTab==="projects" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {byProject.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"32px 0", fontSize:13 }}>No employees assigned.</p>}
                {byProject.map(([prj,emps])=>(
                  <div key={prj}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{prj}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:999, backgroundColor:`${M}15`, color:M }}>{emps.length} employees</span>
                    </div>
                    {emps.map(e=>{
                      const d=daysUntil(e.endDate);
                      const urg=d>=0&&d<=30;
                      return (
                        <div key={e._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:9, border:`1px solid ${urg?"#fed7aa":"#f3f4f6"}`, backgroundColor:urg?"#fffbf5":"#f9fafb", marginBottom:4 }}>
                          <div>
                            <span style={{ fontSize:12, fontWeight:600, color:"#1f2937" }}>{e.name}</span>
                            <span style={{ fontSize:11, color:"#9ca3af", marginLeft:7 }}>{e.position||"—"}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <WFBadge status={e.workflowStatus}/>
                            <span style={{ fontSize:11, fontWeight:600, color:urg?"#d97706":d<0?"#9ca3af":"#374151" }}>{d<0?"Expired":urg?`⚠ ${d}d`:fmt(e.endDate)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* PO (Sela only) */}
            {detailTab==="po" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ padding:"14px", borderRadius:11, border:"1px solid #bbf7d0", backgroundColor:"#f0fdf4", textAlign:"center" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#16a34a", marginBottom:4 }}>Has PO</div>
                    <div style={{ fontSize:26, fontWeight:900, color:"#16a34a" }}>{hasPO.length}</div>
                  </div>
                  <div style={{ padding:"14px", borderRadius:11, border:`1px solid ${missingPO.length>0?"#fecaca":"#e5e7eb"}`, backgroundColor:missingPO.length>0?"#fef2f2":"#f9fafb", textAlign:"center" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:missingPO.length>0?"#dc2626":"#9ca3af", marginBottom:4 }}>Missing PO</div>
                    <div style={{ fontSize:26, fontWeight:900, color:missingPO.length>0?"#dc2626":"#9ca3af" }}>{missingPO.length}</div>
                  </div>
                </div>
                {missingPO.map(e=>(
                  <div key={e._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 13px", borderRadius:10, backgroundColor:"#fef2f2", border:"1px solid #fecaca" }}>
                    <div>
                      <span style={{ fontSize:12, fontWeight:600, color:"#1f2937" }}>{e.name}</span>
                      <span style={{ fontSize:11, color:"#9ca3af", marginLeft:7 }}>{e.project||"—"}</span>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:"#dc2626", padding:"2px 8px", borderRadius:999, backgroundColor:"#fee2e2" }}>No PO</span>
                  </div>
                ))}
                {hasPO.length>0 && (
                  <details>
                    <summary style={{ fontSize:11, color:"#9ca3af", cursor:"pointer", fontWeight:600 }}>{hasPO.length} with PO ▸</summary>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:8 }}>
                      {hasPO.map(e=>(
                        <div key={e._id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:9, backgroundColor:"#f0fdf4", border:"1px solid #bbf7d0" }}>
                          <span style={{ fontSize:12, fontWeight:600, color:"#1f2937" }}>{e.name}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:"#16a34a" }}>PO: {e.poNumbers}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* CONTACTS */}
            {detailTab==="contacts" && (
              <div>
                <div style={{ ...s.flexBetween, marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Contacts ({safeClient.contacts.length})</span>
                  <button onClick={()=>addContact(safeClient.id)} style={{ fontSize:11, fontWeight:700, color:M, background:"none", border:"none", cursor:"pointer" }}>+ Add</button>
                </div>
                {safeClient.contacts.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"24px 0", fontSize:13 }}>No contacts yet.</p>}
                {safeClient.contacts.map((co,ci)=>(
                  <div key={ci} style={{ display:"flex", alignItems:"center", gap:10, padding:10, borderRadius:10, backgroundColor:"#f9fafb", marginBottom:6, border:"1px solid #f3f4f6" }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${MD},${M})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13, fontWeight:700, flexShrink:0 }}>{(co.name||"?")[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <input value={co.name} onChange={e=>updContact(safeClient.id,ci,"name",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:12, fontWeight:600, outline:"none" }}/>
                      <input value={co.role} onChange={e=>updContact(safeClient.id,ci,"role",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:11, color:"#9ca3af", outline:"none" }}/>
                    </div>
                    <input value={co.phone} onChange={e=>updContact(safeClient.id,ci,"phone",e.target.value)} style={{ width:130, border:"none", backgroundColor:"transparent", fontSize:11, textAlign:"right", outline:"none", direction:"ltr" }}/>
                    {co.phone && (
                      <button onClick={()=>{ const msg=`مرحباً ${co.name},\n\nأتواصل معك بخصوص ${safeClient.name}.\n\nتحياتي`; window.open(`https://wa.me/${co.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank"); }} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:30, height:30, borderRadius:8, border:"1px solid #16a34a", backgroundColor:"white", color:"#16a34a", cursor:"pointer", flexShrink:0 }}>
                        <MessageCircle size={13}/>
                      </button>
                    )}
                    <button onClick={()=>delContact(safeClient.id,ci)} title="Remove contact" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:26, height:26, borderRadius:7, border:"1px solid #fecaca", backgroundColor:"#fff5f5", color:"#ef4444", cursor:"pointer", flexShrink:0 }}>
                      <X size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <Modal title="Add Client" onClose={()=>setShowAdd(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Inp label="Company Name" value={nC.name} onChange={v=>setNC(c=>({...c,name:v}))}/>
            <div style={s.grid2}>
              <Inp label="Region" value={nC.region} onChange={v=>setNC(c=>({...c,region:v}))}/>
              <Inp label="Email"  value={nC.email}  onChange={v=>setNC(c=>({...c,email:v}))}/>
            </div>
            <Inp label="Notes" value={nC.notes} onChange={v=>setNC(c=>({...c,notes:v}))}/>
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)} full>Cancel</Btn>
              <Btn onClick={add} disabled={!nC.name} full style={{ backgroundColor:M, color:"white" }}><Plus size={14}/> Add Client</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* New Action Modal */}
      {showNewAction && safeClient && (
        <Modal title={`New Action · ${safeClient.name}`} onClose={()=>{ setShowNewAction(false); setNewAction({desc:"",type:"Invoice"}); }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={s.label}>Type</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:4 }}>
                {["Invoice","Contract Update","Approval","Payment","Other"].map(t=>(
                  <button key={t} onClick={()=>setNewAction(a=>({...a,type:t}))} style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", border:`1.5px solid ${newAction.type===t?M:"#e5e7eb"}`, backgroundColor:newAction.type===t?`${M}12`:"white", color:newAction.type===t?M:"#6b7280" }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={s.label}>Description</label>
              <textarea
                autoFocus
                value={newAction.desc}
                onChange={e=>setNewAction(a=>({...a,desc:e.target.value}))}
                placeholder="Describe the action…"
                rows={3}
                style={{ ...s.inp, resize:"vertical", marginTop:4 }}
              />
            </div>
            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <Btn variant="ghost" onClick={()=>{ setShowNewAction(false); setNewAction({desc:"",type:"Invoice"}); }} full>Cancel</Btn>
              <Btn onClick={()=>{
                if(!newAction.desc.trim()) return;
                addRequest(safeClient.id,{ ts:new Date().toISOString(), type:newAction.type, employee:newAction.desc, status:"Pending" });
                setShowNewAction(false);
                setNewAction({desc:"",type:"Invoice"});
                setDetailTab("actions");
              }} disabled={!newAction.desc.trim()} full style={{ backgroundColor:M, color:"white" }}>
                <Plus size={14}/> Add Action
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <Modal title="Delete Client?" onClose={()=>setConfirmDeleteId(null)}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ margin:0, fontSize:13, color:"#374151" }}>
              هتتحذف بيانات الـ client دي نهائياً. مش ممكن تتراجعي.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" onClick={()=>setConfirmDeleteId(null)} full>Cancel</Btn>
              <Btn onClick={()=>deleteC(confirmDeleteId)} full style={{ backgroundColor:"#dc2626", color:"white" }}>
                Delete
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PARTNER HUB ────────────────────────────────────────────────────────
const DEF_PARTNERS=[
  {id:"P-01",name:"Safwa HR Solutions",  partnerType:"operational", region:"Riyadh",           email:"ops@safwa-hr.sa",      status:"active",contacts:[{name:"Mohammed Al-Ghamdi",role:"Operations",phone:"+966501111111"},{name:"Sara Al-Harbi",role:"Gov. Relations",phone:"+966502222222"}],notes:"Primary partner for Sela projects.",requestLog:[{ts:"2026-04-20T09:00:00Z",type:"Handover",employee:"Ahmed Al-Zahrani",status:"Completed"},{ts:"2026-04-28T11:00:00Z",type:"Docs Request",employee:"Fahad Mubarak",status:"Pending"}]},
  {id:"P-02",name:"Gulf Staffing Group", partnerType:"operational", region:"Eastern Province",  email:"admin@gulfstaffing.sa",status:"active",contacts:[{name:"Faisal Al-Dosari",role:"Finance",phone:"+966503333333"},{name:"Nour Khalid",role:"HR Manager",phone:"+966504444444"}],notes:"Handles SPL workforce.",requestLog:[{ts:"2026-04-25T14:00:00Z",type:"Handover",employee:"Sara Mohammed",status:"Completed"}]},
  {id:"P-03",name:"Blue Cube",           partnerType:"commission",  region:"Riyadh",           email:"",                     status:"active",contacts:[],notes:"Commission-only partner — no operational involvement.",requestLog:[]},
];

function PartnerHub({ employees, partners, savePartners }) {
  if (!partners) partners = [];
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("active");
  const [typeFilter,setTypeFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [openId,setOpenId]=useState(null);
  const [detailTab,setDetailTab]=useState("overview");
  const [editingInfo,setEditingInfo]=useState(false);
  const [infoForm,setInfoForm]=useState({name:"",region:"",email:"",notes:"",partnerType:""});
  const [nP,setNP]=useState({name:"",region:"",email:"",notes:"",partnerType:"operational"});
  const [showNewAction,setShowNewAction]=useState(false);
  const [newAction,setNewAction]=useState({desc:"",type:"Handover"});
  const [confirmDeleteId,setConfirmDeleteId]=useState(null);
  const [actionsFilter,setActionsFilter]=useState("pending");
  const [notesVal,setNotesVal]=useState("");
  const notesTimer=useRef(null);

  const save=p=>{ if(savePartners) savePartners(p); else { localStorage.setItem("fisheyePartners_v1",JSON.stringify(p)); } };
  const add=()=>{
    const newId=`P-${Date.now().toString(36).toUpperCase()}`;
    save([...partners,{...nP,id:newId,status:"active",contacts:[],requestLog:[]}]);
    setShowAdd(false); setNP({name:"",region:"",email:"",notes:""});
  };
  const archive=id=>save(partners.map(p=>p.id===id?{...p,status:"archived"}:p));
  const unarchive=id=>save(partners.map(p=>p.id===id?{...p,status:"active"}:p));
  const deleteP=id=>{ save(partners.filter(p=>p.id!==id)); setConfirmDeleteId(null); if(openId===id) setOpenId(null); };
  const addContact=pid=>save(partners.map(p=>p.id===pid?{...p,contacts:[...(p.contacts||[]),{name:"New Contact",role:"",phone:""}]}:p));
  const updContact=(pid,ci,f,v)=>save(partners.map(p=>p.id===pid?{...p,contacts:p.contacts.map((c,i)=>i===ci?{...c,[f]:v}:c)}:p));
  const delContact=(pid,ci)=>save(partners.map(p=>p.id===pid?{...p,contacts:p.contacts.filter((_,i)=>i!==ci)}:p));
  const addRequest=(pid,req)=>save(partners.map(p=>p.id===pid?{...p,requestLog:[...(p.requestLog||[]),req]}:p));
  const updReqStatus=(pid,ri,st)=>save(partners.map(p=>p.id===pid?{...p,requestLog:p.requestLog.map((r,i)=>i===ri?{...r,status:st}:r)}:p));
  const getLinked=pid=>{const p=partners.find(x=>x.id===pid);if(!p)return[];return employees.filter(e=>!isExcluded(e)&&e.profitMode==="partner"&&(e.partnerAssigned===p.id||e.partnerAssigned===p.name));};

  // Pre-compute linked count + health for ALL partners (H1 + H4)
  const partnerStats=useMemo(()=>{
    const m={};
    partners.forEach(p=>{
      const linked=employees.filter(e=>!isExcluded(e)&&e.profitMode==="partner"&&(e.partnerAssigned===p.id||e.partnerAssigned===p.name));
      let score=100;
      if(linked.length){
        const total=linked.length;
        const expiring=linked.filter(e=>{const d=daysUntil(e.endDate);return d>=0&&d<=30;}).length;
        score-=Math.round((expiring/total)*40);
        const wfPending=linked.filter(e=>!isWFDone(e.workflowStatus)).length;
        score-=Math.round((wfPending/total)*30);
        const overdue=(p.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length;
        if(overdue>0) score-=Math.min(30,overdue*10);
        score=Math.max(0,Math.min(100,score));
      }
      const label=score>=80?"On Track":score>=60?"At Risk":score>=40?"Warning":"Critical";
      const color=score>=80?"#16a34a":score>=60?"#d97706":score>=40?"#dc2626":"#7f1d1d";
      m[p.id]={linked,score,label,color};
    });
    return m;
  },[partners,employees]);

  const displayed=useMemo(()=>partners.filter(p=>{
    const matchFilter=filter==="all"||(filter==="archived"?p.status==="archived":p.status!=="archived");
    const matchType=typeFilter==="all"||p.partnerType===typeFilter;
    const matchSearch=!search||p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter&&matchType&&matchSearch;
  }),[partners,filter,typeFilter,search]);

  // ── Global stats ──
  const totalPending=partners.reduce((s,p)=>s+(p.requestLog||[]).filter(r=>r.status==="Pending").length,0);
  const totalOverdue=partners.reduce((s,p)=>s+(p.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length,0);
  const totalAssigned=employees.filter(e=>e.partnerAssigned&&e.profitMode==="partner"&&!isExcluded(e)).length;
  const totalExpiring=employees.filter(e=>e.partnerAssigned&&e.profitMode==="partner"&&!isExcluded(e)&&(d=>d>=0&&d<=30)(daysUntil(e.endDate))).length;

  // ── Detail modal data ──
  const openPartner=partners.find(p=>p.id===openId)||null;
  const safePartner=openPartner?{
    ...openPartner,
    contacts:  Array.isArray(openPartner.contacts)  ?openPartner.contacts  :[],
    requestLog:Array.isArray(openPartner.requestLog)?openPartner.requestLog:[],
  }:null;
  const linkedEmps=safePartner?(partnerStats[safePartner.id]?.linked||getLinked(safePartner.id)):[];
  const expiringLinked=linkedEmps.filter(e=>{const d=daysUntil(e.endDate);return d>=0&&d<=30;}).length;
  const pendingActions=safePartner?safePartner.requestLog.map((r,i)=>({...r,i,dw:Math.floor((Date.now()-new Date(r.ts))/864e5)})).filter(r=>r.status==="Pending").sort((a,b)=>b.dw-a.dw):[];
  const completedCount=safePartner?safePartner.requestLog.filter(r=>r.status==="Completed").length:0;
  const totalActions=safePartner?safePartner.requestLog.length:0;
  const completionRate=totalActions>0?Math.round((completedCount/totalActions)*100):null;
  const completionLabel=completionRate!==null?`${completionRate}% (${completedCount}/${totalActions})`:"—";

  // Sync notes val when partner changes
  useEffect(()=>{ setNotesVal(safePartner?.notes||""); },[openId]);
  const handleNotesChange=val=>{
    setNotesVal(val);
    clearTimeout(notesTimer.current);
    notesTimer.current=setTimeout(()=>{
      save(partners.map(p=>p.id===openId?{...p,notes:val}:p));
    },500);
  };

  // Employees by client
  const byClient=useMemo(()=>{
    const m={};
    linkedEmps.forEach(e=>{const c=e.client||"No Client";if(!m[c])m[c]=[];m[c].push(e);});
    return Object.entries(m).sort((a,b)=>b[1].length-a[1].length);
  },[linkedEmps]);

  // Workflow breakdown
  const wfBreakdown=useMemo(()=>{
    const m={};
    linkedEmps.forEach(e=>{const w=e.workflowStatus||"Unknown";if(!m[w])m[w]=0;m[w]++;});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[linkedEmps]);

  // Employees sorted by urgency: expiring soonest first, then expired, then rest
  const sortedLinkedEmps=useMemo(()=>[...linkedEmps].sort((a,b)=>{
    const da=daysUntil(a.endDate); const db=daysUntil(b.endDate);
    // Active & expiring first (d≥0), most urgent first
    if(da>=0&&db>=0) return da-db;
    if(da>=0) return -1;
    if(db>=0) return 1;
    // Both expired — most recently expired first
    return db-da;
  }),[linkedEmps]);

  const TABS=[
    {k:"overview",  l:"Overview"},
    {k:"actions",   l:`Actions${pendingActions.length?` (${pendingActions.length})`:""}`},
    {k:"employees", l:`Employees${linkedEmps.length?` (${linkedEmps.length})`:""}`},
    {k:"contacts",  l:"Contacts"},
  ];

  const PU="linear-gradient(135deg,#4c1d95,#7c3aed)";
  const PC="#7c3aed";

  // partner health score (simple)
  const calcPartnerHealth=(pid)=>{
    const linked=getLinked(pid);
    if(!linked.length)return{score:100,label:"No Data",color:"#9ca3af"};
    let score=100;
    const total=linked.length;
    const expiring=linked.filter(e=>{const d=daysUntil(e.endDate);return d>=0&&d<=14;}).length;
    score-=Math.round((expiring/total)*40);
    const wfPending=linked.filter(e=>!isWFDone(e.workflowStatus)).length;
    score-=Math.round((wfPending/total)*30);
    const p=partners.find(x=>x.id===pid);
    const overdue=(p?.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length;
    if(overdue>0)score-=Math.min(30,overdue*10);
    score=Math.max(0,Math.min(100,score));
    const label=score>=80?"On Track":score>=60?"At Risk":score>=40?"Warning":"Critical";
    const color=score>=80?"#16a34a":score>=60?"#d97706":score>=40?"#dc2626":"#7f1d1d";
    return{score,label,color};
  };

  return (
    <div style={{ display:"flex", height:"calc(100vh - 140px)", gap:0, backgroundColor:"#f3f4f6", borderRadius:16, border:"1px solid #e5e7eb", overflow:"hidden" }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width:256, flexShrink:0, display:"flex", flexDirection:"column", borderRight:"1px solid #e5e7eb", backgroundColor:"white" }}>

        {/* Sidebar header */}
        <div style={{ padding:"16px 16px 12px", background:PU, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <Users size={16} style={{ color:"white" }}/>
              <span style={{ fontWeight:800, fontSize:15, color:"white", letterSpacing:"-0.01em" }}>Partner Hub</span>
            </div>
            <button onClick={()=>setShowAdd(true)} title="Add Partner" style={{ width:26, height:26, borderRadius:7, border:"1px solid rgba(255,255,255,0.35)", backgroundColor:"rgba(255,255,255,0.15)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
              <Plus size={13}/>
            </button>
          </div>
          {/* Mini KPI strip */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            {[
              { l:"Partners", v:partners.filter(p=>p.status==="active").length, alert:false },
              { l:"Pending",  v:totalPending,  alert:totalOverdue>0 },
              { l:"Expiring", v:totalExpiring, alert:totalExpiring>0 },
            ].map(k => (
              <div key={k.l} style={{ backgroundColor:"rgba(255,255,255,0.13)", borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"rgba(220,200,255,0.85)", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{k.l}</div>
                <div style={{ fontSize:17, fontWeight:900, color:k.alert?"#fca5a5":"white", fontFamily:"monospace", lineHeight:1 }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding:"8px 10px", borderBottom:"1px solid #f3f4f6", display:"flex", gap:4 }}>
          {[["active","Active"],["archived","Archived"],["all","All"]].map(([k,l]) => (
            <button key={k} onClick={()=>setFilter(k)} style={{ flex:1, padding:"4px 0", border:"none", fontSize:10, fontWeight:700, cursor:"pointer", borderRadius:6, backgroundColor:filter===k?PC:"#f3f4f6", color:filter===k?"white":"#9ca3af", transition:"all 0.12s" }}>{l}</button>
          ))}
        </div>
        <div style={{ padding:"6px 10px", borderBottom:"1px solid #f3f4f6" }}>
          <div style={{ position:"relative" }}>
            <Search size={11} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", pointerEvents:"none" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search partners…"
              style={{ width:"100%", padding:"5px 8px 5px 24px", borderRadius:7, border:"1px solid #e5e7eb", fontSize:11, outline:"none", backgroundColor:"white", boxSizing:"border-box" }}/>
          </div>
        </div>
        {/* Type filter pills */}
        <div style={{ padding:"6px 10px", borderBottom:"1px solid #f3f4f6", display:"flex", gap:4 }}>
          {[["all","All"],["operational","Operational"],["commission","Commission"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTypeFilter(k)} style={{ flex:1, padding:"4px 0", border:"none", fontSize:9, fontWeight:700, cursor:"pointer", borderRadius:6, backgroundColor:typeFilter===k?PC:"#f3f4f6", color:typeFilter===k?"white":"#9ca3af", transition:"all 0.12s", whiteSpace:"nowrap" }}>{l}</button>
          ))}
        </div>

        {/* Partner list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {displayed.length===0 && (
            <div style={{ textAlign:"center", padding:"32px 16px", color:"#9ca3af" }}>
              <Users size={24} style={{ opacity:0.25, margin:"0 auto 8px", display:"block" }}/>
              <p style={{ fontSize:12, margin:0 }}>No partners</p>
            </div>
          )}
          {displayed.map(p => {
            const {linked,label:healthLabel,color:healthColor}=partnerStats[p.id]||{linked:[],label:"—",color:"#9ca3af"};
            const pending = (p.requestLog||[]).filter(r=>r.status==="Pending").length;
            const overdue = (p.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length;
            const isArchived = p.status === "archived";
            const isSelected = openId === p.id;

            return (
              <div key={p.id}
                onClick={()=>{ setOpenId(p.id===openId?null:p.id); setDetailTab("overview"); setEditingInfo(false); }}
                style={{ padding:"10px 14px", cursor:"pointer", borderLeft:`3px solid ${isSelected?PC:"transparent"}`, backgroundColor:isSelected?`${PC}14`:"transparent", transition:"background 0.1s, border-color 0.1s", borderBottom:"1px solid #f9fafb" }}
                onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.backgroundColor="#f9fafb"; }}
                onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.backgroundColor="transparent"; }}>

                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:33, height:33, borderRadius:9, background:isArchived?"#e5e7eb":PU, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:11, flexShrink:0, opacity:isArchived?0.5:1 }}>
                    {p.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:isArchived?"#9ca3af":"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                      {!isArchived && <span style={{ width:6, height:6, borderRadius:"50%", backgroundColor:healthColor, flexShrink:0, display:"inline-block" }}/>}
                      <span style={{ fontSize:10, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {isArchived ? "Archived" : `${linked.length} employees · ${healthLabel}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
                    {overdue>0 && <span style={{ fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:999, backgroundColor:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>{overdue}!</span>}
                    {pending>0 && overdue===0 && <span style={{ fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:999, backgroundColor:"#ede9fe", color:"#6d28d9", border:"1px solid #ddd6fe" }}>{pending}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT DETAIL PANEL ── */}
      {!openPartner ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
          <Users size={44} style={{ color:"#e5e7eb" }}/>
          <p style={{ fontSize:14, fontWeight:600, margin:0, color:"#9ca3af" }}>Select a partner to view details</p>
          <p style={{ fontSize:11, margin:0, color:"#d1d5db" }}>{partners.filter(p=>p.status==="active").length} active partners</p>
        </div>
      ) : (
        <div key={`detail-${openId}`} style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", backgroundColor:"white" }}>

          {/* Detail Header */}
          <div style={{ padding:"18px 24px 14px", background:PU, flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              {editingInfo ? (
                <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1, marginRight:12 }}>
                  <input
                    autoFocus
                    value={infoForm.name}
                    onChange={e=>setInfoForm(f=>({...f,name:e.target.value}))}
                    placeholder="Partner name"
                    style={{ fontSize:17, fontWeight:800, color:"white", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.35)", borderRadius:8, padding:"5px 10px", outline:"none", letterSpacing:"-0.01em", fontFamily:"inherit" }}
                  />
                  <div style={{ display:"flex", gap:7 }}>
                    <input value={infoForm.region} onChange={e=>setInfoForm(f=>({...f,region:e.target.value}))} placeholder="Region" style={{ flex:1, fontSize:12, color:"white", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:7, padding:"4px 9px", outline:"none", fontFamily:"inherit" }}/>
                    <input value={infoForm.email} onChange={e=>setInfoForm(f=>({...f,email:e.target.value}))} placeholder="Email" type="email" style={{ flex:2, fontSize:12, color:"white", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:7, padding:"4px 9px", outline:"none", fontFamily:"inherit" }}/>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {["operational","commission"].map(t=>(
                      <button key={t} onClick={()=>setInfoForm(f=>({...f,partnerType:t}))} style={{ flex:1, padding:"4px 8px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", border:`1px solid ${infoForm.partnerType===t?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.2)"}`, backgroundColor:infoForm.partnerType===t?"rgba(255,255,255,0.25)":"transparent", color:"white", textTransform:"capitalize" }}>{t}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ flex:1, minWidth:0 }}>
                  <h3 style={{ margin:0, fontSize:19, fontWeight:800, color:"white", letterSpacing:"-0.01em" }}>{safePartner.name}</h3>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"rgba(220,200,255,0.9)" }}>
                    {[safePartner.region, safePartner.email].filter(Boolean).join(" · ") || "—"}
                    {safePartner.partnerType && <span style={{ marginLeft:8, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999, backgroundColor:"rgba(255,255,255,0.18)", color:"white" }}>{safePartner.partnerType}</span>}
                  </p>
                </div>
              )}
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {editingInfo ? (
                  <>
                    <button onClick={()=>{ if(infoForm.name.trim()) save(partners.map(p=>p.id===openId?{...p,...infoForm}:p)); setEditingInfo(false); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.5)", backgroundColor:"rgba(255,255,255,0.22)", color:"white", cursor:"pointer" }}>Save</button>
                    <button onClick={()=>setEditingInfo(false)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.2)", backgroundColor:"transparent", color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>{ setInfoForm({name:safePartner.name||"",region:safePartner.region||"",email:safePartner.email||"",notes:safePartner.notes||"",partnerType:safePartner.partnerType||"operational"}); setEditingInfo(true); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>safePartner.status==="archived"?unarchive(openId):archive(openId)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>
                      {safePartner.status==="archived" ? "Restore" : "Archive"}
                    </button>
                    <button onClick={()=>setConfirmDeleteId(openId)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,100,100,0.4)", backgroundColor:"rgba(255,100,100,0.15)", color:"#fca5a5", cursor:"pointer" }}>Delete</button>
                  </>
                )}
              </div>
            </div>
            {/* Performance bar — uses pre-computed partnerStats */}
            {(()=>{ const h=partnerStats[safePartner.id]||{score:100,label:"No Data"}; return (
              <div style={{ marginTop:13 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:"rgba(220,200,255,0.85)", fontWeight:600 }}>Performance</span>
                  <span style={{ fontSize:12, fontWeight:800, color:"white" }}>{h.label} · {h.score}/100</span>
                </div>
                <div style={{ height:5, backgroundColor:"rgba(255,255,255,0.2)", borderRadius:999, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${h.score}%`, backgroundColor:"white", borderRadius:999 }}/>
                </div>
              </div>
            ); })()}
          </div>

          {/* Quick stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", borderBottom:"1px solid #f3f4f6", flexShrink:0, backgroundColor:"white" }}>
            {[
              { l:"Headcount",    v:linkedEmps.length,                                                             c:PC },
              { l:"Expiring ≤30d",v:expiringLinked,                                                                c:expiringLinked>0?"#d97706":"#374151" },
              { l:"WF Pending",   v:linkedEmps.filter(e=>{const wf=(e.workflowStatus||"").trim();return wf&&!isWFDone(wf);}).length, c:"#dc2626" },
              { l:"Completion",   v:completionLabel,                                                                c:completionRate===null?"#9ca3af":completionRate>=80?"#16a34a":"#d97706" },
            ].map(({l,v,c})=>(
              <div key={l} style={{ padding:"11px 8px", textAlign:"center", borderRight:"1px solid #f3f4f6" }}>
                <div style={{ fontSize:9, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:l==="Completion"?12:19, fontWeight:900, color:c, lineHeight:1 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6", flexShrink:0, overflowX:"auto", backgroundColor:"white" }}>
            {TABS.map(t=>(
              <button key={t.k} onClick={()=>setDetailTab(t.k)} style={{ padding:"10px 16px", fontSize:11, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, backgroundColor:"transparent", color:detailTab===t.k?PC:"#9ca3af", borderBottom:`2px solid ${detailTab===t.k?PC:"transparent"}`, transition:"color 0.1s" }}>{t.l}</button>
            ))}
            <div style={{ flex:1, display:"flex", justifyContent:"flex-end", alignItems:"center", padding:"0 16px" }}>
              <button onClick={()=>setShowNewAction(true)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:`1px solid ${PC}`, backgroundColor:PC, color:"white", cursor:"pointer" }}>
                + New Action
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ flex:1, overflowY:"auto", padding:"18px 24px" }}>

            {/* OVERVIEW */}
            {detailTab==="overview" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* Editable notes */}
                <div style={{ padding:"10px 14px", borderRadius:10, backgroundColor:"#faf5ff", border:"1px solid #e9d5ff" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#6b21a8", marginBottom:6 }}>NOTES</div>
                  <textarea
                    value={notesVal}
                    onChange={e=>handleNotesChange(e.target.value)}
                    placeholder="Add notes about this partner…"
                    rows={3}
                    style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:12, color:"#374151", lineHeight:1.6, resize:"vertical", outline:"none", fontFamily:"inherit", padding:0, margin:0 }}
                  />
                </div>
                {/* Workflow breakdown */}
                {wfBreakdown.length>0 && (
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", margin:"0 0 8px" }}>Workflow Breakdown</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {wfBreakdown.map(([wf,count])=>(
                        <div key={wf} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                              <WFBadge status={wf}/>
                              <span style={{ fontSize:11, fontWeight:700, color:"#374151" }}>{count}</span>
                            </div>
                            <div style={{ height:4, backgroundColor:"#f3f4f6", borderRadius:999, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${Math.round((count/linkedEmps.length)*100)}%`, backgroundColor:PC, borderRadius:999 }}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* By client */}
                {byClient.map(([client,emps])=>(
                  <div key={client} style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #f3f4f6", backgroundColor:"#f9fafb" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{client}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#ede9fe", color:PC }}>{emps.length}</span>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {emps.slice(0,6).map(e=>{ const d=daysUntil(e.endDate); const urg=d>=0&&d<=14; return <span key={e._id} style={{ fontSize:11, padding:"2px 8px", borderRadius:999, backgroundColor:urg?"#fff7ed":"white", border:`1px solid ${urg?"#fed7aa":"#e5e7eb"}`, color:urg?"#c2410c":"#374151" }}>{e.name}{urg?` ⚠${d}d`:""}</span>; })}
                      {emps.length>6 && <span style={{ fontSize:11, color:"#9ca3af" }}>+{emps.length-6}</span>}
                    </div>
                  </div>
                ))}
                {linkedEmps.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"32px 0", fontSize:13 }}>No employees assigned to this partner.</p>}
              </div>
            )}

            {/* ACTIONS */}
            {detailTab==="actions" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {(() => {
                  const allActions=safePartner.requestLog.map((r,i)=>({...r,i,dw:Math.floor((Date.now()-new Date(r.ts))/864e5)}));
                  const pendingCnt=allActions.filter(r=>r.status==="Pending").length;
                  const completedCnt=allActions.filter(r=>r.status==="Completed").length;
                  const shown=actionsFilter==="all"?allActions:allActions.filter(r=>r.status===(actionsFilter==="pending"?"Pending":"Completed"));
                  return (
                    <>
                      <div style={{ display:"flex", gap:5, marginBottom:2 }}>
                        {[["pending",`Pending · ${pendingCnt}`],["completed",`Completed · ${completedCnt}`],["all","All"]].map(([k,l])=>(
                          <button key={k} onClick={()=>setActionsFilter(k)} style={{ padding:"4px 11px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", border:`1.5px solid ${actionsFilter===k?PC:"#e5e7eb"}`, backgroundColor:actionsFilter===k?`${PC}10`:"white", color:actionsFilter===k?PC:"#6b7280" }}>{l}</button>
                        ))}
                      </div>
                      {shown.length===0 && (
                        <div style={{ textAlign:"center", padding:"32px 0" }}>
                          <CheckCircle size={28} style={{ margin:"0 auto 8px", display:"block", color:"#16a34a", opacity:0.4 }}/>
                          <p style={{ fontWeight:600, fontSize:13, color:"#374151", margin:"0 0 4px" }}>No {actionsFilter==="all"?"":actionsFilter} actions</p>
                        </div>
                      )}
                      {shown.map(r=>(
                        <div key={r.i} style={{ padding:"12px 14px", borderRadius:12, border:`1px solid ${r.status==="Completed"?"#bbf7d0":r.dw>5?"#fecaca":"#f3f4f6"}`, backgroundColor:r.status==="Completed"?"#f0fdf4":r.dw>5?"#fef2f2":"#f9fafb", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#ede9fe", color:"#6d28d9" }}>{r.type}</span>
                              {r.status==="Pending"&&r.dw>5&&<span style={{ fontSize:10, fontWeight:700, color:"#dc2626" }}>⚠ Delayed {r.dw}d</span>}
                              {r.status==="Completed"&&<span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#dcfce7", color:"#166534" }}>✓ Done</span>}
                            </div>
                            <p style={{ fontWeight:600, fontSize:13, margin:"0 0 2px", color:"#1f2937" }}>{r.employee}</p>
                            <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>
                              {new Date(r.ts).toLocaleDateString("en-GB")}
                              {r.status==="Pending"&&r.dw>0&&<span style={{ marginLeft:6, fontWeight:700, color:r.dw>5?"#dc2626":"#d97706" }}>· {r.dw}d waiting</span>}
                            </p>
                          </div>
                          {r.status==="Pending"&&<button onClick={()=>updReqStatus(safePartner.id,r.i,"Completed")} style={{ fontSize:11, fontWeight:700, padding:"5px 10px", borderRadius:8, border:"1px solid #bbf7d0", backgroundColor:"#f0fdf4", color:"#16a34a", cursor:"pointer", whiteSpace:"nowrap" }}>✓ Done</button>}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}

            {/* EMPLOYEES — sorted by urgency (soonest expiry first) */}
            {detailTab==="employees" && (
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {sortedLinkedEmps.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"32px 0", fontSize:13 }}>No employees assigned.</p>}
                {sortedLinkedEmps.map(e=>{
                  const d=daysUntil(e.endDate);
                  const urg=d>=0&&d<=30;
                  return (
                    <div key={e._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:10, border:`1px solid ${urg?"#fed7aa":"#f3f4f6"}`, backgroundColor:urg?"#fffbf5":"#f9fafb" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:12, color:"#1f2937" }}>{e.name}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{e.client||"—"} · {e.project||"—"}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                        <WFBadge status={e.workflowStatus}/>
                        <span style={{ fontSize:11, fontWeight:600, color:d<0?"#9ca3af":urg?"#d97706":"#374151" }}>
                          {d<0?"Expired":urg?`${d}d`:fmt(e.endDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CONTACTS */}
            {detailTab==="contacts" && (
              <div>
                <div style={{ ...s.flexBetween, marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Contacts ({safePartner.contacts.length})</span>
                  <button onClick={()=>addContact(safePartner.id)} style={{ fontSize:11, fontWeight:700, color:PC, background:"none", border:"none", cursor:"pointer" }}>+ Add</button>
                </div>
                {safePartner.contacts.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"24px 0", fontSize:13 }}>No contacts yet.</p>}
                {safePartner.contacts.map((co,ci)=>(
                  <div key={ci} style={{ display:"flex", alignItems:"center", gap:10, padding:10, borderRadius:10, backgroundColor:"#f9fafb", marginBottom:6, border:"1px solid #f3f4f6" }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:PU, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13, fontWeight:700, flexShrink:0 }}>{(co.name||"?")[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <input value={co.name} onChange={e=>updContact(safePartner.id,ci,"name",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:12, fontWeight:600, outline:"none" }}/>
                      <input value={co.role} onChange={e=>updContact(safePartner.id,ci,"role",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:11, color:"#9ca3af", outline:"none" }}/>
                    </div>
                    <input value={co.phone} onChange={e=>updContact(safePartner.id,ci,"phone",e.target.value)} style={{ width:130, border:"none", backgroundColor:"transparent", fontSize:11, textAlign:"right", outline:"none", direction:"ltr" }}/>
                    {co.phone && (
                      <button onClick={()=>{ const msg=`مرحباً ${co.name},\n\nأتواصل معك بخصوص شراكتنا.\n\nتحياتي`; window.open(`https://wa.me/${co.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank"); }} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:30, height:30, borderRadius:8, border:"1px solid #16a34a", backgroundColor:"white", color:"#16a34a", cursor:"pointer", flexShrink:0 }}>
                        <MessageCircle size={13}/>
                      </button>
                    )}
                    <button onClick={()=>delContact(safePartner.id,ci)} title="Remove contact" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:26, height:26, borderRadius:7, border:"1px solid #fecaca", backgroundColor:"#fff5f5", color:"#ef4444", cursor:"pointer", flexShrink:0 }}>
                      <X size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAdd && (
        <Modal title="Add Partner" onClose={()=>setShowAdd(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Inp label="Company Name" value={nP.name} onChange={v=>setNP(p=>({...p,name:v}))}/>
            <div style={s.grid2}>
              <Inp label="Region" value={nP.region} onChange={v=>setNP(p=>({...p,region:v}))}/>
              <Inp label="Email"  value={nP.email}  onChange={v=>setNP(p=>({...p,email:v}))}/>
            </div>
            <Inp label="Notes" value={nP.notes} onChange={v=>setNP(p=>({...p,notes:v}))}/>
            <div>
              <label style={s.label}>Partner Type</label>
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                {["operational","commission"].map(t=>(
                  <button key={t} onClick={()=>setNP(p=>({...p,partnerType:t}))} style={{ flex:1, padding:"7px 0", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", border:`1.5px solid ${nP.partnerType===t?PC:"#e5e7eb"}`, backgroundColor:nP.partnerType===t?`${PC}10`:"white", color:nP.partnerType===t?PC:"#6b7280", textTransform:"capitalize" }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)} full>Cancel</Btn>
              <Btn onClick={add} disabled={!nP.name} full style={{ backgroundColor:PC, color:"white" }}><Plus size={14}/> Add Partner</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* New Action Modal */}
      {showNewAction && safePartner && (
        <Modal title={`New Action · ${safePartner.name}`} onClose={()=>{ setShowNewAction(false); setNewAction({desc:"",type:"Handover"}); }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={s.label}>Type</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:4 }}>
                {["Handover","Docs Request","GOSI","Iqama","Payment","Other"].map(t=>(
                  <button key={t} onClick={()=>setNewAction(a=>({...a,type:t}))} style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", border:`1.5px solid ${newAction.type===t?PC:"#e5e7eb"}`, backgroundColor:newAction.type===t?`${PC}12`:"white", color:newAction.type===t?PC:"#6b7280" }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={s.label}>Description</label>
              <textarea autoFocus value={newAction.desc} onChange={e=>setNewAction(a=>({...a,desc:e.target.value}))} placeholder="Describe the action…" rows={3} style={{ ...s.inp, resize:"vertical", marginTop:4 }}/>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <Btn variant="ghost" onClick={()=>{ setShowNewAction(false); setNewAction({desc:"",type:"Handover"}); }} full>Cancel</Btn>
              <Btn onClick={()=>{
                if(!newAction.desc.trim()) return;
                addRequest(safePartner.id,{ ts:new Date().toISOString(), type:newAction.type, employee:newAction.desc, status:"Pending" });
                setShowNewAction(false); setNewAction({desc:"",type:"Handover"});
                setDetailTab("actions");
              }} disabled={!newAction.desc.trim()} full style={{ backgroundColor:PC, color:"white" }}>
                <Plus size={14}/> Add Action
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <Modal title="Delete Partner?" onClose={()=>setConfirmDeleteId(null)}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ margin:0, fontSize:13, color:"#374151" }}>هتتحذف بيانات الـ partner دي نهائياً. مش ممكن تتراجعي.</p>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" onClick={()=>setConfirmDeleteId(null)} full>Cancel</Btn>
              <Btn onClick={()=>deleteP(confirmDeleteId)} full style={{ backgroundColor:"#dc2626", color:"white" }}>Delete</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SETTINGS ───────────────────────────────────────────────────────────
function NotificationsSettings({ employees }) {
  const [phone,    setPhone]    = useState(() => localStorage.getItem('fisheye_ops_phone')    || '');
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem('fisheye_wa_apikey')    || '');
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState('');
  const [notifPerm, setNotifPerm] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');

  const save = () => {
    localStorage.setItem('fisheye_ops_phone',  phone);
    localStorage.setItem('fisheye_wa_apikey',  apiKey);
    setResult('✅ Saved');
    setTimeout(() => setResult(''), 2000);
  };

  const requestNotifPerm = async () => {
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };

  const buildDigest = () => {
    const expiring = employees
      .filter(e => !isExcluded(e))
      .map(e => ({ ...e, d: daysUntil(e.endDate) }))
      .filter(e => e.d >= 0 && e.d <= 30)
      .sort((a, b) => a.d - b.d);

    // Direct-mode employees whose margin comes from a client Deal (never
    // typed in manually) but no Deal actually matches them -- their profit
    // is silently computing as 0 SAR, which is easy to miss since nothing
    // on their own card looks wrong. See utils/appConfig.js getEffectiveMargin.
    const noDeal = employees.filter(e => !isExcluded(e) && e.profitMode === "direct" && getEffectiveMargin(e).source === "none");

    // Sela is the one client where an empty PO field is a real compliance
    // flag (see Report Logic reference) -- surface it here too instead of
    // relying on someone remembering to filter for it in the table.
    const noPOSela = employees.filter(e => !isExcluded(e) && e.client === "Sela" && !(e.poNumbers && String(e.poNumbers).trim()));

    if (!expiring.length && !noDeal.length && !noPOSela.length) return null;

    const urgent = expiring.filter(e => e.d <= 7);
    const expLines = expiring.map(e => `• ${e.name} (${e.client || '—'}) — ${e.d} day${e.d !== 1 ? 's' : ''}`);

    let msg = `🔔 Fisheye Daily Digest — ${new Date().toLocaleDateString('en-GB')}\n\n`;
    if (expiring.length) {
      msg += (urgent.length ? `🚨 URGENT (≤7 days): ${urgent.length}\n` : '')
        + `⚠️ Expiring within 30 days: ${expiring.length}\n\n`
        + expLines.join('\n') + '\n\n';
    }
    if (noDeal.length) {
      msg += `💰 No Deal margin set (profit computing as 0 SAR): ${noDeal.length}\n`
        + noDeal.slice(0, 15).map(e => `• ${e.name} (${e.client || '—'})`).join('\n')
        + (noDeal.length > 15 ? `\n…and ${noDeal.length - 15} more` : '') + '\n\n';
    }
    if (noPOSela.length) {
      msg += `📋 Sela — missing PO number: ${noPOSela.length}\n`
        + noPOSela.slice(0, 15).map(e => `• ${e.name}`).join('\n')
        + (noPOSela.length > 15 ? `\n…and ${noPOSela.length - 15} more` : '');
    }
    return msg.trim();
  };

  const sendWhatsApp = async () => {
    const msg = buildDigest();
    if (!msg) { setResult('✅ No expiring contracts — nothing to send'); return; }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || !apiKey) { setResult('❌ Phone and API key required'); return; }
    setSending(true); setResult('');
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(msg)}&apikey=${apiKey}`;
    // Use Image trick to bypass CORS (CallMeBot is a GET API)
    const img = new window.Image();
    img.onload = img.onerror = () => {
      setResult('✅ WhatsApp digest sent!');
      localStorage.setItem('fisheye_last_digest_date', new Date().toISOString().split('T')[0]);
      setSending(false);
    };
    img.src = url;
  };

  const previewMsg  = buildDigest();
  const expCount    = employees.filter(e => !isExcluded(e) && daysUntil(e.endDate) >= 0 && daysUntil(e.endDate) <= 30).length;
  const urgCount    = employees.filter(e => !isExcluded(e) && daysUntil(e.endDate) >= 0 && daysUntil(e.endDate) <= 7).length;
  const noDealCount = employees.filter(e => !isExcluded(e) && e.profitMode === "direct" && getEffectiveMargin(e).source === "none").length;
  const noPOCount   = employees.filter(e => !isExcluded(e) && e.client === "Sela" && !(e.poNumbers && String(e.poNumbers).trim())).length;
  const lastDigest  = localStorage.getItem('fisheye_last_digest_date');

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Status cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
        <Card style={{padding:14,background: urgCount ? WF_TOKENS.errorBg : WF_TOKENS.successBg, border: `1px solid ${urgCount ? WF_TOKENS.errorSolid+'40':WF_TOKENS.successSolid+'40'}`}}>
          <p style={{fontSize:11,color:'#6b7280',margin:'0 0 4px',fontWeight:700}}>URGENT (≤7 days)</p>
          <p style={{fontSize:24,fontWeight:900,margin:0,color: urgCount ? WF_TOKENS.error : WF_TOKENS.success}}>{urgCount}</p>
        </Card>
        <Card style={{padding:14,background:WF_TOKENS.warningBg,border:`1px solid ${WF_TOKENS.warningSolid}40`}}>
          <p style={{fontSize:11,color:'#6b7280',margin:'0 0 4px',fontWeight:700}}>EXPIRING (≤30 days)</p>
          <p style={{fontSize:24,fontWeight:900,margin:0,color:WF_TOKENS.warning}}>{expCount}</p>
        </Card>
        <Card style={{padding:14,background: noDealCount ? WF_TOKENS.errorBg : WF_TOKENS.successBg, border: `1px solid ${noDealCount ? WF_TOKENS.errorSolid+'40':WF_TOKENS.successSolid+'40'}`}}>
          <p style={{fontSize:11,color:'#6b7280',margin:'0 0 4px',fontWeight:700}}>NO DEAL (profit = 0)</p>
          <p style={{fontSize:24,fontWeight:900,margin:0,color: noDealCount ? WF_TOKENS.error : WF_TOKENS.success}}>{noDealCount}</p>
        </Card>
        <Card style={{padding:14,background: noPOCount ? WF_TOKENS.warningBg : WF_TOKENS.successBg, border: `1px solid ${noPOCount ? WF_TOKENS.warningSolid+'40':WF_TOKENS.successSolid+'40'}`}}>
          <p style={{fontSize:11,color:'#6b7280',margin:'0 0 4px',fontWeight:700}}>SELA — NO PO</p>
          <p style={{fontSize:24,fontWeight:900,margin:0,color: noPOCount ? WF_TOKENS.warning : WF_TOKENS.success}}>{noPOCount}</p>
        </Card>
        <Card style={{padding:14}}>
          <p style={{fontSize:11,color:'#6b7280',margin:'0 0 4px',fontWeight:700}}>LAST DIGEST</p>
          <p style={{fontSize:13,fontWeight:700,margin:0,color:MD}}>{lastDigest || '—'}</p>
        </Card>
      </div>

      {/* Browser notifications */}
      <Card style={{padding:16}}>
        <h3 style={{fontWeight:700,fontSize:14,margin:'0 0 8px'}}>Browser Notifications</h3>
        <p style={{fontSize:12,color:'#6b7280',margin:'0 0 12px'}}>
          لما تفتحي الـ app كل يوم بيظهرلك notification تلقائي لو في عقود بتنتهي.
        </p>
        {notifPerm === 'granted' && <p style={{fontSize:13,color:WF_TOKENS.success,fontWeight:700,margin:0}}>✅ Browser notifications enabled</p>}
        {notifPerm === 'denied'  && <p style={{fontSize:13,color:WF_TOKENS.error,margin:0}}>❌ Blocked — enable from browser settings</p>}
        {notifPerm === 'default' && <Btn onClick={requestNotifPerm}><Bell size={13}/> Enable Browser Notifications</Btn>}
      </Card>

      {/* WhatsApp config */}
      <Card style={{padding:16}}>
        <h3 style={{fontWeight:700,fontSize:14,margin:'0 0 12px'}}>WhatsApp Digest</h3>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#6b7280',display:'block',marginBottom:4}}>OPS MANAGER PHONE (with country code)</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+966XXXXXXXXX"
              style={{width:'100%',padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#6b7280',display:'block',marginBottom:4}}>
              CALLMEBOT API KEY &nbsp;
              <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noreferrer"
                style={{color:M,fontWeight:600}}>كيف تحصلي على API key؟</a>
            </label>
            <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="123456"
              style={{width:'100%',padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <Btn onClick={save} style={{...s.btnPrimary,backgroundColor:M}}><Save size={13}/> Save</Btn>
            <Btn onClick={sendWhatsApp} disabled={sending} style={{backgroundColor:'#25d366',border:'none',color:'#fff'}}>
              <MessageCircle size={13}/> {sending ? 'Sending…' : 'Send Digest Now'}
            </Btn>
            {result && <span style={{fontSize:13,color: result.startsWith('✅') ? WF_TOKENS.success : WF_TOKENS.error,fontWeight:600}}>{result}</span>}
          </div>
        </div>
      </Card>

      {/* Preview */}
      {previewMsg && (
        <Card style={{padding:16}}>
          <h3 style={{fontWeight:700,fontSize:14,margin:'0 0 8px'}}>Message Preview</h3>
          <pre style={{fontSize:12,color:'#374151',background:'#f9fafb',padding:12,borderRadius:8,whiteSpace:'pre-wrap',margin:0,fontFamily:'monospace'}}>
            {previewMsg}
          </pre>
        </Card>
      )}
    </div>
  );
}


// Does `project` match one of a deal's own project-match keywords? Mirrors
// the matching logic in utils/appConfig.js's getEffectiveMargin exactly, so
// the live preview below agrees with what real payroll math will do.
function projectMatchesDeal(deal, project) {
  const p = (project || "").trim().toUpperCase();
  return (deal?.projectMatches || []).some(pm => {
    const v = (pm.value || "").trim().toUpperCase();
    if (!v) return false;
    return pm.matchType === "exact" ? p === v : p.includes(v);
  });
}
// Which deal (by index into the client's full deals array) would actually
// apply to an employee with this project name, under the same
// higher-index-wins precedence getEffectiveMargin uses. Index 0 is always
// the fallback (the default deal), whether or not it has anything filled in.
function winningDealIndexForProject(deals, project) {
  for (let j = deals.length - 1; j >= 1; j--) {
    if (dealHasAnyValue(deals[j]) && projectMatchesDeal(deals[j], project)) return j;
  }
  return 0;
}

// Shared field set for one Deal (the client's default deal, or one of its
// project-specific deals) -- used twice below so both look and behave
// identically. `onChange` receives a partial patch to merge into the deal.
// `previewEmployees` (optional) is the list of REAL current employees this
// exact deal would apply to -- used to show a live "here's what this margin
// actually comes out to" preview, since the same percentage means a
// different SAR amount for every employee's own salary.
function DealFields({ deal, onChange, previewEmployees }) {
  const type = deal?.marginType || "percent";
  const showPercent = type === "percent" || type === "percent_fixed";
  const showFixed   = type === "fixed" || type === "percent_fixed";
  // Backward-compat reads: older deals only ever had one `marginValue` field
  // (paired with `marginType`). A deal that hasn't been touched since the
  // percent+fixed split shipped still has its number sitting in `marginValue`
  // -- fall back to it once, scoped to whichever new field it originally meant.
  const percentVal = deal?.marginPercent ?? (type === "percent" ? deal?.marginValue : undefined);
  const fixedVal   = deal?.marginFixed   ?? (type === "fixed"   ? deal?.marginValue : undefined);
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Service Type</label>
          <select value={deal?.serviceType || ""} onChange={e => onChange({ serviceType: e.target.value })}
            style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, minWidth: 140 }}>
            <option value="">— Choose —</option>
            <option value="Outsourcing">Outsourcing</option>
            <option value="Recruitment">Recruitment</option>
            <option value="RPO">RPO (via Partner)</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Margin Type</label>
          <select value={type} onChange={e => onChange({ marginType: e.target.value })}
            style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, minWidth: 170 }}>
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount (SAR)</option>
            <option value="percent_fixed">Percentage + fixed amount</option>
          </select>
        </div>
        {showPercent && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Margin %</label>
              <input type="number" value={percentVal ?? ""} onChange={e => onChange({ marginPercent: e.target.value })} placeholder="e.g. 6"
                style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, width: 80 }}/>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Based On</label>
              <select value={deal?.marginBasis || "monthly"} onChange={e => onChange({ marginBasis: e.target.value })}
                style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, minWidth: 130 }}>
                <option value="monthly">Monthly salary</option>
                <option value="annual">Annual salary</option>
              </select>
            </div>
          </>
        )}
        {showFixed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Fixed Amount (SAR)</label>
            <input type="number" value={fixedVal ?? ""} onChange={e => onChange({ marginFixed: e.target.value })} placeholder="e.g. 500"
              style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, width: 100 }}/>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Saudization Visa Fee (SAR)</label>
          <input type="number" value={deal?.saudizationFee ?? ""} onChange={e => onChange({ saudizationFee: e.target.value })} placeholder="e.g. 1000 (optional)"
            style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, width: 130 }}/>
        </div>
        {deal?.serviceType === "Recruitment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Recruitment Fee (SAR)</label>
            <input type="number" value={deal?.recruitmentFee ?? ""} onChange={e => onChange({ recruitmentFee: e.target.value })} placeholder="e.g. 5000"
              style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, width: 110 }}/>
          </div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 10.5, color: "#9ca3af", lineHeight: 1.5 }}>
        The percentage, the fixed amount, and the Saudization fee are all added together into one margin — none of it is separate income.
      </p>
      {dealHasAnyValue(deal) && previewEmployees && (
        <div style={{ padding: "8px 10px", backgroundColor: `${MD}0a`, border: `1px solid ${MD}20`, borderRadius: 8 }}>
          {previewEmployees.length === 0 ? (
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>No current employee matches this deal yet — nothing to preview against.</p>
          ) : (() => {
            const rows = previewEmployees.map(e => ({
              name: e.name || "—",
              pkg: Number(e.totalPackage) || 0,
              margin: computeDealMargin(deal, Number(e.totalPackage) || 0).amount,
            }));
            if (rows.length <= 4) {
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: MD, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Preview on {rows.length === 1 ? "this employee" : "current employees"}
                  </p>
                  {rows.map((r, i) => (
                    <p key={i} style={{ margin: 0, fontSize: 11.5, color: "#374151" }}>
                      {r.name} <span style={{ color: "#9ca3af" }}>(SAR {r.pkg.toLocaleString()}/mo)</span> → margin <b style={{ color: MD }}>SAR {Math.round(r.margin).toLocaleString()}</b>
                    </p>
                  ))}
                </div>
              );
            }
            const amounts = rows.map(r => r.margin);
            const min = Math.min(...amounts), max = Math.max(...amounts);
            const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            return (
              <p style={{ margin: 0, fontSize: 11.5, color: "#374151" }}>
                Applies to <b style={{ color: MD }}>{rows.length} employees</b> right now — margin ranges from <b>SAR {Math.round(min).toLocaleString()}</b> to <b>SAR {Math.round(max).toLocaleString()}</b> (avg SAR {Math.round(avg).toLocaleString()}), based on each one's own salary.
              </p>
            );
          })()}
        </div>
      )}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[["billGosi","Bill GOSI"],["billMedical","Bill Medical"],["billAjeer","Bill Ajeer"]].map(([key,label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
            <input type="checkbox" checked={!!deal?.[key]} onChange={e => onChange({ [key]: e.target.checked })}/>
            {label}
          </label>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>Notes</label>
        <input value={deal?.note || ""} onChange={e => onChange({ note: e.target.value })} placeholder="e.g. special visa slot arrangement"
          style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}/>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗂️ CONFIGURATION PANEL — Settings → Configuration
// Edits the client list / colors / auto-classification rules that used to be
// hardcoded (CLIENTS_LIST, CLIENT_META, mapClient). Renaming a client cascades
// to existing employee records and Client Hub records, then persists + reloads.
// ═══════════════════════════════════════════════════════════════════════════════
function ConfigurationPanel({ employees, setEmployees, clients, saveClients }) {
  const { profile: __profile } = useAuth();
  const isViewer = __profile?.role === 'viewer';
  const [rows, setRows] = useState(() => {
    const list = getEffectiveClientsList();
    const meta = getEffectiveClientMeta();
    const registered = new Set(list);
    // Any client name that actually appears on employee records but was
    // never formally registered (imported directly before this page existed,
    // or added via a bulk edit that only touched employees_master) still
    // needs a row here, otherwise it's invisible and un-renameable even
    // though real employees sit under it.
    const unregistered = [...new Set(employees.map(e => (e.client || "").trim()).filter(Boolean))]
      .filter(c => !registered.has(c));
    const allNames = [...list, ...unregistered];
    return allNames.map((name, i) => ({
      id: `row-${i}-${name}`,
      origName: name,
      name,
      meta: meta[name] || CLIENT_COLOR_PALETTE[i % CLIENT_COLOR_PALETTE.length],
    }));
  });
  const [rules, setRules] = useState(() => getEffectiveMappingRules().map((r, i) => ({ id: `rule-${i}`, ...r })));
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [clientFilter, setClientFilter] = useState("");
  const [expandedDealId, setExpandedDealId] = useState(null); // which row's Deal Terms panel is open
  const [expandedProjectsId, setExpandedProjectsId] = useState(null); // which row's Projects panel is open
  const [colorPickerId, setColorPickerId] = useState(null); // which row's color swatch picker is open

  const empCountFor = (name) => employees.filter(e => e.client === name).length;

  const updateRowName  = (id, val)  => setRows(rs => rs.map(r => r.id === id ? { ...r, name: sanitizeClientName(val) } : r));
  const updateRowColor = (id, meta) => setRows(rs => rs.map(r => r.id === id ? { ...r, meta: { ...r.meta, ...meta } } : r));
  // Deals: Fisheye's own reference copy of what was agreed with the client (service
  // type, margin, recruitment fee, who bills what) — entered/edited here so account
  // managers don't need to open the CRM just to check terms. This is NOT a live sync
  // with the CRM (no export/API yet) — it's a manual note that mirrors what Sales
  // recorded there, and it deliberately holds nothing about partner cost/bonus: that
  // stays per-employee and confidential, same as today.
  //
  // deals[0] is the client's DEFAULT deal (applies to every project under this client).
  // deals[1+] are optional deals scoped to specific projects (e.g. one client with two
  // margins for two different project groups) -- see the "Projects for this deal" list
  // on each. getEffectiveMargin in utils/appConfig.js is what actually applies these to
  // profit calculations: an employee's own typed-in Fisheye Margin always wins over any
  // deal here, so nothing already saved on an employee changes just because a deal is
  // added or edited.
  const dealsFor = (row) => (row.meta?.deals && row.meta.deals.length)
    ? row.meta.deals
    : [{ id: `deal-${row.id}-base`, ...(row.meta?.dealTerms || {}) }]; // migrate the old single-deal shape
  const updateDeal = (rowId, dealId, patch) => setRows(rs => rs.map(r => {
    if (r.id !== rowId) return r;
    const deals = dealsFor(r).map(d => d.id === dealId ? { ...d, ...patch } : d);
    return { ...r, meta: { ...r.meta, deals } };
  }));
  const addDeal = (rowId) => setRows(rs => rs.map(r => r.id === rowId
    ? { ...r, meta: { ...r.meta, deals: [...dealsFor(r), { id: `deal-${Date.now()}`, projectMatches: [] }] } }
    : r));
  const removeDeal = (rowId, dealId) => setRows(rs => rs.map(r => r.id === rowId
    ? { ...r, meta: { ...r.meta, deals: dealsFor(r).filter(d => d.id !== dealId) } }
    : r));
  const addDealProject = (rowId, dealId) => setRows(rs => rs.map(r => r.id === rowId
    ? { ...r, meta: { ...r.meta, deals: dealsFor(r).map(d => d.id === dealId
        ? { ...d, projectMatches: [...(d.projectMatches || []), { id: `pm-${Date.now()}`, matchType: "contains", value: "" }] }
        : d) } }
    : r));
  const updateDealProject = (rowId, dealId, pmId, patch) => setRows(rs => rs.map(r => r.id === rowId
    ? { ...r, meta: { ...r.meta, deals: dealsFor(r).map(d => d.id === dealId
        ? { ...d, projectMatches: (d.projectMatches || []).map(pm => pm.id === pmId ? { ...pm, ...patch } : pm) }
        : d) } }
    : r));
  const removeDealProject = (rowId, dealId, pmId) => setRows(rs => rs.map(r => r.id === rowId
    ? { ...r, meta: { ...r.meta, deals: dealsFor(r).map(d => d.id === dealId
        ? { ...d, projectMatches: (d.projectMatches || []).filter(pm => pm.id !== pmId) }
        : d) } }
    : r));
  const addRow = () => setRows(rs => [...rs, { id: `row-new-${Date.now()}`, origName: "", name: "", meta: CLIENT_COLOR_PALETTE[rs.length % CLIENT_COLOR_PALETTE.length] }]);
  const removeRow = (id) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    const count = row.origName ? empCountFor(row.origName) : 0;
    if (count > 0) {
      alert(`مينفعش تمسحي "${row.origName}" — لسه فيه ${count} موظف مسجل تحته. غيّري الاسم بدل ما تمسحيه، أو انقلي الموظفين لعميل تاني الأول.`);
      return;
    }
    setRows(rs => rs.filter(r => r.id !== id));
  };

  const clientOptions   = rows.map(r => r.name.trim()).filter(Boolean);
  const nonDefaultRules = rules.filter(r => r.matchType !== "default");
  const defaultRule     = rules.find(r => r.matchType === "default") || { id: "rule-default", client: clientOptions[0] || "", matchType: "default", value: "" };
  const updateRule = (id, patch) => setRules(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  const removeRule = (id) => setRules(rs => rs.filter(r => r.id !== id));

  // Inserts a new keyword rule pinned to one client — used by the "+ Project" button
  // under each client row, so adding a project keyword never requires picking the
  // client from a dropdown (it's already the row you're in). Order among rules for
  // DIFFERENT clients no longer needs manual reordering here since keywords are
  // looked up per-client rather than as one flat, priority-ordered list. (A
  // standalone "Project Matching" card with a manual default-client picker, a
  // "test a project name" preview, a client/project mismatch fixer, and a
  // rename-project-everywhere tool used to live here -- removed at the user's
  // request since the default-client picker never actually drove real employee
  // creation (CSV import always asks explicitly instead) and read as confusing
  // dead weight. The underlying `rules`/`defaultRule` data this fed is untouched
  // and keeps working exactly as before; only that admin card is gone.)
  const addRuleForClient = (clientName) => setRules(rs => {
    const idx = rs.findIndex(r => r.matchType === "default");
    const newRule = { id: `rule-new-${Date.now()}`, client: clientName, matchType: "contains", value: "" };
    const arr = [...rs];
    if (idx === -1) arr.push(newRule); else arr.splice(idx, 0, newRule);
    return arr;
  });

  const pendingRenames = rows.filter(r => r.origName && r.name.trim() && r.origName !== r.name.trim());
  const totalAffected  = pendingRenames.reduce((sum, r) => sum + empCountFor(r.origName), 0);

  const doSave = async () => {
    const finalNames = rows.map(r => r.name.trim()).filter(Boolean);
    if (!finalNames.length) return alert("لازم يفضل عميل واحد على الأقل في الليستة.");
    // NOTE: duplicate final names are allowed on purpose -- that's a merge
    // (see BUG 2 note above), not an error. Uniqueness is enforced later when
    // clientsList/clientMeta are built, by collapsing duplicates to one entry.
    if (nonDefaultRules.some(r => !r.value.trim())) return alert("في قاعدة تصنيف من غير كلمة مفتاحية — املاها أو امسحيها.");
    if (!defaultRule.client) return alert("لازم تختاري عميل افتراضي (آخر قاعدة).");

    if (pendingRenames.length) {
      const ok = window.confirm(
        `هيتم تحديث ${totalAffected} موظف تلقائيًا بالأسماء الجديدة:\n` +
        pendingRenames.map(r => `• ${r.origName} → ${r.name.trim()}`).join("\n") +
        `\n\nمتابعة؟`
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      let updatedEmployees = employees;
      for (const r of pendingRenames) {
        const oldName = r.origName, newName = r.name.trim();
        const affected = updatedEmployees.filter(e => e.client === oldName);
        if (affected.length) {
          updatedEmployees = updatedEmployees.map(e => e.client === oldName ? { ...e, client: newName } : e);
          const ids = affected.map(e => e._id);
          await supabase.from('employees_master').update({ client: newName }).in('_id', ids);
        }
      }
      if (updatedEmployees !== employees) {
        setEmployees(updatedEmployees);
        try { localStorage.setItem("fisheyeData_v3", JSON.stringify(updatedEmployees)); } catch {}
      }

      if (pendingRenames.length && Array.isArray(clients) && clients.length) {
        const lookup = Object.fromEntries(pendingRenames.map(r => [r.origName, r.name.trim()]));
        const newClients = clients.map(c => lookup[c.name] ? { ...c, name: lookup[c.name] } : c);
        saveClients && saveClients(newClients);
      }

      // Collapse rows that share a final name (a merge) into one entry each,
      // preferring the row that already had that exact name so its existing
      // color/phone/requiresPO settings survive the merge.
      const dedupedByName = new Map();
      rows.forEach(r => {
        const n = r.name.trim();
        if (!n) return;
        const existing = dedupedByName.get(n);
        if (!existing || (r.origName === n && existing.origName !== n)) {
          dedupedByName.set(n, r);
        }
      });
      const dedupedFinalNames = [...dedupedByName.keys()];
      const clientMeta = {};
      dedupedByName.forEach((r, n) => { clientMeta[n] = r.meta; });
      const renameLookup = Object.fromEntries(pendingRenames.map(r => [r.origName, r.name.trim()]));
      const mappingRules = [
        ...nonDefaultRules.map(r => ({ client: renameLookup[r.client] || r.client, matchType: r.matchType, value: r.value.trim() })),
        { client: renameLookup[defaultRule.client] || defaultRule.client, matchType: "default", value: "" },
      ];
      // A coded default (DEFAULT_CLIENTS_LIST / DEFAULT_CLIENT_META in
      // appConfig.js) that the user just deleted or renamed away from would
      // otherwise reappear on its own: getEffectiveClientsList/
      // getEffectiveClientMeta union the saved config with those coded
      // defaults, and a union can only add keys back, never remove one --
      // which is exactly why a deleted/renamed default client used to come
      // right back after Save's auto-reload below. Record it as "removed"
      // instead so it stays gone (a real employee later using that same
      // name still reintroduces it normally, via the unregistered-row path
      // in this component's initial state).
      const keptNames = new Set(dedupedFinalNames);
      const priorCfg = loadAppConfig();
      const priorRemoved = (priorCfg && Array.isArray(priorCfg.removedClients)) ? priorCfg.removedClients : [];
      const allDefaultNames = new Set([...DEFAULT_CLIENTS_LIST, ...Object.keys(DEFAULT_CLIENT_META)]);
      const removedClients = [...new Set([
        ...priorRemoved.filter(n => !keptNames.has(n)),
        ...[...allDefaultNames].filter(n => !keptNames.has(n)),
      ])];
      const finalCfg = { clientsList: dedupedFinalNames, clientMeta, mappingRules, removedClients };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(finalCfg));
      const { error } = await supabase.from('fisheye_app_data').upsert({ key: CONFIG_KEY, data: finalCfg }, { onConflict: 'key' });
      setSaving(false);
      if (error) {
        // Do NOT show success and do NOT reload -- reloading would re-fetch
        // the OLD config from Supabase and silently overwrite the edit that
        // (correctly) made it into localStorage. Leave everything as-is so
        // the user can just press Save again once the network issue clears.
        alert("❌ اتسجل التعديل عندك بس فشل رفعه للسحابة (" + error.message + ") — التعديل لسه موجود على الشاشة، جرّبي تضغطي Save تاني. متعمليش Refresh للصفحة دلوقتي عشان متفقديش التعديل.");
        return;
      }
      setSavedFlash(true);
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setSaving(false);
      alert("❌ حصل خطأ أثناء الحفظ: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <p style={{ fontSize: 12.5, color: "#6b7280", margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
          دول أسماء العملاء اللي بتظهر في كل الفلاتر والداشبورد والتقارير ({rows.length} حاليًا). غيّري الاسم وهيتحدث تلقائي في كل حتة، شامل سجلات الموظفين الحاليين.
        </p>
        <Btn onClick={addRow} style={{ ...s.btnPrimary, backgroundColor: M, flexShrink: 0, whiteSpace: "nowrap" }}><Plus size={13}/> Add Client</Btn>
      </div>
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input value={clientFilter} onChange={e => setClientFilter(e.target.value)} placeholder="Search clients…"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px 10px 38px", border: "1px solid #E5E1DC", borderRadius: 10, fontSize: 13, backgroundColor: "white" }}/>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.filter(r => !clientFilter.trim() || r.name.toLowerCase().includes(clientFilter.trim().toLowerCase())).map(row => {
            const count = row.origName ? empCountFor(row.origName) : 0;
            const renamed = row.origName && row.name.trim() && row.origName !== row.name.trim();
            const deals = dealsFor(row);
            // A deal only "counts" once it actually has something typed into it --
            // an empty default deal (service/margin fields still blank) shouldn't
            // be counted alongside real project-specific deals just because it
            // exists as a placeholder row in the array.
            const dealIsFilled = d => !!(d.serviceType || (d.marginValue !== undefined && d.marginValue !== "") || (d.marginPercent !== undefined && d.marginPercent !== "") || (d.marginFixed !== undefined && d.marginFixed !== "") || (d.saudizationFee !== undefined && d.saudizationFee !== "") || d.recruitmentFee || d.note || (d.projectMatches||[]).length);
            const hasDeal = deals.some(dealIsFilled);
            const filledDealsCount = deals.filter(dealIsFilled).length;
            const dealOpen = expandedDealId === row.id;
            const matchName = row.origName || row.name.trim();
            const clientRules = nonDefaultRules.filter(r => r.client === matchName);
            const projectsOpen = expandedProjectsId === row.id;
            // Real project names already on this client's employee records --
            // offered as suggestions when picking which project a deal applies
            // to, so a Deal Terms project match can be chosen instead of typed
            // from scratch (free text still works for a project not yet in the
            // system).
            const clientProjectNames = [...new Set(
              employees.filter(e => e.client === matchName).map(e => (e.project || "").trim()).filter(Boolean)
            )].sort((a, b) => a.localeCompare(b));
            // Employees this client's Deals could actually apply to for the live
            // margin preview -- excludes anyone with their own manually-typed
            // Fisheye Margin, since that always overrides any client Deal and a
            // Deal preview would be misleading for them.
            const dealPreviewPool = employees.filter(e => e.client === matchName && !(Number(e.fisheyeMargin) || 0));
            return (
              <div key={row.id} style={{ border: "1px solid #E5E1DC", borderRadius: 14, overflow: "hidden", backgroundColor: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", flexWrap: "wrap" }}>
                  <button onClick={() => setColorPickerId(colorPickerId === row.id ? null : row.id)} title="تغيير لون العميل"
                    style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: row.meta?.dot || "#9ca3af", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}/>
                  <input value={row.name} onChange={e => updateRowName(row.id, e.target.value)} placeholder="اسم العميل"
                    style={{ flex: "1 1 160px", padding: "7px 10px", border: "1px solid transparent", borderRadius: 8, fontSize: 14.5, fontWeight: 600, backgroundColor: "transparent" }}
                    onFocus={e => e.target.style.border = "1px solid #E5E1DC"} onBlur={e => e.target.style.border = "1px solid transparent"}/>
                  {renamed && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: WF_TOKENS.warningSolid, backgroundColor: WF_TOKENS.warningBg, padding: "3px 8px", borderRadius: 999 }}>
                      ⚠️ هيتحدث {count} موظف
                    </span>
                  )}
                  {!renamed && count > 0 && <span style={{ fontSize: 10, color: "#9ca3af" }}>{count} موظف حاليًا</span>}
                  <button onClick={() => setExpandedDealId(dealOpen ? null : row.id)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, height: 30, minWidth: 116, padding: "0 14px", borderRadius: 999, border: "none", backgroundColor: dealOpen ? MD : WF_TOKENS.infoBg, color: dealOpen ? "#fff" : WF_TOKENS.info, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxSizing: "border-box", flexShrink: 0 }}>
                    {`Deal Terms${filledDealsCount > 1 ? ` (${filledDealsCount})` : ""}`} <ChevronDown size={11} style={{ transform: dealOpen ? "rotate(180deg)" : "none" }}/>
                  </button>
                  <button onClick={() => setExpandedProjectsId(projectsOpen ? null : row.id)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, height: 30, minWidth: 116, padding: "0 14px", borderRadius: 999, border: "none", backgroundColor: projectsOpen ? MD : "#F1EEE8", color: projectsOpen ? "#fff" : "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxSizing: "border-box", flexShrink: 0 }}>
                    Projects{clientRules.length ? ` (${clientRules.length})` : ""} <ChevronDown size={11} style={{ transform: projectsOpen ? "rotate(180deg)" : "none" }}/>
                  </button>
                  <button onClick={() => removeRow(row.id)} title="مسح" style={{ width: 30, height: 30, borderRadius: 8, border: "none", backgroundColor: WF_TOKENS.errorBg, color: WF_TOKENS.errorSolid, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxSizing: "border-box" }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
                <datalist id={`proj-list-${row.id}`}>
                  {clientProjectNames.map(p => <option key={p} value={p} />)}
                </datalist>
                {colorPickerId === row.id && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 18px 14px 18px" }}>
                    {CLIENT_COLOR_PALETTE.map((pal, i) => (
                      <button key={i} onClick={() => { updateRowColor(row.id, pal); setColorPickerId(null); }} title="لون"
                        style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: pal.dot, border: row.meta?.dot === pal.dot ? `2px solid ${MD}` : "2px solid transparent", boxShadow: "0 0 0 1px #E5E1DC", cursor: "pointer", padding: 0 }}/>
                    ))}
                  </div>
                )}
                {dealOpen && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f3f4f6", backgroundColor: "#FCFBF9", display: "flex", flexDirection: "column", gap: 14 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", lineHeight: 1.6 }}>
                      Fisheye's own reference copy of the deal terms agreed with the client — not yet linked to the CRM. The default margin applies automatically to every employee's profit under this client, unless the employee has their own margin typed on their card — in that case their number always wins. Partner cost and bonus details stay confidential in each employee's own record, same as today.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: MD, textTransform: "uppercase", letterSpacing: "0.05em" }}>Default margin for all of this client's projects</p>
                      <DealFields deal={deals[0]} onChange={patch => updateDeal(row.id, deals[0].id, patch)}
                        previewEmployees={dealPreviewPool.filter(e => winningDealIndexForProject(deals, e.project) === 0)} />
                    </div>

                    {deals.slice(1).map((d, dIdx) => (
                      <div key={d.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, backgroundColor: "white", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.05em" }}>Margin for a specific project</p>
                          <button onClick={() => removeDeal(row.id, d.id)} title="Remove this deal" style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${WF_TOKENS.errorSolid}30`, backgroundColor: WF_TOKENS.errorBg, color: WF_TOKENS.errorSolid, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Trash2 size={11}/>
                          </button>
                        </div>
                        <DealFields deal={d} onChange={patch => updateDeal(row.id, d.id, patch)}
                          previewEmployees={dealPreviewPool.filter(e => winningDealIndexForProject(deals, e.project) === dIdx + 1)} />
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {(d.projectMatches || []).map(pm => (
                            <div key={pm.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <select value={pm.matchType} onChange={e => updateDealProject(row.id, d.id, pm.id, { matchType: e.target.value })}
                                style={{ padding: "4px 5px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 10 }}>
                                <option value="contains">contains</option>
                                <option value="exact">= exactly</option>
                              </select>
                              <input value={pm.value} onChange={e => updateDealProject(row.id, d.id, pm.id, { value: e.target.value })}
                                placeholder="pick or type a project" list={`proj-list-${row.id}`}
                                style={{ padding: "5px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontFamily: "monospace", fontWeight: 600, width: 160, backgroundColor: `${MD}0a`, color: MD }}/>
                              <button onClick={() => removeDealProject(row.id, d.id, pm.id)} title="Remove" style={{ width: 20, height: 20, borderRadius: 5, border: "none", backgroundColor: "transparent", color: "#c4c4c4", cursor: "pointer", fontSize: 13, lineHeight: 1 }}>×</button>
                            </div>
                          ))}
                          <Btn onClick={() => addDealProject(row.id, d.id)} variant="ghost" style={{ ...s.btnSm, padding: "4px 9px", fontSize: 11 }}>
                            <Plus size={11}/> Project
                          </Btn>
                        </div>
                        {!(d.projectMatches || []).length && (
                          <p style={{ margin: 0, fontSize: 10, color: "#c4c4c4" }}>Needs at least one project here for this margin to apply instead of the default.</p>
                        )}
                      </div>
                    ))}

                    <Btn onClick={() => addDeal(row.id)} variant="ghost" style={{ ...s.btnSm, alignSelf: "flex-start" }}>
                      <Plus size={12}/> Add Deal for a Specific Project
                    </Btn>
                  </div>
                )}
                {projectsOpen && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #f3f4f6", backgroundColor: "#FCFBF9", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <p style={{ margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, color: MD, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Real projects on record ({clientProjectNames.length})
                      </p>
                      {clientProjectNames.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 12, color: "#c4c4c4" }}>مفيش موظفين ليهم اسم مشروع مسجل تحت "{row.name || matchName}" لسه.</p>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {clientProjectNames.map(p => (
                            <span key={p} style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: MD, backgroundColor: `${MD}0a`, padding: "4px 9px", borderRadius: 999 }}>{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af", lineHeight: 1.6 }}>
                      دي أسماء المشاريع الحقيقية المسجلة فعليًا على موظفين تحت العميل ده — مش مربوطة تلقائي بحاجة. اللي بيربطها فعليًا بالعميل ده الكلمات المفتاحية تحت: أي مشروع جديد اسمه (أو جزء منه) يطابق واحدة منها، هيتحط تلقائي تحت "{row.name || matchName}".
                    </p>
                    {clientRules.length === 0 && (
                      <p style={{ margin: 0, fontSize: 12, color: "#c4c4c4" }}>مفيش مشاريع مربوطة لسه — أي موظف من غير مشروع مطابق هيروح للعميل الافتراضي.</p>
                    )}
                    {clientRules.map(r => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", border: "1px solid #f0f0f0", borderRadius: 8, backgroundColor: "white", flexWrap: "wrap" }}>
                        <select value={r.matchType} onChange={e => updateRule(r.id, { matchType: e.target.value })} style={{ padding: "5px 6px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11 }}>
                          <option value="contains">Project contains</option>
                          <option value="exact">Project = exactly</option>
                        </select>
                        <input value={r.value} onChange={e => updateRule(r.id, { value: e.target.value })} placeholder="keyword" style={{ flex: "1 1 140px", padding: "5px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontFamily: "monospace", fontWeight: 600, backgroundColor: `${MD}0a`, color: MD }}/>
                        <button onClick={() => removeRule(r.id)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${WF_TOKENS.errorSolid}30`, backgroundColor: WF_TOKENS.errorBg, color: WF_TOKENS.errorSolid, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    ))}
                    <Btn onClick={() => addRuleForClient(matchName)} variant="ghost" style={{ ...s.btnSm, alignSelf: "flex-start" }}>
                      <Plus size={12}/> Add Project
                    </Btn>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <Card style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>عايزة تعدّلي أسماء الـ Partners؟ ده متاح من صفحة <b>Partner Hub</b> نفسها (إضافة/تعديل/حذف partner).</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {savedFlash && <span style={{ fontSize: 12, fontWeight: 700, color: WF_TOKENS.success }}>✅ محفوظ — بيتم تحديث الصفحة...</span>}
          {isViewer ? (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>👁️ Viewer — read only</span>
          ) : (
            <Btn onClick={doSave} disabled={saving} style={{ ...s.btnPrimary, opacity: saving ? 0.6 : 1 }}>
              <Save size={13}/> {saving ? "جاري الحفظ..." : "Save Configuration"}
            </Btn>
          )}
        </div>
      </Card>
    </div>
  );
}

function SettingsView({
  onClear,
  empCount, 
  syncStatus,
  syncMessage,
  lastSync,
  syncProgress,
  isOnline,
  uploadToCloud,
  downloadFromCloud,
  backup,
  bidirectionalSync,
  employees,
  setEmployees,
  clients,
  saveClients,
}) {
  const { profile: __profile } = useAuth();
  const isAdmin = __profile?.role === 'admin';
  const [tab,setTab]=useState(null);
  const [confirmClear,setConfirmClear]=useState(false);

  const syncMeta = !isOnline ? "Offline" : lastSync
    ? `Synced ${new Date(lastSync).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}`
    : "Not synced yet";

  const CATEGORIES=[
    {k:"config",        l:"Clients & Deals", d:"Rename clients, manage project-matching rules, and keep deal-term references.", icon:Briefcase,    meta:`${clients?.length||0} clients on file`},
    {k:"notifications",  l:"Notifications",   d:"Configure alerts for expiring documents, approvals, and daily digests.",         icon:Bell,         meta:"Alerts & digests"},
    {k:"team",           l:"Team & Access",   d:"Control who can sign in and what they can see, Admin down to Viewer.",           icon:Users,        meta:"Roles & access", adminOnly:true},
    {k:"general",        l:"Data & Sync",     d:"Back up or restore configuration and workforce data with the cloud.",            icon:RefreshCw,    meta:syncMeta},
    {k:"logic",          l:"Report Logic",    d:"A quick reference for how matching and finance logic work across the app.",      icon:ClipboardList, meta:"Reference only"},
  ].filter(c=>!c.adminOnly||isAdmin);

  const current = CATEGORIES.find(c=>c.k===tab);

  if (!tab) return (
    <div style={{maxWidth:960,display:"flex",flexDirection:"column",gap:20,"--font-sans":FE_SANS,fontFamily:FE_SANS}}>
      <div>
        <h2 style={{margin:0,fontSize:21,fontWeight:700,fontFamily:FE_SERIF,color:MD}}>Settings</h2>
        <p style={{margin:"4px 0 0",fontSize:13,color:"#6b7280"}}>Everything that shapes how Fisheye Ops runs.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
        {CATEGORIES.map(c=>{
          const Icon=c.icon;
          return (
            <button key={c.k} onClick={()=>setTab(c.k)} style={{textAlign:"left",cursor:"pointer",border:"1px solid #e5e7eb",borderRadius:14,padding:20,backgroundColor:"white",display:"flex",flexDirection:"column",gap:10,fontFamily:"inherit"}}>
              <div style={{width:38,height:38,borderRadius:10,backgroundColor:MD,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={18} color="#fff"/>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:"#111827"}}>{c.l}</div>
              <div style={{fontSize:12.5,color:"#6b7280",lineHeight:1.5,flexGrow:1}}>{c.d}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:2}}>
                <span style={{fontSize:11,fontFamily:FE_MONO,color:"#9ca3af"}}>{c.meta}</span>
                <ChevronRight size={15} color={M}/>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:720,display:"flex",flexDirection:"column",gap:20,"--font-sans":FE_SANS,fontFamily:FE_SANS}}>
      <button onClick={()=>setTab(null)} style={{display:"flex",alignItems:"center",gap:6,fontSize:12.5,fontWeight:600,color:"#6b7280",background:"none",border:"none",cursor:"pointer",padding:0,alignSelf:"flex-start"}}>
        <ChevronLeft size={15}/> Settings
      </button>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {current && (
          <div style={{width:38,height:38,borderRadius:10,backgroundColor:MD,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <current.icon size={18} color="#fff"/>
          </div>
        )}
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,fontFamily:FE_SERIF,color:MD}}>{current?.l}</h2>
          {current?.d && <p style={{margin:"2px 0 0",fontSize:12.5,color:"#6b7280"}}>{current.d}</p>}
        </div>
      </div>
      {tab==="general"&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Cloud Sync */}
          {isOnline && (
            <Card style={{padding:20,border:`2px solid ${syncStatus==='error'?WF_TOKENS.errorSolid+'40':syncStatus==='success'?WF_TOKENS.successSolid+'40':'#e5e7eb'}`,backgroundColor:syncStatus==='error'?WF_TOKENS.errorBg:syncStatus==='success'?WF_TOKENS.successBg:'white'}}>
              <h3 style={{fontWeight:700,fontSize:14,margin:"0 0 4px"}}>Cloud Backup</h3>
              <p style={{fontSize:12,color:'#6b7280',margin:'0 0 14px'}}>مزامنة البيانات مع Supabase{lastSync ? ` · آخر sync: ${new Date(lastSync).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}` : ''}</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <Btn onClick={uploadToCloud}     disabled={syncStatus==='syncing'} style={{...s.btnPrimary,backgroundColor:M,opacity:syncStatus==='syncing'?0.6:1}}>📤 Upload to Cloud</Btn>
                <Btn onClick={downloadFromCloud} disabled={syncStatus==='syncing'} style={{...s.btnPrimary,backgroundColor:MD,opacity:syncStatus==='syncing'?0.6:1}}>📥 Download from Cloud</Btn>
                <Btn onClick={backup}            disabled={syncStatus==='syncing'} style={{...s.btnPrimary,backgroundColor:'white',color:M,border:`1px solid ${M}40`,opacity:syncStatus==='syncing'?0.6:1}}>💾 Backup</Btn>
                <Btn onClick={bidirectionalSync} disabled={syncStatus==='syncing'} style={{...s.btnPrimary,backgroundColor:'white',color:MD,border:`1px solid ${MD}40`,opacity:syncStatus==='syncing'?0.6:1}}>⇄ Sync Both</Btn>
              </div>
              {syncStatus==='syncing' && (
                <div style={{marginTop:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:MD}}>{syncMessage||'جاري المزامنة...'}</span>
                    <span style={{fontSize:11,fontWeight:700,color:MD}}>{syncProgress}%</span>
                  </div>
                  <div style={{height:6,backgroundColor:`${MD}20`,borderRadius:999,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${syncProgress}%`,backgroundColor:MD,borderRadius:999,transition:'width 0.3s ease'}}/>
                  </div>
                </div>
              )}
              {syncMessage && syncStatus!=='syncing' && (
                <p key={syncMessage} className={syncStatus==='success'?'fe-flash-success':syncStatus==='error'?'fe-flash-error':''} style={{margin:'10px 0 0',fontSize:12,fontWeight:700,color:syncStatus==='error'?WF_TOKENS.error:WF_TOKENS.success,padding:'4px 6px'}}>{syncMessage}</p>
              )}
            </Card>
          )}
          {/* Data Management */}
          <Card style={{padding:20}}>
            <h3 style={{fontWeight:700,fontSize:14,margin:"0 0 12px"}}>Data Management</h3>
            <p style={{fontSize:13,color:"#6b7280",margin:"0 0 16px"}}>{empCount} contracts loaded.</p>
            {!confirmClear
              ? <Btn variant="danger" onClick={()=>setConfirmClear(true)}><Trash2 size={13}/> Clear & Re-upload</Btn>
              : <div style={{display:'flex',flexDirection:'column',gap:10,padding:'12px 16px',border:'2px solid #fca5a5',borderRadius:10,backgroundColor:'#fff1f2'}}>
                  <p style={{margin:0,fontSize:13,fontWeight:600,color:'#b91c1c'}}>⚠️ هتتمسح كل البيانات المحلية. متعملش كده غير لو عندك backup أو Supabase sync.</p>
                  <div style={{display:'flex',gap:8}}>
                    <Btn variant="danger" onClick={()=>{setConfirmClear(false);onClear&&onClear();}}><Trash2 size={13}/> تأكيد المسح</Btn>
                    <Btn onClick={()=>setConfirmClear(false)}>إلغاء</Btn>
                  </div>
                </div>
            }
          </Card>
        </div>
      )}
      {tab==="notifications"&&(
        <NotificationsSettings employees={employees}/>
      )}
      {tab==="config"&&(
        <ConfigurationPanel employees={employees} setEmployees={setEmployees} clients={clients} saveClients={saveClients}/>
      )}
      {tab==="logic"&&(
        <Card style={{padding:"4px 20px"}}>
          {["Pending = workflow NOT in [Agreement Signed, Complete]","Morning report excludes: Expired, Resigned, Combuzz HR","PO Alert: Sela only · Empty PO field","Expiry: Rolling 30-day window","Finance: Excludes resigned always. Excludes expired UNLESS Sela with no PO","Profit Direct: effective margin % × Total Package (employee's own value if set, else the client's Deal — see Clients & Deals) — or fixed SAR if type = fixed","Profit Partner: Net = Client Price − Partner Cost (each can be % of Total Package or fixed SAR)","SAR Discrepancy: Only shown after uploading partner invoice CSV"].map((r,i)=>(
            <div key={r} style={{display:"flex",gap:14,padding:"14px 0",borderBottom:i<7?"1px solid #f3f4f6":"none"}}>
              <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:M,flexShrink:0,width:20}}>{String(i+1).padStart(2,"0")}</span>
              <p style={{fontSize:12.5,color:"#374151",margin:0,lineHeight:1.6}}>{r}</p>
            </div>
          ))}
        </Card>
      )}
      {tab==="team" && isAdmin && (<TeamPanel/>)}
    </div>
  );
}

// ─── Team / Users panel (admin only) — promote/demote @fisheye.sa accounts ──
function TeamPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    supabase.from('profiles').select('id,email,role,created_at').order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setRows(data || []);
        setLoading(false);
      });
  };
  useEffect(() => { load(); }, []);

  const toggleRole = async (row) => {
    const newRole = row.role === 'admin' ? 'viewer' : 'admin';
    setBusyId(row.id); setErr("");
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', row.id);
    if (error) {
      setErr(error.message);
    } else {
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, role: newRole } : r));
    }
    setBusyId(null);
  };

  return (
    <Card style={{ padding: 20 }}>
      <h3 style={{ fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>فريق العمل</h3>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px" }}>
        كل الحسابات اللي عملت تسجيل دخول بإيميل @fisheye.sa. Admin يقدر يعدّل ويحذف، Viewer يشوف بس.
      </p>
      {err && <p style={{ fontSize: 12, color: WF_TOKENS.error, margin: "0 0 10px" }}>{err}</p>}
      {loading ? (
        <p style={{ fontSize: 13, color: "#9ca3af" }}>جاري التحميل...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map(row => (
            <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "1px solid #f0f2f5", borderRadius: 12 }}>
              <span style={{ fontSize: 13.5, color: "#1F2933", fontWeight: 600 }}>{row.email}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999, backgroundColor: row.role === 'admin' ? MD : '#F1EEE8', color: row.role === 'admin' ? '#fff' : '#374151' }}>
                  {row.role === 'admin' ? 'Admin' : 'Viewer'}
                </span>
                <Btn onClick={() => toggleRole(row)} disabled={busyId === row.id} style={{ ...s.btnGhost, borderColor: `${M}40`, color: M, fontSize: 11, padding: "6px 11px" }}>
                  {busyId === row.id ? '...' : (row.role === 'admin' ? 'خليه Viewer' : 'خليه Admin')}
                </Btn>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p style={{ fontSize: 13, color: "#9ca3af" }}>مفيش حسابات لسه.</p>}
        </div>
      )}
    </Card>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// 🧾 BILLING MODULE
// ═══════════════════════════════════════════════════════════════════════════════
const loadLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ─── PO Manager Tab ─────────────────────────────────────────────────────────
function POManagerTab({ pos, savePOs, employees }) {
  const [showAdd,  setShowAdd]  = useState(false);
  const [showLink, setShowLink] = useState(null);
  const [form, setForm] = useState({ poNumber:"", client:"Sela", value:"", startDate:"", endDate:"", notes:"" });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const addPO = () => {
    if (!form.poNumber || !form.client) return alert("PO Number و Client مطلوبين");
    savePOs([{ id:`po-${Date.now()}`, poNumber:form.poNumber, client:form.client,
      value:parseFloat(form.value)||0, startDate:form.startDate, endDate:form.endDate,
      notes:form.notes, status:"active", linkedEmployeeIds:[], createdAt:new Date().toISOString()
    }, ...pos]);
    setForm({ poNumber:"", client:"Sela", value:"", startDate:"", endDate:"", notes:"" });
    setShowAdd(false);
  };

  const toggleStatus  = id => savePOs(pos.map(p => p.id===id ? {...p, status:p.status==="active"?"closed":"active"} : p));
  const deletePO      = id => { if(window.confirm("حذف الـ PO؟")) savePOs(pos.filter(p=>p.id!==id)); };
  const toggleEmpLink = (poId, empId) => savePOs(pos.map(p => {
    if (p.id !== poId) return p;
    const linked = p.linkedEmployeeIds || [];
    return { ...p, linkedEmployeeIds: linked.includes(empId) ? linked.filter(x=>x!==empId) : [...linked, empId] };
  }));

  const linkingPO   = pos.find(p => p.id === showLink);
  const linkingEmps = linkingPO ? employees.filter(e => e.client===linkingPO.client && !isExcluded(e)) : [];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{...s.flexBetween,flexWrap:"wrap",gap:8}}>
        <p style={{margin:0,fontSize:13,color:"#6b7280"}}>{pos.length} POs · {pos.filter(p=>p.status==="active").length} active</p>
        <Btn onClick={()=>setShowAdd(true)}><Plus size={14}/> Add PO</Btn>
      </div>

      {pos.length===0 && (
        <Card style={{padding:48,textAlign:"center"}}>
          <FileText size={32} style={{color:"#d1d5db",margin:"0 auto 12px",display:"block"}}/>
          <p style={{color:"#9ca3af",margin:0,fontSize:13}}>لا توجد POs. أضف أول PO للبدء.</p>
        </Card>
      )}

      {pos.length>0 && (
        <Card style={{overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table className="fe-table" style={s.table}>
              <thead><tr>{["PO Number","Client","Value (SAR)","Employees","Period","Status",""].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {pos.map(po=>{
                  const linked = (po.linkedEmployeeIds||[]).length;
                  const isActive = po.status==="active";
                  return (
                    <tr key={po.id}>
                      <td style={s.td}><span style={{fontFamily:"monospace",fontWeight:700,color:M,fontSize:13}}>{po.poNumber}</span></td>
                      <td style={s.td}><ClientBadge client={po.client}/></td>
                      <td style={s.td}><span style={{fontFamily:"monospace",fontWeight:600,fontSize:12}}>{po.value?(+po.value).toLocaleString():"—"}</span></td>
                      <td style={s.td}>
                        <button onClick={()=>setShowLink(po.id)} style={{fontSize:11,fontWeight:700,color:M,background:"none",border:`1px solid ${M}30`,borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>
                          👥 {linked} linked
                        </button>
                      </td>
                      <td style={s.td}><span style={{fontSize:11,color:"#6b7280",whiteSpace:"nowrap"}}>{fmt(po.startDate)} → {fmt(po.endDate)}</span></td>
                      <td style={s.td}>
                        <button onClick={()=>toggleStatus(po.id)} style={{padding:"3px 10px",borderRadius:999,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                          backgroundColor:isActive?"#dcfce7":"#f3f4f6",color:isActive?"#166534":"#6b7280"}}>
                          {isActive?"● Active":"○ Closed"}
                        </button>
                      </td>
                      <td style={s.td}>
                        <button onClick={()=>deletePO(po.id)} style={{fontSize:11,padding:"4px 8px",borderRadius:6,border:"1px solid #fecaca",backgroundColor:"#fef2f2",color:"#dc2626",cursor:"pointer"}}>
                          <Trash2 size={10} style={{display:"inline",marginRight:3}}/>Del
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showAdd && (
        <Modal title="Add New PO" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={s.grid2}>
              <Inp label="PO Number" value={form.poNumber} onChange={v=>upd("poNumber",v)} placeholder="PO-32782"/>
              <div>
                <label style={s.label}>Client</label>
                <select value={form.client} onChange={e=>upd("client",e.target.value)} style={s.sel}>
                  {CLIENTS_LIST.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <Inp label="PO Value (SAR)" type="number" value={form.value} onChange={v=>upd("value",v)} placeholder="500000"/>
            <div style={s.grid2}>
              <Inp label="Start Date" type="date" value={form.startDate} onChange={v=>upd("startDate",v)}/>
              <Inp label="End Date"   type="date" value={form.endDate}   onChange={v=>upd("endDate",v)}/>
            </div>
            <div><label style={s.label}>Notes</label><textarea value={form.notes} onChange={e=>upd("notes",e.target.value)} style={{...s.inp,resize:"none"}} rows={2}/></div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={addPO}><Save size={14}/> Save PO</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showLink && linkingPO && (
        <Modal title={`Link Employees · ${linkingPO.poNumber}`} subtitle={`${linkingPO.client} · ${linkingEmps.length} eligible`} onClose={()=>setShowLink(null)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:380,overflowY:"auto",paddingRight:4}}>
            {linkingEmps.length===0 && <p style={{color:"#9ca3af",textAlign:"center",padding:24,fontSize:12}}>لا يوجد موظفين نشطين لـ {linkingPO.client}</p>}
            {linkingEmps.map(e=>{
              const linked = (linkingPO.linkedEmployeeIds||[]).includes(e._id);
              return (
                <div key={e._id} onClick={()=>toggleEmpLink(linkingPO.id,e._id)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,
                    border:`1px solid ${linked?"#3b82f6":"#e5e7eb"}`,backgroundColor:linked?"#eff6ff":"white",cursor:"pointer",transition:"all 0.1s"}}>
                  <input type="checkbox" checked={linked} readOnly style={{pointerEvents:"none"}}/>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontWeight:600,fontSize:13}}>{e.name}</p>
                    <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>{e.position} · {e.project}</p>
                  </div>
                  <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#374151",flexShrink:0}}>
                    {(e.clientPrice||e.totalPackage||0).toLocaleString()} SAR
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
            <Btn onClick={()=>setShowLink(null)}><Check size={14}/> Done · {(linkingPO.linkedEmployeeIds||[]).length} selected</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Invoice Builder Tab ─────────────────────────────────────────────────────
function InvoiceBuilderTab({ invoices, saveInvs, pos, employees }) {
  const [showBuild, setShowBuild] = useState(false);
  const [form, setForm] = useState({ poId:"", invoiceNumber:"", invoiceDate:new Date().toISOString().split("T")[0], vatOverride:"" });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const selectedPO   = pos.find(p=>p.id===form.poId);
  const linkedEmps   = selectedPO ? (selectedPO.linkedEmployeeIds||[]).map(id=>employees.find(e=>e._id===id)).filter(Boolean) : [];
  const preVat       = linkedEmps.reduce((s,e)=>s+(+(e.clientPrice||e.totalPackage)||0),0);
  const vatCalc      = Math.round(preVat*0.15*100)/100;
  const vatAmt       = form.vatOverride!=="" ? (parseFloat(form.vatOverride)||0) : vatCalc;
  const total        = preVat + vatAmt;

  const fmtCandidates = emps => {
    if(!emps.length) return "—";
    if(emps.length===1) return emps[0].name;
    return `${emps[0].name} & ${emps.length-1} other${emps.length>2?"s":""}`;
  };

  const fmtInvDate = iso => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}).replace(/ /g,"-");
  };

  const buildInvoice = () => {
    if (!form.poId)          return alert("اختار PO الأول");
    if (!form.invoiceNumber) return alert("ادخل Invoice Number");
    if (linkedEmps.length===0) return alert("الـ PO مفيش موظفين linked. ارجع لـ PO Management وربط الموظفين.");
    const inv = {
      id:`inv-${Date.now()}`, poId:form.poId, poNumber:selectedPO.poNumber, client:selectedPO.client,
      invoiceNumber:form.invoiceNumber, invoiceDate:form.invoiceDate,
      candidateNames:fmtCandidates(linkedEmps),
      employees:linkedEmps.map(e=>({_id:e._id,name:e.name,totalPackage:e.totalPackage,clientPrice:e.clientPrice||e.totalPackage})),
      preVat, vat:vatAmt, total, status:"draft", createdAt:new Date().toISOString()
    };
    saveInvs([inv,...invoices]);
    setForm({ poId:"", invoiceNumber:"", invoiceDate:new Date().toISOString().split("T")[0], vatOverride:"" });
    setShowBuild(false);
  };

  const exportRow = inv => {
    const hdr = ["PO Number","Invoice Number","Invoice Date","Candidate Name(s)","Total Cost Pre-VAT (SAR)","VAT (SAR)","Total Amount (SAR)"];
    const row = [inv.poNumber, inv.invoiceNumber, fmtInvDate(inv.invoiceDate), inv.candidateNames,
      (+inv.preVat).toFixed(2), (+inv.vat).toFixed(2), (+inv.total).toFixed(2)];
    const csv = "\uFEFF" + [hdr,row].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download=`invoice_${inv.invoiceNumber}_${inv.poNumber}.csv`; a.click();
  };

  const exportAll = () => {
    if (!invoices.length) return;
    const hdr = ["PO Number","Invoice Number","Invoice Date","Candidate Name(s)","Total Cost Pre-VAT (SAR)","VAT (SAR)","Total Amount (SAR)"];
    const rows = invoices.map(inv=>[inv.poNumber,inv.invoiceNumber,fmtInvDate(inv.invoiceDate),inv.candidateNames,
      (+inv.preVat).toFixed(2),(+inv.vat).toFixed(2),(+inv.total).toFixed(2)]);
    const csv = "\uFEFF" + [hdr,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download=`invoices_${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const updateStatus = (id,status) => saveInvs(invoices.map(i=>i.id===id?{...i,status}:i));
  const deleteInv    = id => { if(window.confirm("حذف الفاتورة؟")) saveInvs(invoices.filter(i=>i.id!==id)); };

  const STC = { draft:["#f3f4f6","#374151"], sent:["#dbeafe","#1e40af"], paid:["#dcfce7","#166534"] };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{...s.flexBetween,flexWrap:"wrap",gap:8}}>
        <p style={{margin:0,fontSize:13,color:"#6b7280"}}>{invoices.length} invoices</p>
        <div style={{display:"flex",gap:8}}>
          {invoices.length>0 && <Btn variant="ghost" onClick={exportAll} style={s.btnSm}><Download size={13}/> Export All</Btn>}
          <Btn onClick={()=>setShowBuild(true)}><Plus size={14}/> Build Invoice</Btn>
        </div>
      </div>

      {invoices.length===0 && (
        <Card style={{padding:48,textAlign:"center"}}>
          <FileText size={32} style={{color:"#d1d5db",margin:"0 auto 12px",display:"block"}}/>
          <p style={{color:"#9ca3af",margin:0,fontSize:13}}>لا توجد فواتير. أنشئ أول فاتورة من PO.</p>
        </Card>
      )}

      {invoices.length>0 && (
        <Card style={{overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table className="fe-table" style={{...s.table,minWidth:860}}>
              <thead><tr>{["PO Number","Invoice #","Date","Candidate Name(s)","Pre-VAT (SAR)","VAT (SAR)","Total (SAR)","Status",""].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {invoices.map(inv=>{
                  const [bg,tc] = STC[inv.status]||STC.draft;
                  return (
                    <tr key={inv.id}>
                      <td style={s.td}><span style={{fontFamily:"monospace",fontWeight:700,color:M}}>{inv.poNumber}</span></td>
                      <td style={s.td}><span style={{fontFamily:"monospace",fontWeight:600}}>{inv.invoiceNumber}</span></td>
                      <td style={s.td}><span style={{fontSize:12,whiteSpace:"nowrap"}}>{fmt(inv.invoiceDate)}</span></td>
                      <td style={{...s.td,maxWidth:180}}><span style={{fontSize:12,display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{inv.candidateNames}</span></td>
                      <td style={s.td}><span style={{fontFamily:"monospace",fontWeight:600,fontSize:12}}>{(+inv.preVat).toLocaleString("en-US",{minimumFractionDigits:2})}</span></td>
                      <td style={s.td}><span style={{fontFamily:"monospace",fontSize:12,color:"#6b7280"}}>{(+inv.vat).toLocaleString("en-US",{minimumFractionDigits:2})}</span></td>
                      <td style={s.td}><span style={{fontFamily:"monospace",fontWeight:700,color:"#1f2937"}}>{(+inv.total).toLocaleString("en-US",{minimumFractionDigits:2})}</span></td>
                      <td style={s.td}>
                        <select value={inv.status} onChange={e=>updateStatus(inv.id,e.target.value)}
                          style={{padding:"3px 8px",borderRadius:999,border:`1px solid ${bg}`,cursor:"pointer",
                            fontSize:11,fontWeight:700,backgroundColor:bg,color:tc,outline:"none",textTransform:"capitalize"}}>
                          {["draft","sent","paid"].map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td style={s.td}>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>exportRow(inv)} title="Export CSV"
                            style={{padding:"4px 8px",borderRadius:6,border:"1px solid #e5e7eb",backgroundColor:"white",cursor:"pointer"}}>
                            <Download size={11}/>
                          </button>
                          <button onClick={()=>deleteInv(inv.id)}
                            style={{padding:"4px 8px",borderRadius:6,border:"1px solid #fecaca",backgroundColor:"#fef2f2",color:"#dc2626",cursor:"pointer"}}>
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showBuild && (
        <Modal title="🧾 Build Invoice" subtitle="Direct client billing" onClose={()=>setShowBuild(false)} wide>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Select PO</label>
                <select value={form.poId} onChange={e=>upd("poId",e.target.value)} style={s.sel}>
                  <option value="">— اختار PO —</option>
                  {pos.filter(p=>p.status==="active").map(p=>(
                    <option key={p.id} value={p.id}>{p.poNumber} · {p.client}</option>
                  ))}
                </select>
              </div>
              <Inp label="Invoice Number" value={form.invoiceNumber} onChange={v=>upd("invoiceNumber",v)} placeholder="2301082"/>
            </div>
            <div style={{maxWidth:220}}>
              <Inp label="Invoice Date" type="date" value={form.invoiceDate} onChange={v=>upd("invoiceDate",v)}/>
            </div>

            {selectedPO && (
              <div>
                <label style={s.label}>Employees on PO ({linkedEmps.length})</label>
                {linkedEmps.length===0
                  ? <p style={{fontSize:12,color:"#f59e0b",margin:"4px 0 0",padding:"10px 14px",backgroundColor:"#fffbeb",borderRadius:8,border:"1px solid #fde68a"}}>
                      ⚠ الـ PO مفيش موظفين linked. ارجع لتاب PO Management وربط الموظفين الأول.
                    </p>
                  : <div style={{border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden",marginTop:4}}>
                      <table className="fe-table" style={{...s.table,margin:0}}>
                        <thead><tr>{["Name","Position","Client Price (SAR)"].map(h=><th key={h} style={{...s.th,fontSize:10,padding:"6px 10px"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {linkedEmps.map(e=>(
                            <tr key={e._id}>
                              <td style={{...s.td,padding:"6px 10px"}}><span style={{fontSize:12,fontWeight:600}}>{e.name}</span></td>
                              <td style={{...s.td,padding:"6px 10px"}}><span style={{fontSize:11,color:"#6b7280"}}>{e.position}</span></td>
                              <td style={{...s.td,padding:"6px 10px"}}><span style={{fontFamily:"monospace",fontSize:12,fontWeight:700}}>{(e.clientPrice||e.totalPackage||0).toLocaleString()}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            )}

            {selectedPO && linkedEmps.length>0 && (
              <div style={{backgroundColor:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:12,padding:16}}>
                <p style={{fontWeight:700,fontSize:13,margin:"0 0 12px",color:"#1f2937"}}>🧾 Invoice Preview</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{...s.flexBetween}}>
                    <span style={{fontSize:12,color:"#6b7280"}}>Candidate Name(s)</span>
                    <span style={{fontSize:12,fontWeight:600,maxWidth:280,textAlign:"right"}}>{fmtCandidates(linkedEmps)}</span>
                  </div>
                  <div style={{...s.flexBetween}}>
                    <span style={{fontSize:12,color:"#6b7280"}}>Total Cost Pre-VAT</span>
                    <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700}}>{preVat.toLocaleString("en-US",{minimumFractionDigits:2})} SAR</span>
                  </div>
                  <div style={{...s.flexBetween,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#6b7280"}}>VAT (SAR) <span style={{color:"#9ca3af",fontSize:10}}>editable</span></span>
                    <input type="number" value={form.vatOverride!==""?form.vatOverride:vatCalc}
                      onChange={e=>upd("vatOverride",e.target.value)}
                      style={{...s.inp,width:130,fontFamily:"monospace",fontSize:12,fontWeight:600,textAlign:"right",padding:"5px 8px"}}/>
                  </div>
                  <div style={{...s.flexBetween,borderTop:"2px solid #e5e7eb",paddingTop:10,marginTop:4}}>
                    <span style={{fontSize:14,fontWeight:700}}>Total Amount (SAR)</span>
                    <span style={{fontFamily:"monospace",fontSize:16,fontWeight:900,color:M}}>{total.toLocaleString("en-US",{minimumFractionDigits:2})}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <Btn variant="ghost" onClick={()=>setShowBuild(false)}>Cancel</Btn>
              <Btn onClick={buildInvoice} disabled={!form.poId||!form.invoiceNumber||linkedEmps.length===0}>
                <Save size={14}/> Save Invoice
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Partner Flow Tab ────────────────────────────────────────────────────────
function PartnerFlowTab({ flows, saveFlows, employees }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ client:"Channel Play", partner:"Safwa", month:"", timesheetSent:false, partnerAmt:"", marginPct:15 });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const clientEmps  = employees.filter(e=>e.client===form.client && !isExcluded(e));
  const partnerAmt  = parseFloat(form.partnerAmt)||0;
  const marginAmt   = Math.round(partnerAmt*(parseFloat(form.marginPct)||0)/100*100)/100;
  const clientPreVat = partnerAmt + marginAmt;
  const vat         = Math.round(clientPreVat*0.15*100)/100;
  const clientTotal = clientPreVat + vat;

  const addFlow = () => {
    if (!form.month)       return alert("ادخل الشهر");
    if (!form.partnerAmt)  return alert("ادخل Partner Invoice Amount");
    saveFlows([{
      id:`flow-${Date.now()}`, client:form.client, partner:form.partner, month:form.month,
      timesheetSent:form.timesheetSent, partnerAmt, marginPct:parseFloat(form.marginPct)||0,
      marginAmt, clientPreVat, vat, clientTotal, employeeCount:clientEmps.length,
      status:"draft", createdAt:new Date().toISOString()
    }, ...flows]);
    setForm({ client:"Channel Play", partner:"Safwa", month:"", timesheetSent:false, partnerAmt:"", marginPct:15 });
    setShowAdd(false);
  };

  const updateStatus = (id,status) => saveFlows(flows.map(f=>f.id===id?{...f,status}:f));
  const toggleTS     = id => saveFlows(flows.map(f=>f.id===id?{...f,timesheetSent:!f.timesheetSent}:f));
  const deleteFlow   = id => { if(window.confirm("حذف الـ flow؟")) saveFlows(flows.filter(f=>f.id!==id)); };

  const exportFlow = flow => {
    const rows = [
      ["Month",flow.month],["Client",flow.client],["Partner",flow.partner],["Employees",flow.employeeCount],["",""],
      ["Partner Invoice (SAR)",(+flow.partnerAmt).toFixed(2)],[`Margin (${flow.marginPct}%)`,(+flow.marginAmt).toFixed(2)],
      ["Client Invoice Pre-VAT (SAR)",(+flow.clientPreVat).toFixed(2)],["VAT 15% (SAR)",(+flow.vat).toFixed(2)],
      ["Client Invoice Total (SAR)",(+flow.clientTotal).toFixed(2)],
    ];
    const csv = "\uFEFF" + rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download=`partner_flow_${flow.client}_${flow.month}.csv`; a.click();
  };

  const FLOW_STATUSES = ["draft","timesheet_sent","partner_invoiced","client_invoiced","reconciled"];
  const FLOW_STC = {
    draft:            ["#f3f4f6","#374151"],
    timesheet_sent:   ["#fef9c3","#854d0e"],
    partner_invoiced: ["#dbeafe","#1e40af"],
    client_invoiced:  ["#f3e8ff","#581c87"],
    reconciled:       ["#dcfce7","#166534"],
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{padding:14,borderRadius:12,backgroundColor:"#eff6ff",border:"1px solid #bfdbfe",fontSize:12,color:"#1e40af"}}>
        <p style={{fontWeight:700,margin:"0 0 4px"}}>🔄 Partner Flow — كيف يشتغل</p>
        <p style={{margin:0,lineHeight:1.7}}>
          ١. استقبل التايم شيت من العميل (Channel Play) &nbsp;→&nbsp;
          ٢. ارسله لـ Safwa &nbsp;→&nbsp;
          ٣. استلم فاتورة Safwa &nbsp;→&nbsp;
          ٤. أضف مارجنك &nbsp;→&nbsp;
          ٥. اصدر فاتورة للعميل
        </p>
      </div>

      <div style={{...s.flexBetween,flexWrap:"wrap",gap:8}}>
        <p style={{margin:0,fontSize:13,color:"#6b7280"}}>{flows.length} monthly flows</p>
        <Btn onClick={()=>setShowAdd(true)}><Plus size={14}/> New Monthly Flow</Btn>
      </div>

      {flows.length===0 && (
        <Card style={{padding:48,textAlign:"center"}}>
          <TrendingUp size={32} style={{color:"#d1d5db",margin:"0 auto 12px",display:"block"}}/>
          <p style={{color:"#9ca3af",margin:0,fontSize:13}}>لا توجد flows. أضف أول flow شهري.</p>
        </Card>
      )}

      {flows.map(flow=>{
        const [bg,tc] = FLOW_STC[flow.status]||FLOW_STC.draft;
        return (
          <Card key={flow.id} style={{padding:16}}>
            <div style={{...s.flexBetween,flexWrap:"wrap",gap:8,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontWeight:800,fontSize:15,color:"#1f2937"}}>{flow.month}</span>
                <ClientBadge client={flow.client}/>
                <span style={{fontSize:12,color:"#9ca3af"}}>→ {flow.partner}</span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <select value={flow.status} onChange={e=>updateStatus(flow.id,e.target.value)}
                  style={{padding:"4px 10px",borderRadius:999,border:`1px solid ${bg}`,cursor:"pointer",
                    fontSize:11,fontWeight:700,backgroundColor:bg,color:tc,outline:"none"}}>
                  {FLOW_STATUSES.map(o=><option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
                </select>
                <button onClick={()=>exportFlow(flow)} title="Export CSV"
                  style={{padding:"5px 9px",borderRadius:8,border:"1px solid #e5e7eb",backgroundColor:"white",cursor:"pointer"}}>
                  <Download size={12}/>
                </button>
                <button onClick={()=>deleteFlow(flow.id)}
                  style={{padding:"5px 9px",borderRadius:8,border:"1px solid #fecaca",backgroundColor:"#fef2f2",color:"#dc2626",cursor:"pointer"}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:8,marginBottom:12}}>
              {[
                {l:"👥 Employees",       v:flow.employeeCount},
                {l:"📥 Partner Invoice", v:(+flow.partnerAmt).toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"},
                {l:`📈 Margin ${flow.marginPct}%`, v:"+ "+(+flow.marginAmt).toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"},
                {l:"📤 Pre-VAT",         v:(+flow.clientPreVat).toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"},
                {l:"🧾 VAT 15%",         v:(+flow.vat).toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"},
                {l:"✅ Client Total",    v:(+flow.clientTotal).toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"},
              ].map(({l,v})=>(
                <div key={l} style={{padding:"8px 12px",backgroundColor:"#f9fafb",borderRadius:8,border:"1px solid #f3f4f6"}}>
                  <p style={{fontSize:10,color:"#6b7280",margin:"0 0 2px",fontWeight:600,whiteSpace:"nowrap"}}>{l}</p>
                  <p style={{fontSize:12,fontWeight:700,margin:0,fontFamily:"monospace",color:"#1f2937"}}>{v}</p>
                </div>
              ))}
            </div>

            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:"#374151"}}>
              <input type="checkbox" checked={!!flow.timesheetSent} onChange={()=>toggleTS(flow.id)}/>
              {flow.timesheetSent
                ? <span style={{color:"#16a34a",fontWeight:600}}>✅ تم إرسال التايم شيت لـ {flow.partner}</span>
                : <span style={{color:"#9ca3af"}}>⏳ التايم شيت لم يُرسل بعد</span>
              }
            </label>
          </Card>
        );
      })}

      {showAdd && (
        <Modal title="🔄 New Monthly Partner Flow" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Client</label>
                <select value={form.client} onChange={e=>upd("client",e.target.value)} style={s.sel}>
                  {CLIENTS_LIST.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Inp label="Partner" value={form.partner} onChange={v=>upd("partner",v)} placeholder="Safwa"/>
            </div>
            <Inp label="Month (e.g. Jan-26)" value={form.month} onChange={v=>upd("month",v)} placeholder="Jan-26"/>

            <div style={{padding:12,backgroundColor:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:10}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,fontWeight:500}}>
                <input type="checkbox" checked={form.timesheetSent} onChange={e=>upd("timesheetSent",e.target.checked)}/>
                ✅ تم إرسال التايم شيت للبارتنر ({form.partner})
              </label>
              <p style={{margin:"6px 0 0",fontSize:11,color:"#9ca3af"}}>
                عدد موظفين {form.client} الحاليين: <strong>{clientEmps.length}</strong>
              </p>
            </div>

            <div style={s.grid2}>
              <Inp label="Partner Invoice Amount (SAR)" type="number" value={form.partnerAmt} onChange={v=>upd("partnerAmt",v)} placeholder="45000"/>
              <Inp label="Your Margin %" type="number" value={form.marginPct} onChange={v=>upd("marginPct",v)} placeholder="15"/>
            </div>

            {partnerAmt>0 && (
              <div style={{backgroundColor:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:16}}>
                <p style={{fontWeight:700,fontSize:12,margin:"0 0 10px",color:"#166534"}}>📊 حساب الفاتورة</p>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    [`Partner Invoice (${form.partner})`, partnerAmt.toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"],
                    [`Margin (${form.marginPct}%)`, "+ "+marginAmt.toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"],
                    ["Client Invoice Pre-VAT",      clientPreVat.toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"],
                    ["VAT 15%",                     vat.toLocaleString("en-US",{minimumFractionDigits:2})+" SAR"],
                  ].map(([l,v])=>(
                    <div key={l} style={{...s.flexBetween}}>
                      <span style={{fontSize:12,color:"#4b5563"}}>{l}</span>
                      <span style={{fontFamily:"monospace",fontSize:12,fontWeight:600}}>{v}</span>
                    </div>
                  ))}
                  <div style={{...s.flexBetween,borderTop:"1px solid #bbf7d0",paddingTop:8,marginTop:4}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#166534"}}>إجمالي فاتورة {form.client}</span>
                    <span style={{fontFamily:"monospace",fontSize:15,fontWeight:900,color:"#166534"}}>{clientTotal.toLocaleString("en-US",{minimumFractionDigits:2})} SAR</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={addFlow}><Save size={14}/> Save Flow</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────
// ─── Notifications panel (sidebar footer bell) ─────────────────────────────
// Portaled to <body> so it always paints above page content, never behind
// it -- the sidebar sits inside its own stacking context, so a merely-high
// z-index isn't enough once another panel on the page has one of its own.
function NotificationsPanel({ anchorEl, notifications, onClose }) {
  const [pos, setPos] = useState(null);
  const width = 320;
  useLayoutEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    setPos({
      bottom: window.innerHeight - rect.top + 10,
      left: Math.min(rect.left, window.innerWidth - width - 8),
    });
  }, [anchorEl]);
  if (!pos) return null;
  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={onClose} />
      <div style={{
        position: "fixed", bottom: pos.bottom, left: pos.left, width,
        backgroundColor: "white", borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)", border: "1px solid #e5e7eb",
        zIndex: 300, overflow: "hidden",
      }}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <p style={{margin:0,fontWeight:700,fontSize:13}}>التنبيهات</p>
          <span style={{fontSize:11,color:"#9ca3af"}}>{notifications.length} تنبيه</span>
        </div>
        <div style={{maxHeight:360,overflowY:"auto"}}>
          {notifications.length === 0
            ? <p style={{padding:"24px",textAlign:"center",color:"#9ca3af",fontSize:12}}>لا توجد تنبيهات</p>
            : notifications.map(n => (
                <div key={n.id} style={{padding:"12px 16px",borderBottom:"1px solid #f9fafb",display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",backgroundColor: n.type==='warning'?"#f59e0b":"#3b82f6",flexShrink:0,marginTop:4}}/>
                  <div>
                    <p style={{margin:0,fontWeight:600,fontSize:12,color:"#1f2937"}}>{n.title}</p>
                    <p style={{margin:"2px 0 0",fontSize:11,color:"#6b7280"}}>{n.message}</p>
                    <p style={{margin:"2px 0 0",fontSize:10,color:"#9ca3af"}}>{n.client}</p>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </>,
    document.body
  );
}

function FisheyeOpsPro({ employees, setEmployees }) {
  const bellRef = useRef(null); // anchors the portaled NotificationsPanel
  const { session, profile } = useAuth();
  const isViewer = profile?.role === 'viewer';
  const [isLoading, setIsLoading] = useState(true);

  // Keep the CLIENTS_LIST/CLIENT_META roster in sync with real employee data
  // on every change (initial load, CSV import, bulk edit, Reconcile, ...) --
  // see syncClientRosterWithEmployees() above for why this exists.
  useEffect(() => { syncClientRosterWithEmployees(employees); }, [employees]);

  const [clients, setClients] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fisheyeClients_v1")) || DEF_CLIENTS; }
    catch { return DEF_CLIENTS; }
  });
  const saveClients = c => {
    setClients(c);
    localStorage.setItem("fisheyeClients_v1", JSON.stringify(c));
    supabase.from('fisheye_app_data').upsert({ key: 'fisheyeClients_v1', data: c }, { onConflict: 'key' })
      .then(({ error }) => {
        if (error) {
          console.warn('saveClients sync error:', error.message);
          // The edit is safe in this tab (state + localStorage), but it
          // hasn't reached the cloud -- if this tab is refreshed before a
          // retry succeeds, the startup load will silently pull the old
          // copy back down. Make that risk visible instead of hiding it.
          alert("⚠️ التعديل محفوظ على الشاشة دي بس مارفعش للسحابة (" + error.message + ") — متعمليش Refresh دلوقتي، وجرّبي تاني كمان شوية.");
        }
      });
  };

  // `clients` here is Client Hub's PROFILE list (name/region/contacts/notes) -- a totally
  // separate, manually-curated array from CLIENTS_LIST/employees_master.client (see
  // syncClientRosterWithEmployees above). Nothing ever auto-added a profile record here, so a
  // real client only ever showed up in Client Hub if someone had clicked "+Add Client" for it
  // by hand -- which is why clients with hundreds of real employees (SPL, Combuzz, ...) were
  // simply missing from the list, not filtered out. Auto-create a bare stub profile (empty
  // contacts/notes, still fully editable in the UI) for every real client name on an employee
  // record that doesn't already match an existing profile via sameClientName. Additive only:
  // this never edits or removes an existing profile, so manually-entered contacts/notes/colors
  // are never touched.
  useEffect(() => {
    if (!Array.isArray(employees) || !employees.length) return;
    const distinctNames = [...new Set(employees.map(e => (e.client || "").trim()).filter(Boolean))];
    const missing = distinctNames.filter(name => !clients.some(c => sameClientName(c.name, name)));
    if (!missing.length) return;
    const stamp = Date.now().toString(36).toUpperCase();
    const stubs = missing.map((name, i) => ({
      id: `C-AUTO-${stamp}-${i}`,
      name,
      region: "",
      email: "",
      status: "active",
      contacts: [],
      notes: "",
      requestLog: [],
    }));
    saveClients([...clients, ...stubs]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees]);

  const [partners, setPartners] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fisheyePartners_v1")) || DEF_PARTNERS; }
    catch { return DEF_PARTNERS; }
  });
  const savePartners = p => {
    setPartners(p);
    localStorage.setItem("fisheyePartners_v1", JSON.stringify(p));
    supabase.from('fisheye_app_data').upsert({ key: 'fisheyePartners_v1', data: p }, { onConflict: 'key' })
      .then(({ error }) => {
        if (error) {
          console.warn('savePartners sync error:', error.message);
          alert("⚠️ التعديل محفوظ على الشاشة دي بس مارفعش للسحابة (" + error.message + ") — متعمليش Refresh دلوقتي، وجرّبي تاني كمان شوية.");
        }
      });
  };


  const [nav, setNav]   = useState(() => localStorage.getItem("fisheye_nav") || "action");
  const [open, setOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalSearch, setGlobalSearch]   = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [pendingOpenEmpId, setPendingOpenEmpId] = useState(null);
  const [pendingOpenPO,    setPendingOpenPO]    = useState(null);

  // ── Global Search Results ────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    // Employees
    const empHits = employees
      .filter(e =>
        (e.name       || "").toLowerCase().includes(q) ||
        (e.client     || "").toLowerCase().includes(q) ||
        (e.position   || "").toLowerCase().includes(q) ||
        (e.employeeId || "").toLowerCase().includes(q) ||
        (e.poNumbers  || "").toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map(e => ({ type:"employee", id:e._id, title:e.name, sub:`${e.client || "—"} · ${e.position || "—"}`, nav:"workforce" }));

    // Clients
    let clientHits = [];
    try {
      const cls = JSON.parse(localStorage.getItem("fisheyeClients_v1") || "[]");
      clientHits = cls
        .filter(c => (c.name || "").toLowerCase().includes(q))
        .slice(0, 2)
        .map(c => ({ type:"client", id:c.id, title:c.name, sub:"Client", nav:"clients" }));
    } catch {}

    // Invoices
    let invHits = [];
    let invs = [];
    try {
      invs = JSON.parse(localStorage.getItem("fisheye_invoices_v1") || "[]");
      invHits = invs
        .filter(i =>
          (i.invoiceNumber || "").toLowerCase().includes(q) ||
          (i.poNumber      || "").toLowerCase().includes(q) ||
          (i.candidateNames|| "").toLowerCase().includes(q)
        )
        .slice(0, 3)
        .map(i => ({ type:"invoice", id:i.id, title:i.invoiceNumber || i.poNumber, sub:`${i.poNumber || "—"} · ${i.candidateNames || "—"} · ${i.status || "—"}`, nav:"finance" }));
    } catch {}

    // PO — aggregate: show PO summary card if query looks like a PO number
    let poHits = [];
    const isPOQuery = /po[-\s]?\d{3,}/i.test(q) || /^\d{4,}$/.test(q);
    if (isPOQuery) {
      // Find all employees with this PO
      const poEmps = employees.filter(e => (e.poNumbers || "").toLowerCase().includes(q));
      // Find all invoices with this PO
      const poInvs = invs.filter(i => (i.poNumber || "").toLowerCase().includes(q));
      // Unique PO numbers matching
      const matchedPOs = [...new Set([
        ...poEmps.flatMap(e => String(e.poNumbers||"").split(/[,;\n]/).map(p=>p.trim()).filter(p=>p.toLowerCase().includes(q))),
        ...poInvs.map(i => i.poNumber).filter(Boolean),
      ])];
      matchedPOs.slice(0, 2).forEach(po => {
        const empsForPO = employees.filter(e => (e.poNumbers||"").toLowerCase().includes(po.toLowerCase()));
        const invsForPO = poInvs.filter(i => (i.poNumber||"").toLowerCase() === po.toLowerCase());
        const totalInvoiced = invsForPO.reduce((s,i) => s + Number(i.totalDue||0), 0);
        poHits.push({
          type:"po",
          id:`po-${po}`,
          title:po.toUpperCase(),
          sub:`${empsForPO.length} موظف · ${invsForPO.length} فاتورة · SAR ${totalInvoiced.toLocaleString("en-SA",{maximumFractionDigits:0})}`,
          nav:"finance",
        });
      });
    }

    return [...poHits, ...empHits, ...clientHits, ...invHits];
  }, [globalSearch, employees]);

  // Notifications
  const notifications = useMemo(() => {
    const items = [];
    employees.forEach(e => {
      const d = daysUntil(e.endDate);
      if (d >= 0 && d <= 30 && !isExcluded(e)) {
        items.push({
          id: `exp-${e._id}`, type: 'warning',
          title: 'عقد قريب الانتهاء',
          message: `${e.name} · ${d === 0 ? 'اليوم' : `${d} يوم`}`,
          client: e.client,
        });
      }
    });
    employees.forEach(e => {
      if (e.workflowStatus === 'Onboarding') {
        const done = Object.values(e.onboardingSteps || {}).filter(Boolean).length;
        if (done < 5) {
          items.push({
            id: `onb-${e._id}`, type: 'info',
            title: 'Onboarding ناقص',
            message: `${e.name} · ${done}/5 خطوات`,
            client: e.client,
          });
        }
      }
    });
    return items;
  }, [employees]);

  // Supabase Sync
  const {
    syncStatus, syncMessage, lastSync, syncProgress,
    isOnline, uploadToCloud, downloadFromCloud, backup, bidirectionalSync,
  } = useSupabaseSync(employees, setEmployees);

  // ── Load ALL app data from Supabase on startup ───────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load general app data (invoices, clients, partners, reminders, etc.)
        const { data: appData } = await supabase.from('fisheye_app_data').select('*');
        if (appData && appData.length > 0) {
          appData.forEach(({ key, data }) => {
            if (key === 'fisheye_payroll_flow_v1') {
              // Merge payroll flow: Supabase is the base, local always wins
              // This lets Vercel (empty localStorage) get full data from Supabase
              // while local browser's own toggles are never overwritten
              const existing = (() => {
                try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
              })();
              const merged = { ...data, ...existing }; // local wins
              try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
              return;
            }
            try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
          });
          console.log(`✅ Loaded ${appData.length} data keys from Supabase`);
          // Update clients and partners state from freshly loaded localStorage
          try {
            const c = JSON.parse(localStorage.getItem('fisheyeClients_v1'));
            if (c && c.length > 0) setClients(c);
          } catch {}
          try {
            const p = JSON.parse(localStorage.getItem('fisheyePartners_v1'));
            if (p && p.length > 0) setPartners(p);
          } catch {}
        }

        // 2. Load employees
        const { data, error } = await supabase.from('employees_master').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          // Auto-expire: any employee whose endDate has passed and isn't already expired/resigned
          const todayStr = new Date().toISOString().split('T')[0];
          const toExpire = data.filter(e =>
            e.endDate && e.endDate < todayStr &&
            e.status !== 'expired' && e.status !== 'resigned'
          );
          if (toExpire.length > 0) {
            console.log(`⏰ Auto-expiring ${toExpire.length} employees with past end dates`);
            // Batch update in Supabase
            const expiredIds = toExpire.map(e => e._id);
            await supabase
              .from('employees_master')
              .update({ status: 'expired' })
              .in('_id', expiredIds);
            // Update local data array too
            toExpire.forEach(e => { e.status = 'expired'; });
          }
          setEmployees(data);
          localStorage.setItem("fisheyeData_v3", JSON.stringify(data));
        } else {
          const local = localStorage.getItem("fisheyeData_v3");
          if (local) setEmployees(JSON.parse(local));
        }
      } catch (err) {
        console.error("Error loading data from Supabase:", err.message);
        const local = localStorage.getItem("fisheyeData_v3");
        if (local) setEmployees(JSON.parse(local));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const channel = supabase
      .channel('employees_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees_master' }, (payload) => {
        if (payload.eventType === 'INSERT') setEmployees(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') setEmployees(prev => prev.map(e => e._id === payload.new._id ? payload.new : e));
        else if (payload.eventType === 'DELETE') setEmployees(prev => prev.filter(e => e._id !== payload.old._id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Test Supabase connection
  useEffect(() => {
    testConnection().then(r => r.success && console.log('✅ متصل بـ Supabase'));
  }, []);

  // ── Daily Contract Expiry Notification ──────────────────────────────────────
  useEffect(() => {
    if (!employees.length) return;
    const today = new Date().toISOString().split('T')[0];
    const lastNotified = localStorage.getItem('fisheye_last_notif_date');
    if (lastNotified === today) return; // already notified today

    const expiring = employees.filter(e => {
      if (isExcluded(e)) return false;
      const d = daysUntil(e.endDate);
      return d >= 0 && d <= 30;
    }).sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate));

    if (!expiring.length) return;

    localStorage.setItem('fisheye_last_notif_date', today);

    // Browser notification
    const sendBrowserNotif = () => {
      const urgent = expiring.filter(e => daysUntil(e.endDate) <= 7);
      const title  = urgent.length
        ? `🚨 ${urgent.length} عقود تنتهي خلال 7 أيام!`
        : `⚠️ ${expiring.length} عقود تنتهي خلال 30 يوم`;
      const body = expiring.slice(0, 3).map(e => `• ${e.name} (${daysUntil(e.endDate)} يوم)`).join('\n')
        + (expiring.length > 3 ? `\n+ ${expiring.length - 3} آخرين` : '');
      new Notification(title, { body, icon: '/favicon.ico' });
    };

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        sendBrowserNotif();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') sendBrowserNotif(); });
      }
    }
  }, [employees]);

  // ── Sidebar badges (must be before any early return) ─────────────────────
  const workforceBadge = useMemo(() =>
    employees.filter(e => { const d = daysUntil(e.endDate); return d >= 0 && d <= 30 && !isExcluded(e); }).length
  , [employees]);

  const financeBadge = useMemo(() => {
    let count = 0;
    const now = new Date();
    const day = now.getDate();
    // Missing salary: window day 25 → day 5 only
    // Only flag employees who had salary marked last month (actively tracked in the flow)
    // — avoids counting employees who were never entered into the payroll flow at all
    if (day >= 25 || day <= 5) {
      const salaryMonthDate = day <= 5
        ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
        : now;
      const salaryMonthKey = `${salaryMonthDate.getFullYear()}-${String(salaryMonthDate.getMonth()+1).padStart(2,'0')}`;
      // previous month = one month before the salary month being checked
      const prevMonthDate = new Date(salaryMonthDate.getFullYear(), salaryMonthDate.getMonth() - 1, 1);
      const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth()+1).padStart(2,'0')}`;
      let flows = {};
      try { flows = JSON.parse(localStorage.getItem('fisheye_payroll_flow_v1') || '{}'); } catch {}
      const sk2 = (e) => (e.name || '').trim().toLowerCase().replace(/\s+/g, '_') || String(e._id);
      // Only flag if there's already a flow entry this month (you've started processing)
      // but salary is not checked yet — catches "forgot one mid-cycle", not "haven't started yet"
      count += employees.filter(e => {
        if (isExcluded(e)) return false;
        const thisFlow = flows[`${salaryMonthKey}_${sk2(e)}`];
        return thisFlow !== undefined && !thisFlow.salary;
      }).length;
    }
    // Salary paid but invoice NOT sent — count UNIQUE employees across last 3 months
    // (one employee with 3 un-invoiced months = 1, not 3)
    let flows2 = {};
    try { flows2 = JSON.parse(localStorage.getItem('fisheye_payroll_flow_v1') || '{}'); } catch {}
    const activeEmps = employees.filter(e => !isExcluded(e));
    const sk3 = (e) => (e.name || '').trim().toLowerCase().replace(/\s+/g, '_') || String(e._id);
    const uninvoicedNames = new Set();
    for (let m = 0; m < 3; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      activeEmps.forEach(e => {
        const f = flows2[`${mk}_${sk3(e)}`] || {};
        if (f.salary && !f.invoice) uninvoicedNames.add(sk3(e));
      });
    }
    count += uninvoicedNames.size;
    // Negative net profit: partner payout exceeds gross margin
    count += activeEmps.filter(e => {
      if (e.profitMode !== 'partner') return false;
      const totalPkg = Number(e.totalPackage || 0);
      const pValue = Number(e.clientPrice || 0);
      const margin = e.clientPriceType === 'percent' ? (pValue / 100) * totalPkg : pValue;
      const payout = e.partnerCostType === 'percent'
        ? Math.round((Number(e.partnerCost || 0) / 100) * totalPkg)
        : Number(e.partnerCost || 0);
      return margin - payout < 0;
    }).length;
    // Unpaid invoices: overdue (>30 days) but recent enough to be actionable (<90 days)
    // Invoices older than 90 days are considered stale/handled — don't inflate the badge
    let invoices = [];
    try { invoices = JSON.parse(localStorage.getItem('fisheye_invoices_v1') || '[]'); } catch {}
    count += invoices.filter(inv => {
      const st = (inv.status || '').toLowerCase();
      if (['paid','cancelled','credit note','credit_note'].includes(st)) return false;
      const d = new Date(inv.invoiceDate);
      if (isNaN(d)) return false;
      const ageDays = (now - d) / 86400000;
      return ageDays > 30 && ageDays <= 90;
    }).length;
    return count;
  }, [employees]);

  // Onboarding badge = employees actively in "Onboarding" workflow (same filter as the tab)
  const onboardingBadge = useMemo(() =>
    employees.filter(e => !isExcluded(e) && ["onboarding", "اونبوردينج", "تأهيل"].includes((e.workflowStatus || "").toLowerCase().trim())).length
  , [employees]);

  // Guard against a stale/removed nav value left over in localStorage from a
  // previous app version (e.g. a tab that no longer exists) — without this,
  // the page renders a blank content area with a stale header. Must run
  // unconditionally, before the isLoading/no-data early returns below, so
  // its hook call order never changes between renders. Keep this key list
  // in sync with navItems' k values below.
  useEffect(() => {
    const validNavKeys = ["action","workforce","clients","partners","onboarding","finance","bonus","weeklyreport","settings"];
    if (!validNavKeys.includes(nav)) {
      setNav("action");
      localStorage.setItem("fisheye_nav", "action");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── جاري التحميل من Supabase ──
  if (isLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, backgroundColor: "#0f172a" }}>
      <div style={{ width: 48, height: 48, border: "4px solid #334155", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>جاري تحميل البيانات من Supabase…</p>
    </div>
  );

  // ── لا توجد بيانات بعد التحميل → شاشة الرفع ──
  if (!employees || !employees.length) return (
    <UploadScreen onUpload={data => {
      localStorage.setItem("fisheyeData_v3", JSON.stringify(data));
      setEmployees(data);
    }}/>
  );

  const handleClear = () => {
    localStorage.removeItem("fisheyeData_v3");
    setEmployees([]);
  };

  const report      = buildReport(employees);
  const totalAlerts = employees.filter(e => { const d = daysUntil(e.endDate); return d >= 0 && d <= 30 && !isExcluded(e); }).length + report.pendingCount;

  const navItems = [
    { k:"action",       l:"Action Center",  i:Target,      section:null      },
    { k:"workforce",    l:"Employees",      i:Users,       section:"PEOPLE"  },
    { k:"clients",      l:"Clients",        i:Building2,   section:null      },
    { k:"partners",     l:"Partners",       i:Briefcase,   section:null      },
    { k:"onboarding",   l:"Onboarding",     i:UserPlus,    section:"OPS"     },
    { k:"finance",      l:"Finance",        i:Wallet,      section:null      },
    { k:"bonus",        l:"My Bonus",       i:Award,       section:null      },
    { k:"weeklyreport", l:"Reports",        i:FileText,    section:"INSIGHTS"},
    { k:"settings",     l:"Settings",       i:Settings,    section:"SYSTEM"  },
  ];

  const labels = {
    action:      "⚡ Action Center",
    calendar:    "📅 Operations Calendar",
    report:      "📋 Morning Report",
    workforce:   "👥 Workforce Explorer",
    clients:     "🏢 Client Command Center",
    partners:    "🤝 Partner Hub",
    finance:     "💳 Finance & Reconciliation",
    bonus:       "🏆 My Bonus — SIP Outsourcing Policy",
    billing:     "📄 Billing Flow",
    onboarding:  "🚀 Onboarding Tracker",
    escalations:  "🚨 Escalation Manager",
    weeklyreport: "📧 Weekly Client Reports",
    settlement:  "🤝 Partner Settlement",
    reports:     "📊 Weekly / Monthly Reports",
    tickets:     "🎫 Support Tickets",
    settings:    "⚙️ Settings",
  };

  const exportCSV = (data) => {
    const headers = ["Employee ID","Contract ID","Name","Position","Project","Client","Start Date","End Date","Total Package","Workflow Status","Status","PO Numbers","Invoice Numbers","Bank Name","IBAN Number","Requester Name"];
    const rows = (data || employees).map(e => [
      e.employeeId, e.contractId, e.name, e.position, e.project, e.client,
      e.startDate, e.endDate, e.totalPackage, e.workflowStatus, e.status,
      e.poNumbers, e.invoiceNumbers, e.bank, e.iban, e.requesterName
    ]);
    const csv = "﻿" + [headers, ...rows].map(r => r.map(v => `"${v||""}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "employees_export.csv";
    a.click();
  };

  return (
    <div style={s.appShell}>
      {/* ── Sidebar ── */}
      <div style={s.sidebar(open)}>
        <div style={s.sidebarHeader}>
          {/* Fisheye brandmark symbol — bracket mark in crimson */}
          <div style={s.sidebarLogo}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="8" height="2" fill="white"/>
              <rect x="2" y="2" width="2" height="8" fill="white"/>
              <rect x="10" y="10" width="8" height="2" fill="white"/>
              <rect x="16" y="10" width="2" height="8" fill="white"/>
            </svg>
          </div>
          {open && <div style={{minWidth:0}}>
            <p style={{color:"white",fontWeight:800,fontSize:13,margin:0,lineHeight:1.2,letterSpacing:"-0.01em",fontFamily:"Georgia,serif"}}>Fisheye</p>
            <p style={{color:"rgba(160,210,230,0.5)",fontSize:9,margin:"2px 0 0",fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase"}}>Executive Search · ERP</p>
          </div>}
        </div>
        <div style={{height:2,background:"linear-gradient(90deg, #A02843 0%, rgba(160,40,67,0) 65%)",flexShrink:0}}/>
        {open && (
          <div style={s.sidebarBadge}>
            <div style={s.sidebarBadgeInner}>
              <FileText size={12} style={{color:"oklch(70% 0.12 152)",flexShrink:0}}/>
              <span style={{color:"white",fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {employees.length} contracts
              </span>
              <div style={{...s.sidebarDot,marginLeft:"auto"}} className="fe-pulse"/>
            </div>
          </div>
        )}
        {/* ── Global Search ── */}
        {open && (
          <div style={{ padding: "0 9px 8px", position: "relative" }}>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.45)", pointerEvents:"none" }}/>
              <input
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
                placeholder="Search employees, clients, invoices…"
                className="fe-sidebar-search"
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:"rgba(255,255,255,0.09)", border:"1px solid rgba(255,255,255,0.13)",
                  borderRadius:8, padding:"7px 8px 7px 28px",
                  color:"white", fontSize:12, fontFamily:"var(--font-sans)",
                }}
              />
            </div>
            {searchFocused && searchResults.length > 0 && (
              <div style={{
                position:"absolute", top:"calc(100% + 4px)", left:9, right:9, zIndex:999,
                background:"white", borderRadius:11, boxShadow:"0 12px 32px rgba(0,0,0,0.18)",
                border:"1px solid var(--border,#e5e7eb)", overflow:"hidden",
              }}>
                {searchResults.map(r => {
                  const typeIcon = r.type === "employee" ? "👤" : r.type === "client" ? "🏢" : r.type === "po" ? "📋" : "🧾";
                  const typeColor = r.type === "employee" ? "#A02843" : r.type === "client" ? "#00293A" : r.type === "po" ? "#7c3aed" : "#0369a1";
                  return (
                    <button key={r.id} onMouseDown={() => {
                      setNav(r.nav);
                      localStorage.setItem("fisheye_nav", r.nav);
                      setGlobalSearch("");
                      if (r.type === "employee") setPendingOpenEmpId(r.id);
                      if (r.type === "po") setPendingOpenPO(r.title);
                    }}
                    className="fe-search-result"
                    style={{ display:"flex", alignItems:"center", gap:10, width:"100%", textAlign:"left", padding:"9px 13px", background:"none", border:"none", borderBottom:"1px solid #f5f5f6", cursor:"pointer" }}
                    >
                      <span style={{fontSize:14, flexShrink:0}}>{typeIcon}</span>
                      <div style={{minWidth:0}}>
                        <p style={{margin:0,fontSize:12,fontWeight:700,color:"#111827",letterSpacing:"-0.01em",fontFamily:"var(--font-sans)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</p>
                        <p style={{margin:"1px 0 0",fontSize:11,color:"#6b7280",fontFamily:"var(--font-sans)"}}>{r.sub}</p>
                      </div>
                      <span style={{marginLeft:"auto",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,backgroundColor:`${typeColor}12`,color:typeColor,flexShrink:0,textTransform:"uppercase"}}>{r.type}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {searchFocused && globalSearch.length >= 2 && searchResults.length === 0 && (
              <div style={{
                position:"absolute", top:"calc(100% + 4px)", left:9, right:9, zIndex:999,
                background:"white", borderRadius:11, boxShadow:"0 12px 32px rgba(0,0,0,0.18)",
                border:"1px solid var(--border,#e5e7eb)", padding:"14px 13px", textAlign:"center",
              }}>
                <p style={{margin:0,fontSize:12,color:"#9ca3af",fontFamily:"var(--font-sans)"}}>No results found</p>
              </div>
            )}
          </div>
        )}

        <nav style={s.sidebarNav}>
          {navItems.map(({k, l, i:Icon, section}) => {
            const isA   = nav === k;
            const badge = k==="action"     ? totalAlerts
                        : k==="workforce"  ? workforceBadge
                        : k==="finance"    ? financeBadge
                        : k==="onboarding" ? onboardingBadge
                        : k==="report"     ? report.pendingCount
                        : 0;
            // Badge color follows what the number MEANS, not one loud color
            // for every number: "action" is the whole backlog (brand
            // crimson); "workforce"/"finance" are things that need attention
            // (contracts expiring soon / payroll blockers) so they get the
            // warning tone; everything else is a quiet status count.
            const badgeKind  = k==="action" ? "total" : (k==="workforce" || k==="finance") ? "warn" : "count";
            const badgeStyle = badgeKind==="total" ? s.navBadgeTotal : badgeKind==="warn" ? s.navBadgeWarn : s.navBadgeCount;
            return (
              <React.Fragment key={k}>
                {section && open && (
                  <div style={{display:"flex",alignItems:"center",gap:6,margin:"14px 0 4px",paddingLeft:12}}>
                    <span style={{width:10,height:2,borderRadius:2,backgroundColor:"#A02843",opacity:0.55,flexShrink:0}}/>
                    <p style={{fontSize:9,fontWeight:700,color:"rgba(160,210,230,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",margin:0,fontFamily:"var(--font-sans)"}}>{section}</p>
                  </div>
                )}
                {section && !open && (
                  <div style={{height:1,margin:"8px 4px",backgroundColor:"rgba(255,255,255,0.07)"}}/>
                )}
                <button
                  onClick={() => { setNav(k); localStorage.setItem("fisheye_nav", k); }}
                  className={`fe-nav-btn${isA?" fe-nav-active":""}`}
                  style={s.navBtn(isA)}
                  title={!open ? l : undefined}
                >
                  <Icon size={15} style={{flexShrink:0, color: isA ? "white" : "rgba(160,210,230,0.6)"}}/>
                  {open && <span style={{flex:1,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis"}}>{l}</span>}
                  {open && badge > 0 && <span key={badge} className="fe-notif-badge fe-badge-pop" style={badgeStyle}>{badge}</span>}
                  {!open && badge > 0 && <span key={badge} className="fe-badge-pop" style={{...badgeStyle,position:"absolute",top:4,right:4,fontSize:8,padding:"1px 4px"}}>{badge}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
        <div style={s.sidebarFooter}>
          {open ? (
            <div style={{display:"flex",alignItems:"center",gap:8}} title={`${isViewer ? "Viewer" : "Admin"} · Fisheye Admin · Super Admin`}>
              <div style={{position:"relative",width:28,height:28,borderRadius:8,backgroundColor:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:900,flexShrink:0}}>
                FO
                <span style={{position:"absolute",bottom:-1,right:-1,width:8,height:8,borderRadius:"50%",backgroundColor:"oklch(70% 0.12 152)",border:"1.5px solid #00293A"}}/>
              </div>
              <p style={{flex:1,minWidth:0,margin:0,fontSize:11,fontWeight:700,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Fisheye Admin</p>
              <div style={{position:"relative"}} ref={bellRef}>
                <Bell size={14}
                  style={{color: notifications.length > 0 ? "#ff8fa3" : "rgba(160,210,230,0.5)", cursor:"pointer"}}
                  onClick={() => setShowNotifications(p => !p)}/>
                {notifications.length > 0 && (
                  <span style={{position:"absolute",top:-6,right:-6,width:14,height:14,borderRadius:"50%",backgroundColor:M,color:"white",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {notifications.length > 99 ? "99+" : notifications.length}
                  </span>
                )}
                {showNotifications && (
                  <NotificationsPanel
                    anchorEl={bellRef.current}
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                title="تسجيل خروج"
                style={{display:"flex",alignItems:"center",border:"none",background:"none",cursor:"pointer",color:"#ff8fa3",padding:0,flexShrink:0}}
              ><LogOut size={14}/></button>
            </div>
          ) : (
            <div style={{position:"relative", display:"flex", justifyContent:"center"}} title={`Fisheye Admin · Super Admin${notifications.length ? ` · ${notifications.length} notifications` : ""}`}>
              <div style={{width:28,height:28,borderRadius:8,backgroundColor:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:900}}>FO</div>
              {notifications.length > 0 && (
                <span style={{position:"absolute",top:-4,right:-4,width:12,height:12,borderRadius:"50%",backgroundColor:M,border:"2px solid #00293A"}}/>
              )}
            </div>
          )}
        </div>
        <div style={s.sidebarToggle}>
          <button onClick={() => setOpen(p => !p)} className="fe-toggle-btn" style={s.toggleBtn}><Menu size={15}/></button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={s.main}>
        {/* Page title — the Admin/notifications/logout/user cluster that used
             to live in a topbar here has moved to the sidebar footer (see
             sidebarFooter below); it's global chrome, not something that
             needs to repeat above the content on every single screen. */}
        {!["action","finance","billing","weeklyreport","workforce"].includes(nav) && (
          <div style={s.topbar} className="fe-topbar">
            <h1 style={{margin:0,fontSize:15,fontWeight:700,color:"#111827",letterSpacing:"-0.02em",fontFamily:"var(--font-sans)"}}>{labels[nav] || nav}</h1>
          </div>
        )}

        {/* ── Content ── */}
        <div id="app-main-content" style={s.content} className="fe-scroll">
          <div key={nav} className="fe-page">

          {/* ── ACTION CENTER ── */}
          {nav==="action" && <ActionCenter
            employees={employees}
            setEmployees={setEmployees}
            clients={clients}
            partners={partners}
            onNavigate={k => { setNav(k); localStorage.setItem("fisheye_nav", k); }}
            onOpenEmployee={emp => {
              setNav("workforce");
              localStorage.setItem("fisheye_nav", "workforce");
              setPendingOpenEmpId(emp._id);
            }}
          />}

          {/* ── ENTITY VIEWS ── */}
          {nav==="workforce"  && <WorkforceView employees={employees} setEmployees={setEmployees} partners={partners} clients={clients} exportCSV={exportCSV} pendingOpenEmpId={pendingOpenEmpId} onPendingOpenHandled={() => setPendingOpenEmpId(null)}/>}
          {nav==="clients"    && <ClientHub employees={employees} clients={clients} saveClients={saveClients}/>}
          {nav==="partners"   && <PartnerHub employees={employees} partners={partners} savePartners={savePartners}/>}

          {/* ── FINANCE (consolidated: Payroll · Billing · Settlements) ── */}
          {nav==="finance" && <FinanceModule employees={employees} setEmployees={setEmployees} onNav={k => { setNav(k); localStorage.setItem("fisheye_nav", k); }} pendingOpenPO={pendingOpenPO} onPendingPOHandled={() => setPendingOpenPO(null)}/>}

          {/* ── MY BONUS (SIP Outsourcing Policy) ── */}
          {nav==="bonus" && <BonusSIP employees={employees} embedded/>}

          {/* ── ONBOARDING ── */}
          {nav==="onboarding" && <OnboardingModule employees={employees} setEmployees={setEmployees} partners={partners}/>}

          {/* ── ANALYTICS ── */}

          {/* ── SETTINGS ── */}
          {nav==="settings" && <SettingsView
            onClear={handleClear}
            empCount={employees?.length || 0}
            syncStatus={syncStatus}
            syncMessage={syncMessage}
            lastSync={lastSync}
            syncProgress={syncProgress}
            isOnline={isOnline}
            uploadToCloud={uploadToCloud}
            downloadFromCloud={downloadFromCloud}
            backup={backup}
            bidirectionalSync={bidirectionalSync}
            employees={employees}
            setEmployees={setEmployees}
            clients={clients}
            saveClients={saveClients}
          />}

          {/* ── DEEP LINKS (accessible via URL/nav programmatically, not in sidebar) ── */}
          {nav==="weeklyreport"&& <WeeklyReportGenerator employees={employees}/>}
          {nav==="reports"     && <WeeklyMonthlyReports employees={employees}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────
export default function App() {
  const [employees, setEmployees] = useState([]);
  const [partners, setPartners]   = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: empData } = await supabase
        .from('employees_master')
        .select('*')
        .order('_id', { ascending: true });
      if (empData) setEmployees(empData);

      const { data: partData } = await supabase
        .from('partners')
        .select('id, name');
      if (partData) setPartners(partData);
    };
    fetchInitialData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no login required, but scoped to safe fields only (see ClientPortal.jsx / PartnerPortal.jsx) */}
        <Route path="/partner/:partnerId" element={<PartnerPortal/>}/>
        <Route path="/client/:clientName"  element={<ClientPortal/>}/>
        {/* Internal — requires an @fisheye.sa login (see AuthGate.jsx) */}
        <Route path="/my-bonus" element={<AuthGate><BonusSIP employees={employees}/></AuthGate>}/>
        {/* Design system review page — internal only, no real data. See DESIGN_SYSTEM.md. */}
        <Route path="/style-guide" element={<AuthGate><StyleGuide/></AuthGate>}/>
        <Route path="/*" element={<AuthGate><FisheyeOpsPro employees={employees} setEmployees={setEmployees}/></AuthGate>}/>
      </Routes>
    </BrowserRouter>
  );
}