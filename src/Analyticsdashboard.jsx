import React, { useState, useMemo } from 'react';
import { BarChart2, Users, Building2, Handshake, TrendingUp, AlertCircle, Clock, DollarSign, Briefcase, Globe } from "lucide-react";
import { useOperationalIssues, daysUntil } from "./useOperationalIssues";
import { isExcluded } from "./utils/helpers";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const M  = "#800000";

// ─── BILLING HELPERS (mirrors FinanceModule — no circular import) ─────────────
const calcLine = emp => {
  const totalPkg = Number(emp.totalPackage || 0);
  let marginAmount = 0;
  if (emp.profitMode === "partner") {
    const pValue = Number(emp.clientPrice || 0);
    const pType  = emp.clientPriceType || "percent";
    marginAmount = pType === "percent" ? (pValue / 100) * totalPkg : pValue;
  } else {
    const mValue = Number(emp.fisheyeMargin || 0);
    const mType  = emp.fisheyeMarginType || "percent";
    marginAmount = mType === "percent" ? (mValue / 100) * totalPkg : mValue;
  }
  const baseAmount = totalPkg + marginAmount;
  const vat        = marginAmount * 0.15;
  return { subTotal: baseAmount, margin: marginAmount, vat, total: baseAmount + vat };
};

const calcPartnerPayout = emp => {
  if (emp.profitMode !== "partner") return 0;
  const totalPkg = Number(emp.totalPackage || 0);
  if (emp.partnerCostType === "percent") return (Number(emp.partnerCost || 0) / 100) * totalPkg;
  return Number(emp.partnerCost || 0);
};

