import React, { useState, useEffect, useRef, useMemo } from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceModule } from './FinanceModule';
import ClientPortal from './ClientPortal';
import PartnerPortal from './PartnerPortal';
import { OnboardingModule } from './modules/onboarding';
import { AnalyticsDashboard } from './Analyticsdashboard';
import WeeklyMonthlyReports from './Weeklymonthlyreports';
import WeeklyReportGenerator from './Weeklyreportgenerator';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { supabase, testConnection } from './utils/supabase';
import { isExcluded, isWFDone, hasMissingPO, hasValidPO, getClientsList } from './utils/helpers';
import {
  LayoutDashboard, Users, DollarSign, Ticket, Settings, Building2,
  Bell, Clock, FileText, Upload, Plus, X, Send, Eye,
  Search, Shield, User, TrendingUp, CheckCircle,
  Download, MessageCircle, Calendar, AlertCircle, Trash2, BarChart2,
  Menu, ChevronDown, Copy, Check, Mail, Filter, FileUp,
  Edit3, Save, Hash, Zap, ClipboardList, Briefcase, Archive, Globe, Link, Inbox, UserPlus, Database,
  Target, CalendarDays, Receipt, AlertTriangle, RefreshCw, GitBranch
} from "lucide-react";
import { ActionCenter } from './ActionCenterV2';
import { OperationsCalendar, ClientCommandCenter } from './Actioncenter'; // الباقي من القديم

// ملاحظة: إضافة الموظفين تتم من خلال handleAddSingle داخل WorkforceView
// WhatsApp Helper for Client Communications
const sendWhatsAppMessage = async (phone, message, clientName) => {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.length < 7) return;
  
  // CallMeBot Integration (Free WhatsApp API)
  // يمكنك الحصول على API key من: https://www.callmebot.com/en/
  const apiKey = '[3635248]'; // استخدم مفتاحك الفعلي
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  
  try {
    await fetch(url);
    console.log(`✅ WhatsApp sent to ${clientName}`);
    return true;
  } catch (error) {
    console.error('WhatsApp send failed:', error);
    return false;
  }
};
 
