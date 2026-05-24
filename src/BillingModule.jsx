import React, { useState, useMemo } from "react";
import { DollarSign, Search, Users, Receipt, Layers, AlertTriangle, Download, TrendingUp, Building2 } from "lucide-react";

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────
const VAT_RATE = 0.15;
const M = "#800000";
const MD = "#5c0000";

const fmtSAR = n => `SAR ${Number(n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 })}`;
const fmtNum = n => Number(n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 });

const isExcluded = e => {
  const status = (e.status || "").toLowerCase().trim();
  return ["expired", "resigned", "expired_ar", "resigned_ar", "مستقيل", "منتهي"].includes(status);
};

const calcLine = (emp) => {
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

const s = {
  card: { backgroundColor: "white", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  th: { padding: "12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", backgroundColor: "#fdf8f8", borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px", borderBottom: "1px solid #f9fafb", fontSize: 13 },
  tab: (active) => ({ padding: "14px 28px", cursor: "pointer", fontSize: 14, fontWeight: 800, color: active ? M : "#6b7280", borderBottom: `3px solid ${active ? M : "transparent"}`, backgroundColor: active ? "#fff5f5" : "transparent", transition: "0.2s", display: "flex", alignItems: "center", gap: 8 }),
  badgePO: (hasPO) => ({ 
    backgroundColor: hasPO ? "#f3f4f6" : "#fff7ed", 
    color: hasPO ? "#374151" : "#c2410c", 
    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, border: `1px solid ${hasPO ? "#e5e7eb" : "#ffedd5"}`, display: "inline-flex", alignItems: "center", gap: 6
  })
};

export const BillingModule = ({ employees = [] }) => {
  const [activeTab, setActiveTab] = useState("client"); 
  const [filterClient, setFilterClient] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPartnerSettlement, setShowPartnerSettlement] = useState(false);

  const billingData = useMemo(() => employees.filter(emp => !isExcluded(emp)), [employees]);

  const filteredItems = useMemo(() => {
    return billingData.filter(emp => {
      const empClient = (emp.client || "").toLowerCase();
      const selectedClient = filterClient.toLowerCase();
      const matchClient = filterClient === "all" || empClient === selectedClient;
      const matchSearch = (emp.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (empClient === "sela") {
        const hasPo = emp.poNumbers && String(emp.poNumbers).trim() !== "";
        if (!hasPo) return false;
      }
      return matchClient && matchSearch;
    });
  }, [billingData, filterClient, searchQuery]);

  const stats = useMemo(() => {
    let marginTotal = 0, vatTotal = 0, grandTotal = 0;
    filteredItems.forEach(emp => {
      const line = calcLine(emp);
      marginTotal += line.margin;
      vatTotal += line.vat;
      grandTotal += line.total;
    });
    return { marginTotal, vatTotal, grandTotal };
  }, [filteredItems]);

  const clientsList = useMemo(() => Array.from(new Set(billingData.map(e => e.client).filter(Boolean))), [billingData]);

  // ── PARTNER SETTLEMENT ──────────────────────────────────────
  const partners = {};
  billingData.forEach(e => {
    if (e.profitMode !== 'direct' && e.partnerAssigned) {
      if (!partners[e.partnerAssigned]) {
        partners[e.partnerAssigned] = { emps: [], phone: e.partnerPhone };
      }
      partners[e.partnerAssigned].emps.push(e);
    }
  });

  const settlementData = Object.entries(partners).map(([name, data]) => {
    const totalPayroll = data.emps.reduce((sum, e) => sum + (e.totalPackage || 0), 0);
    const commission = Math.round(totalPayroll * 0.08);
    return { name, phone: data.phone, headcount: data.emps.length, totalPayroll, commission };
  });

  const totalCommission = settlementData.reduce((sum, p) => sum + p.commission, 0);

  return (
    <div className="fe-page" style={{ padding: "0", direction: "ltr" }}>
      
      {/* Header & Stats Cards */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>📊 Financial Operations</h1>
          <p style={{ color: "#6b7280", fontSize: 13, margin: "2px 0 0", fontFamily: "var(--font-sans)" }}>Billing cycles, VAT management, and Partner settlements.</p>
        </div>
        
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>TOTAL MARGIN</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{fmtSAR(stats.marginTotal)}</div>
          </div>
          <div style={{ textAlign: "right", borderLeft: "1px solid #e5e7eb", paddingLeft: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>EST. VAT (15%)</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: M }}>{fmtSAR(stats.vatTotal)}</div>
          </div>
          <button onClick={() => setShowPartnerSettlement(!showPartnerSettlement)}
            className={showPartnerSettlement ? "fe-btn fe-btn-primary" : "fe-btn fe-btn-ghost"}>
            🤝 Settlement ({settlementData.length})
          </button>
        </div>
      </div>

      {/* Partner Settlement Panel */}
      {showPartnerSettlement && (
        <div className="fe-card" style={{ padding: 20, marginBottom: 25, backgroundColor: '#f9fafb', border: '2px solid #7c3aed' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>🤝 Partner Settlement Report</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="fe-stat-card" style={{ padding: 12, textAlign: 'center' }}>
              <div className="fe-label">Partners</div>
              <div className="fe-kpi-value" style={{ color: '#7c3aed', marginTop: 4 }}>{settlementData.length}</div>
            </div>
            <div className="fe-stat-card" style={{ padding: 12, textAlign: 'center' }}>
              <div className="fe-label">Total Commission</div>
              <div className="fe-kpi-value" style={{ color: '#16a34a', marginTop: 4 }}>SR {totalCommission.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="fe-table" style={{ width: '100%', minWidth: 600 }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ ...s.th, textAlign: 'left' }}>Partner</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Headcount</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Payroll (SR)</th>
                  <th style={{ ...s.th, textAlign: 'right', color: '#16a34a' }}>Commission (SR)</th>
                </tr>
              </thead>
              <tbody>
                {settlementData.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ ...s.td, fontWeight: 700 }}>{p.name}</td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: 700 }}>{p.headcount}</td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace' }}>SR {p.totalPayroll.toLocaleString()}</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 900, color: '#16a34a' }}>SR {p.commission.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="fe-card" style={{ padding: 16, marginBottom: 25, display: "flex", gap: 15 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            className="fe-input"
            type="text" placeholder="Search by employee name..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: 40 }}
          />
        </div>
        <select className="fe-select" value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ fontWeight: 700, minWidth: 200 }}>
            <option value="all">All Clients ({billingData.length})</option>
            {clientsList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #f3f4f6", marginBottom: 25 }}>
        <div style={s.tab(activeTab === "client")} onClick={() => setActiveTab("client")}>
          <Users size={18}/> Client Invoicing
        </div>
        <div style={s.tab(activeTab === "partner")} onClick={() => setActiveTab("partner")}>
          <Layers size={18}/> Partner Settlements
        </div>
      </div>

      {/* Main Table */}
      <div className="fe-card">
        <table className="fe-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={s.th}>Employee & Reference</th>
              <th style={s.th}>Client</th>
              {activeTab === "client" ? (
                <>
                  <th style={{ ...s.th, textAlign: "right" }}>Pkg Value</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Margin</th>
                  <th style={{ ...s.th, textAlign: "right" }}>VAT</th>
                  <th style={{ ...s.th, textAlign: "right", backgroundColor: "#fff5f5" }}>Total Invoice</th>
                </>
              ) : (
                <>
                  <th style={s.th}>Partner Name</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Settlement</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Net Profit</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(emp => {
              const line = calcLine(emp);
              if (activeTab === "partner" && emp.profitMode !== "partner") return null;
              const poRaw = emp.poNumbers || "";
              const hasPO = poRaw.toString().trim().length > 0;
              const isSela = (emp.client || "").toLowerCase() === "sela";

              return (
                <tr key={emp._id}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 800, color: "#111827" }}>{emp.name}</div>
                    {isSela && (
                      <div style={{ marginTop: 6 }}>
                        <span style={s.badgePO(hasPO)}>
                          {hasPO ? `PO: ${poRaw}` : <><AlertTriangle size={14}/> Missing PO</>}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 700, color: "#4b5563" }}>{emp.client}</span>
                  </td>
                  
                  {activeTab === "client" ? (
                    <>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>{fmtNum(emp.totalPackage)}</td>
                      <td style={{ ...s.td, textAlign: "right", color: "#10b981", fontWeight: 800 }}>{fmtNum(line.margin)}</td>
                      <td style={{ ...s.td, textAlign: "right", color: "#6b7280" }}>{fmtNum(line.vat)}</td>
                      <td style={{ ...s.td, textAlign: "right", fontWeight: 900, color: M, backgroundColor: "#fffbfb" }}>{fmtNum(line.total)}</td>
                    </>
                  ) : (
                    <>
                      <td style={s.td}>{emp.partnerAssigned || "N/A"}</td>
                      <td style={{ ...s.td, textAlign: "right", color: "#2563eb", fontWeight: 700 }}>{fmtNum(line.partnerCost)}</td>
                      <td style={{ ...s.td, textAlign: "right", fontWeight: 900, color: "#059669" }}>{fmtNum(line.margin)}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};