const calcNetProfit = emp => calcLine(emp).margin - calcPartnerPayout(emp);

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
const fK = n => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `SAR ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `SAR ${(v / 1_000).toFixed(0)}K`;
  return `SAR ${v}`;
};
const pct = (n, d) => d > 0 ? ((n / d) * 100).toFixed(1) + "%" : "—";

// ─── COLOR PALETTES ───────────────────────────────────────────────────────────
const CLIENT_COLORS  = ["#800000","#2563eb","#059669","#d97706","#7c3aed","#db2777","#0891b2","#65a30d","#dc2626","#9333ea"];
const PARTNER_COLORS = ["#7c3aed","#2563eb","#059669","#d97706","#800000","#db2777","#0891b2","#65a30d"];
const NAT_COLORS     = ["#800000","#2563eb","#059669","#d97706","#7c3aed","#db2777","#0891b2","#65a30d","#6b7280"];

// ─── SVG: HORIZONTAL BAR CHART ────────────────────────────────────────────────
function HBarChart({ data, barH = 28, gap = 10 }) {
  if (!data || !data.length) return <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>No data</div>;
  const max    = Math.max(...data.map(d => d.value), 1);
  const labelW = 120, valW = 80, barMax = 320;
  const totalH = data.length * (barH + gap);
  return (
    <svg viewBox={`0 0 ${labelW + barMax + valW} ${totalH}`} style={{ width: "100%", height: totalH }}>
      {data.map((d, i) => {
        const y  = i * (barH + gap);
        const bw = Math.max(4, (d.value / max) * barMax);
        return (
          <g key={i}>
            <text x={labelW - 8} y={y + barH / 2 + 5} textAnchor="end" fontSize={11} fill="#374151" fontFamily="Inter,sans-serif" fontWeight={600}>
              {d.label.length > 15 ? d.label.slice(0, 14) + "…" : d.label}
            </text>
            <rect x={labelW} y={y} width={barMax} height={barH} rx={6} fill="#f3f4f6" />
            <rect x={labelW} y={y} width={bw}    height={barH} rx={6} fill={d.color || M} opacity={0.88} />
            <text x={labelW + bw + 6} y={y + barH / 2 + 5} fontSize={11} fill="#374151" fontFamily="Inter,sans-serif" fontWeight={700}>
              {d.display ?? d.value.toLocaleString()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG: DONUT CHART ────────────────────────────────────────────────────────
function DonutChart({ data, size = 150, title, subtitle }) {
  const filtered = (data || []).filter(d => d.value > 0);
  if (!filtered.length) return <div style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: 20 }}>No data</div>;
  const total = filtered.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.37, inner = size * 0.24;
  let cursor = -Math.PI / 2;
  const slices = filtered.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cursor);
    const y1 = cy + r * Math.sin(cursor);
    cursor += angle;
    const x2 = cx + r * Math.cos(cursor);
    const y2 = cy + r * Math.sin(cursor);
    return { ...d, x1, y1, x2, y2, large: angle > Math.PI ? 1 : 0 };
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        {slices.map((s, i) => (
          <path key={i}
            d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2} Z`}
            fill={s.color} opacity={0.9} />
        ))}
        <circle cx={cx} cy={cy} r={inner} fill="white" />
        {title    && <text x={cx} y={cy - 5}  textAnchor="middle" fontSize={13} fontWeight={800} fill="#111827" fontFamily="Inter,sans-serif">{title}</text>}
        {subtitle && <text x={cx} y={cy + 11} textAnchor="middle" fontSize={10} fill="#6b7280"  fontFamily="Inter,sans-serif">{subtitle}</text>}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", justifyContent: "center", maxWidth: size + 40 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#374151", fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>({pct(s.value, total)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EXPIRY TIMELINE ─────────────────────────────────────────────────────────
function ExpiryTimeline({ items }) {
  if (!items.length) return <div style={{ color: "#9ca3af", fontSize: 13, padding: 16 }}>No expiries in the next 90 days</div>;
  const col = d => d < 0 ? "#dc2626" : d <= 14 ? "#ef4444" : d <= 30 ? "#f97316" : "#f59e0b";
  const bg  = d => d < 0 ? "#fef2f2" : d <= 14 ? "#fef2f2" : d <= 30 ? "#fff7ed" : "#fffbeb";
  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
      {items.slice(0, 20).map((e, i) => {
        const d = daysUntil(e.endDate);
        return (
          <div key={i} style={{ flexShrink: 0, width: 132, padding: "10px 12px", borderRadius: 10, backgroundColor: bg(d), border: `1px solid ${col(d)}44` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: col(d), marginBottom: 2 }}>
              {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "TODAY!" : `${d}d left`}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{e.client}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>{e.endDate?.slice(0, 10)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = M, bg = "#fff5f5", border }) {
  return (
    <div style={{ backgroundColor: bg, borderRadius: 12, border: `1px solid ${border || color + "22"}`, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1.1, fontFamily: "var(--font-sans)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>
      <span style={{ color: M }}>{icon}</span> {children}
    </h3>
  );
}

function TabBtn({ label, active, onClick, badge }) {
  return (
    <div onClick={onClick} style={{
      padding: "12px 22px", cursor: "pointer", fontSize: 13, fontWeight: 700,
      color: active ? M : "#6b7280",
      borderBottom: `3px solid ${active ? M : "transparent"}`,
      backgroundColor: active ? "#fff5f5" : "transparent",
      display: "flex", alignItems: "center", gap: 6, transition: "0.15s", whiteSpace: "nowrap",
      userSelect: "none"
    }}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{ backgroundColor: active ? M : "#e5e7eb", color: active ? "white" : "#374151", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{badge}</span>
      )}
    </div>
  );
}

// ─── TH helper ────────────────────────────────────────────────────────────────
const TH = ({ children, align = "left", color }) => (
  <th style={{ padding: "11px 14px", fontSize: 11, fontWeight: 700, color: color || "#6b7280", textTransform: "uppercase", backgroundColor: "#fdf8f8", borderBottom: "1px solid #f3f4f6", textAlign: align }}>
    {children}
  </th>
);
const TD = ({ children, align = "left", bold, color, mono }) => (
  <td style={{ padding: "10px 14px", fontSize: 12, textAlign: align, fontWeight: bold ? (bold === true ? 700 : bold) : 400, color: color || "#374151", fontFamily: mono ? "monospace" : undefined, borderBottom: "1px solid #f9fafb" }}>
    {children}
  </td>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ active, billable, issues, allExpiring }) {
  const clientsList = [...new Set(active.map(e => e.client).filter(Boolean))];

  const funnel = [
    { label: "Docs Requested",  n: active.filter(e => (e.workflowStatus||"").toLowerCase() === "docs requested").length },
    { label: "Agreement Sent",  n: active.filter(e => (e.workflowStatus||"").toLowerCase().includes("agreement")).length },
    { label: "Qiwa Submitted",  n: active.filter(e => (e.workflowStatus||"").toLowerCase().includes("qiwa submitted")).length },
    { label: "Qiwa Approved",   n: active.filter(e => (e.workflowStatus||"").toLowerCase() === "qiwa approved").length },
    { label: "Active / Done",   n: active.filter(e => ["active","complete"].includes((e.status||"").toLowerCase())).length },
  ];

  const clientHC = clientsList.map((c, i) => ({
    label: c, value: active.filter(e => e.client === c).length,
    color: CLIENT_COLORS[i % CLIENT_COLORS.length]
  })).sort((a, b) => b.value - a.value);

  const partnerCount = active.filter(e => e.profitMode === "partner").length;

  const natMap = {};
  active.forEach(e => { const n = e.nationality || "Unknown"; natMap[n] = (natMap[n]||0)+1; });
  const natData = Object.entries(natMap).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([l,v],i) => ({ label: l, value: v, color: NAT_COLORS[i] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Alert banner */}
      {issues.counts.urgent > 0 && (
        <div style={{ backgroundColor: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: "#dc2626", fontSize: 13 }}>{issues.counts.urgent} urgent issues —</span>
          <span style={{ color: "#7f1d1d", fontSize: 12 }}>contracts expiring ≤7 days or blocked workflows</span>
          {issues.counts.renewals > 0 && (
            <span style={{ marginLeft: "auto", backgroundColor: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              +{issues.counts.renewals} renewals pending
            </span>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Headcount by client */}
        <div className="fe-card" style={{ padding: 20 }}>
          <SectionTitle icon={<Building2 size={16}/>}>Headcount by Client</SectionTitle>
          <HBarChart data={clientHC} />
        </div>

        {/* Workflow funnel */}
        <div className="fe-card" style={{ padding: 20 }}>
          <SectionTitle icon={<TrendingUp size={16}/>}>Workflow Pipeline</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {funnel.map((f, i) => {
              const p = active.length ? Math.round(f.n / active.length * 100) : 0;
              const op = 0.45 + (i / funnel.length) * 0.55;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{i+1}. {f.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: M }}>{f.n} <span style={{ color: "#9ca3af", fontWeight: 600 }}>({p}%)</span></span>
                  </div>
                  <div style={{ height: 16, backgroundColor: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p}%`, backgroundColor: M, opacity: op, borderRadius: 6, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {/* Sourcing mode */}
        <div className="fe-card" style={{ padding: 20 }}>
          <SectionTitle icon={<Handshake size={16}/>}>Sourcing Mode</SectionTitle>
          <DonutChart
            data={[
              { label: "Partner", value: partnerCount,               color: "#7c3aed" },
              { label: "Direct",  value: active.length - partnerCount, color: M },
            ]}
            size={150} title={String(active.length)} subtitle="employees"
          />
        </div>

        {/* Nationality */}
        <div className="fe-card" style={{ padding: 20 }}>
          <SectionTitle icon={<Globe size={16}/>}>Nationality Mix</SectionTitle>
          <DonutChart data={natData} size={150} title={String(active.length)} subtitle="employees" />
        </div>

        {/* Operational health */}
        <div className="fe-card" style={{ padding: 20 }}>
          <SectionTitle icon={<AlertCircle size={16}/>}>Operational Health</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: "Urgent",    n: issues.counts.urgent,    color: "#dc2626", bg: "#fef2f2" },
              { label: "Renewals",  n: issues.counts.renewals,  color: "#f97316", bg: "#fff7ed" },
              { label: "Approvals", n: issues.counts.approvals, color: "#2563eb", bg: "#eff6ff" },
              { label: "Payroll",   n: issues.counts.payroll,   color: "#d97706", bg: "#fffbeb" },
              { label: "Blockers",  n: issues.counts.blockers,  color: "#6b7280", bg: "#f9fafb" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: 8, backgroundColor: item.bg }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: item.color }}>{item.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiry timeline */}
      {allExpiring.length > 0 && (
        <div className="fe-card" style={{ padding: 20 }}>
          <SectionTitle icon={<Clock size={16}/>}>Contract Expiry Timeline (Next 90 Days)</SectionTitle>
          <ExpiryTimeline items={allExpiring} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 TAB: CLIENTS
// ═══════════════════════════════════════════════════════════════════════════════
function ClientsTab({ active, billable }) {
  const clientsList = [...new Set(active.map(e => e.client).filter(Boolean))].sort();

  const rows = clientsList.map((c, i) => {
    const all  = active.filter(e => e.client === c);
    const bill = billable.filter(e => e.client === c);
    const pkg        = bill.reduce((s,e)=>s+Number(e.totalPackage||0),0);
    const grossM     = bill.reduce((s,e)=>s+calcLine(e).margin,0);
    const partnerOut = bill.reduce((s,e)=>s+calcPartnerPayout(e),0);
    const netP       = grossM - partnerOut;
    const billed     = bill.reduce((s,e)=>s+calcLine(e).total,0);
    const vat        = bill.reduce((s,e)=>s+calcLine(e).vat,0);
    return { name:c, hc:all.length, pkg, grossM, partnerOut, netP, billed, vat, color: CLIENT_COLORS[i%CLIENT_COLORS.length] };
  }).sort((a,b)=>b.netP-a.netP);

  const tot = rows.reduce((a,r)=>({ hc:a.hc+r.hc, pkg:a.pkg+r.pkg, grossM:a.grossM+r.grossM, partnerOut:a.partnerOut+r.partnerOut, netP:a.netP+r.netP, billed:a.billed+r.billed, vat:a.vat+r.vat }),
    {hc:0,pkg:0,grossM:0,partnerOut:0,netP:0,billed:0,vat:0});

  const barData = rows.map(r=>({ label:r.name, value:Math.round(r.netP), display:fK(r.netP), color:r.color }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <KpiCard label="Total Clients"   value={clientsList.length}   sub={`${tot.hc} employees`} />
        <KpiCard label="Total Billed"    value={fK(tot.billed-tot.vat)} sub="pre-VAT"             color="#0369a1" bg="#f0f9ff" border="#bae6fd" />
        <KpiCard label="Gross Margin"    value={fK(tot.grossM)}        sub={pct(tot.grossM,tot.billed)+" margin"} color="#059669" bg="#f0fdf4" border="#bbf7d0" />
        <KpiCard label="Net Profit"      value={fK(tot.netP)}          sub="after partner payouts" color="#7c3aed" bg="#faf5ff" border="#e9d5ff" />
      </div>

      <div className="fe-card" style={{ padding:20 }}>
        <SectionTitle icon={<BarChart2 size={16}/>}>Net Profit by Client</SectionTitle>
        <HBarChart data={barData} />
      </div>

      <div className="fe-card" style={{ overflowX:"auto" }}>
        <table className="fe-table" style={{ width:"100%", minWidth:740 }}>
          <thead><tr>
            <TH>Client</TH><TH align="center">HC</TH><TH align="right">Payroll</TH>
            <TH align="right">Billed (pre-VAT)</TH><TH align="right" color="#059669">Gross Margin</TH>
            <TH align="right" color="#7c3aed">Partner Out</TH><TH align="right" color={M}>Net Profit</TH>
            <TH align="right">Margin %</TH>
          </tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <TD><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,backgroundColor:r.color,flexShrink:0}}/><b>{r.name}</b></div></TD>
                <TD align="center" bold>{r.hc}</TD>
                <TD align="right" mono>{fK(r.pkg)}</TD>
                <TD align="right" mono>{fK(r.billed-r.vat)}</TD>
                <TD align="right" bold color="#059669">{fK(r.grossM)}</TD>
                <TD align="right" color="#7c3aed">({fK(r.partnerOut)})</TD>
                <TD align="right" bold={900} color={M}>{fK(r.netP)}</TD>
                <TD align="right" bold color="#6b7280">{pct(r.netP,r.billed)}</TD>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor:"#fdf8f8", borderTop:"2px solid #f3f4f6" }}>
              <td style={{padding:"10px 14px",fontWeight:800,fontSize:13}}>TOTAL</td>
              <td style={{padding:"10px 14px",textAlign:"center",fontWeight:800}}>{tot.hc}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"monospace",fontWeight:700}}>{fK(tot.pkg)}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"monospace",fontWeight:700}}>{fK(tot.billed-tot.vat)}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:800,color:"#059669"}}>{fK(tot.grossM)}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:"#7c3aed"}}>({fK(tot.partnerOut)})</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:900,color:M}}>{fK(tot.netP)}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:"#6b7280"}}>{pct(tot.netP,tot.billed)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🤝 TAB: PARTNERS
// ═══════════════════════════════════════════════════════════════════════════════
function PartnersTab({ active, billable }) {
  const partnerEmps  = billable.filter(e => e.profitMode === "partner" && e.partnerAssigned);
  const partnerNames = [...new Set(partnerEmps.map(e => e.partnerAssigned))].sort();

  const rows = partnerNames.map((p,i) => {
    const emps    = partnerEmps.filter(e => e.partnerAssigned === p);
    const clients = [...new Set(emps.map(e=>e.client).filter(Boolean))];
    const pkg     = emps.reduce((s,e)=>s+Number(e.totalPackage||0),0);
    const grossM  = emps.reduce((s,e)=>s+calcLine(e).margin,0);
    const payout  = emps.reduce((s,e)=>s+calcPartnerPayout(e),0);
    const netP    = grossM - payout;
    return { name:p, hc:emps.length, clients:clients.join(", "), pkg, grossM, payout, netP,
             payoutPct: grossM>0?(payout/grossM*100).toFixed(1)+"%":"—",
             color: PARTNER_COLORS[i%PARTNER_COLORS.length] };
  }).sort((a,b)=>b.payout-a.payout);

  const tot = rows.reduce((a,r)=>({hc:a.hc+r.hc,pkg:a.pkg+r.pkg,grossM:a.grossM+r.grossM,payout:a.payout+r.payout,netP:a.netP+r.netP}),
    {hc:0,pkg:0,grossM:0,payout:0,netP:0});

  const barData = rows.map(r=>({ label:r.name, value:Math.round(r.payout), display:fK(r.payout), color:r.color }));

  if (!rows.length) return (
    <div className="fe-card" style={{padding:40,textAlign:"center"}}>
      <Handshake size={36} style={{color:"#d1d5db",marginBottom:12}}/>
      <div style={{fontSize:14,color:"#9ca3af",fontWeight:600}}>No partner employees found</div>
      <div style={{fontSize:12,color:"#d1d5db",marginTop:4}}>Employees with profitMode = "partner" and a partnerName will appear here</div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KpiCard label="Active Partners"  value={rows.length}      sub={`${tot.hc} placed employees`}      color="#7c3aed" bg="#faf5ff" border="#e9d5ff" />
        <KpiCard label="Total Payroll"    value={fK(tot.pkg)}      sub="partner employee packages"          color="#374151" bg="#f9fafb" border="#e5e7eb" />
        <KpiCard label="Total Payout"     value={fK(tot.payout)}   sub="commissions to partners"            color="#7c3aed" bg="#faf5ff" border="#e9d5ff" />
        <KpiCard label="Net to Fisheye"   value={fK(tot.netP)}     sub="gross margin minus payout"         color="#059669" bg="#f0fdf4" border="#bbf7d0" />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <div className="fe-card" style={{padding:20}}>
          <SectionTitle icon={<BarChart2 size={16}/>}>Payout Volume by Partner</SectionTitle>
          <HBarChart data={barData} />
        </div>
        {rows.length > 1 && (
          <div className="fe-card" style={{padding:20}}>
            <SectionTitle icon={<Handshake size={16}/>}>Payout Distribution</SectionTitle>
            <DonutChart
              data={rows.map(r=>({label:r.name,value:Math.round(r.payout),color:r.color}))}
              size={160} title={fK(tot.payout).replace("SAR ","")} subtitle="total payout"
            />
          </div>
        )}
      </div>

      <div className="fe-card" style={{overflowX:"auto"}}>
        <table className="fe-table" style={{width:"100%",minWidth:680}}>
          <thead><tr>
            <TH>Partner</TH><TH align="center">HC</TH><TH>Clients</TH><TH align="right">Payroll</TH>
            <TH align="right" color="#059669">Gross Margin</TH><TH align="right" color="#7c3aed">Total Payout</TH>
            <TH align="right" color={M}>Net to Fisheye</TH><TH align="right">Payout %</TH>
          </tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <TD><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,backgroundColor:r.color,flexShrink:0}}/><b>{r.name}</b></div></TD>
                <TD align="center" bold>{r.hc}</TD>
                <TD><span style={{fontSize:11,color:"#6b7280"}}>{r.clients||"—"}</span></TD>
                <TD align="right" mono>{fK(r.pkg)}</TD>
                <TD align="right" bold color="#059669">{fK(r.grossM)}</TD>
                <TD align="right" bold color="#7c3aed">({fK(r.payout)})</TD>
                <TD align="right" bold={900} color={M}>{fK(r.netP)}</TD>
                <TD align="right" bold color="#6b7280">{r.payoutPct}</TD>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{backgroundColor:"#fdf8f8",borderTop:"2px solid #f3f4f6"}}>
              <td style={{padding:"10px 14px",fontWeight:800,fontSize:13}}>TOTAL</td>
              <td style={{padding:"10px 14px",textAlign:"center",fontWeight:800}}>{tot.hc}</td>
              <td/>
              <td style={{padding:"10px 14px",textAlign:"right",fontFamily:"monospace",fontWeight:700}}>{fK(tot.pkg)}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:800,color:"#059669"}}>{fK(tot.grossM)}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:"#7c3aed"}}>({fK(tot.payout)})</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:900,color:M}}>{fK(tot.netP)}</td>
              <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700,color:"#6b7280"}}>{pct(tot.payout,tot.grossM)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 TAB: WORKFORCE
// ═══════════════════════════════════════════════════════════════════════════════
function WorkforceTab({ active, allExpiring }) {
  // Salary buckets
  const buckets = [
    {label:"< 5K",   min:0,     max:5000},
    {label:"5–10K",  min:5000,  max:10000},
    {label:"10–15K", min:10000, max:15000},
    {label:"15–20K", min:15000, max:20000},
    {label:"20–30K", min:20000, max:30000},
    {label:"> 30K",  min:30000, max:Infinity},
  ];
  const salaryBars = buckets.map((b,i)=>({
    label:b.label,
    value:active.filter(e=>{ const v=Number(e.totalPackage||0); return v>=b.min && v<b.max; }).length,
    color:CLIENT_COLORS[i%CLIENT_COLORS.length]
  }));

  // Top positions
  const posMap = {};
  active.forEach(e=>{ const p=e.position||e.jobTitle||"Unknown"; posMap[p]=(posMap[p]||0)+1; });
  const positionBars = Object.entries(posMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([l,v],i)=>({label:l,value:v,color:PARTNER_COLORS[i%PARTNER_COLORS.length]}));

  // Status donut
  const stMap = {};
  active.forEach(e=>{ const st=e.status||"Unknown"; stMap[st]=(stMap[st]||0)+1; });
  const statusData = Object.entries(stMap).sort((a,b)=>b[1]-a[1]).map(([l,v],i)=>({label:l,value:v,color:NAT_COLORS[i]}));

  const totalSalary = active.reduce((s,e)=>s+Number(e.totalPackage||0),0);
  const avgSalary   = active.length ? totalSalary/active.length : 0;
  const maxSalary   = active.length ? Math.max(...active.map(e=>Number(e.totalPackage||0))) : 0;
  const minSalary   = active.filter(e=>e.totalPackage>0).length ? Math.min(...active.filter(e=>e.totalPackage>0).map(e=>Number(e.totalPackage||0))) : 0;

  const overdue   = active.filter(e=>daysUntil(e.endDate)<0).length;
  const critical  = active.filter(e=>{ const d=daysUntil(e.endDate); return d>=0&&d<=14; }).length;
  const warning   = active.filter(e=>{ const d=daysUntil(e.endDate); return d>14&&d<=60; }).length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KpiCard label="Active Employees" value={active.length}       sub={`${active.filter(e=>e.status==="active").length} fully active`} />
        <KpiCard label="Avg Package"      value={fK(avgSalary)}       sub={`Min ${fK(minSalary)} · Max ${fK(maxSalary)}`} color="#0369a1" bg="#f0f9ff" border="#bae6fd" />
        <KpiCard label="Total Payroll"    value={fK(totalSalary)}     sub="all active employees"                         color="#059669" bg="#f0fdf4" border="#bbf7d0" />
        <KpiCard label="Expiry Alerts"    value={overdue+critical}    sub={`${warning} more within 60d`}
          color={(overdue+critical)>0?"#dc2626":"#374151"} bg={(overdue+critical)>0?"#fef2f2":"#f9fafb"} border={(overdue+critical)>0?"#fecaca":"#e5e7eb"} />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="fe-card" style={{padding:20}}>
          <SectionTitle icon={<DollarSign size={16}/>}>Salary Distribution</SectionTitle>
          <HBarChart data={salaryBars} />
        </div>
        <div className="fe-card" style={{padding:20}}>
          <SectionTitle icon={<Users size={16}/>}>Status Breakdown</SectionTitle>
          <DonutChart data={statusData} size={155} title={String(active.length)} subtitle="total" />
        </div>
      </div>

      {positionBars.length>0 && (
        <div className="fe-card" style={{padding:20}}>
          <SectionTitle icon={<Briefcase size={16}/>}>Top Positions (Headcount)</SectionTitle>
          <HBarChart data={positionBars} />
        </div>
      )}

      {allExpiring.length>0 && (
        <div className="fe-card" style={{overflowX:"auto"}}>
          <div style={{padding:"16px 20px 0"}}>
            <SectionTitle icon={<Clock size={16}/>}>Contract Expiry Detail</SectionTitle>
          </div>
          <table className="fe-table" style={{width:"100%"}}>
            <thead><tr>
              <TH>Employee</TH><TH>Client</TH><TH>Status</TH><TH align="right">End Date</TH><TH align="right">Days Left</TH>
            </tr></thead>
            <tbody>
              {allExpiring.slice(0,30).map((e,i)=>{
                const d   = daysUntil(e.endDate);
                const col = d<0?"#dc2626":d<=14?"#ef4444":d<=30?"#f97316":"#f59e0b";
                const bg  = d<0||d<=14?"#fef2f2":undefined;
                return (
                  <tr key={i} style={{borderBottom:"1px solid #f9fafb",backgroundColor:bg}}>
                    <TD bold>{e.name}</TD>
                    <TD color="#4b5563">{e.client}</TD>
                    <TD><span style={{backgroundColor:"#f3f4f6",color:"#374151",padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:700}}>{e.status}</span></TD>
                    <TD align="right" mono>{e.endDate?.slice(0,10)}</TD>
                    <td style={{padding:"10px 14px",textAlign:"right",fontWeight:900,color:col,fontSize:13}}>
                      {d<0?`${Math.abs(d)}d overdue`:d===0?"TODAY":`${d}d`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function AnalyticsDashboard({ employees = [] }) {
  const [tab, setTab] = useState("overview");
  const issues = useOperationalIssues(employees);

  const active = useMemo(() => employees.filter(e => !isExcluded(e)), [employees]);

  const billable = useMemo(() =>
    active.filter(emp => {
      const isSela = (emp.client||"").toLowerCase() === "sela";
      const hasPO  = emp.poNumbers && String(emp.poNumbers).trim() !== "";
      return !isSela || hasPO;
    }), [active]);

  const allExpiring = useMemo(() =>
    active
      .filter(e => e.endDate && daysUntil(e.endDate) <= 90)
      .sort((a,b) => daysUntil(a.endDate) - daysUntil(b.endDate)),
    [active]);

  // Global KPIs
  const totalPayroll    = active.reduce((s,e)=>s+Number(e.totalPackage||0),0);
  const billableMargin  = billable.reduce((s,e)=>s+calcLine(e).margin,0);
  const netProfit       = billable.reduce((s,e)=>s+calcNetProfit(e),0);
  const expiring60      = allExpiring.filter(e=>daysUntil(e.endDate)<=60).length;

  return (
    <div className="fe-page" style={{padding:"0",direction:"ltr"}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:20,fontWeight:700,color:"#111827",margin:"0 0 4px",fontFamily:"var(--font-sans)",letterSpacing:"-0.02em",display:"flex",alignItems:"center",gap:8}}>
          <BarChart2 size={20} style={{color:M}}/> Analytics
        </h1>
        <p style={{color:"#6b7280",fontSize:13,margin:0,fontFamily:"var(--font-sans)"}}>
          Headcount · Client Profitability · Partner Settlements · Workforce Trends
        </p>
      </div>

      {/* Global KPI strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:24}}>
        <KpiCard label="Headcount"       value={active.length}         sub={`${billable.length} billable`} />
        <KpiCard label="Total Payroll"   value={fK(totalPayroll)}      sub="all active employees"          color="#374151" bg="#f9fafb" border="#e5e7eb" />
        <KpiCard label="Billable Margin" value={fK(billableMargin)}    sub="excl. Sela no-PO"              color="#0369a1" bg="#f0f9ff" border="#bae6fd" />
        <KpiCard label="Net Profit"      value={fK(netProfit)}         sub="after partner payouts"         color="#059669" bg="#f0fdf4" border="#bbf7d0" />
        <KpiCard label="Expiring ≤60d"   value={expiring60}            sub={`${issues.counts.urgent} urgent`}
          color={expiring60>0?"#dc2626":"#374151"} bg={expiring60>0?"#fef2f2":"#f9fafb"} border={expiring60>0?"#fecaca":"#e5e7eb"} />
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"2px solid #f3f4f6",marginBottom:24}}>
        {[
          {key:"overview",  label:"Overview",  icon:<BarChart2 size={14}/> },
          {key:"clients",   label:"Clients",   icon:<Building2 size={14}/> },
          {key:"partners",  label:"Partners",  icon:<Handshake size={14}/> },
          {key:"workforce", label:"Workforce", icon:<Users size={14}/>,     badge:expiring60 },
        ].map(t=>(
          <TabBtn key={t.key}
            label={<span style={{display:"flex",alignItems:"center",gap:5}}>{t.icon}{t.label}</span>}
            active={tab===t.key} onClick={()=>setTab(t.key)} badge={t.badge} />
        ))}
      </div>

      {/* Content */}
      {tab==="overview"  && <OverviewTab  active={active} billable={billable} issues={issues} allExpiring={allExpiring} />}
      {tab==="clients"   && <ClientsTab   active={active} billable={billable} />}
      {tab==="partners"  && <PartnersTab  active={active} billable={billable} />}
      {tab==="workforce" && <WorkforceTab active={active} allExpiring={allExpiring} />}
    </div>
  );
}