const M  = "#800000";
const MD = "#5c0000";
const ML = "#a83232";
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const CLIENTS_LIST = ["Sela","SPL","Channelplay","Riva Engineering 2","Combuzz HR"];
const CLIENT_META = {
  "Sela":               { badge:"#bbf7d0", text:"#14532d", dot:"#16a34a", phone:"" },
  "SPL":                { badge:"#e9d5ff", text:"#4c1d95", dot:"#7c3aed", phone:"" },
  "Channelplay":        { badge:"#bfdbfe", text:"#1e3a8a", dot:"#2563eb", phone:"" },
  "Riva Engineering 2": { badge:"#fecdd3", text:"#881337", dot:M,         phone:"" },
  "Combuzz HR":         { badge:"#fed7aa", text:"#7c2d12", dot:"#ea580c", phone:"" },
};
const WORKFLOW_OPTS = [
  "Docs Requested","Docs Received","Docs Received +","Agreement Sent",
  "Agreement Signed","Pending","Complete","Rejected","Qiwa Submitted","Qiwa Approved", "Onboarding", "Iqama Transferred"
];
const STATUS_OPTS = ["active","new","renewal","transfer","expired","resigned"];
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
  const p = project.trim().toUpperCase();
  if (!p) return "Sela";
  if (p === "CEO") return "Riva Engineering 2";
  if (p.includes("SILQFI")) return "Channelplay";
  if (p.includes("SPL")) return "SPL";
  if (["MAVERIC","C5I","INSPIRING MINDS","SAUDI FRANSI"].some(k => p.includes(k))) return "Combuzz HR";
  return "Sela";
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
      project, client: mapClient(project),
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
    // Direct mode: Fisheye Margin * Total Package
    const marginType = e.fisheyeMarginType || "percent";
    if (marginType === "percent") {
      return Math.round((e.fisheyeMargin / 100) * e.totalPackage);
    } else {
      return e.fisheyeMargin; // Fixed amount
    }
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
  const selaPoAlert = employees.filter(e => e.client==="Sela" && !isExcluded(e) && hasMissingPO(e));
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
  sidebar: (open) => ({ width: open ? 204 : 58, flexShrink:0, display:"flex", flexDirection:"column", background:`linear-gradient(160deg,#3a0000 0%,${MD} 28%,${M} 62%,#8a1818 100%)`, transition:"width 280ms cubic-bezier(0.4,0,0.2,1)", overflow:"hidden" }),
  sidebarHeader: { padding:"17px 13px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 },
  sidebarLogo: { width:36, height:36, backgroundColor:"white", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 10px rgba(0,0,0,0.28)", flexShrink:0 },
  sidebarBadge: { padding:"8px 11px", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 },
  sidebarBadgeInner: { display:"flex", alignItems:"center", gap:8, backgroundColor:"rgba(255,255,255,0.09)", borderRadius:8, padding:"7px 10px" },
  sidebarDot: { width:7, height:7, borderRadius:"50%", backgroundColor:"#4ade80", flexShrink:0 },
  sidebarNav: { flex:1, overflowY:"auto", padding:"10px 7px" },
  navBtn: (active) => ({ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, marginBottom:2, backgroundColor: active ? "white" : "transparent", color: active ? M : "rgba(255,210,210,0.82)", whiteSpace:"nowrap", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)" }),
  navBadge: { fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:999, backgroundColor:"#fde047", color:"#713f12", marginLeft:"auto", letterSpacing:"0", fontFamily:"var(--font-mono)" },
  sidebarToggle: { padding:"7px 7px", borderTop:"1px solid rgba(255,255,255,0.08)", flexShrink:0 },
  toggleBtn: { width:"100%", padding:8, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"transparent", border:"none", cursor:"pointer", color:"rgba(255,200,200,0.55)", borderRadius:8, fontFamily:"inherit" },
  main: { flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" },
  topbar: { backgroundColor:"rgba(255,255,255,0.88)", borderBottom:"1px solid rgba(228,228,231,0.7)", padding:"11px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" },
  content: { flex:1, overflowY:"auto", padding:"20px 24px", background:"var(--surface-sub,#f8f8f9)" },
  // Cards
  card: { backgroundColor:"white", borderRadius:13, border:"1px solid var(--border,#e4e4e7)", boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)" },
  statCard: { backgroundColor:"white", borderRadius:13, border:"1px solid var(--border,#e4e4e7)", boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)", padding:16 },
  // Buttons
  btnPrimary: { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", backgroundColor:M, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)" },
  btnGhost:   { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", backgroundColor:"white", color:"#3f3f46", border:"1px solid var(--border,#e4e4e7)", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)" },
  btnDanger:  { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", backgroundColor:"#b91c1c", color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"-0.01em", fontFamily:"var(--font-sans)" },
  btnSm: { padding:"5px 11px", fontSize:12 },
  // Table
  table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th: { padding:"11px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:"0.07em", backgroundColor:"#fafafa", borderBottom:"1px solid #f0eff1", whiteSpace:"nowrap" },
  td: { padding:"11px 12px", borderBottom:"1px solid #f5f5f6", verticalAlign:"middle", fontSize:13, color:"#27272a" },
  // Form
  inp: { width:"100%", border:"1px solid var(--border,#e4e4e7)", borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"var(--font-sans)", color:"#18181b" },
  sel: { width:"100%", border:"1px solid var(--border,#e4e4e7)", borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", backgroundColor:"white", boxSizing:"border-box", fontFamily:"var(--font-sans)", color:"#18181b" },
  label: { display:"block", fontSize:10, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4, fontFamily:"var(--font-sans)" },
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
          <p className="fe-kpi-value" style={{fontSize:24,fontWeight:800,color:"#18181b",margin:"5px 0 0",lineHeight:1}}>{value}</p>
          {sub&&<p style={{fontSize:11,color:"#a1a1aa",margin:"5px 0 0",fontFamily:"var(--font-sans)"}}>{sub}</p>}
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

  // Operational issues for this employee (from Sprint 1 hook if available)
  const empIssues = useMemo(() => {
    if (!useOpsIssues || !allEmployees.length) return [];
    try {
      const allIssues = useOpsIssues(allEmployees);
      return allIssues.byEmployee?.[emp._id] || [];
    } catch { return []; }
  }, [allEmployees, emp._id, useOpsIssues]);

  const save = () => {
    const original   = allEmployees.find(e => e._id === form._id) || {};
    const hadPO      = original.poNumbers && String(original.poNumbers).trim() !== "";
    const hasPO      = form.poNumbers  && String(form.poNumbers).trim()  !== "";
    const poJustAdded = hasPO && !hadPO;

    const updated = {
      ...form,
      ...(form.workflowStatus !== original.workflowStatus
        ? { wfDate: new Date().toISOString().split("T")[0] }
        : {}),
      ...(poJustAdded ? { poAddedDate: new Date().toISOString().split("T")[0] } : {}),
      auditLog: [
        ...(Array.isArray(form.auditLog) ? form.auditLog : []),
        { ts: new Date().toISOString(), action: "Profile updated" },
        ...(poJustAdded ? [{ ts: new Date().toISOString(), action: `PO added: ${form.poNumbers}` }] : []),
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
    log.forEach(l => entries.push({ ts: l.ts, label: l.action, type: "log" }));
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
              :<Inp label="Fisheye Margin (%)" value={String(form.fisheyeMargin||15)} onChange={v=>upd("fisheyeMargin",parseFloat(v)||0)} type="number"/>
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
                  const dotColor   = isExpired?"#dc2626":isContract?"#2563eb":M;
                  return (
                    <div key={i} style={{display:"flex",gap:16,padding:"8px 0",paddingLeft:4,position:"relative"}}>
                      <div style={{width:24,height:24,borderRadius:"50%",backgroundColor:dotColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,marginTop:2}}>
                        {isExpired ? <AlertCircle size={10} style={{color:"white"}}/> : isContract ? <FileText size={10} style={{color:"white"}}/> : <Clock size={10} style={{color:"white"}}/>}
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
                  backgroundColor: done ? '#16a34a' : current ? M : '#e5e7eb',
                  color: done || current ? 'white' : '#9ca3af',
                  border: current ? `2px solid ${MD}` : 'none',
                }}>
                  {done ? <Check size={9}/> : i + 1}
                </div>
                <span style={{ fontSize: 8, fontWeight: 600, color: done ? '#16a34a' : current ? M : '#9ca3af', whiteSpace: 'nowrap' }}>{step.s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 12, height: 2, backgroundColor: done ? '#16a34a' : '#e5e7eb', flexShrink: 0, marginTop: 9 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
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
    <th onClick={()=>sort(col)} style={{...s.th,cursor:"pointer"}}>
      <span style={{display:"flex",alignItems:"center",gap:4}}>{label}{sCol===col&&<ChevronDown size={9} style={{transform:sDir<0?"rotate(180deg)":"none"}}/>}</span>
    </th>
  );
  return (
    <Card style={{overflow:"hidden"}}>
      <div style={{overflowX:"auto", maxHeight:"calc(100vh - 280px)", overflowY:"auto"}}>
        <table className="fe-table" style={{...s.table,minWidth:900}}>
          <thead style={{position:"sticky",top:0,zIndex:2}}>
            <tr style={{backgroundColor:"#fafafa"}}>
              <th style={{...s.th,width:36,paddingRight:0}}>
                <input type="checkbox" checked={allChk} onChange={()=>setSelected(allChk?[]:sorted.map(r=>r._id))}/>
              </th>
              <th onClick={()=>sort("name")} style={{...s.th,cursor:"pointer",width:"1%",whiteSpace:"nowrap"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}>Employee{sCol==="name"&&<ChevronDown size={9} style={{transform:sDir<0?"rotate(180deg)":"none"}}/>}</span>
              </th>
              <Th col="position"     label="Position"/>
              <Th col="client"       label="Client"/>
              <Th col="startDate"    label="Start Date"/>
              <Th col="endDate"      label="End Date"/>
              <Th col="totalPackage" label="Package / Profit"/>
              <th style={s.th}>Status</th>
              <th style={s.th}>Workflow</th>
              <th style={{...s.th,textAlign:"right"}}>Actions</th>
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
                  onMouseEnter={ev=>{ if(!isActive) ev.currentTarget.style.backgroundColor=isSelected?"#fff0f0":"#fafafa"; }}
                  onMouseLeave={ev=>{ ev.currentTarget.style.backgroundColor=isActive?`${M}08`:isSelected?"#fff5f5":"white"; }}>

                  {/* Checkbox */}
                  <td style={{...s.td,paddingRight:0,width:36}} onClick={ev=>ev.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={()=>setSelected(sel=>sel.includes(e._id)?sel.filter(x=>x!==e._id):[...sel,e._id])}/>
                  </td>

                  {/* Employee: name + ID */}
                  <td style={{...s.td,whiteSpace:"nowrap",width:"1%"}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#111827"}}>{e.name}</div>
                    {e.idNumber&&<div style={{fontSize:11,color:"#9ca3af",fontFamily:"monospace",marginTop:1}}>{e.idNumber}</div>}
                  </td>

                  {/* Position + Project */}
                  <td style={{...s.td,maxWidth:160}}>
                    <div style={{fontSize:12,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{e.position||"—"}</div>
                    {e.project&&<div style={{fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{e.project}</div>}
                  </td>

                  {/* Client */}
                  <td style={s.td}><ClientBadge client={e.client} small/></td>

                  {/* Start Date */}
                  <td style={s.td}>
                    <span style={{fontSize:12,color:"#6b7280",whiteSpace:"nowrap"}}>{fmt(e.startDate)}</span>
                  </td>

                  {/* End Date */}
                  <td style={s.td}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0,display:"inline-block",
                        backgroundColor: expired?"#9ca3af":urgent?"#d97706":"#16a34a"}}/>
                      <span style={{fontSize:12,fontWeight:500,color:urgent?"#b45309":expired?"#9ca3af":"#374151",whiteSpace:"nowrap"}}>
                        {fmt(e.endDate)}
                      </span>
                    </div>
                    {urgent&&<div style={{fontSize:10,color:"#d97706",fontWeight:700,marginTop:1}}>{days}d left</div>}
                    {expired&&<div style={{fontSize:10,color:"#9ca3af",marginTop:1}}>Expired</div>}
                    {!urgent&&!expired&&<div style={{fontSize:10,color:"#16a34a",marginTop:1}}>Active</div>}
                  </td>

                  {/* Package + Profit */}
                  <td style={s.td}>
                    <div style={{fontSize:12,fontFamily:"monospace",fontWeight:700,color:"#111827"}}>{e.totalPackage?`SAR ${e.totalPackage.toLocaleString()}`:"—"}</div>
                    {profit>0&&<div style={{fontSize:11,color:"#16a34a",fontWeight:600,marginTop:1}}>+{profit.toLocaleString()}</div>}
                  </td>

                  {/* Status badge */}
                  <td style={s.td}><StatusBadge status={e.status}/></td>

                  {/* Workflow badge */}
                  <td style={s.td}><WFBadge status={e.workflowStatus}/></td>

                  {/* Actions */}
                  <td style={{...s.td,whiteSpace:"nowrap"}} onClick={ev=>ev.stopPropagation()}>
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
                      {/* WA — right */}
                      {waHref(e.phone)&&(
                        <a href={waHref(e.phone)} target="_blank" rel="noreferrer" onClick={ev=>ev.stopPropagation()}
                          title="WhatsApp"
                          style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:7,border:"1px solid #dcfce7",backgroundColor:"#f0fdf4",color:"#16a34a",cursor:"pointer",textDecoration:"none",flexShrink:0}}
                          onMouseEnter={ev=>ev.currentTarget.style.backgroundColor="#dcfce7"}
                          onMouseLeave={ev=>ev.currentTarget.style.backgroundColor="#f0fdf4"}>
                          <MessageCircle size={13}/>
                        </a>
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
          <StatusBadge status={emp.status} />
          <WFBadge status={emp.workflowStatus} />
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
          { l: "Profit",     v: profit > 0 ? `+${profit.toLocaleString()}` : "—",                  c: "#16a34a" },
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
          <a href={wa} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid #16a34a", backgroundColor: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <MessageCircle size={12}/> WhatsApp
          </a>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
        {[{ k: "context", l: "Context" }, { k: "history", l: "History" }, { k: "timeline", l: "Timeline" }, { k: "comms", l: "Comms" }].map(t => (
          <button key={t.k} onClick={() => setPanelTab(t.k)} style={{
            flex: 1, padding: "9px 0", fontSize: 11, fontWeight: 700,
            border: "none", cursor: "pointer",
            borderBottom: `2px solid ${panelTab === t.k ? M : "transparent"}`,
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
                    <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: done ? "#16a34a" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                <StatusBadge status={emp.status} />
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
              <a href={wa} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "9px 12px", borderRadius: 9, border: "1px solid #16a34a", backgroundColor: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
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
function WorkforceView({employees, setEmployees, partners, clients=[], exportCSV}) {
  const [client, setClient] = useState("All");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fWF, setFWF] = useState("");
  const [fProject, setFPrj] = useState("");
  // ── Sprint 3: Advanced filters
  const [fPO, setFPO] = useState("");
  const [fSourcing, setFSourcing] = useState("");
  const [fPartner, setFPartner] = useState("");
  const [fNationality, setFNationality] = useState("");
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [pendingCSVDiff, setPendingCSVDiff] = useState(null); // { changes, notFound, skipped, applyFn }
  const [importBackup, setImportBackup] = useState(null);     // snapshot for rollback
  const [csvApplying, setCsvApplying] = useState(false);      // loading state for apply btn
  const [pendingAddCSV, setPendingAddCSV] = useState(null);   // { records, file } waiting for client selection
  // ── Sprint 3: Side panel
  const [sideEmp, setSideEmp] = useState(null);
  const [selected, setSelected] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
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
  const counts = useMemo(() =>
    CLIENTS_LIST.reduce((a, c) => ({ ...a, [c]: employees.filter(e => e.client === c && !isExcluded(e)).length }), {}),
    [employees]
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
  const clearAllFilters = () => { setFStatus(""); setFWF(""); setFPrj(""); setFPO(""); setFSourcing(""); setFPartner(""); setFNationality(""); };

  // ── KPI values for header strip ──────────────────────────────────────────
  const kpiTotal    = useMemo(() => employees.filter(e => !isExcluded(e)).length, [employees]);
  const kpiNew      = useMemo(() => employees.filter(e => (e.status||"").toLowerCase()==="new").length, [employees]);
  const kpiExpiring = useMemo(() => employees.filter(e => { const d=daysUntil(e.endDate); return d>=0&&d<=30&&!isExcluded(e); }).length, [employees]);
  const kpiNoPO     = useMemo(() => employees.filter(e => {
    const st = (e.status || "").toLowerCase().trim();
    const isResigned = ["resigned", "resigned_ar", "مستقيل"].includes(st);
    return e.client === "Sela" && !isResigned && hasMissingPO(e);
  }).length, [employees]);
  // ─── handleUpdateField: تحديث حقل واحد لموظف محدد (كان مفقود من props!) ───
  const handleUpdateField = async (id, field, value) => {
    const extraFields = {};

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
      const emp = employees.find(e => e._id === id);
      const hadPO = emp?.poNumbers && String(emp.poNumbers).trim() !== "";
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
      // rollback محلي لو فشل الحفظ
      setEmployees(prev => prev.map(e => e._id === id ? { ...e, [field]: e[field] } : e));
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
      if (mapped) {
        resolved.push({ ...r, client: mapped });
      } else if (client && client !== "All") {
        resolved.push({ ...r, client });
      } else {
        needsClient.push(r);
      }
    });

    if (needsClient.length === 0) {
      // كل الموظفين اتحددلهم client تلقائياً
      await doInsertCSV(resolved);
    } else {
      // فيه موظفين محتاجين اختيار client يدوي
      setPendingAddCSV({ resolved, needsClient });
    }
  };

  const doInsertCSV = async (records) => {
    try {
      // Insert in chunks of 50
      let allInserted = [];
      for (let i = 0; i < records.length; i += 50) {
        const { data, error } = await supabase.from('employees_master').insert(records.slice(i, i + 50)).select();
        if (error) throw error;
        allInserted = [...allInserted, ...data];
      }
      setEmployees(prev => [...allInserted, ...prev]);
      setPendingAddCSV(null);
      alert(`✅ تم رفع ${allInserted.length} موظف بنجاح!`);
    } catch (err) {
      console.error("CSV Insert Error:", err);
      alert(`❌ خطأ: ${err.message}`);
    }
  };
   // 4. الدوال المساعدة
  const save = async (updated) => {
  const { _id, ...fieldsToUpdate } = updated;

  // تحديث محلي سريع بـ _id الصح
  setEmployees(prev => {
    const n = prev.map(e => (e._id === _id ? updated : e));
    localStorage.setItem("fisheyeData_v3", JSON.stringify(n));
    return n;
  });

  // حفظ في Supabase
 try {
  const response = await supabase
    .from('employees_master')
    .update(fieldsToUpdate)
    .eq('_id', Number(_id))
    .select();

  console.log("Supabase response:", response);

  if (response.error) throw response.error;
  
  console.log("✅ Updated rows:", response.data);

} catch (err) {
  console.error("Save Error:", err.message);
  alert("❌ فشل الحفظ: " + err.message);
}
};
  const bulkUpd = async (field, value) => {
  alert("bulkUpd called: " + field + " = " + value);
  // 1. تحديث محلي سريع
  setEmployees(prev => {
    const n = prev.map(e =>
      selected.includes(e._id) ? { ...e, [field]: value } : e
    );
    localStorage.setItem("fisheyeData_v3", JSON.stringify(n));
    return n;
  });

  // 2. حفظ في Supabase
  try {
    const { error } = await supabase
      .from('employees_master')
      .update({ [field]: value })
      .in('_id', selected.map(Number));

    if (error) throw error;
    console.log(`✅ Bulk updated ${selected.length} employees: ${field} = ${value}`);
    setShowBulk(false);
    setSelected([]);
  } catch (err) {
    console.error("Bulk Save Error:", err.message);
    alert("❌ فشل الحفظ: " + err.message);
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
  setEmployees(prev => prev.map(e => e._id === _id ? updated : e));
  await supabase.from('employees_master').update(fields).eq('_id', Number(_id));
  setRenewEmp(null);
};
  return (
    <div style={{ display: "flex", gap: 16 }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 180, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, padding: "0 8px" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={12} style={{ color: "white" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>Clients</span>
        </div>
        {["All", ...CLIENTS_LIST].map(c => {
          const isA = client === c;
          const count = c === "All" ? employees.filter(e => !isExcluded(e)).length : counts[c] || 0;
          const dotColor = CLIENT_META[c]?.dot || M;
          return (
            <button key={c} onClick={() => setClient(c)} style={{
              width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 10,
              border: isA ? `1px solid ${M}30` : "1px solid transparent",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 2,
              backgroundColor: isA ? `${M}0e` : "transparent",
              color: isA ? M : "#4b5563", transition: "all 0.15s",
              borderLeft: isA ? `3px solid ${M}` : "3px solid transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                {c !== "All" && <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: isA ? M : dotColor, flexShrink: 0 }} />}
                {c === "All" && <Users size={11} style={{ color: isA ? M : "#9ca3af", flexShrink: 0 }} />}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c}</span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                backgroundColor: isA ? M : "#f3f4f6",
                color: isA ? "white" : "#6b7280", flexShrink: 0, marginLeft: 4,
                fontFamily: "monospace",
              }}>{count}</span>
            </button>
          );
        })}
      </div>

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
              <Btn onClick={handleAddSingle} style={{ backgroundColor: M, color: "white" }}>
                <UserPlus size={14} /> New Employee
              </Btn>
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
              <Btn variant="ghost" onClick={() => exportCSV(filtered)} style={s.btnSm}><Download size={13} /> Export</Btn>
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
              {/* Import dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowImportMenu(m => !m)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Upload size={13} /> Import <ChevronDown size={11} style={{ marginLeft: 1 }} />
                </button>
                {showImportMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50, backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", width: 180, overflow: "hidden" }}
                    onMouseLeave={() => setShowImportMenu(false)}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor="#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}>
                      <FileUp size={13} style={{ color: M }} /> Add from CSV
                      <input type="file" accept=".csv" onChange={e => { handleCSVImport(e); setShowImportMenu(false); }} style={{ display: "none" }} />
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", borderTop: "1px solid #f3f4f6" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor="#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}>
                      <Upload size={13} style={{ color: "#0369a1" }} /> Update from CSV
                      <input type="file" accept=".csv" style={{ display: "none" }} onChange={async (e) => {
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
                        };
                        const empIdIdx      = headers.indexOf('employee id');
                        const contractIdIdx = headers.indexOf('contract id');
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
                          if (candidates.length === 1) { emp = candidates[0]; }
                          else {
                            const csvContractId = contractIdIdx !== -1 ? cols[contractIdIdx] : null;
                            if (csvContractId) emp = candidates.find(c => c.contractId === csvContractId);
                            if (!emp) {
                              const csvStart = startIdx !== -1 ? normalizeDate(cols[startIdx]) : null;
                              const csvEnd   = endIdx   !== -1 ? normalizeDate(cols[endIdx])   : null;
                              if (csvStart || csvEnd) emp = candidates.find(c => {
                                return (!csvStart || normalizeDate(c.startDate) === csvStart) &&
                                       (!csvEnd   || normalizeDate(c.endDate)   === csvEnd);
                              });
                            }
                            if (!emp) { const active = candidates.filter(c => (c.status||'').toLowerCase()==='active'); emp = active.length===1 ? active[0] : null; }
                            if (!emp) { skippedCount++; continue; }
                          }
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
                            if (val) fieldsToUpdate[field] = val;
                          });
                          if (fieldsToUpdate.workflowStatus) {
                            if (['Qiwa Submitted','Qiwa Approved','Iqama Transferred'].includes(emp.workflowStatus))
                              delete fieldsToUpdate.workflowStatus;
                          }
                          if (Object.keys(fieldsToUpdate).length === 0) continue;
                          // Build field-level diff
                          const fieldDiffs = Object.entries(fieldsToUpdate).map(([field, newVal]) => ({
                            field, oldVal: emp[field] ?? '—', newVal
                          }));
                          changes.push({ emp, fieldsToUpdate, fieldDiffs });
                        }
                        if (changes.length === 0 && notFound.length === 0) {
                          alert('No changes detected in this CSV.'); e.target.value = ''; return;
                        }
                        // ── Show diff preview modal ───────────────────────────
                        const applyFn = async () => {
                          const EXTENDED_FIELDS = ['iban', 'bank', 'requesterName', 'poAddedDate'];
                          let updated = 0; let errors = 0;
                          for (const { emp, fieldsToUpdate } of changes) {
                            const coreFields = {}; const extFields = {};
                            Object.entries(fieldsToUpdate).forEach(([k, v]) => {
                              if (EXTENDED_FIELDS.includes(k)) extFields[k] = v; else coreFields[k] = v;
                            });
                            if (Object.keys(coreFields).length > 0) {
                              const { error } = await supabase.from('employees_master').update(coreFields).eq('_id', Number(emp._id));
                              if (error) { errors++; continue; }
                              setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, ...coreFields } : e));
                              updated++;
                            }
                            if (Object.keys(extFields).length > 0) {
                              const { error: extErr } = await supabase.from('employees_master').update(extFields).eq('_id', Number(emp._id));
                              if (!extErr) setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, ...extFields } : e));
                            }
                          }
                          setPendingCSVDiff(null);
                          alert(`✅ Applied: ${updated} employees updated${errors > 0 ? `\n❌ Errors: ${errors}` : ''}`);
                        };
                        setPendingCSVDiff({ changes, notFound, skippedCount, applyFn });
                        e.target.value = '';
                      }} />
                    </label>
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
                { label: "Status",      value: fStatus,      set: setFStatus,      opts: [["", "Status"], ...STATUS_OPTS.map(o=>[o,o])] },
                { label: "Workflow",    value: fWF,          set: setFWF,          opts: [["", "Workflow"], ...WORKFLOW_OPTS.map(o=>[o,o])] },
                { label: "Project",     value: fProject,     set: setFPrj,         opts: [["", "Project"], ...projects.filter(Boolean).map(o=>[o,o])] },
                { label: "Sourcing",    value: fSourcing,    set: setFSourcing,    opts: [["", "Sourcing"], ...sourcingOpts.filter(Boolean).map(o=>[o,o])] },
                { label: "Partner",     value: fPartner,     set: setFPartner,     opts: [["", "Partner"], ...partnerOpts.filter(Boolean).map(o=>[o,o])] },
                { label: "Nationality", value: fNationality, set: setFNationality, opts: [["", "Nationality"], ...nationalityOpts.filter(Boolean).map(o=>[o,o])] },
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
                  <button key={v} onClick={() => setFPO(v)} style={{
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
      {CLIENTS_LIST.map(c => (
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

    if (error) alert("❌ فشل الحفظ: " + error.message);
    else alert("✅ تم الحفظ بنجاح");

  } else {
    const fisheyeType = showProfitMode?.fisheyeType || "percent";
    const fisheyeVal = parseFloat(document.getElementById("fisheyeValue")?.value || 15);

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

    if (error) alert("❌ فشل الحفظ: " + error.message);
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
        const byClient = CLIENTS_LIST.reduce((acc, c) => {
          const emps = pool.filter(e => e.client === c);
          if (emps.length > 0) acc[c] = emps;
          return acc;
        }, {});
        const otherEmps = pool.filter(e => !CLIENTS_LIST.includes(e.client));
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

        // Flatten rows: one row per (employee × changed field)
        const rows = changes.flatMap(({ emp, fieldDiffs }) =>
          fieldDiffs.map(({ field, oldVal, newVal }) => ({
            name: emp.name,
            empId: emp.employeeId,
            field,
            oldVal: oldVal === undefined || oldVal === null ? '—' : String(oldVal),
            newVal: String(newVal),
          }))
        );

        const FIELD_LABEL = {
          workflowStatus: 'Workflow Status', idNumber: 'ID Number', project: 'Project',
          phone: 'Phone', email: 'Email', poNumbers: 'PO Numbers', poAddedDate: 'PO Added Date',
          invoiceNumbers: 'Invoice Numbers', requesterName: 'Requester Name',
          bank: 'Bank', iban: 'IBAN',
        };

        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.55)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{
              backgroundColor: "white", borderRadius: 16, width: "100%", maxWidth: 780,
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
                    راجع التغييرات قبل تطبيقها — {changes.length} موظف · {rows.length} تعديل
                    {skippedCount > 0 && ` · ${skippedCount} skipped (ambiguous)`}
                  </p>
                </div>
                <button onClick={() => setPendingCSVDiff(null)} disabled={applying}
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
                          {["Employee", "ID", "Field", "Old Value", "New Value"].map(h => (
                            <th key={h} style={{
                              padding: "8px 10px", textAlign: "left", fontWeight: 700,
                              color: "#374151", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => {
                          const changed = r.oldVal !== r.newVal;
                          return (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
                              <td style={{ padding: "7px 10px", color: "#111827", fontWeight: 600, borderBottom: "1px solid #f3f4f6" }}>{r.name}</td>
                              <td style={{ padding: "7px 10px", color: "#6b7280", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace" }}>{r.empId}</td>
                              <td style={{ padding: "7px 10px", color: "#374151", fontWeight: 600, borderBottom: "1px solid #f3f4f6" }}>{FIELD_LABEL[r.field] || r.field}</td>
                              <td style={{
                                padding: "7px 10px", color: changed ? "#dc2626" : "#6b7280",
                                borderBottom: "1px solid #f3f4f6",
                                textDecoration: changed ? "line-through" : "none",
                                opacity: changed ? 0.8 : 1,
                              }}>{r.oldVal}</td>
                              <td style={{
                                padding: "7px 10px",
                                color: changed ? "#16a34a" : "#6b7280",
                                fontWeight: changed ? 700 : 400,
                                borderBottom: "1px solid #f3f4f6",
                              }}>{r.newVal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Not found */}
                {notFound.length > 0 && (
                  <div style={{
                    padding: "12px 14px", borderRadius: 10, backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a", marginBottom: 16,
                  }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: "#92400e" }}>
                      ⚠️ {notFound.length} Employee ID{notFound.length > 1 ? "s" : ""} not found in system:
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
                display: "flex", justifyContent: "flex-end", gap: 10,
                flexShrink: 0, backgroundColor: "#f9fafb", borderRadius: "0 0 16px 16px",
              }}>
                <button onClick={() => setPendingCSVDiff(null)} disabled={applying}
                  style={{
                    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: "1px solid #e5e7eb", backgroundColor: "white", cursor: "pointer",
                    color: "#374151", opacity: applying ? 0.5 : 1,
                  }}>❌ Cancel</button>
                <button
                  disabled={applying || changes.length === 0}
                  onClick={async () => { setCsvApplying(true); await applyFn(); setCsvApplying(false); }}
                  style={{
                    padding: "8px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: "none", cursor: changes.length === 0 ? "not-allowed" : "pointer",
                    backgroundColor: changes.length === 0 ? "#e5e7eb" : M,
                    color: changes.length === 0 ? "#9ca3af" : "white",
                    opacity: applying ? 0.7 : 1,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {applying ? "⏳ Applying..." : `✅ Apply ${changes.length} Changes`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add CSV: Client Selector Modal (for unrecognized projects) ── */}
      {pendingAddCSV && (() => {
        const { resolved = [], needsClient = [] } = pendingAddCSV;
        // Group needsClient by project
        const byProject = {};
        needsClient.forEach(r => { const p = r.project || "Unknown"; if (!byProject[p]) byProject[p] = []; byProject[p].push(r); });
        const projects = Object.keys(byProject);
        // clientAssignments: { [project]: clientName }
        const [assignments, setAssignments] = React.useState({});

        const allAssigned = projects.every(p => assignments[p]);
        const handleApply = async () => {
          const withClients = needsClient.map(r => ({ ...r, client: assignments[r.project || "Unknown"] || "Unknown" }));
          await doInsertCSV([...resolved, ...withClients]);
        };

        return (
          <div style={{ position:"fixed", inset:0, zIndex:9999, backgroundColor:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ backgroundColor:"white", borderRadius:16, width:"100%", maxWidth:480, maxHeight:"85vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
              <h3 style={{ margin:"0 0 4px", fontSize:16, fontWeight:700, color:"#111827" }}>📂 تعيين Client للبروجكتات الجديدة</h3>
              <p style={{ margin:"0 0 20px", fontSize:12, color:"#6b7280" }}>
                {resolved.length > 0 && <span style={{color:"#16a34a", fontWeight:600}}>{resolved.length} موظف اتعرفوا تلقائياً ✅ &nbsp;</span>}
                {needsClient.length} موظف في {projects.length} بروجكت جديد — اختاري الـ Client لكل بروجكت:
              </p>

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
                        const selected = assignments[proj] === c;
                        return (
                          <button key={c} onClick={() => setAssignments(a => ({ ...a, [proj]: c }))} style={{
                            padding:"5px 11px", borderRadius:999, fontSize:11, fontWeight:700, cursor:"pointer",
                            border:`1px solid ${selected ? (meta.dot||M) : "#e5e7eb"}`,
                            backgroundColor: selected ? (meta.badge||`${M}15`) : "white",
                            color: selected ? (meta.text||M) : "#6b7280",
                          }}>{c}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setPendingAddCSV(null)} style={{
                  flex:1, padding:"9px", borderRadius:8, border:"1px solid #e5e7eb",
                  backgroundColor:"white", cursor:"pointer", fontSize:13, color:"#6b7280", fontWeight:600,
                }}>❌ Cancel</button>
                <button onClick={handleApply} disabled={!allAssigned} style={{
                  flex:2, padding:"9px", borderRadius:8, border:"none",
                  backgroundColor: allAssigned ? M : "#e5e7eb",
                  color: allAssigned ? "white" : "#9ca3af",
                  cursor: allAssigned ? "pointer" : "not-allowed",
                  fontSize:13, fontWeight:700,
                }}>✅ رفع {resolved.length + needsClient.length} موظف</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌅 MORNING REPORT VIEW (Enhanced with Checkboxes)
// ═══════════════════════════════════════════════════════════════════════════════
function MorningReportView({ employees, morningReportChecks, setMorningReportChecks, reportSendTo, setReportSendTo }) {
  const report = useMemo(() => buildReport(employees), [employees]);
  const [copied, setCopied] = useState(false);
  const [sections, setSections] = useState({ pending: true, missingPO: true, expiring: true, projects: true });
 
  const text = useMemo(() => {
    const lines = [`🔴 *FISHEYE OPS – MORNING REPORT*`, `📅 ${TODAY.toDateString()}`, `📊 Active: ${employees.filter(e => !isExcluded(e)).length}  |  Pending: ${report.pendingCount}`, ""];
    
    if (sections.pending) {
      lines.push("*📋 PENDING WORKFLOW BY PROJECT*");
      Object.entries(report.byProject).sort((a, b) => b[1].length - a[1].length).forEach(([proj, emps]) => {
        lines.push(`\n*${proj}* (${emps.length})`);
        emps.forEach(e => lines.push(`  • ${e.name} — ${e.workflowStatus || "No Status"}`));
      });
    }
    
    if (sections.missingPO && report.selaPoAlert.length) {
      lines.push("", "*⚠️ SELA – MISSING PO*");
      report.selaPoAlert.forEach(e => lines.push(`  • ${e.name} — ${e.project}`));
    }
    
    if (sections.expiring && report.expiring.length) {
      lines.push("", "*🕐 EXPIRING ≤ 30 DAYS*");
      report.expiring.forEach(e => lines.push(`  • ${e.name} ends ${fmt(e.endDate)} (${daysUntil(e.endDate)}d)`));
    }
    
    return lines.join("\n");
  }, [report, employees, sections]);
 
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
 
  const sendReport = async () => {
    const recipients = {
      client: ["client@example.com"], // استبدل بالبريد الفعلي
      partner: ["partner@example.com"],
      both: ["client@example.com", "partner@example.com"]
    };
 
    const emailList = reportSendTo === "all" ? [...recipients.client, ...recipients.partner] : recipients[reportSendTo] || recipients.client;
    
    // محاكاة الإرسال (في الواقع يجب استخدام API حقيقي)
    console.log(`📧 Sending report to: ${emailList.join(", ")}`);
    alert(`✅ Report sent to ${emailList.length} recipient(s)`);
  };
 
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ ...s.flexBetween, marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🌅 Morning Report</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{TODAY.toDateString()} · Expired/Resigned</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={copy}>{copied ? <><Check size={13} style={{ color: "#16a34a" }} /> Copied!</> : <><Copy size={13} /> Copy</>}</Btn>
          <Btn onClick={() => { const url = `https://wa.me/?text=${encodeURIComponent(text)}`; window.open(url, '_blank'); }} style={{ ...s.btnPrimary, backgroundColor: "#25d366", border: "none" }}><MessageCircle size={13} /> WhatsApp</Btn>
          <Btn onClick={sendReport} style={{ ...s.btnPrimary }}><Mail size={13} /> Send Report</Btn>
        </div>
      </div>
 
      <div style={s.grid4}>
        <StatCard icon={ClipboardList} label="Pending" value={report.pendingCount} color={M} />
        <StatCard icon={AlertCircle} label="Missing PO" value={report.selaPoAlert.length} color="#d97706" />
        <StatCard icon={Calendar} label="Expiring ≤30d" value={report.expiring.length} color="#dc2626" />
        <StatCard icon={CheckCircle} label="Projects" value={Object.keys(report.byProject).length} color="#7c3aed" />
      </div>
 
      {/* ✅ SECTION SELECTION CHECKBOXES */}
      <Card style={{ padding: 20, marginTop: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={16} style={{ color: M }} /> Select Report Sections</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {[
            { key: "pending", label: "📋 Pending", value: report.pendingCount },
            { key: "missingPO", label: "⚠️ Missing PO", value: report.selaPoAlert.length },
            { key: "expiring", label: "📅 Expiring", value: report.expiring.length },
            { key: "projects", label: "✅ Projects", value: Object.keys(report.byProject).length }
          ].map(item => (
            <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, border: sections[item.key] ? "2px solid " + M : "1px solid #e5e7eb", backgroundColor: sections[item.key] ? M + "0a" : "white", cursor: "pointer", transition: "all 0.2s" }}>
              <input type="checkbox" checked={sections[item.key]} onChange={e => setSections(s => ({ ...s, [item.key]: e.target.checked }))} style={{ cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{item.value} items</div>
              </div>
            </label>
          ))}
        </div>
      </Card>
 
      {/* 📧 RECIPIENT SELECTION */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Mail size={16} style={{ color: M }} /> Send Report To:</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "🤝 Both (Client + Partner)", value: "both" },
            { label: "👥 Clients Only", value: "client" },
            { label: "💼 Partners Only", value: "partner" }
          ].map(opt => (
            <button key={opt.value} onClick={() => setReportSendTo(opt.value)} style={{ flex: "1", minWidth: 140, padding: "10px 12px", borderRadius: 8, border: reportSendTo === opt.value ? "2px solid " + M : "1px solid #e5e7eb", backgroundColor: reportSendTo === opt.value ? M + "0a" : "white", color: reportSendTo === opt.value ? M : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>{opt.label}</button>
          ))}
        </div>
      </Card>
 
      {/* 📊 CONTENT SECTIONS */}
      {report.expiring.length > 0 && sections.expiring && (
        <Card style={{ marginTop: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #fed7aa", backgroundColor: "#fff7ed", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={14} style={{ color: "#ea580c" }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#9a3412" }}>🕐 Expiring Within 30 Days ({report.expiring.length})</span>
          </div>
          <div style={{ maxHeight: 224, overflowY: "auto" }}>
            {report.expiring.map(e => (
              <div key={e._id} style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f9fafb" }}>
                <div><span style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</span><span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{e.project}</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>{daysUntil(e.endDate)}d · {fmt(e.endDate)}</span>
                  <WABtn phone={e.phone} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
 
      {report.selaPoAlert.length > 0 && sections.missingPO && (
        <Card style={{ marginTop: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #fde68a", backgroundColor: "#fffbeb", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={14} style={{ color: "#d97706" }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>⚠️ Sela — Missing PO Numbers ({report.selaPoAlert.length})</span>
          </div>
          <div style={{ maxHeight: 224, overflowY: "auto" }}>
            {report.selaPoAlert.map(e => (
              <div key={e._id} style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f9fafb" }}>
                <div><span style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</span><span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{e.project} · {e.status}</span></div>
                <WABtn phone={e.phone} />
              </div>
            ))}
          </div>
        </Card>
      )}
 
      {sections.pending && (
        <Card style={{ marginTop: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6", backgroundColor: "#fdf8f8" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>📋 Pending Workflow by Project ({report.pendingCount})</span>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>Excludes: Agreement Signed · Complete · Expired · Resigned · Combuzz HR</p>
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {Object.entries(report.byProject).sort((a, b) => b[1].length - a[1].length).map(([proj, emps]) => (
              <div key={proj} style={{ padding: "12px 20px", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{proj}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white", backgroundColor: M, padding: "2px 8px", borderRadius: 999 }}>{emps.length}</span>
                  <ClientBadge client={emps[0]?.client} small />
                </div>
                {emps.map(e => (
                  <div key={e._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: M, flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{e.name}</span>
                      <WFBadge status={e.workflowStatus} />
                    </div>
                    <WABtn phone={e.phone} />
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(report.byProject).length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af" }}>
                <CheckCircle size={28} style={{ color: "#4ade80", margin: "0 auto 8px", display: "block" }} />
                All workflows complete!
              </div>
            )}
          </div>
        </Card>
      )}
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

  const getFlow  = empId => flows[`${selectedMonth}_${empId}`] || {};
  const allDone  = e => PAYROLL_STEPS.every(s => getFlow(e._id)[s.k]);

  const toggle = (empId, step) => {
    const key = `${selectedMonth}_${empId}`;
    const cur = flows[key] || {};
    saveFlows({ ...flows, [key]: { ...cur, [step]: !cur[step] } });
  };

  // ── Bulk: mark a STEP as done for ALL visible employees ─────────────────
  const bulkMarkStep = (emps, step, value) => {
    const updated = { ...flows };
    emps.forEach(e => {
      const key = `${selectedMonth}_${e._id}`;
      updated[key] = { ...(updated[key] || {}), [step]: value };
    });
    saveFlows(updated);
  };

  // ── Bulk: mark ALL steps done/undone for ALL visible employees ───────────
  const bulkMarkAll = (emps, value) => {
    const updated = { ...flows };
    emps.forEach(e => {
      const key = `${selectedMonth}_${e._id}`;
      const cur = updated[key] || {};
      PAYROLL_STEPS.forEach(s => { cur[s.k] = value; });
      updated[key] = cur;
    });
    saveFlows(updated);
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
function calcClientHealth(clientName, employees) {
  const clientEmps = employees.filter(e => e.client === clientName && !isExcluded(e));
  if (!clientEmps.length) return { score: 100, label: "No Data", color: "#9ca3af" };

  let score = 100;
  const total = clientEmps.length;

  // Expiring contracts penalty
  const expiring = clientEmps.filter(e => { const d = daysUntil(e.endDate); return d >= 0 && d <= 14; }).length;
  score -= Math.round((expiring / total) * 30);

  // Pending workflows penalty
  const pending = clientEmps.filter(e => !isWFDone(e.workflowStatus)).length;
  score -= Math.round((pending / total) * 25);

  // Missing PO penalty (Sela specific)
  if (clientName === "Sela") {
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
  {id:"C-02",name:"SPL",region:"Riyadh",email:"hr@spl.sa",status:"active",contacts:[{name:"Faisal Al-Dosari",role:"Operations",phone:"+966509876543"}],notes:"Staffing provider",requestLog:[{ts:"2026-04-25T12:00:00Z",type:"Invoice",employee:"Monthly",status:"Completed"}]},
  {id:"C-03",name:"Channelplay",region:"Eastern Province",email:"admin@channelplay.sa",status:"active",contacts:[{name:"Sara Mohammed",role:"HR Manager",phone:"+966507654321"}],notes:"Tech company · SILQFI projects",requestLog:[]},
  {id:"C-04",name:"Riva Engineering 2",region:"Riyadh",email:"ops@riva.sa",status:"active",contacts:[{name:"Mohammed CEO",role:"Executive",phone:"+966501111111"}],notes:"CEO projects",requestLog:[]},
  {id:"C-05",name:"Combuzz HR",region:"Riyadh",email:"info@combuzz.sa",status:"active",contacts:[{name:"Support Team",role:"General",phone:"+966505555555"}],notes:"Multiple brands handling",requestLog:[]},
];

function ClientHub({ employees }) {
  const [clients,setClients]=useState(()=>{try{return JSON.parse(localStorage.getItem("fisheyeClients_v1"))||DEF_CLIENTS;}catch{return DEF_CLIENTS;}});
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("active");
  const [openId,setOpenId]=useState(null);
  const [detailTab,setDetailTab]=useState("overview");
  const [editingInfo,setEditingInfo]=useState(false);
  const [infoForm,setInfoForm]=useState({name:"",region:"",email:""});
  const [nC,setNC]=useState({name:"",region:"",email:"",notes:""});

  const save=c=>{setClients(c);localStorage.setItem("fisheyeClients_v1",JSON.stringify(c));};
  const add=()=>{save([...clients,{...nC,id:`C-${String(clients.length+1).padStart(2,"0")}`,status:"active",contacts:[],requestLog:[]}]);setShowAdd(false);setNC({name:"",region:"",email:"",notes:""});};
  const archive=id=>save(clients.map(c=>c.id===id?{...c,status:"archived"}:c));
  const unarchive=id=>save(clients.map(c=>c.id===id?{...c,status:"active"}:c));
  const deleteC=id=>{if(window.confirm("Delete?"))save(clients.filter(c=>c.id!==id));};
  const addContact=cid=>save(clients.map(c=>c.id===cid?{...c,contacts:[...c.contacts,{name:"New Contact",role:"",phone:""}]}:c));
  const updContact=(cid,ci,f,v)=>save(clients.map(c=>c.id===cid?{...c,contacts:c.contacts.map((co,i)=>i===ci?{...co,[f]:v}:co)}:c));
  const addRequest=(cid,req)=>save(clients.map(c=>c.id===cid?{...c,requestLog:[...c.requestLog,req]}:c));
  const updReqStatus=(cid,ri,st)=>save(clients.map(c=>c.id===cid?{...c,requestLog:c.requestLog.map((r,i)=>i===ri?{...r,status:st}:r)}:c));
  const getHC=cid=>employees.filter(e=>e.client===clients.find(c=>c.id===cid)?.name&&!isExcluded(e)).length;
  const displayed=clients.filter(c=>filter==="all"||(filter==="archived"?c.status==="archived":c.status!=="archived"));

  const totalPending=clients.reduce((s,c)=>s+(c.requestLog||[]).filter(r=>r.status==="Pending").length,0);
  const totalPOIssues=employees.filter(e=>e.client==="Sela"&&!isExcluded(e)&&hasMissingPO(e)).length;
  const totalOverdue=clients.reduce((s,c)=>s+(c.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/(864e5))>5).length,0);

  // ── detail modal data ──
  const openClient=clients.find(c=>c.id===openId)||null;
  const selEmps=openClient?employees.filter(e=>e.client===openClient.name&&!isExcluded(e)):[];
  const selHealth=openClient?calcClientHealth(openClient.name,employees):null;
  const isSela=openClient?.name==="Sela";
  const missingPO=selEmps.filter(hasMissingPO);
  const hasPO=selEmps.filter(hasValidPO);
  const byProject=useMemo(()=>{const m={};selEmps.forEach(e=>{const p=e.project||"Unassigned";if(!m[p])m[p]=[];m[p].push(e);});return Object.entries(m).sort((a,b)=>b[1].length-a[1].length);},[selEmps]);
  const pendingActions=openClient?(openClient.requestLog||[]).map((r,i)=>({...r,i,dw:Math.floor((Date.now()-new Date(r.ts))/864e5)})).filter(r=>r.status==="Pending").sort((a,b)=>b.dw-a.dw):[];

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
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            {[
              { l:"Clients",  v:clients.filter(c=>c.status==="active").length, alert:false },
              { l:"Pending",  v:totalPending,  alert:totalOverdue>0 },
              { l:"No PO",    v:totalPOIssues, alert:totalPOIssues>0 },
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

        {/* Client list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {displayed.length===0 && (
            <div style={{ textAlign:"center", padding:"32px 16px", color:"#9ca3af" }}>
              <Building2 size={24} style={{ opacity:0.25, margin:"0 auto 8px", display:"block" }}/>
              <p style={{ fontSize:12, margin:0 }}>No clients</p>
            </div>
          )}
          {displayed.map(c => {
            const hc = getHC(c.id);
            const pending = (c.requestLog||[]).filter(r=>r.status==="Pending").length;
            const overdue = (c.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length;
            const isArchived = c.status === "archived";
            const health = calcClientHealth(c.name, employees);
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
                </div>
              ) : (
                <div style={{ flex:1, minWidth:0 }}>
                  <h3 style={{ margin:0, fontSize:19, fontWeight:800, color:"white", letterSpacing:"-0.01em" }}>{openClient.name}</h3>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"rgba(255,210,210,0.9)" }}>
                    {[openClient.region, openClient.email].filter(Boolean).join(" · ") || "—"}
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
                    <button onClick={()=>{ setInfoForm({name:openClient.name||"",region:openClient.region||"",email:openClient.email||""}); setEditingInfo(true); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>openClient.status==="archived"?unarchive(openId):archive(openId)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>
                      {openClient.status==="archived" ? "Restore" : "Archive"}
                    </button>
                    <button onClick={()=>{ if(window.confirm("Delete client?")) deleteC(openId); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,100,100,0.4)", backgroundColor:"rgba(255,100,100,0.15)", color:"#fca5a5", cursor:"pointer" }}>Delete</button>
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
              { l:"Expiring ≤14d",v:selEmps.filter(e=>{const d=daysUntil(e.endDate);return d>=0&&d<=14;}).length, c:"#d97706" },
              { l:"WF Pending",   v:selEmps.filter(e=>!isWFDone(e.workflowStatus)).length,                        c:"#7c3aed" },
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
                const desc=prompt("Action description:");
                const type=prompt("Type (Invoice / Contract Update / Approval / Payment):");
                if(desc&&type) addRequest(openClient.id,{ts:new Date().toISOString(),type,employee:desc,status:"Pending"});
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
                <div style={{ padding:"10px 14px", borderRadius:10, backgroundColor:"#fefce8", border:"1px solid #fef9c3" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#854d0e", marginBottom:6 }}>NOTES</div>
                  <textarea
                    value={openClient.notes||""}
                    onChange={e=>save(clients.map(c=>c.id===openId?{...c,notes:e.target.value}:c))}
                    placeholder="Add notes about this client…"
                    rows={3}
                    style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:12, color:"#374151", lineHeight:1.6, resize:"vertical", outline:"none", fontFamily:"inherit", padding:0, margin:0 }}
                  />
                </div>
                {byProject.slice(0,4).map(([prj,emps])=>(
                  <div key={prj} style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #f3f4f6", backgroundColor:"#fafafa" }}>
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
              </div>
            )}

            {/* ACTIONS */}
            {detailTab==="actions" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {pendingActions.length===0 && (
                  <div style={{ textAlign:"center", padding:"32px 0" }}>
                    <CheckCircle size={28} style={{ margin:"0 auto 8px", display:"block", color:"#16a34a", opacity:0.4 }}/>
                    <p style={{ fontWeight:600, fontSize:13, color:"#374151", margin:"0 0 4px" }}>No pending actions</p>
                    <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>All client actions are resolved.</p>
                  </div>
                )}
                {pendingActions.map(r=>(
                  <div key={r.i} style={{ padding:"12px 14px", borderRadius:12, border:`1px solid ${r.dw>5?"#fecaca":"#f3f4f6"}`, backgroundColor:r.dw>5?"#fef2f2":"#fafafa", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#e0f2fe", color:"#0369a1" }}>{r.type}</span>
                        {r.dw>5 && <span style={{ fontSize:10, fontWeight:700, color:"#dc2626" }}>⚠ Delayed {r.dw}d</span>}
                      </div>
                      <p style={{ fontWeight:600, fontSize:13, margin:"0 0 2px", color:"#1f2937" }}>{r.employee}</p>
                      <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>
                        {new Date(r.ts).toLocaleDateString("en-GB")}
                        {r.dw>0 && <span style={{ marginLeft:6, fontWeight:700, color:r.dw>5?"#dc2626":"#d97706" }}>· {r.dw}d waiting</span>}
                      </p>
                    </div>
                    <button onClick={()=>updReqStatus(openClient.id,r.i,"Completed")} style={{ fontSize:11, fontWeight:700, padding:"5px 10px", borderRadius:8, border:"1px solid #bbf7d0", backgroundColor:"#f0fdf4", color:"#16a34a", cursor:"pointer", whiteSpace:"nowrap" }}>✓ Done</button>
                  </div>
                ))}
                {(openClient.requestLog||[]).filter(r=>r.status==="Completed").length>0 && (
                  <details style={{ marginTop:4 }}>
                    <summary style={{ fontSize:11, color:"#9ca3af", cursor:"pointer", fontWeight:600 }}>{(openClient.requestLog||[]).filter(r=>r.status==="Completed").length} completed actions</summary>
                    <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:8 }}>
                      {(openClient.requestLog||[]).filter(r=>r.status==="Completed").map((r,ri)=>(
                        <div key={ri} style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:9, backgroundColor:"#f9fafb", border:"1px solid #f3f4f6" }}>
                          <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{r.employee}<span style={{ fontWeight:400, color:"#9ca3af", marginLeft:6 }}>{r.type}</span></span>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#dcfce7", color:"#166534" }}>✓</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
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
                        <div key={e._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:9, border:`1px solid ${urg?"#fed7aa":"#f3f4f6"}`, backgroundColor:urg?"#fffbf5":"#fafafa", marginBottom:4 }}>
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
                  <span style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Contacts ({openClient.contacts.length})</span>
                  <button onClick={()=>addContact(openClient.id)} style={{ fontSize:11, fontWeight:700, color:M, background:"none", border:"none", cursor:"pointer" }}>+ Add</button>
                </div>
                {openClient.contacts.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"24px 0", fontSize:13 }}>No contacts yet.</p>}
                {openClient.contacts.map((co,ci)=>(
                  <div key={ci} style={{ display:"flex", alignItems:"center", gap:10, padding:10, borderRadius:10, backgroundColor:"#f9fafb", marginBottom:6, border:"1px solid #f3f4f6" }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${MD},${M})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13, fontWeight:700, flexShrink:0 }}>{(co.name||"?")[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <input value={co.name} onChange={e=>updContact(openClient.id,ci,"name",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:12, fontWeight:600, outline:"none" }}/>
                      <input value={co.role} onChange={e=>updContact(openClient.id,ci,"role",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:11, color:"#9ca3af", outline:"none" }}/>
                    </div>
                    <input value={co.phone} onChange={e=>updContact(openClient.id,ci,"phone",e.target.value)} style={{ width:130, border:"none", backgroundColor:"transparent", fontSize:11, textAlign:"right", outline:"none", direction:"ltr" }}/>
                    {co.phone && (
                      <button onClick={()=>{ const msg=`مرحباً ${co.name},\n\nأتواصل معك بخصوص ${openClient.name}.\n\nتحياتي`; window.open(`https://wa.me/${co.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank"); }} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:30, height:30, borderRadius:8, border:"1px solid #16a34a", backgroundColor:"white", color:"#16a34a", cursor:"pointer", flexShrink:0 }}>
                        <MessageCircle size={13}/>
                      </button>
                    )}
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
    </div>
  );
}

// ─── PARTNER HUB ────────────────────────────────────────────────────────
const DEF_PARTNERS=[
  {id:"P-01",name:"Safwa HR Solutions",  partnerType:"operational", region:"Riyadh",           email:"ops@safwa-hr.sa",      status:"active",contacts:[{name:"Mohammed Al-Ghamdi",role:"Operations",phone:"+966501111111"},{name:"Sara Al-Harbi",role:"Gov. Relations",phone:"+966502222222"}],notes:"Primary partner for Sela projects.",requestLog:[{ts:"2026-04-20T09:00:00Z",type:"Handover",employee:"Ahmed Al-Zahrani",status:"Completed"},{ts:"2026-04-28T11:00:00Z",type:"Docs Request",employee:"Fahad Mubarak",status:"Pending"}]},
  {id:"P-02",name:"Gulf Staffing Group", partnerType:"operational", region:"Eastern Province",  email:"admin@gulfstaffing.sa",status:"active",contacts:[{name:"Faisal Al-Dosari",role:"Finance",phone:"+966503333333"},{name:"Nour Khalid",role:"HR Manager",phone:"+966504444444"}],notes:"Handles SPL workforce.",requestLog:[{ts:"2026-04-25T14:00:00Z",type:"Handover",employee:"Sara Mohammed",status:"Completed"}]},
  {id:"P-03",name:"Blue Cube",           partnerType:"commission",  region:"Riyadh",           email:"",                     status:"active",contacts:[],notes:"Commission-only partner — no operational involvement.",requestLog:[]},
];

function PartnerHub({ employees, setAppPartners }) {
  const [partners,setPartners]=useState(()=>{try{return JSON.parse(localStorage.getItem("fisheyePartners_v1"))||DEF_PARTNERS;}catch{return DEF_PARTNERS;}});
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("active");
  const [openId,setOpenId]=useState(null);
  const [detailTab,setDetailTab]=useState("overview");
  const [editingInfo,setEditingInfo]=useState(false);
  const [infoForm,setInfoForm]=useState({name:"",region:"",email:""});
  const [nP,setNP]=useState({name:"",region:"",email:"",notes:""});

  const save=p=>{setPartners(p);localStorage.setItem("fisheyePartners_v1",JSON.stringify(p));if(setAppPartners)setAppPartners(p);};
  const add=()=>{save([...partners,{...nP,id:`P-${String(partners.length+1).padStart(2,"0")}`,status:"active",contacts:[],requestLog:[]}]);setShowAdd(false);setNP({name:"",region:"",email:"",notes:""});};
  const archive=id=>save(partners.map(p=>p.id===id?{...p,status:"archived"}:p));
  const unarchive=id=>save(partners.map(p=>p.id===id?{...p,status:"active"}:p));
  const deleteP=id=>{if(window.confirm("Delete this partner?"))save(partners.filter(p=>p.id!==id));};
  const addContact=pid=>save(partners.map(p=>p.id===pid?{...p,contacts:[...p.contacts,{name:"New Contact",role:"",phone:""}]}:p));
  const updContact=(pid,ci,f,v)=>save(partners.map(p=>p.id===pid?{...p,contacts:p.contacts.map((c,i)=>i===ci?{...c,[f]:v}:c)}:p));
  const addRequest=(pid,req)=>save(partners.map(p=>p.id===pid?{...p,requestLog:[...p.requestLog,req]}:p));
  const updReqStatus=(pid,ri,st)=>save(partners.map(p=>p.id===pid?{...p,requestLog:p.requestLog.map((r,i)=>i===ri?{...r,status:st}:r)}:p));
  const getLinked=pid=>{const p=partners.find(x=>x.id===pid);if(!p)return[];return employees.filter(e=>!isExcluded(e)&&(e.partnerAssigned===p.id||e.partnerAssigned===p.name));};
  const displayed=partners.filter(p=>filter==="all"||(filter==="archived"?p.status==="archived":p.status!=="archived"));

  // ── Global stats ──
  const totalPending=partners.reduce((s,p)=>s+(p.requestLog||[]).filter(r=>r.status==="Pending").length,0);
  const totalOverdue=partners.reduce((s,p)=>s+(p.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length,0);
  const totalAssigned=employees.filter(e=>e.partnerAssigned&&!isExcluded(e)).length;
  const totalExpiring=employees.filter(e=>e.partnerAssigned&&!isExcluded(e)&&(d=>d>=0&&d<=30)(daysUntil(e.endDate))).length;

  // ── Detail modal data ──
  const openPartner=partners.find(p=>p.id===openId)||null;
  const linkedEmps=openPartner?getLinked(openPartner.id):[];
  const expiringLinked=linkedEmps.filter(e=>{const d=daysUntil(e.endDate);return d>=0&&d<=30;}).length;
  const pendingActions=openPartner?(openPartner.requestLog||[]).map((r,i)=>({...r,i,dw:Math.floor((Date.now()-new Date(r.ts))/864e5)})).filter(r=>r.status==="Pending").sort((a,b)=>b.dw-a.dw):[];
  const completionRate=openPartner&&(openPartner.requestLog||[]).length>0?Math.round(((openPartner.requestLog||[]).filter(r=>r.status==="Completed").length/(openPartner.requestLog||[]).length)*100):null;

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

        {/* Partner list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {displayed.length===0 && (
            <div style={{ textAlign:"center", padding:"32px 16px", color:"#9ca3af" }}>
              <Users size={24} style={{ opacity:0.25, margin:"0 auto 8px", display:"block" }}/>
              <p style={{ fontSize:12, margin:0 }}>No partners</p>
            </div>
          )}
          {displayed.map(p => {
            const linked = getLinked(p.id);
            const pending = (p.requestLog||[]).filter(r=>r.status==="Pending").length;
            const overdue = (p.requestLog||[]).filter(r=>r.status==="Pending"&&Math.floor((Date.now()-new Date(r.ts))/864e5)>5).length;
            const isArchived = p.status === "archived";
            const health = calcPartnerHealth(p.id);
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
                      {!isArchived && <span style={{ width:6, height:6, borderRadius:"50%", backgroundColor:health.color, flexShrink:0, display:"inline-block" }}/>}
                      <span style={{ fontSize:10, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {isArchived ? "Archived" : `${linked.length} employees · ${health.label}`}
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
                </div>
              ) : (
                <div style={{ flex:1, minWidth:0 }}>
                  <h3 style={{ margin:0, fontSize:19, fontWeight:800, color:"white", letterSpacing:"-0.01em" }}>{openPartner.name}</h3>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"rgba(220,200,255,0.9)" }}>
                    {[openPartner.region, openPartner.email].filter(Boolean).join(" · ") || "—"}
                    {openPartner.partnerType && <span style={{ marginLeft:8, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999, backgroundColor:"rgba(255,255,255,0.18)", color:"white" }}>{openPartner.partnerType}</span>}
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
                    <button onClick={()=>{ setInfoForm({name:openPartner.name||"",region:openPartner.region||"",email:openPartner.email||""}); setEditingInfo(true); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>Edit</button>
                    <button onClick={()=>openPartner.status==="archived"?unarchive(openId):archive(openId)} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,255,255,0.3)", backgroundColor:"rgba(255,255,255,0.12)", color:"white", cursor:"pointer" }}>
                      {openPartner.status==="archived" ? "Restore" : "Archive"}
                    </button>
                    <button onClick={()=>{ if(window.confirm("Delete partner?")) deleteP(openId); }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:"1px solid rgba(255,100,100,0.4)", backgroundColor:"rgba(255,100,100,0.15)", color:"#fca5a5", cursor:"pointer" }}>Delete</button>
                  </>
                )}
              </div>
            </div>
            {/* Performance bar */}
            {(()=>{ const h=calcPartnerHealth(openPartner.id); return (
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
              { l:"WF Pending",   v:linkedEmps.filter(e=>!isWFDone(e.workflowStatus)).length,                      c:"#dc2626" },
              { l:"Completion",   v:completionRate!==null?`${completionRate}%`:"—",                                c:completionRate===null?"#9ca3af":completionRate>=80?"#16a34a":"#d97706" },
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
              <button key={t.k} onClick={()=>setDetailTab(t.k)} style={{ padding:"10px 16px", fontSize:11, fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, backgroundColor:"transparent", color:detailTab===t.k?PC:"#9ca3af", borderBottom:`2px solid ${detailTab===t.k?PC:"transparent"}`, transition:"color 0.1s" }}>{t.l}</button>
            ))}
            <div style={{ flex:1, display:"flex", justifyContent:"flex-end", alignItems:"center", padding:"0 16px" }}>
              <button onClick={()=>{
                const emp=prompt("Employee name / description:");
                const type=prompt("Action type (Handover / Docs Request / GOSI / Iqama / Other):");
                if(emp&&type) addRequest(openPartner.id,{ts:new Date().toISOString(),type,employee:emp,status:"Pending"});
              }} style={{ fontSize:10, fontWeight:700, padding:"5px 11px", borderRadius:7, border:`1px solid ${PC}`, backgroundColor:PC, color:"white", cursor:"pointer" }}>
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
                    value={openPartner.notes||""}
                    onChange={e=>save(partners.map(p=>p.id===openId?{...p,notes:e.target.value}:p))}
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
                  <div key={client} style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #f3f4f6", backgroundColor:"#fafafa" }}>
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
                {pendingActions.length===0 && (
                  <div style={{ textAlign:"center", padding:"32px 0" }}>
                    <CheckCircle size={28} style={{ margin:"0 auto 8px", display:"block", color:"#16a34a", opacity:0.4 }}/>
                    <p style={{ fontWeight:600, fontSize:13, color:"#374151", margin:"0 0 4px" }}>No pending actions</p>
                    <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>All partner actions are resolved.</p>
                  </div>
                )}
                {pendingActions.map(r=>(
                  <div key={r.i} style={{ padding:"12px 14px", borderRadius:12, border:`1px solid ${r.dw>5?"#fecaca":"#f3f4f6"}`, backgroundColor:r.dw>5?"#fef2f2":"#fafafa", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#ede9fe", color:"#6d28d9" }}>{r.type}</span>
                        {r.dw>5 && <span style={{ fontSize:10, fontWeight:700, color:"#dc2626" }}>Delayed {r.dw}d</span>}
                      </div>
                      <p style={{ fontWeight:600, fontSize:13, margin:"0 0 2px", color:"#1f2937" }}>{r.employee}</p>
                      <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>
                        {new Date(r.ts).toLocaleDateString("en-GB")}
                        {r.dw>0 && <span style={{ marginLeft:6, fontWeight:700, color:r.dw>5?"#dc2626":"#d97706" }}>· {r.dw}d waiting</span>}
                      </p>
                    </div>
                    <button onClick={()=>updReqStatus(openPartner.id,r.i,"Completed")} style={{ fontSize:11, fontWeight:700, padding:"5px 10px", borderRadius:8, border:"1px solid #bbf7d0", backgroundColor:"#f0fdf4", color:"#16a34a", cursor:"pointer", whiteSpace:"nowrap" }}>Done</button>
                  </div>
                ))}
                {(openPartner.requestLog||[]).filter(r=>r.status==="Completed").length>0 && (
                  <details style={{ marginTop:4 }}>
                    <summary style={{ fontSize:11, color:"#9ca3af", cursor:"pointer", fontWeight:600 }}>{(openPartner.requestLog||[]).filter(r=>r.status==="Completed").length} completed actions</summary>
                    <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:8 }}>
                      {(openPartner.requestLog||[]).filter(r=>r.status==="Completed").map((r,ri)=>(
                        <div key={ri} style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", borderRadius:9, backgroundColor:"#f9fafb", border:"1px solid #f3f4f6" }}>
                          <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{r.employee}<span style={{ fontWeight:400, color:"#9ca3af", marginLeft:6 }}>{r.type}</span></span>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, backgroundColor:"#dcfce7", color:"#166534" }}>✓</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* EMPLOYEES */}
            {detailTab==="employees" && (
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {linkedEmps.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"32px 0", fontSize:13 }}>No employees assigned.</p>}
                {linkedEmps.map(e=>{
                  const d=daysUntil(e.endDate);
                  const urg=d>=0&&d<=30;
                  return (
                    <div key={e._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:10, border:`1px solid ${urg?"#fed7aa":"#f3f4f6"}`, backgroundColor:urg?"#fffbf5":"#fafafa" }}>
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
                  <span style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>Contacts ({openPartner.contacts.length})</span>
                  <button onClick={()=>addContact(openPartner.id)} style={{ fontSize:11, fontWeight:700, color:PC, background:"none", border:"none", cursor:"pointer" }}>+ Add</button>
                </div>
                {openPartner.contacts.length===0 && <p style={{ textAlign:"center", color:"#9ca3af", padding:"24px 0", fontSize:13 }}>No contacts yet.</p>}
                {openPartner.contacts.map((co,ci)=>(
                  <div key={ci} style={{ display:"flex", alignItems:"center", gap:10, padding:10, borderRadius:10, backgroundColor:"#f9fafb", marginBottom:6, border:"1px solid #f3f4f6" }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:PU, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13, fontWeight:700, flexShrink:0 }}>{(co.name||"?")[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <input value={co.name} onChange={e=>updContact(openPartner.id,ci,"name",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:12, fontWeight:600, outline:"none" }}/>
                      <input value={co.role} onChange={e=>updContact(openPartner.id,ci,"role",e.target.value)} style={{ width:"100%", border:"none", backgroundColor:"transparent", fontSize:11, color:"#9ca3af", outline:"none" }}/>
                    </div>
                    <input value={co.phone} onChange={e=>updContact(openPartner.id,ci,"phone",e.target.value)} style={{ width:130, border:"none", backgroundColor:"transparent", fontSize:11, textAlign:"right", outline:"none", direction:"ltr" }}/>
                    {co.phone && (
                      <button onClick={()=>{ const msg=`مرحباً ${co.name},\n\nأتواصل معك بخصوص شراكتنا.\n\nتحياتي`; window.open(`https://wa.me/${co.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank"); }} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:30, height:30, borderRadius:8, border:"1px solid #16a34a", backgroundColor:"white", color:"#16a34a", cursor:"pointer", flexShrink:0 }}>
                        <MessageCircle size={13}/>
                      </button>
                    )}
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
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)} full>Cancel</Btn>
              <Btn onClick={add} disabled={!nP.name} full style={{ backgroundColor:PC, color:"white" }}><Plus size={14}/> Add Partner</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TICKETS ────────────────────────────────────────────────────────────
const DEF_TICKETS=[
  {id:"TKT-001",subject:"Iqama renewal — SILQFI batch",category:"Legal",priority:"High",status:"Open",requesterName:"Mohammed Al-Rashidi",requesterPhone:"+966501234567",requesterType:"Partner",created:"2026-04-28",messages:[{sender:"Admin",text:"MOL request submitted. Awaiting approval.",ts:"2026-04-28T09:00:00Z"}]},
  {id:"TKT-002",subject:"April payroll discrepancy — SPL",category:"Payroll",priority:"Medium",status:"In Progress",requesterName:"HR Manager",requesterPhone:"+966509876543",requesterType:"Client",created:"2026-04-29",messages:[]},
];

function TicketingView() {
  const [tickets,setTickets]=useState(DEF_TICKETS);
  const [active,setActive]=useState(null);
  const [msg,setMsg]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [showLink,setShowLink]=useState(false);
  const [showPublic,setShowPublic]=useState(false);
  const [pubForm,setPubForm]=useState({name:"",phone:"",email:"",type:"Employee",category:"HR",priority:"Medium",subject:"",description:""});
  const [nt,setNt]=useState({subject:"",category:"Legal",priority:"Medium",requesterName:"",requesterPhone:"",requesterType:"Employee"});
  const msgRef=useRef();

  const ticket=tickets.find(t=>t.id===active);
  const send=()=>{if(!msg.trim())return;setTickets(prev=>prev.map(t=>t.id===active?{...t,messages:[...t.messages,{sender:"Admin",text:msg,ts:new Date().toISOString()}]}:t));setMsg("");setTimeout(()=>msgRef.current?.scrollTo(0,99999),80);};
  const changeStatus=(id,status)=>setTickets(prev=>prev.map(t=>t.id===id?{...t,status}:t));
  const create=()=>{const id=`TKT-${String(tickets.length+3).padStart(3,"0")}`;setTickets(prev=>[...prev,{...nt,id,status:"Open",created:new Date().toISOString().split("T")[0],messages:[]}]);setShowNew(false);};
  const submitPublic=()=>{const id=`TKT-EXT-${Date.now().toString().slice(-4)}`;const newT={id,subject:pubForm.subject,category:pubForm.category,priority:pubForm.priority,status:"Open",requesterName:pubForm.name,requesterPhone:pubForm.phone,requesterType:pubForm.type,created:new Date().toISOString().split("T")[0],messages:[{sender:"System",text:`External: ${pubForm.description}`,ts:new Date().toISOString()}]};setTickets(prev=>[newT,...prev]);setShowPublic(false);setPubForm({name:"",phone:"",email:"",type:"Employee",category:"HR",priority:"Medium",subject:"",description:""});};

  const pc={High:["#fee2e2","#991b1b"],Medium:["#fef9c3","#854d0e"],Low:["#dbeafe","#1e40af"]};
  const sc={Open:["#fee2e2","#991b1b"],"In Progress":["#fef9c3","#854d0e"],Closed:["#dcfce7","#166534"]};
  const rtc={Employee:["#dbeafe","#1e40af"],Client:["#f3e8ff","#581c87"],Partner:["#ffedd5","#7c2d12"]};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{...s.flexBetween,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:700}}>Support Tickets</h2>
          <p style={{margin:"2px 0 0",fontSize:13,color:"#6b7280"}}>{tickets.length} total · {tickets.filter(t=>t.status==="Open").length} open</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="ghost" onClick={()=>setShowPublic(true)} style={s.btnSm}><Globe size={13}/> Preview Portal</Btn>
          <Btn variant="ghost" onClick={()=>setShowLink(true)} style={s.btnSm}><Link size={13}/> External Link</Btn>
        </div>
      </div>

      <div style={{display:"flex",gap:16,height:"calc(100vh - 280px)",minHeight:520}}>
        {/* List */}
        <div style={{width:300,flexShrink:0,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{...s.flexBetween}}>
            <p style={{fontWeight:700,fontSize:14,margin:0,display:"flex",alignItems:"center",gap:6}}><Inbox size={14} style={{color:M}}/> Inbox</p>
            <Btn style={s.btnSm} onClick={()=>setShowNew(t=>!t)}><Plus size={12}/> New</Btn>
          </div>
          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
            {tickets.map(t=>(
              <button key={t.id} onClick={()=>setActive(t.id)} style={{textAlign:"left",padding:16,borderRadius:12,border:`2px solid ${active===t.id?M:"#e5e7eb"}`,backgroundColor:active===t.id?`${M}06`:"white",cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{...s.flexBetween,marginBottom:8}}>
                  <span style={{fontSize:11,fontFamily:"monospace",color:"#9ca3af"}}>{t.id}</span>
                  <span style={{fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:999,backgroundColor:pc[t.priority]?.[0],color:pc[t.priority]?.[1]}}>{t.priority}</span>
                </div>
                <p style={{fontWeight:600,fontSize:13,margin:"0 0 8px",color:"#1f2937"}}>{t.subject}</p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:999,backgroundColor:sc[t.status]?.[0],color:sc[t.status]?.[1]}}>{t.status}</span>
                  <span style={{fontSize:11,color:"#9ca3af"}}>{t.category}</span>
                  {t.requesterType&&<span style={{fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:999,backgroundColor:rtc[t.requesterType]?.[0]||"#f3f4f6",color:rtc[t.requesterType]?.[1]||"#374151"}}>{t.requesterType}</span>}
                </div>
                {t.requesterName&&<p style={{fontSize:11,color:"#9ca3af",margin:"6px 0 0",display:"flex",alignItems:"center",gap:4}}><User size={10}/>{t.requesterName}</p>}
              </button>
            ))}
          </div>
          {showNew&&(
            <Card style={{padding:16,flexShrink:0}}>
              <div style={{...s.flexBetween,marginBottom:12}}><span style={{fontWeight:700,fontSize:13}}>New Ticket</span><button onClick={()=>setShowNew(false)} style={{background:"none",border:"none",cursor:"pointer"}}><X size={13} style={{color:"#9ca3af"}}/></button></div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <Inp label="Subject" value={nt.subject} onChange={v=>setNt(p=>({...p,subject:v}))}/>
                <Inp label="Requester Name" value={nt.requesterName} onChange={v=>setNt(p=>({...p,requesterName:v}))}/>
                <Inp label="Requester Phone" value={nt.requesterPhone} onChange={v=>setNt(p=>({...p,requesterPhone:v}))}/>
                <div style={s.grid2}>
                  <Sel value={nt.requesterType} onChange={v=>setNt(p=>({...p,requesterType:v}))} options={["Employee","Client","Partner"]}/>
                  <Sel value={nt.category} onChange={v=>setNt(p=>({...p,category:v}))} options={["Legal","Payroll","Docs","HR","IT","Iqama"]}/>
                </div>
                <Sel value={nt.priority} onChange={v=>setNt(p=>({...p,priority:v}))} options={["High","Medium","Low"]}/>
                <Btn full onClick={create} disabled={!nt.subject}>Create</Btn>
              </div>
            </Card>
          )}
        </div>

        {/* Chat */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          {ticket?(
            <Card style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"12px 20px",borderBottom:"1px solid #f3f4f6",backgroundColor:`${M}08`,flexShrink:0}}>
                <div style={{...s.flexBetween,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:14}}>{ticket.subject}</span>
                      <span style={{fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:999,backgroundColor:sc[ticket.status]?.[0],color:sc[ticket.status]?.[1]}}>{ticket.status}</span>
                      <span style={{fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:999,backgroundColor:pc[ticket.priority]?.[0],color:pc[ticket.priority]?.[1]}}>{ticket.priority}</span>
                    </div>
                    <div style={{fontSize:11,color:"#9ca3af",marginTop:4,display:"flex",alignItems:"center",gap:12}}>
                      <span>{ticket.id} · {ticket.category} · {ticket.created}</span>
                      {ticket.requesterName&&<span style={{display:"flex",alignItems:"center",gap:4}}><User size={10}/>{ticket.requesterName}</span>}
                      {ticket.requesterPhone&&<WABtn phone={ticket.requesterPhone} label="Notify"/>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {["Open","In Progress","Closed"].map(st=>(
                      <button key={st} onClick={()=>changeStatus(ticket.id,st)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${ticket.status===st?M:"#e5e7eb"}`,backgroundColor:ticket.status===st?M:"white",color:ticket.status===st?"white":"#6b7280",cursor:"pointer"}}>{st}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div ref={msgRef} style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:16,backgroundColor:"#fafafa"}}>
                {!ticket.messages.length&&<div style={{textAlign:"center",color:"#9ca3af",marginTop:48}}><MessageCircle size={32} style={{margin:"0 auto 8px",opacity:0.2,display:"block"}}/>No messages.</div>}
                {ticket.messages.map((m,i)=>{
                  const isAdmin=m.sender==="Admin";
                  return (
                    <div key={i} style={{display:"flex",justifyContent:isAdmin?"flex-end":"flex-start"}}>
                      <div style={{maxWidth:400,padding:"12px 16px",borderRadius:16,backgroundColor:isAdmin?M:"white",border:isAdmin?"none":"1px solid #e5e7eb",borderBottomRightRadius:isAdmin?4:16,borderBottomLeftRadius:isAdmin?16:4}}>
                        <p style={{fontSize:11,fontWeight:700,margin:"0 0 4px",color:isAdmin?"rgba(255,200,200,0.8)":"#9ca3af"}}>{m.sender}</p>
                        <p style={{fontSize:13,margin:0,color:isAdmin?"white":"#1f2937",lineHeight:1.5}}>{m.text}</p>
                        <p style={{fontSize:11,margin:"6px 0 0",color:isAdmin?"rgba(255,200,200,0.6)":"#9ca3af"}}>{new Date(m.ts).toLocaleTimeString("en-SA",{hour:"2-digit",minute:"2-digit"})}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{padding:16,borderTop:"1px solid #f3f4f6",backgroundColor:"white",display:"flex",gap:12,flexShrink:0}}>
                <input style={{...s.inp,flex:1}} placeholder="Type message… (Enter to send)" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}/>
                <Btn onClick={send} disabled={!msg.trim()}><Send size={14}/></Btn>
              </div>
            </Card>
          ):(
            <Card style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{textAlign:"center",color:"#9ca3af"}}>
                <Inbox size={48} style={{margin:"0 auto 12px",opacity:0.2,display:"block"}}/>
                <p style={{fontWeight:600,margin:0}}>Select a ticket</p>
                <p style={{fontSize:13,margin:"4px 0 0"}}>Or create a new one</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showLink&&(
        <Modal title="External Ticket Link" onClose={()=>setShowLink(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{padding:16,backgroundColor:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12}}>
              <p style={{fontSize:12,fontWeight:700,color:"#166534",margin:"0 0 8px"}}>Public submission URL</p>
              <code style={{fontSize:11,fontFamily:"monospace",color:"#15803d",wordBreak:"break-all"}}>{`https://fisheye-ops.sa/submit-ticket?token=${btoa("fisheye-public")}`}</code>
            </div>
            <div style={{padding:16,backgroundColor:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,fontSize:12,color:"#92400e"}}>
              <p style={{fontWeight:700,margin:"0 0 6px"}}>⚡ Zapier Integration</p>
              <p style={{margin:"0 0 8px"}}>Paste your Zapier webhook URL to auto-notify Gmail when a ticket is submitted:</p>
              <input placeholder="https://hooks.zapier.com/…" style={{...s.inp,border:"1px solid #fde68a",backgroundColor:"white"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="ghost" style={s.btnSm} onClick={()=>navigator.clipboard?.writeText("https://fisheye-ops.sa/submit-ticket")}><Copy size={12}/> Copy Link</Btn>
              <Btn style={s.btnSm} onClick={()=>{setShowLink(false);setShowPublic(true);}}><Globe size={12}/> Preview Portal</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showPublic&&(
        <Modal title="Public Ticket Portal" subtitle="Preview — how submitters see it" onClose={()=>setShowPublic(false)} wide>
          <div style={{backgroundColor:"#f9fafb",borderRadius:16,padding:32,border:"1px solid #e5e7eb"}}>
            <div style={{maxWidth:480,margin:"0 auto"}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:48,height:48,backgroundColor:"white",borderRadius:16,boxShadow:"0 2px 8px rgba(0,0,0,0.1)",marginBottom:12}}><Eye size={22} style={{color:M}}/></div>
                <h3 style={{fontSize:22,fontWeight:900,color:MD,margin:0}}>Fisheye Ops</h3>
                <p style={{color:"#6b7280",fontSize:13,margin:"4px 0 0"}}>Submit a support request</p>
              </div>
              <div style={{backgroundColor:"white",borderRadius:16,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",padding:24,display:"flex",flexDirection:"column",gap:16}}>
                <div style={s.grid2}>
                  <Inp label="Your Name" value={pubForm.name} onChange={v=>setPubForm(p=>({...p,name:v}))} placeholder="Full name"/>
                  <div>
                    <label style={s.label}>I am a…</label>
                    <select value={pubForm.type} onChange={e=>setPubForm(p=>({...p,type:e.target.value}))} style={s.sel}>
                      {["Employee","Client","Partner"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={s.grid2}>
                  <Inp label="Phone / WhatsApp" value={pubForm.phone} onChange={v=>setPubForm(p=>({...p,phone:v}))} placeholder="+966…"/>
                  <Inp label="Email (optional)" value={pubForm.email} onChange={v=>setPubForm(p=>({...p,email:v}))} placeholder="you@email.com"/>
                </div>
                <div style={s.grid2}>
                  <Sel label="Category" value={pubForm.category} onChange={v=>setPubForm(p=>({...p,category:v}))} options={["HR","Legal","Payroll","Docs","Iqama","IT","Other"]}/>
                  <Sel label="Priority" value={pubForm.priority} onChange={v=>setPubForm(p=>({...p,priority:v}))} options={["High","Medium","Low"]}/>
                </div>
                <Inp label="Subject" value={pubForm.subject} onChange={v=>setPubForm(p=>({...p,subject:v}))} placeholder="Brief description…"/>
                <div>
                  <label style={s.label}>Details</label>
                  <textarea rows={4} value={pubForm.description} onChange={e=>setPubForm(p=>({...p,description:e.target.value}))} style={{...s.inp,resize:"none"}} placeholder="Describe your request…"/>
                </div>
                <Btn full disabled={!pubForm.name||!pubForm.subject} onClick={submitPublic}><Send size={14}/> Submit Request</Btn>
                <p style={{fontSize:11,color:"#9ca3af",textAlign:"center",margin:0}}>You'll receive a ticket ID to track your request</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 COMMAND CENTER VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardView({ employees, isOnline, syncStatus, syncMessage, syncProgress, lastSync, uploadToCloud, downloadFromCloud, backup, bidirectionalSync }) {
  const [showSync, setShowSync] = useState(false);

  // ── Global filters ───────────────────────────────────────────────────────
  const [globalClient,   setGlobalClient]   = useState('All');
  const [globalStatus,   setGlobalStatus]   = useState('All'); // All / active / new / renewal / transfer

  // ── Per-zone type toggles ────────────────────────────────────────────────
  const [urgentTypes,  setUrgentTypes]  = useState({ expiring: true, agreement: true, docs: true });
  const [followTypes,  setFollowTypes]  = useState({ expiring30: true, pending: true, nopo: true, onboarding: true });
  const [trackClients, setTrackClients] = useState(Object.fromEntries(CLIENTS_LIST.map(c => [c, true])));

  // ── Zone collapse state ──────────────────────────────────────────────────
  const [urgentOpen,  setUrgentOpen]  = useState(true);
  const [followOpen,  setFollowOpen]  = useState(true);
  const [trackOpen,   setTrackOpen]   = useState(true);

  // ── Filter panel open state ──────────────────────────────────────────────
  const [urgentFiltOpen, setUrgentFiltOpen]  = useState(false);
  const [followFiltOpen, setFollowFiltOpen]  = useState(false);
  const [trackFiltOpen,  setTrackFiltOpen]   = useState(false);

  // ── Pool: apply global filters ───────────────────────────────────────────
  const pool = employees.filter(e => {
    if (isExcluded(e)) return false;
    if (globalClient !== 'All' && e.client !== globalClient) return false;
    if (globalStatus !== 'All' && e.status !== globalStatus) return false;
    return true;
  });

  // ── Raw buckets ──────────────────────────────────────────────────────────
  const raw = {
    expiring:    pool.filter(e => { const d = daysUntil(e.endDate); return d >= 0 && d <= 7; }),
    agreement:   pool.filter(e => (e.workflowStatus||'').toLowerCase() === 'agreement sent'),
    docs:        pool.filter(e => (e.workflowStatus||'').toLowerCase() === 'docs requested'),
    expiring30:  pool.filter(e => { const d = daysUntil(e.endDate); return d > 7 && d <= 30; }),
    pending:     pool.filter(e => (e.workflowStatus||'').toLowerCase() === 'pending'),
    nopo:        pool.filter(e => e.client === 'Sela' && !e.poNumbers),
    onboarding:  pool.filter(e => (e.workflowStatus||'').toLowerCase() === 'onboarding'),
    onTrack:     pool.filter(e => isWFDone(e.workflowStatus)),
  };

  // ── Filtered buckets (apply zone toggles) ───────────────────────────────
  const urgentItems = [
    ...(urgentTypes.expiring   ? raw.expiring.map(e   => ({ ...e, _t: 'expiring' }))   : []),
    ...(urgentTypes.agreement  ? raw.agreement.map(e  => ({ ...e, _t: 'agreement' }))  : []),
    ...(urgentTypes.docs       ? raw.docs.map(e       => ({ ...e, _t: 'docs' }))       : []),
  ];
  const followItems = [
    ...(followTypes.expiring30 ? raw.expiring30.map(e  => ({ ...e, _t: 'expiring30' })) : []),
    ...(followTypes.pending    ? raw.pending.map(e     => ({ ...e, _t: 'pending' }))    : []),
    ...(followTypes.nopo       ? raw.nopo.map(e        => ({ ...e, _t: 'nopo' }))       : []),
    ...(followTypes.onboarding ? raw.onboarding.map(e  => ({ ...e, _t: 'onboarding' })) : []),
  ];
  const trackItems = raw.onTrack.filter(e => trackClients[e.client]);

  // ── Summary counts use RAW (unfiltered by zone toggles) ─────────────────
  const urgentRawCount = raw.expiring.length + raw.agreement.length + raw.docs.length;
  const followRawCount = raw.expiring30.length + raw.pending.length + raw.nopo.length + raw.onboarding.length;
  const totalActive    = employees.filter(e => !isExcluded(e)).length;

  // ── Invoice Alert: لو بعد يوم 7 وفيه كلاينت invoice لسه مش بعتت ──────────
  const invoiceAlert = useMemo(() => {
    const today = new Date();
    if (today.getDate() <= 7) return null; // بكري — مش وقت التنبيه
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    let flowData = {};
    try { flowData = JSON.parse(localStorage.getItem('fisheye_payroll_flow_v1')) || {}; } catch {}
    const activeEmps = employees.filter(e => !isExcluded(e));
    const clientsWithPendingInvoice = CLIENTS_LIST.filter(client => {
      const clientEmps = activeEmps.filter(e => e.client === client);
      if (clientEmps.length === 0) return false;
      // لو أي موظف في الكلاينت ده invoice step مش done
      return clientEmps.some(e => !flowData[`${currentMonthKey}_${e._id}`]?.invoice);
    });
    return clientsWithPendingInvoice.length > 0 ? clientsWithPendingInvoice : null;
  }, [employees]);

  // ── Financial Summary (للـ Dashboard strip) ──────────────────────────────
  const financialSummary = useMemo(() => {
    const activeEmps = employees.filter(e => !isExcluded(e));
    const totalPayroll = activeEmps.reduce((s, e) => s + Number(e.totalPackage || 0), 0);
    let totalMargin = 0, totalBilled = 0;
    activeEmps.forEach(e => {
      const isSela = (e.client || "").toLowerCase() === "sela";
      const hasPO  = e.poNumbers && String(e.poNumbers).trim() !== "";
      if (isSela && !hasPO) return; // Sela بدون PO مش محسوبة في الفواتير
      const p = calcProfit(e);
      totalMargin += p > 0 ? p : 0;
      totalBilled += Number(e.clientPrice || 0) || Math.round(Number(e.totalPackage || 0) * 1.15);
    });
    return { totalPayroll, totalMargin, totalBilled };
  }, [employees]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const Toggle = ({ label, active, onToggle, color = M, count }) => (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
      border: `1px solid ${active ? color : '#e5e7eb'}`,
      backgroundColor: active ? `${color}15` : '#f9fafb',
      color: active ? color : '#9ca3af', cursor: 'pointer',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: active ? color : '#d1d5db', flexShrink: 0 }} />
      {label}
      {count !== undefined && <span style={{ fontSize: 10, backgroundColor: active ? color : '#e5e7eb', color: active ? 'white' : '#6b7280', borderRadius: 999, padding: '1px 5px' }}>{count}</span>}
    </button>
  );

  const ZoneHeader = ({ emoji, title, color, bgColor, borderColor, count, open, setOpen, onFiltToggle, filtOpen, children }) => (
    <Card style={{ overflow: 'hidden', border: `2px solid ${borderColor}` }}>
      <div style={{ padding: '10px 16px', backgroundColor: bgColor, borderBottom: open ? `1px solid ${borderColor}` : 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 14 }}>{emoji}</span>
        <span style={{ fontWeight: 800, fontSize: 13, color }}>{title}</span>
        <span style={{ fontWeight: 900, fontSize: 14, color, backgroundColor: 'white', padding: '1px 9px', borderRadius: 999, marginLeft: 4 }}>{count}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }} onClick={ev => ev.stopPropagation()}>
          <button onClick={onFiltToggle}
            style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: `1px solid ${filtOpen ? color : borderColor}`, backgroundColor: filtOpen ? `${color}20` : 'white', color: filtOpen ? color : '#6b7280', cursor: 'pointer' }}>
            {filtOpen ? '▲ Filters' : '▼ Filters'}
          </button>
          <span style={{ fontSize: 12, color, fontWeight: 700 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {children}
    </Card>
  );

  const UrgentItem = ({ e }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderBottom: '1px solid #fff5f5' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{e.name}</span>
          <ClientBadge client={e.client} small />
          <WFBadge status={e.workflowStatus} />
        </div>
        <div style={{ fontSize: 11, color: '#991b1b', marginTop: 1 }}>
          {e._t === 'expiring'   && `⏰ ينتهي خلال ${daysUntil(e.endDate)} يوم — ${fmt(e.endDate)}`}
          {e._t === 'agreement'  && `📋 Agreement Sent — في انتظار التوقيع`}
          {e._t === 'docs'       && `📂 Docs Requested — في انتظار المستندات`}
        </div>
      </div>
      {e.phone && <WABtn phone={e.phone} label="WhatsApp" />}
    </div>
  );

  const FollowItem = ({ e }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderBottom: '1px solid #fffbeb' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{e.name}</span>
          <ClientBadge client={e.client} small />
          <StatusBadge status={e.status} />
        </div>
        <div style={{ fontSize: 11, color: '#854d0e', marginTop: 1 }}>
          {e._t === 'expiring30'  && `⚠ ينتهي خلال ${daysUntil(e.endDate)} يوم — ${fmt(e.endDate)}`}
          {e._t === 'pending'     && `⏳ Pending — بانتظار الإجراء`}
          {e._t === 'nopo'        && `📋 بدون PO Number (Sela)`}
          {e._t === 'onboarding'  && `🚀 Onboarding — جاري التأهيل`}
        </div>
      </div>
      {e.phone && <WABtn phone={e.phone} label="WA" />}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ ...s.flexBetween, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })} · {totalActive} active
          </p>
        </div>
        {isOnline && (
          <button onClick={() => setShowSync(o => !o)}
            style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${syncStatus === 'syncing' ? '#fbbf24' : '#e5e7eb'}`, backgroundColor: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={12} style={{ color: '#3b82f6' }} />
            {syncStatus === 'syncing' ? '🔄 Syncing…' : '☁ Sync'}
          </button>
        )}
      </div>

      {/* ── Financial Summary Strip ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Total Payroll',  value: fmtSARShort(financialSummary.totalPayroll),  color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Est. Billed',    value: fmtSARShort(financialSummary.totalBilled),   color: M,         bg: `${M}06`,  border: `${M}25`  },
          { label: 'Net Margin',     value: fmtSARShort(financialSummary.totalMargin),   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
        ].map(k => (
          <div key={k.label} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${k.border}`, backgroundColor: k.bg }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{k.label}</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Invoice Alert ─────────────────────────────────────────────────── */}
      {invoiceAlert && (
        <div style={{ padding: '10px 16px', borderRadius: 10, backgroundColor: '#fff7ed', border: '2px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AlertTriangle size={15} style={{ color: '#c2410c', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#c2410c' }}>
            ⚠ Invoice لم تُرسل بعد يوم {new Date().getDate()}:
          </span>
          {invoiceAlert.map(c => (
            <span key={c} style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, backgroundColor: '#ffedd5', color: '#9a3412' }}>{c}</span>
          ))}
          <span style={{ fontSize: 11, color: '#b45309', marginLeft: 'auto' }}>→ Finance → Payroll Flow</span>
        </div>
      )}

      {/* ── Sync panel ────────────────────────────────────────────────────── */}
      {showSync && isOnline && (
        <Card style={{ padding: 14, border: '2px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn onClick={uploadToCloud}     disabled={syncStatus==='syncing'} style={{ ...s.btnPrimary, backgroundColor: '#3b82f6', ...s.btnSm }}>📤 Upload</Btn>
            <Btn onClick={downloadFromCloud} disabled={syncStatus==='syncing'} style={{ ...s.btnPrimary, backgroundColor: '#7c3aed', ...s.btnSm }}>📥 Download</Btn>
            <Btn onClick={backup}            disabled={syncStatus==='syncing'} style={{ ...s.btnPrimary, backgroundColor: '#16a34a', ...s.btnSm }}>💾 Backup</Btn>
            <Btn onClick={bidirectionalSync} disabled={syncStatus==='syncing'} style={{ ...s.btnPrimary, backgroundColor: '#0891b2', ...s.btnSm }}>⇄ Sync Both</Btn>
          </div>
          {syncMessage && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#1e40af' }}>{syncMessage}</p>}
        </Card>
      )}

      {/* ── GLOBAL FILTERS ────────────────────────────────────────────────── */}
      <Card style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Client */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>العميل:</span>
            {['All', ...CLIENTS_LIST].map(c => {
              const meta = c === 'All' ? null : CLIENT_META[c];
              const isAct = globalClient === c;
              const cnt = c === 'All' ? pool.length : pool.filter(e => e.client === c).length;
              return (
                <button key={c} onClick={() => setGlobalClient(c)} style={{
                  padding: '3px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${isAct ? (meta ? meta.dot : M) : '#e5e7eb'}`,
                  backgroundColor: isAct ? (meta ? meta.badge : `${M}12`) : 'white',
                  color: isAct ? (meta ? meta.text : M) : '#6b7280',
                }}>
                  {c === 'All' ? '🌐 All' : c}
                  <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>({cnt})</span>
                </button>
              );
            })}
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb' }} />

          {/* Status */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>الحالة:</span>
            {['All', 'active', 'new', 'renewal', 'transfer'].map(st => (
              <button key={st} onClick={() => setGlobalStatus(st)} style={{
                padding: '3px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${globalStatus === st ? M : '#e5e7eb'}`,
                backgroundColor: globalStatus === st ? `${M}12` : 'white',
                color: globalStatus === st ? M : '#6b7280',
                textTransform: 'capitalize',
              }}>
                {st === 'All' ? '🌐 All' : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Summary Row ───────────────────────────────────────────────────── */}
      <div style={s.grid3}>
        {[
          { count: urgentRawCount, label: '🔴 URGENT', sub: 'لازم يتعمل النهارده', bg: '#fee2e2', border: '#fca5a5', color: '#dc2626', subColor: '#991b1b' },
          { count: followRawCount, label: '🟡 FOLLOW UP', sub: 'في انتظارك', bg: '#fef9c3', border: '#fde047', color: '#d97706', subColor: '#854d0e' },
          { count: trackItems.length, label: '🟢 ON TRACK', sub: 'مش محتاج attention', bg: '#dcfce7', border: '#86efac', color: '#16a34a', subColor: '#166534' },
        ].map(z => (
          <div key={z.label} style={{ padding: 16, borderRadius: 12, backgroundColor: z.bg, border: `2px solid ${z.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: z.color, lineHeight: 1 }}>{z.count}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: z.subColor, marginTop: 4 }}>{z.label}</div>
            <div style={{ fontSize: 10, color: z.subColor, opacity: 0.8, marginTop: 1 }}>{z.sub}</div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 🔴 URGENT ZONE                                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <ZoneHeader
        emoji="🔴" title="URGENT — لازم يتعمل النهارده"
        color="#991b1b" bgColor="#fee2e2" borderColor="#fca5a5"
        count={urgentItems.length}
        open={urgentOpen} setOpen={setUrgentOpen}
        filtOpen={urgentFiltOpen} onFiltToggle={() => setUrgentFiltOpen(o => !o)}
      >
        {/* Filter row */}
        {urgentFiltOpen && (
          <div style={{ padding: '10px 16px', backgroundColor: '#fff5f5', borderBottom: '1px solid #fca5a5', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b' }}>إظهار:</span>
            <Toggle label="⏰ Expiring ≤7 days" active={urgentTypes.expiring}
              onToggle={() => setUrgentTypes(t => ({ ...t, expiring: !t.expiring }))}
              color="#dc2626" count={raw.expiring.length} />
            <Toggle label="📋 Agreement Sent" active={urgentTypes.agreement}
              onToggle={() => setUrgentTypes(t => ({ ...t, agreement: !t.agreement }))}
              color="#dc2626" count={raw.agreement.length} />
            <Toggle label="📂 Docs Requested" active={urgentTypes.docs}
              onToggle={() => setUrgentTypes(t => ({ ...t, docs: !t.docs }))}
              color="#dc2626" count={raw.docs.length} />
          </div>
        )}
        {/* List */}
        {urgentOpen && (
          urgentItems.length === 0
            ? <div style={{ padding: '18px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>✅ لا يوجد items بالفلاتر دي</div>
            : <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {urgentItems.map((e, i) => <UrgentItem key={`${e._id}-${i}`} e={e} />)}
              </div>
        )}
      </ZoneHeader>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 🟡 FOLLOW UP ZONE                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <ZoneHeader
        emoji="🟡" title="FOLLOW UP — في انتظارك"
        color="#854d0e" bgColor="#fef9c3" borderColor="#fde047"
        count={followItems.length}
        open={followOpen} setOpen={setFollowOpen}
        filtOpen={followFiltOpen} onFiltToggle={() => setFollowFiltOpen(o => !o)}
      >
        {followFiltOpen && (
          <div style={{ padding: '10px 16px', backgroundColor: '#fffbeb', borderBottom: '1px solid #fde047', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e' }}>إظهار:</span>
            <Toggle label="⚠ Expiring 8-30 days" active={followTypes.expiring30}
              onToggle={() => setFollowTypes(t => ({ ...t, expiring30: !t.expiring30 }))}
              color="#d97706" count={raw.expiring30.length} />
            <Toggle label="⏳ Pending workflow" active={followTypes.pending}
              onToggle={() => setFollowTypes(t => ({ ...t, pending: !t.pending }))}
              color="#d97706" count={raw.pending.length} />
            <Toggle label="📋 Sela بدون PO" active={followTypes.nopo}
              onToggle={() => setFollowTypes(t => ({ ...t, nopo: !t.nopo }))}
              color="#d97706" count={raw.nopo.length} />
            <Toggle label="🚀 Onboarding" active={followTypes.onboarding}
              onToggle={() => setFollowTypes(t => ({ ...t, onboarding: !t.onboarding }))}
              color="#d97706" count={raw.onboarding.length} />
          </div>
        )}
        {followOpen && (
          followItems.length === 0
            ? <div style={{ padding: '18px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>✅ لا يوجد follow-up بالفلاتر دي</div>
            : <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {followItems.map((e, i) => <FollowItem key={`${e._id}-${i}`} e={e} />)}
              </div>
        )}
      </ZoneHeader>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* 🟢 ON TRACK ZONE                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <ZoneHeader
        emoji="🟢" title="ON TRACK"
        color="#166534" bgColor="#dcfce7" borderColor="#86efac"
        count={trackItems.length}
        open={trackOpen} setOpen={setTrackOpen}
        filtOpen={trackFiltOpen} onFiltToggle={() => setTrackFiltOpen(o => !o)}
      >
        {trackFiltOpen && (
          <div style={{ padding: '10px 16px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #86efac', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>إظهار العملاء:</span>
            {CLIENTS_LIST.map(c => {
              const meta = CLIENT_META[c];
              const cnt  = raw.onTrack.filter(e => e.client === c).length;
              return (
                <Toggle key={c} label={c} active={trackClients[c]}
                  onToggle={() => setTrackClients(t => ({ ...t, [c]: !t[c] }))}
                  color={meta.dot} count={cnt} />
              );
            })}
          </div>
        )}
        {trackOpen && (
          <div style={{ padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {CLIENTS_LIST.filter(c => trackClients[c]).map(c => {
                const cnt  = trackItems.filter(e => e.client === c).length;
                const meta = CLIENT_META[c];
                return (
                  <div key={c} style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: meta.badge, border: `1px solid ${meta.dot}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: meta.text }}>{c}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: meta.text, lineHeight: 1.3 }}>{cnt}</div>
                    <div style={{ fontSize: 10, color: meta.text, opacity: 0.65 }}>on track</div>
                  </div>
                );
              })}
            </div>
            {trackItems.length > 0 && (
              <div style={{ marginTop: 12, maxHeight: 200, overflowY: 'auto' }}>
                {trackItems.slice(0, 30).map(e => (
                  <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f0fdf4' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{e.name}</span>
                    <ClientBadge client={e.client} small />
                    <WFBadge status={e.workflowStatus} />
                  </div>
                ))}
                {trackItems.length > 30 && <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 8 }}>+{trackItems.length - 30} more</p>}
              </div>
            )}
          </div>
        )}
      </ZoneHeader>

    </div>
  );
}

  
// ─── SETTINGS ───────────────────────────────────────────────────────────
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
  employees
}) {
  const [tab,setTab]=useState("general");
  const stabs=[{k:"general",l:"General"},{k:"integration",l:"Integration Guide"},{k:"mapping",l:"Client Mapping"},{k:"logic",l:"Report Logic"}];
  return (
    <div style={{maxWidth:720,display:"flex",flexDirection:"column",gap:20}}>
      <h2 style={{margin:0,fontSize:20,fontWeight:700}}>Settings</h2>
      <div style={{display:"flex",borderBottom:"1px solid #e5e7eb"}}>
        {stabs.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"10px 16px",fontSize:12,fontWeight:600,border:"none",borderBottom:`2px solid ${tab===t.k?M:"transparent"}`,backgroundColor:"transparent",cursor:"pointer",color:tab===t.k?M:"#6b7280",marginBottom:-1}}>{t.l}</button>)}
      </div>
      {tab==="general"&&(
        <Card style={{padding:20}}>
          <h3 style={{fontWeight:700,fontSize:14,margin:"0 0 12px"}}>Data Management</h3>
          <p style={{fontSize:13,color:"#6b7280",margin:"0 0 16px"}}>{empCount} contracts loaded.</p>
          <Btn variant="danger" onClick={onClear}><Trash2 size={13}/> Clear & Re-upload</Btn>
        </Card>
      )}
      {tab==="integration"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {[
            {title:"🗄️ Supabase Setup",bg:"#f0fdf4",border:"#bbf7d0",steps:[
              {n:"1",t:"Create project","d":"supabase.com → New Project → Region: Middle East (Bahrain)"},
              {n:"2",t:"Your table is ready","d":"You already have 'Employees Master' table set up ✅"},
              {n:"3",t:"Get your Anon Key","d":"Settings → API → copy 'anon public' key → paste in src/supabase.js"},
              {n:"4",t:"Enable read policy","d":"Authentication → Policies → Employees Master → New Policy → Enable read access"},
            ]},
            {title:"⚡ Zapier Setup",bg:"#fffbeb",border:"#fde68a",steps:[
              {n:"1",t:"Create Zapier account","d":"zapier.com → free plan (100 tasks/month)"},
              {n:"2",t:"Ticket → Gmail Zap","d":"Trigger: Webhooks (Catch Hook) → Action: Gmail Send Email → paste webhook URL in ticket settings"},
              {n:"3",t:"WhatsApp via CallMeBot","d":"callmebot.com → get free API key → automated WA messages for renewals"},
              {n:"4",t:"Contract renewal alerts","d":"Zapier Schedule (daily 7am) → query Supabase → send WA + email summary"},
            ]},
          ].map(section=>(
            <Card key={section.title} style={{padding:20,backgroundColor:section.bg,border:`1px solid ${section.border}`}}>
              <h3 style={{fontWeight:700,fontSize:14,margin:"0 0 16px"}}>{section.title}</h3>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {section.steps.map(step=>(
                  <div key={step.n} style={{display:"flex",gap:12,padding:12,backgroundColor:"white",borderRadius:12,border:"1px solid rgba(0,0,0,0.06)"}}>
                    <div style={{width:24,height:24,borderRadius:"50%",backgroundColor:M,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>{step.n}</div>
                    <div><p style={{fontWeight:600,fontSize:13,margin:"0 0 2px"}}>{step.t}</p><p style={{fontSize:12,color:"#6b7280",margin:0,fontFamily:"monospace"}}>{step.d}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab==="mapping"&&(
        <Card style={{padding:20}}>
          <h3 style={{fontWeight:700,fontSize:14,margin:"0 0 16px"}}>Client Mapping Rules</h3>
          {[{c:"Riva Engineering 2",r:'Project = "CEO" (exact)'},{c:"Channelplay",r:'Contains "SILQFI"'},{c:"SPL",r:'Contains "SPL"'},{c:"Combuzz HR",r:"Maveric · C5i · Inspiring Minds · Saudi Fransi"},{c:"Sela",r:"All other projects (default)"}].map(({c,r})=>(
            <div key={c} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f3f4f6"}}>
              <ClientBadge client={c}/><span style={{fontSize:11,color:"#9ca3af",fontFamily:"monospace"}}>{r}</span>
            </div>
          ))}
        </Card>
      )}
      {tab==="logic"&&(
        <Card style={{padding:20}}>
          <h3 style={{fontWeight:700,fontSize:14,margin:"0 0 16px"}}>Report & Finance Logic</h3>
          {["✅ Pending = workflow NOT in [Agreement Signed, Complete]","🚫 Morning report excludes: Expired, Resigned, Combuzz HR","⚠️ PO Alert: Sela only · Empty PO field","📅 Expiry: Rolling 30-day window","💰 Finance: Excludes resigned always. Excludes expired UNLESS Sela with no PO","💹 Profit Direct: Client Price − Total Package","💹 Profit Partner: Client Price − Partner Cost","🔴 SAR Discrepancy: Only shown after uploading partner invoice CSV"].map(r=>(
            <p key={r} style={{fontSize:12,color:"#4b5563",padding:"8px 0",borderBottom:"1px solid #f9fafb",margin:0}}>{r}</p>
          ))}
        </Card>
      )}
    </div>
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
  const [form, setForm] = useState({ client:"Channelplay", partner:"Safwa", month:"", timesheetSent:false, partnerAmt:"", marginPct:15 });
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
    setForm({ client:"Channelplay", partner:"Safwa", month:"", timesheetSent:false, partnerAmt:"", marginPct:15 });
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
          ١. استقبل التايم شيت من العميل (Channelplay) &nbsp;→&nbsp;
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
function FisheyeOpsPro({ employees, setEmployees }) {
  const [isLoading, setIsLoading] = useState(true);

  const [clients, setClients] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fisheyeClients_v1")) || DEF_CLIENTS; }
    catch { return DEF_CLIENTS; }
  });
  const saveClients = c => {
    setClients(c);
    localStorage.setItem("fisheyeClients_v1", JSON.stringify(c));
    supabase.from('fisheye_app_data').upsert({ key: 'fisheyeClients_v1', data: c }, { onConflict: 'key' })
      .then(({ error }) => { if (error) console.warn('saveClients sync error:', error.message); });
  };

  const [partners, setPartners] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fisheyePartners_v1")) || DEF_PARTNERS; }
    catch { return DEF_PARTNERS; }
  });
  const savePartners = p => {
    setPartners(p);
    localStorage.setItem("fisheyePartners_v1", JSON.stringify(p));
    supabase.from('fisheye_app_data').upsert({ key: 'fisheyePartners_v1', data: p }, { onConflict: 'key' })
      .then(({ error }) => { if (error) console.warn('savePartners sync error:', error.message); });
  };

  const [nav, setNav]   = useState(() => localStorage.getItem("fisheye_nav") || "action");
  const [open, setOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalSearch, setGlobalSearch]   = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Global Search Results ────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return employees
      .filter(e =>
        (e.name        || "").toLowerCase().includes(q) ||
        (e.client      || "").toLowerCase().includes(q) ||
        (e.position    || "").toLowerCase().includes(q) ||
        (e.employeeId  || "").toLowerCase().includes(q)
      )
      .slice(0, 6);
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

  const report      = buildReport(employees);
  const totalAlerts = employees.filter(e => { const d = daysUntil(e.endDate); return d >= 0 && d <= 30 && !isExcluded(e); }).length + report.pendingCount;

  const navItems = [
    // ── PRIMARY ────────────────────────────────────────────────────────────
    { k:"action",     l:"⚡ Action Center",  i:Target     },
    // ── ENTITY VIEWS ───────────────────────────────────────────────────────
    { k:"workforce",  l:"Employees",         i:Users      },
    { k:"clients",    l:"Clients",           i:Building2  },
    { k:"partners",   l:"Partners",          i:Briefcase  },
    // ── OPS ────────────────────────────────────────────────────────────────
    { k:"onboarding", l:"Onboarding",        i:UserPlus   },
    // ── FINANCE (consolidated: Payroll · Billing · Settlements) ────────────
    { k:"finance",    l:"Finance",           i:DollarSign },
    // ── INSIGHTS ───────────────────────────────────────────────────────────
    { k:"analytics",  l:"Analytics",         i:BarChart2  },
    { k:"weeklyreport", l:"Reports",         i:FileText   },
    // ── SYSTEM ─────────────────────────────────────────────────────────────
    { k:"settings",   l:"Settings",          i:Settings   },
  ];

  const labels = {
    action:      "⚡ Action Center",
    calendar:    "📅 Operations Calendar",
    report:      "📋 Morning Report",
    workforce:   "👥 Workforce Explorer",
    clients:     "🏢 Client Command Center",
    partners:    "🤝 Partner Hub",
    finance:     "💳 Finance & Reconciliation",
    billing:     "📄 Billing Flow",
    onboarding:  "🚀 Onboarding Tracker",
    analytics:   "📈 Analytics Dashboard",
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
          <div style={s.sidebarLogo}><Eye size={18} style={{color:M}}/></div>
          {open && <div style={{minWidth:0}}>
            <p style={{color:"white",fontWeight:900,fontSize:13,margin:0,lineHeight:1.2}}>Fisheye Ops</p>
            <p style={{color:"rgba(255,180,180,0.8)",fontSize:11,margin:0}}>Pro · KSA ERP</p>
          </div>}
        </div>
        {open && (
          <div style={s.sidebarBadge}>
            <div style={s.sidebarBadgeInner}>
              <div style={s.sidebarDot}/>
              <span style={{color:"white",fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {employees.length} contracts
              </span>
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
                placeholder="Search employees…"
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
                border:"1px solid var(--border,#e4e4e7)", overflow:"hidden",
              }}>
                {searchResults.map(e => (
                  <button key={e._id} onMouseDown={() => {
                    setNav("workforce");
                    localStorage.setItem("fisheye_nav","workforce");
                    setGlobalSearch("");
                  }}
                  className="fe-search-result"
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 13px", background:"none", border:"none", borderBottom:"1px solid #f5f5f6", cursor:"pointer" }}
                  >
                    <p style={{margin:0,fontSize:12,fontWeight:700,color:"#18181b",letterSpacing:"-0.01em",fontFamily:"var(--font-sans)"}}>{e.name}</p>
                    <p style={{margin:"2px 0 0",fontSize:11,color:"#71717a",fontFamily:"var(--font-sans)"}}>{e.client} · {e.position}</p>
                  </button>
                ))}
              </div>
            )}
            {searchFocused && globalSearch.length >= 2 && searchResults.length === 0 && (
              <div style={{
                position:"absolute", top:"calc(100% + 4px)", left:9, right:9, zIndex:999,
                background:"white", borderRadius:11, boxShadow:"0 12px 32px rgba(0,0,0,0.18)",
                border:"1px solid var(--border,#e4e4e7)", padding:"14px 13px", textAlign:"center",
              }}>
                <p style={{margin:0,fontSize:12,color:"#a1a1aa",fontFamily:"var(--font-sans)"}}>No results found</p>
              </div>
            )}
          </div>
        )}

        <nav style={s.sidebarNav}>
          {navItems.map(({k, l, i:Icon}) => {
            const isA   = nav === k;
            const badge = k==="action" ? totalAlerts : k==="dashboard" ? totalAlerts : k==="report" ? report.pendingCount : 0;
            const dividerBefore = open && (k==="workforce"||k==="onboarding"||k==="analytics"||k==="dashboard");
            return (
              <React.Fragment key={k}>
                {dividerBefore && <div className="fe-divider" style={{height:1,margin:"6px 4px"}}/>}
                <button
                  onClick={() => { setNav(k); localStorage.setItem("fisheye_nav", k); }}
                  className={`fe-nav-btn${isA?" fe-nav-active":""}`}
                  style={s.navBtn(isA)}
                  title={!open ? l : undefined}
                >
                  <Icon size={16} style={{flexShrink:0}}/>
                  {open && <span style={{flex:1,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis"}}>{l}</span>}
                  {open && badge > 0 && <span className="fe-notif-badge" style={s.navBadge}>{badge}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
        <div style={s.sidebarToggle}>
          <button onClick={() => setOpen(p => !p)} className="fe-toggle-btn" style={s.toggleBtn}><Menu size={15}/></button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={s.main}>
        {/* Topbar */}
        <div style={s.topbar} className="fe-topbar">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <h1 style={{margin:0,fontSize:15,fontWeight:700,color:"#18181b",letterSpacing:"-0.02em",fontFamily:"var(--font-sans)"}}>{labels[nav] || nav}</h1>
            {nav==="action" && totalAlerts > 0 && (
              <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:999,backgroundColor:"#dc2626",color:"white",fontFamily:"var(--font-mono)",letterSpacing:"0"}}>{totalAlerts} issues</span>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {/* Notifications Bell */}
            <div style={{position:"relative"}}>
              <Bell size={17}
                style={{color: notifications.length > 0 ? M : "#9ca3af", cursor:"pointer"}}
                onClick={() => setShowNotifications(p => !p)}/>
              {notifications.length > 0 && (
                <span style={{position:"absolute",top:-6,right:-6,width:16,height:16,borderRadius:"50%",backgroundColor:M,color:"white",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {notifications.length > 99 ? "99+" : notifications.length}
                </span>
              )}
              {showNotifications && (
                <div style={{position:"absolute",top:"calc(100% + 12px)",right:0,width:320,backgroundColor:"white",borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:"1px solid #e5e7eb",zIndex:100,overflow:"hidden"}}>
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
              )}
            </div>
            {/* User */}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:10,backgroundColor:M,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:900}}>FO</div>
              <div>
                <p style={{margin:0,fontSize:11,fontWeight:700,color:"#1f2937"}}>Fisheye Admin</p>
                <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>Super Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div id="app-main-content" style={s.content} className="fe-scroll">

          {/* ── ACTION CENTER ── */}
          {nav==="action" && <ActionCenter
            employees={employees}
            setEmployees={setEmployees}
            clients={clients}
            partners={partners}
            onNavigate={k => { setNav(k); localStorage.setItem("fisheye_nav", k); }}
          />}

          {/* ── ENTITY VIEWS ── */}
          {nav==="workforce"  && <WorkforceView employees={employees} setEmployees={setEmployees} partners={partners} clients={clients} exportCSV={exportCSV}/>}
          {nav==="clients"    && <ClientHub employees={employees} clients={clients} saveClients={saveClients}/>}
          {nav==="clientcmd"  && <ClientCommandCenter employees={employees}/>}
          {nav==="partners"   && <PartnerHub employees={employees} partners={partners} savePartners={savePartners}/>}

          {/* ── FINANCE (consolidated: Payroll · Billing · Settlements) ── */}
          {nav==="finance" && <FinanceModule employees={employees} setEmployees={setEmployees} onNav={k => { setNav(k); localStorage.setItem("fisheye_nav", k); }}/>}

          {/* ── ONBOARDING ── */}
          {nav==="onboarding" && <OnboardingModule employees={employees} setEmployees={setEmployees} partners={partners}/>}

          {/* ── ANALYTICS ── */}
          {nav==="analytics" && <AnalyticsDashboard employees={employees}/>}

          {/* ── SETTINGS ── */}
          {nav==="settings" && <SettingsView
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
          />}

          {/* ── DEEP LINKS (accessible via URL/nav programmatically, not in sidebar) ── */}
          {nav==="calendar"    && <OperationsCalendar employees={employees}/>}
          {nav==="weeklyreport"&& <WeeklyReportGenerator employees={employees}/>}
          {nav==="reports"     && <WeeklyMonthlyReports employees={employees}/>}
          {nav==="report"      && <MorningReportView employees={employees}/>}
          {nav==="tickets"     && <TicketingView/>}
          {nav==="dashboard"   && <DashboardView employees={employees} isOnline={isOnline} syncStatus={syncStatus} syncMessage={syncMessage} lastSync={lastSync} uploadToCloud={uploadToCloud} downloadFromCloud={downloadFromCloud} backup={backup} bidirectionalSync={bidirectionalSync}/>}
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
        <Route path="/partner/:partnerId" element={<PartnerPortal employees={employees} partners={partners}/>}/>
        <Route path="/client/:clientName"  element={<ClientPortal employees={employees}/>}/>
        <Route path="/*" element={<FisheyeOpsPro employees={employees} setEmployees={setEmployees}/>}/>
      </Routes>
    </BrowserRouter>
  );
}