import React, { useState, useMemo, useEffect } from "react";
import {
  DollarSign, Users, Building2, TrendingUp, ChevronDown, ChevronRight,
  Copy, Check, MessageCircle, Mail, FileText, Download, FileDown, AlertCircle,
} from "lucide-react";
import { isExcluded } from "./utils/helpers";
import OperationalPartners from "./modules/OperationalPartners";

// ═══════════════════════════════════════════════════════════════════════════════
// BLUE CUBE COMMISSION DATA (hardcoded from Blue Cube - Sela Invoices .xlsx)
// ═══════════════════════════════════════════════════════════════════════════════
const BC_BATCHES = [
  {
    id: 'bc1', label: '1st Invoice', totalInvoiced: 1958129.98, totalFisheye: 117487.7988, totalBC: 9399.023904,
    rows: [
      { po:'PO-28358', invNums:['2300672','2300648','2300728'], invoicedAmt:71475.95,  bcFee:343.08456   },
      { po:'PO-28551', invNums:['2300650'],                    invoicedAmt:73140,     bcFee:351.072     },
      { po:'PO-28568', invNums:['2300673','2300651','2300729'], invoicedAmt:230391,    bcFee:1105.8768   },
      { po:'PO-28681', invNums:['2300681'],                    invoicedAmt:16035,     bcFee:76.968      },
      { po:'PO-28763', invNums:['2300682'],                    invoicedAmt:9752,      bcFee:46.8096     },
      { po:'PO-28788', invNums:['2300683'],                    invoicedAmt:9752,      bcFee:46.8096     },
      { po:'PO-28823', invNums:['2300684','2300730','2300781'], invoicedAmt:245019,    bcFee:1176.0912   },
      { po:'PO-28874', invNums:['2300685'],                    invoicedAmt:21942,     bcFee:105.3216    },
      { po:'PO-28867', invNums:['2300686','2300731','2300782'], invoicedAmt:75605.61,  bcFee:362.906928  },
      { po:'PO-28946', invNums:['2300687','2300732','2300783'], invoicedAmt:55692,     bcFee:267.3216    },
      { po:'PO-28893', invNums:['2300688','2300733','2300784'], invoicedAmt:249251,    bcFee:1196.4048   },
      { po:'PO-28847', invNums:['2300705'],                    invoicedAmt:11092.9,   bcFee:53.24592    },
      { po:'PO-29102', invNums:['2300706','2300785','2300825'], invoicedAmt:144315,    bcFee:692.712     },
      { po:'PO-29001', invNums:['2300707'],                    invoicedAmt:14915.5,   bcFee:71.5944     },
      { po:'PO-29491', invNums:['2300744'],                    invoicedAmt:8552,      bcFee:41.0496     },
      { po:'PO-29402', invNums:['2300742'],                    invoicedAmt:52844.8,   bcFee:253.65504   },
      { po:'PO-29304', invNums:['2300734','2300735','2300786'], invoicedAmt:107004,    bcFee:513.6192    },
      { po:'PO-29453', invNums:['2300744'],                    invoicedAmt:113314,    bcFee:543.9072    },
      { po:'PO-29745', invNums:['2300771','2300826'],           invoicedAmt:37468.4,   bcFee:179.84832   },
      { po:'PO-29572', invNums:['2300772','2300827'],           invoicedAmt:74936.8,   bcFee:359.69664   },
      { po:'PO-29592', invNums:['2300773'],                    invoicedAmt:8552,      bcFee:41.0496     },
      { po:'PO-29525', invNums:['2300774'],                    invoicedAmt:8533,      bcFee:40.9584     },
      { po:'PO-29608', invNums:['2300775'],                    invoicedAmt:19242,     bcFee:92.3616     },
      { po:'PO-29725', invNums:['2300776'],                    invoicedAmt:16035,     bcFee:76.968      },
      { po:'PO-29742', invNums:['2300777','2300828'],           invoicedAmt:43747.86,  bcFee:209.989728  },
      { po:'PO-29841', invNums:['2300778'],                    invoicedAmt:36552.53,  bcFee:175.452144  },
      { po:'PO-29875', invNums:['2300779'],                    invoicedAmt:86095,     bcFee:413.256     },
      { po:'PO-29884', invNums:['2300780'],                    invoicedAmt:8533,      bcFee:40.9584     },
      { po:'PO-29987', invNums:['2300789'],                    invoicedAmt:8552,      bcFee:41.0496     },
      { po:'PO-30185', invNums:['2300818','2300829'],           invoicedAmt:81224.63,  bcFee:389.878224  },
      { po:'PO-30144', invNums:['2300819'],                    invoicedAmt:18564,     bcFee:89.1072     },
    ],
  },
  {
    id: 'bc2', label: '2nd Invoice', totalInvoiced: 416614.47, totalFisheye: 24996.8682, totalBC: 1999.749456,
    rows: [
      { po:'PO-29745', invNums:['2300929'], invoicedAmt:18734.2,  bcFee:89.92416   },
      { po:'PO-29572', invNums:['2300930'], invoicedAmt:37468.4,  bcFee:179.84832  },
      { po:'PO-30185', invNums:['2300940'], invoicedAmt:24650.67, bcFee:118.323216 },
      { po:'PO-30436', invNums:['2300855'], invoicedAmt:12828,    bcFee:61.5744    },
      { po:'PO-30954', invNums:['2300856','2300932'], invoicedAmt:14966, bcFee:71.8368  },
      { po:'PO-31371', invNums:['2300887','2300933'], invoicedAmt:17104, bcFee:82.0992  },
      { po:'PO-31665', invNums:['2300934'], invoicedAmt:108079.3, bcFee:518.78064  },
      { po:'PO-31306', invNums:['2300935'], invoicedAmt:44898,    bcFee:215.5104   },
      { po:'PO-31043', invNums:['2300938'], invoicedAmt:12828,    bcFee:61.5744    },
      { po:'PO-30932', invNums:['2300968'], invoicedAmt:65205,    bcFee:312.984    },
      { po:'PO-32264', invNums:['2300971'], invoicedAmt:59852.9,  bcFee:287.29392  },
    ],
  },
  {
    id: 'bc3', label: '3rd Invoice', totalInvoiced: 1420831.55, totalFisheye: 85249.893, totalBC: 6819.99144,
    rows: [
      { po:'PO-30932',  invNums:['2300968'], invoicedAmt:65205,     bcFee:312.984      },
      { po:'PO-32265',  invNums:['2300972'], invoicedAmt:121465.3,  bcFee:583.03344    },
      { po:'PO-32279',  invNums:['2300973'], invoicedAmt:34495.5,   bcFee:165.5784     },
      { po:'PO-32339',  invNums:['2300975'], invoicedAmt:20787,     bcFee:99.7776      },
      { po:'PO-32355',  invNums:['2300976'], invoicedAmt:58512,     bcFee:280.8576     },
      { po:'PO-32811',  invNums:['2301022','2301087','2301201'], invoicedAmt:84842,    bcFee:407.2416     },
      { po:'PO-33266',  invNums:['2301051'], invoicedAmt:35527,     bcFee:170.5296     },
      { po:'PO-33227',  invNums:['2301052'], invoicedAmt:13541,     bcFee:64.9968      },
      { po:'PO-33261',  invNums:['2301053'], invoicedAmt:27936.53,  bcFee:134.095344   },
      { po:'PO-33923',  invNums:['2301127'], invoicedAmt:5865,      bcFee:28.152       },
      { po:'PO-33740',  invNums:['2301128','2301210'], invoicedAmt:62642,    bcFee:300.6816     },
      { po:'PO-33778',  invNums:['2301129'], invoicedAmt:16035,     bcFee:76.968       },
      { po:'PO-33802',  invNums:['2301130'], invoicedAmt:40622,     bcFee:194.9856     },
      { po:'PO-33886',  invNums:['2301131','2301211'], invoicedAmt:17816.67, bcFee:85.520016    },
      { po:'PO-33999',  invNums:['2301134','2301212'], invoicedAmt:150729,   bcFee:723.4992     },
      { po:'PO-33891',  invNums:['2301135','2301213'], invoicedAmt:8644,     bcFee:41.4912      },
      { po:'PO-33995',  invNums:['2301220'], invoicedAmt:3367,      bcFee:16.1616      },
      { po:'PO-34159',  invNums:['2301221'], invoicedAmt:48105,     bcFee:230.904      },
      { po:'PO-33859',  invNums:['2301223'], invoicedAmt:24380,     bcFee:117.024      },
      { po:'PO-34786',  invNums:['2301230'], invoicedAmt:7314,      bcFee:35.1072      },
      { po:'PO-34495',  invNums:['2301232'], invoicedAmt:10690,     bcFee:51.312       },
      { po:'PO-34273',  invNums:['2301238'], invoicedAmt:175541.27, bcFee:842.598096   },
      { po:'PO-34318',  invNums:['2301239'], invoicedAmt:357675.78, bcFee:1716.843744  },
      { po:'PO-34284',  invNums:['2301242'], invoicedAmt:9621,      bcFee:46.1808      },
      { po:'PO-34969',  invNums:['2301248'], invoicedAmt:19472.5,   bcFee:93.468       },
    ],
  },
];

// All invoice numbers that have been commissioned to Blue Cube
const BC_COMMISSIONED_INVS = new Set(
  BC_BATCHES.flatMap(b => b.rows.flatMap(r => r.invNums))
);
// All PO numbers that belong to Blue Cube (normalize to uppercase, strip _2 suffix)
const BC_PO_SET = new Set(
  BC_BATCHES.flatMap(b => b.rows.map(r => r.po.replace(/_\d+$/, '').toUpperCase()))
);
const normPO = po => String(po || '').toUpperCase().trim().replace(/_\d+$/, '');

// Lookup: invoice number → which batch it was commissioned in
const BC_INV_TO_BATCH = new Map();
BC_BATCHES.forEach(b => b.rows.forEach(r => r.invNums.forEach(n => {
  if (!BC_INV_TO_BATCH.has(n)) BC_INV_TO_BATCH.set(n, b.label);
})));

// Lookup: PO → fisheye fee rate (for commission estimation on new invoices)
const BC_PO_RATE = new Map();
BC_BATCHES.forEach(b => b.rows.forEach(r => {
  // derive rate from bcFee / invoicedAmt = fisheyeRate * 0.08
  if (!BC_PO_RATE.has(normPO(r.po))) {
    const fisheyeRate = r.bcFee / r.invoicedAmt / 0.08;
    BC_PO_RATE.set(normPO(r.po), Math.round(fisheyeRate * 100) / 100);
  }
}));

const M = "#800000";
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtSAR = n => n ? `SR ${Number(n).toLocaleString()}` : "SR 0";

// ── mirrors App.jsx calcProfit exactly ───────────────────────────────────────
function calcProfit(e) {
  const margin = calcClientBilling(e); // Fisheye margin from client
  const pp = (e.partnerCostType === "percent")
    ? Math.round(((e.partnerCost || 0) / 100) * (e.totalPackage || 0))
    : (e.partnerCost || 0);
  if (e.profitMode === "direct") return margin; // no partner payout
  return margin - pp;
}

function calcClientBilling(e) {
  // Returns only the margin Fisheye charges on top of the package
  if (e.profitMode === "direct") {
    const marginType = e.fisheyeMarginType || "percent";
    if (marginType === "percent") return Math.round(((e.fisheyeMargin || 0) / 100) * (e.totalPackage || 0));
    return e.fisheyeMargin || 0;
  } else {
    // Partner mode: clientPrice is the margin Fisheye charges client
    if (e.clientPriceType === "percent") {
      return Math.round(((e.clientPrice || 0) / 100) * (e.totalPackage || 0));
    }
    return e.clientPrice || 0;
  }
}

function calcTotalBilling(e) {
  // Total invoice to client = package + margin
  return (e.totalPackage || 0) + calcClientBilling(e);
}

function calcPartnerPayout(e) {
  // What Fisheye pays the partner
  if (e.profitMode !== "partner") return 0;
  if (e.partnerCostType === "percent") return Math.round((e.partnerCost / 100) * e.totalPackage);
  return e.partnerCost || 0;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, color = "#374151", border = "#e5e7eb", bg = "white", accent }) {
  return (
    <div className="fe-stat-card" style={{
      padding: "13px 15px",
      borderRadius: 10,
      border: `1px solid ${border}`,
      borderLeft: `4px solid ${accent || color}`,
      backgroundColor: bg,
      minWidth: 0,
    }}>
      <p className="fe-label" style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p className="fe-kpi-value" style={{ color, margin: 0, lineHeight: 1.1, fontSize: 16, fontWeight: 900 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

// ── Copy/WA helper ────────────────────────────────────────────────────────────
function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea"); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    });
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button onClick={copy} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${copied ? "#16a34a" : "#e5e7eb"}`, backgroundColor: "white", color: copied ? "#16a34a" : "#374151", cursor: "pointer" }}>
      {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> {label}</>}
    </button>
  );
}

// ── Build text report for a partner ──────────────────────────────────────────
function buildPartnerReport(partner, monthLabel) {
  const lines = [
    `🤝 Partner Settlement — ${partner.name}`,
    `📅 Period: ${monthLabel}`,
    `👥 Headcount: ${partner.employees.length}`,
    ``,
    `── Employee Breakdown ──`,
  ];
  partner.employees.forEach(e => {
    const payout = calcPartnerPayout(e);
    lines.push(`• ${e.name} (${e.client || "—"}) → ${fmtSAR(payout)}/mo`);
  });
  lines.push(``, `💰 Total Payout: ${fmtSAR(partner.totalPayout)}`);
  lines.push(`_Sent via Fisheye Ops Pro_`);
  return lines.join("\n");
}

function buildClientReport(client, monthLabel) {
  const lines = [
    `🏢 Client Billing Summary — ${client.name}`,
    `📅 Period: ${monthLabel}`,
    `👥 Headcount: ${client.employees.length}`,
    ``,
    `── Employee Breakdown ──`,
  ];
  client.employees.forEach(e => {
    const billing = calcClientBilling(e);
    const profit  = calcProfit(e);
    const mode    = e.profitMode === "direct" ? "Direct" : "Partner";
    lines.push(`• ${e.name} | Billing: ${fmtSAR(billing)} | Profit: ${fmtSAR(profit)} | ${mode}`);
  });
  lines.push(``, `📊 Total Billing: ${fmtSAR(client.totalBilling)}`);
  lines.push(`💵 Total Profit: ${fmtSAR(client.totalProfit)}`);
  lines.push(`_Sent via Fisheye Ops Pro_`);
  return lines.join("\n");
}

// ── Excel export ─────────────────────────────────────────────────────────────
function exportExcel(rows, filename) {
  const BOM = "\uFEFF";
  const headers = Object.keys(rows[0]);
  const escape  = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines   = [headers.map(escape).join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))];
  const blob    = new Blob([BOM + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportPartnerExcel(partner, monthLabel) {
  const rows = partner.employees.map(e => ({
    "اسم الموظف":       e.name || "—",
    "البوزيشن":         e.position || "—",
    "العميل":           e.client || "—",
    "المشروع":          e.project || "—",
    "الراتب الكلي":     e.totalPackage || 0,
    "مدفوع للبارتنر":  calcPartnerPayout(e),
    "الفاتورة للعميل": calcClientBilling(e),
    "ربح فيشاي":       calcProfit(e),
    "Mode":             e.profitMode === "direct" ? "Direct" : "Partner",
  }));
  // totals row
  rows.push({
    "اسم الموظف": `الإجمالي — ${partner.name}`,
    "البوزيشن": "", "العميل": "", "المشروع": "",
    "الراتب الكلي":     partner.employees.reduce((s,e) => s+(e.totalPackage||0), 0),
    "مدفوع للبارتنر":  partner.totalPayout,
    "الفاتورة للعميل": partner.totalBilling,
    "ربح فيشاي":       partner.totalProfit,
    "Mode": "",
  });
  exportExcel(rows, `Settlement_${partner.name}_${monthLabel}.csv`);
}

function exportClientExcel(client, monthLabel) {
  const rows = client.employees.map(e => ({
    "اسم الموظف":       e.name || "—",
    "البوزيشن":         e.position || "—",
    "الراتب الكلي":     e.totalPackage || 0,
    "الفاتورة للعميل": calcClientBilling(e),
    "مدفوع للبارتنر":  calcPartnerPayout(e),
    "ربح فيشاي":       calcProfit(e),
    "Mode":             e.profitMode === "direct" ? "Direct" : "Partner",
    "البارتنر":         e.partnerAssigned || "—",
  }));
  rows.push({
    "اسم الموظف": `الإجمالي — ${client.name}`,
    "البوزيشن": "",
    "الراتب الكلي":     client.employees.reduce((s,e) => s+(e.totalPackage||0), 0),
    "الفاتورة للعميل": client.totalBilling,
    "مدفوع للبارتنر":  client.employees.reduce((s,e) => s+calcPartnerPayout(e), 0),
    "ربح فيشاي":       client.totalProfit,
    "Mode": "", "البارتنر": "",
  });
  exportExcel(rows, `Billing_${client.name}_${monthLabel}.csv`);
}

export default function PartnerSettlementReport({ employees = [] }) {
  const [view, setView]         = useState("partners"); // "partners" | "clients" | "commissions"
  const [openRows, setOpenRows] = useState({});
  const [monthOffset, setMonthOffset] = useState(0);
  const [invoiceVersion, setInvoiceVersion] = useState(0);
  const [batchInputs,   setBatchInputs]   = useState({}); // {partnerName: string}
  const [showBatchInput, setShowBatchInput] = useState({}); // {partnerName: bool}

  // ── One-time migration: mark Blue Cube commissioned invoices as paid + batch ──
  useEffect(() => {
    const STORAGE_KEY = 'fisheye_invoices_v1';
    try {
      const invs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      let changed = false;
      const updated = invs.map(inv => {
        const invNum = String(inv.invoiceNumber || '').trim();
        const bcBatch = BC_INV_TO_BATCH.get(invNum);
        const needsPaid  = !inv.partnerCommissionPaid && BC_COMMISSIONED_INVS.has(invNum);
        const needsBatch = bcBatch && inv.partnerCommissionBatch !== bcBatch;
        if (needsPaid || needsBatch) {
          changed = true;
          return {
            ...inv,
            partnerCommissionPaid:  needsPaid  ? true    : inv.partnerCommissionPaid,
            partnerCommissionBatch: bcBatch    || inv.partnerCommissionBatch,
          };
        }
        return inv;
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setInvoiceVersion(v => v + 1);
      }
    } catch (_) {}
  }, []); // runs once on mount

  // ── Mark all pending invoices for a partner as paid (new batch) ───────────
  const markAllPaid = (pendingItems, batchLabel) => {
    const STORAGE_KEY = 'fisheye_invoices_v1';
    const ids = new Set(pendingItems.map(x => x.inv.id));
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = all.map(inv =>
        ids.has(inv.id)
          ? { ...inv, partnerCommissionPaid: true, partnerCommissionBatch: batchLabel.trim() || 'New Batch' }
          : inv
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setInvoiceVersion(v => v + 1);
    } catch (_) {}
  };

  // ── CSV download helper ───────────────────────────────────────────────────
  const downloadCSV = (rows, filename) => {
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

  // ── Export PAID commissions (grouped by batch) ────────────────────────────
  const exportPaidCSV = (partnerName, paid) => {
    const rows = [['Batch','PO Number','Invoice #(s)','Invoiced Amount (SAR)','Commission Rate','Commission Paid (SAR)'].map(esc).join(',')];
    const byBatch = new Map();
    paid.forEach(x => {
      const b = x.batch || x.inv.partnerCommissionBatch || 'Paid';
      if (!byBatch.has(b)) byBatch.set(b, []);
      byBatch.get(b).push(x);
    });
    const order = ['1st Invoice','2nd Invoice','3rd Invoice','4th Invoice','5th Invoice','6th Invoice'];
    [...byBatch.keys()].sort((a,b)=>(order.indexOf(a)===-1?99:order.indexOf(a))-(order.indexOf(b)===-1?99:order.indexOf(b)))
      .forEach(batch => {
        const poMap = new Map();
        byBatch.get(batch).forEach(x => { const po=x.inv.poNumber||'—'; if(!poMap.has(po))poMap.set(po,[]); poMap.get(po).push(x); });
        poMap.forEach((items, po) => {
          const preVat     = items.reduce((s,x)=>s+((x.inv.totalDue||0)-(x.inv.vat||0)),0);
          const commission = items.reduce((s,x)=>s+x.commission,0);
          // Rate = commission ÷ invoiced amount (actual rate, not hardcoded)
          const ratePct    = preVat > 0 ? (commission / preVat * 100).toFixed(2) + '%' : '—';
          rows.push([esc(batch),esc(po),esc(items.map(x=>x.inv.invoiceNumber).join(', ')),esc(preVat.toFixed(2)),esc(ratePct),esc(commission.toFixed(2))].join(','));
        });
      });
    downloadCSV(rows, `Paid_Commissions_${partnerName.replace(/\s+/g,'_')}.csv`);
  };

  // ── Export PENDING commissions ────────────────────────────────────────────
  const exportPendingCSV = (partnerName, pending) => {
    const rows = [['PO Number','Invoice #(s)','Invoiced Amount (SAR)','Commission Rate','Commission Due (SAR)'].map(esc).join(',')];
    const poMap = new Map();
    pending.forEach(x => { const po=x.inv.poNumber||'—'; if(!poMap.has(po))poMap.set(po,[]); poMap.get(po).push(x); });
    poMap.forEach((items, po) => {
      const preVat     = items.reduce((s,x)=>s+((x.inv.totalDue||0)-(x.inv.vat||0)),0);
      const commission = items.reduce((s,x)=>s+x.commission,0);
      const ratePct    = preVat > 0 ? (commission / preVat * 100).toFixed(2) + '%' : '—';
      rows.push([esc(po),esc(items.map(x=>x.inv.invoiceNumber).join(', ')),esc(preVat.toFixed(2)),esc(ratePct),esc(commission.toFixed(2))].join(','));
    });
    downloadCSV(rows, `Pending_Commissions_${partnerName.replace(/\s+/g,'_')}.csv`);
  };

  // ── Load invoices from localStorage (same key as invoiceManager) ──────────
  const allInvoices = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('fisheye_invoices_v1') || '[]'); }
    catch { return []; }
  }, [invoiceVersion]);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  // Last day of the viewed month
  const viewMonthStart = viewDate;
  const viewMonthEnd   = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  // Eligibility rules — aligned with Payroll tab logic:
  //   • Not excluded (resigned / terminated)
  //   • Was active during the viewed month (start ≤ monthEnd AND end ≥ monthStart, or no end)
  //   • Sela employees must have a PO (otherwise non-billable, exclude from settlement)
  const isEligibleInMonth = (e) => {
    const st = (e.status || '').toLowerCase();
    if (['resigned', 'resigned_ar', 'مستقيل'].includes(st)) return false;

    const start = e.startDate ? new Date(e.startDate) : null;
    const end   = e.endDate   ? new Date(e.endDate)   : null;
    if (start && start > viewMonthEnd)   return false; // hasn't started yet
    if (end   && end   < viewMonthStart) return false; // already ended before this month

    // Sela without PO → non-billable, exclude
    const isSela = (e.client || '').toLowerCase() === 'sela';
    const hasPO  = e.poNumbers && String(e.poNumbers).trim() !== '';
    if (isSela && !hasPO) return false;

    return true;
  };

  const active = useMemo(() =>
    employees.filter(e => !isExcluded(e) && isEligibleInMonth(e)),
    [employees, monthOffset]
  );

  // ── PARTNER DATA ──────────────────────────────────────────────────────────
  const partnerData = useMemo(() => {
    const map = {};
    // Include ALL employees with profitMode=partner and any partnerAssigned value
    active.filter(e => e.profitMode === "partner").forEach(e => {
      const key = e.partnerAssigned || e.partnerName || "غير محدد";
      if (!map[key]) map[key] = { name: key, employees: [] };
      map[key].employees.push(e);
    });
    return Object.values(map).map(p => {
      const totalPayout  = p.employees.reduce((s, e) => s + calcPartnerPayout(e), 0);
      const totalBilling = p.employees.reduce((s, e) => s + calcClientBilling(e), 0);
      const totalProfit  = p.employees.reduce((s, e) => s + calcProfit(e), 0);
      // group by client
      const byClient = {};
      p.employees.forEach(e => {
        const c = e.client || "Unknown";
        if (!byClient[c]) byClient[c] = { name: c, emps: [], payout: 0 };
        byClient[c].emps.push(e);
        byClient[c].payout += calcPartnerPayout(e);
      });
      return { ...p, totalPayout, totalBilling, totalProfit, byClient: Object.values(byClient) };
    }).sort((a, b) => b.totalPayout - a.totalPayout);
  }, [active]);

  // ── CLIENT DATA ──────────────────────────────────────────────────────────
  const clientData = useMemo(() => {
    const map = {};
    active.forEach(e => {
      const c = e.client || "Unknown";
      if (!map[c]) map[c] = { name: c, employees: [] };
      map[c].employees.push(e);
    });
    return Object.values(map).map(c => {
      const totalBilling = c.employees.reduce((s, e) => s + calcClientBilling(e), 0);
      const totalPayroll = c.employees.reduce((s, e) => s + (e.totalPackage || 0), 0);
      const totalProfit  = c.employees.reduce((s, e) => s + calcProfit(e), 0);
      const directCount  = c.employees.filter(e => e.profitMode === "direct").length;
      const partnerCount = c.employees.filter(e => e.profitMode === "partner").length;
      return { ...c, totalBilling, totalPayroll, totalProfit, directCount, partnerCount };
    }).sort((a, b) => b.totalBilling - a.totalBilling);
  }, [active]);

  // ── TOTALS ────────────────────────────────────────────────────────────────
  const totalPayout  = partnerData.reduce((s, p) => s + p.totalPayout, 0);
  const totalBilling = clientData.reduce((s, c) => s + c.totalBilling, 0);
  const totalProfit  = clientData.reduce((s, c) => s + c.totalProfit, 0);

  // ── Blue Cube: find paid invoices not yet commissioned ────────────────────
  const bcUnpaid = useMemo(() =>
    allInvoices.filter(inv => {
      if (inv.status !== 'paid') return false;
      if (!BC_PO_SET.has(normPO(inv.poNumber))) return false;
      return !BC_COMMISSIONED_INVS.has(String(inv.invoiceNumber || '').trim());
    }),
  [allInvoices]);

  const bcTotalCommissioned = BC_BATCHES.reduce((s, b) => s + b.totalBC, 0);
  const bcUnpaidCommission  = bcUnpaid.reduce((s, inv) => {
    const rate = BC_PO_RATE.get(normPO(inv.poNumber)) || 0.06;
    return s + (inv.totalDue || 0) * rate * 0.08;
  }, 0);

  // ── Group paid Blue Cube invoices by PO (from system) ────────────────────
  const bcByPO = useMemo(() => {
    const map = new Map();
    allInvoices
      .filter(inv => inv.status === 'paid' && BC_PO_SET.has(normPO(inv.poNumber)))
      .forEach(inv => {
        const key = normPO(inv.poNumber);
        if (!map.has(key)) map.set(key, { po: inv.poNumber, invoices: [] });
        map.get(key).invoices.push(inv);
      });
    for (const d of map.values())
      d.invoices.sort((a, b) => String(a.invoiceNumber).localeCompare(String(b.invoiceNumber)));
    return [...map.values()].sort((a, b) => a.po.localeCompare(b.po));
  }, [allInvoices]);

  // ── Per-partner commission tracker (general, all partners) ──────────────
  const commissionsByPartner = useMemo(() => {
    // Build PO→employee map from all partner employees
    const poToEmp = new Map();
    employees.filter(e => e.profitMode === 'partner').forEach(e => {
      const raw = String(e.poNumbers || '');
      raw.split(/[,;\n]/).map(p => normPO(p)).filter(Boolean).forEach(po => {
        poToEmp.set(po, e);
      });
    });

    const calcCommission = (emp, inv) => {
      if (!emp) return 0;
      // Base = Pre-VAT (same as Invoiced Amount column)
      const base = (inv.totalDue || 0) - (inv.vat || 0);
      return emp.partnerCostType === 'percent'
        ? Math.round((emp.partnerCost / 100) * base * 100) / 100
        : (emp.partnerCost || 0);
    };

    // Group paid invoices by partner
    const byPartner = new Map();
    allInvoices
      .filter(inv => inv.status === 'paid')
      .forEach(inv => {
        const emp = poToEmp.get(normPO(inv.poNumber));
        if (!emp) return;
        const partnerName = emp.partnerAssigned || emp.partnerName || 'غير محدد';
        if (!byPartner.has(partnerName)) byPartner.set(partnerName, []);
        byPartner.get(partnerName).push({
          inv, emp, commission: calcCommission(emp, inv),
          batch: BC_INV_TO_BATCH.get(String(inv.invoiceNumber||'').trim()) || inv.partnerCommissionBatch || null,
        });
      });

    return [...byPartner.entries()].map(([partnerName, items]) => {
      // Group by PO
      const byPO = new Map();
      items.forEach(({ inv, emp, commission }) => {
        const po = normPO(inv.poNumber);
        if (!byPO.has(po)) byPO.set(po, { po: inv.poNumber, invoices: [], emp });
        byPO.get(po).invoices.push({ inv, commission });
      });
      const poRows = [...byPO.values()].sort((a, b) => a.po.localeCompare(b.po));

      const paid    = items.filter(x => x.inv.partnerCommissionPaid);
      const pending = items.filter(x => !x.inv.partnerCommissionPaid);
      const totalCommissionPaid    = paid.reduce((s, x) => s + x.commission, 0);
      const totalCommissionPending = pending.reduce((s, x) => s + x.commission, 0);

      return { partnerName, poRows, paid, pending, totalCommissionPaid, totalCommissionPending };
    }).sort((a, b) => b.pending.length - a.pending.length); // partners with pending first
  }, [allInvoices, employees]);

  const totalPendingCommission = commissionsByPartner.reduce((s, p) => s + p.totalCommissionPending, 0);
  const totalPaidCommission    = commissionsByPartner.reduce((s, p) => s + p.totalCommissionPaid,    0);

  // ── Operations KPIs (from localStorage, same key as OperationalPartners) ──
  const opKpis = useMemo(() => {
    try {
      const raw = localStorage.getItem('fisheye_op_invoices_v1');
      const invs = raw ? JSON.parse(raw) : [];
      const PARTNERS_MAP = { Emdad: { hasGuarantee: false }, Safwat: { hasGuarantee: true } };
      let pending = 0, gOutstanding = 0, gPending = 0;
      invs.forEach(inv => {
        if (inv.invoiceType === 'guarantee') {
          if (!inv.guaranteeRefunded) {
            if (inv.isPaid) gOutstanding += (inv.grandTotal || 0);
            else             gPending    += (inv.grandTotal || 0);
          }
        } else {
          if (!inv.isPaid) pending += (inv.grandTotal || 0);
        }
      });
      const unpaidCount = invs.filter(i => i.invoiceType !== 'guarantee' && !i.isPaid).length;
      return { pending, gOutstanding, gPending, unpaidCount };
    } catch { return { pending: 0, gOutstanding: 0, gPending: 0, unpaidCount: 0 }; }
  }, [view]); // re-compute when switching to operations tab

  const toggle = key => setOpenRows(r => ({ ...r, [key]: !r[key] }));

  const rowStyle = { borderBottom: "1px solid #f3f4f6", backgroundColor: "white" };
  const tdBase   = { padding: "11px 14px", fontSize: 12 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Month nav strip ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#f9fafb", borderRadius: 10, padding: "8px 14px", border: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Period</span>
        <button
          onClick={() => setMonthOffset(o => o + 1)}
          style={{ padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#6b7280", transition: "all 0.15s" }}
        >← Prev</button>
        <span style={{ fontSize: 12, fontWeight: 800, color: M, minWidth: 88, textAlign: "center", padding: "4px 10px", borderRadius: 8, backgroundColor: "#fff5f5", border: `1px solid ${M}22` }}>{monthLabel}</span>
        <button
          onClick={() => setMonthOffset(o => Math.max(0, o - 1))}
          disabled={monthOffset === 0}
          style={{ padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: monthOffset === 0 ? "default" : "pointer", border: "1px solid #e5e7eb", backgroundColor: "white", color: monthOffset === 0 ? "#d1d5db" : "#6b7280", transition: "all 0.15s" }}
        >Next →</button>
        <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>
          {active.length} active employees
        </span>
      </div>

      {/* ── Contextual KPI Strip (changes per tab) ── */}
      {view === "partners" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <Stat label="Total Billing"    value={fmtSAR(totalBilling)} sub={`${clientData.length} clients`}                                                         color={M}       accent={M}       bg="#fff5f5" border={`${M}22`}  />
          <Stat label="Partner Payouts"  value={fmtSAR(totalPayout)}  sub={`${partnerData.length} partners`}                                                       color="#7c3aed" accent="#7c3aed" bg="#faf5ff" border="#ddd6fe" />
          <Stat label="Gross Profit"     value={fmtSAR(totalProfit)}  sub={`${Math.round((totalProfit/(totalBilling||1))*100)}% margin`}                           color="#059669" accent="#059669" bg="#f0fdf4" border="#bbf7d0" />
          <Stat label="Active Employees" value={active.length}        sub={`${partnerData.reduce((s,p)=>s+p.employees.length,0)} via partners`}                    color="#374151" accent="#6b7280" bg="#f9fafb" border="#e5e7eb" />
        </div>
      )}
      {view === "clients" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <Stat label="Total Billing"  value={fmtSAR(totalBilling)} sub={`${clientData.length} clients`}                                                           color={M}       accent={M}       bg="#fff5f5" border={`${M}22`}  />
          <Stat label="Gross Profit"   value={fmtSAR(totalProfit)}  sub={`${Math.round((totalProfit/(totalBilling||1))*100)}% margin`}                             color="#059669" accent="#059669" bg="#f0fdf4" border="#bbf7d0" />
          <Stat label="Partner Cost"   value={fmtSAR(totalPayout)}  sub="paid to partners"                                                                         color="#7c3aed" accent="#7c3aed" bg="#faf5ff" border="#ddd6fe" />
          <Stat label="Clients"        value={clientData.length}    sub={`${active.length} employees total`}                                                        color="#374151" accent="#6b7280" bg="#f9fafb" border="#e5e7eb" />
        </div>
      )}
      {view === "commissions" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <Stat label="Pending Commission" value={`SR ${totalPendingCommission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub={`${commissionsByPartner.reduce((s,p)=>s+p.pending.length,0)} invoices unpaid`} color="#dc2626" accent="#dc2626" bg="#fef2f2" border="#fca5a5" />
          <Stat label="Paid Commission"    value={`SR ${totalPaidCommission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}    sub={`${commissionsByPartner.reduce((s,p)=>s+p.paid.length,0)} invoices paid`}     color="#059669" accent="#059669" bg="#f0fdf4" border="#bbf7d0" />
          <Stat label="Partners"           value={commissionsByPartner.filter(p=>p.pending.length>0).length} sub={`of ${commissionsByPartner.length} have pending`}                                                                                    color={commissionsByPartner.some(p=>p.pending.length>0) ? "#dc2626" : "#059669"} accent="#7c3aed" bg="#faf5ff" border="#ddd6fe" />
        </div>
      )}
      {view === "operations" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <Stat label="Pending Payments"       value={`SR ${opKpis.pending.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}     sub={`${opKpis.unpaidCount} invoices unpaid`}  color={opKpis.pending>0?"#dc2626":"#059669"}   accent={opKpis.pending>0?"#dc2626":"#059669"}   bg={opKpis.pending>0?"#fef2f2":"#f0fdf4"} border={opKpis.pending>0?"#fca5a5":"#bbf7d0"} />
          <Stat label="Guarantee Outstanding"  value={`SR ${opKpis.gOutstanding.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub="paid to partner — awaiting refund"        color={opKpis.gOutstanding>0?"#b45309":"#6b7280"} accent={opKpis.gOutstanding>0?"#b45309":"#6b7280"} bg={opKpis.gOutstanding>0?"#fffbeb":"#f9fafb"} border={opKpis.gOutstanding>0?"#fcd34d":"#e5e7eb"} />
          <Stat label="Guarantee Pending"      value={`SR ${opKpis.gPending.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}     sub="not yet paid to partner"                  color={opKpis.gPending>0?"#7c3aed":"#6b7280"}   accent={opKpis.gPending>0?"#7c3aed":"#6b7280"}   bg={opKpis.gPending>0?"#faf5ff":"#f9fafb"} border={opKpis.gPending>0?"#ddd6fe":"#e5e7eb"} />
        </div>
      )}

      {/* ── View Toggle ── */}
      <div style={{ display: "flex", gap: 1, borderBottom: "1px solid #e5e7eb", marginBottom: 0 }}>
        {[
          ["partners",    "🤝", "Partners",    M,         null],
          ["clients",     "🏢", "Clients",     "#0369a1", null],
          ["commissions", "💼", "Commissions", "#7c3aed", totalPendingCommission > 0 ? commissionsByPartner.reduce((s,p)=>s+p.pending.length,0) : null],
          ["operations",  "🏗️", "Operations", "#b45309", null],
        ].map(([k, emoji, label, color, badge]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "10px 16px",
              fontSize: 12, fontWeight: view === k ? 800 : 500,
              color: view === k ? color : "#6b7280",
              background: view === k ? `${color}0d` : "transparent",
              border: "none",
              borderBottom: `3px solid ${view === k ? color : "transparent"}`,
              borderRadius: "6px 6px 0 0",
              cursor: "pointer",
              marginBottom: -1,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 13 }}>{emoji}</span>
            {label}
            {badge != null && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 18, height: 18, borderRadius: 999, padding: "0 5px",
                backgroundColor: view === k ? color : "#dc2626",
                color: "white", fontSize: 10, fontWeight: 800, lineHeight: 1,
              }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ PARTNERS VIEW ══════════ */}
      {view === "partners" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {partnerData.length === 0 && (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>No partner-mode employees found.</p>
          )}
          {partnerData.map(p => {
            const isOpen = openRows[`p-${p.name}`];
            const marginPct = p.totalBilling > 0 ? Math.round((p.totalProfit / p.totalBilling) * 100) : 0;
            return (
            <div key={p.name} style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              {/* Partner header row */}
              <div
                onClick={() => toggle(`p-${p.name}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                  cursor: "pointer", borderLeft: `4px solid #7c3aed`,
                  backgroundColor: isOpen ? "#faf5ff" : "white",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 11, flexShrink: 0, letterSpacing: "0.04em" }}>
                  {p.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#111827" }}>{p.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                    {p.employees.length} employees · {p.byClient.map(c => c.name).join(" · ")}
                  </p>
                </div>
                {/* KPI mini-strip */}
                <div style={{ display: "flex", gap: 8, alignItems: "stretch", flexShrink: 0 }}>
                  <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 8, backgroundColor: "#faf5ff", border: "1px solid #ddd6fe" }}>
                    <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Payout</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#7c3aed", fontFamily: "monospace" }}>{fmtSAR(p.totalPayout)}</p>
                  </div>
                  <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profit</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#16a34a", fontFamily: "monospace" }}>{fmtSAR(p.totalProfit)}</p>
                  </div>
                  <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 8, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", minWidth: 44 }}>
                    <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Margin</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: marginPct >= 15 ? "#059669" : marginPct >= 8 ? "#d97706" : M, fontFamily: "monospace" }}>{marginPct}%</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", paddingLeft: 4 }}>
                    {isOpen ? <ChevronDown size={15} style={{ color: "#9ca3af" }} /> : <ChevronRight size={15} style={{ color: "#9ca3af" }} />}
                  </div>
                </div>
              </div>

              {/* Expanded: employee table per client */}
              {openRows[`p-${p.name}`] && (
                <div>
                  {/* Share actions */}
                  <div style={{ padding: "8px 16px", backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Share settlement:</span>
                    <CopyBtn text={buildPartnerReport(p, monthLabel)} label="Copy text" />
                    <button
                      className="fe-btn fe-btn-ghost"
                      onClick={() => {
                        const r = buildPartnerReport(p, monthLabel);
                        const { subject, body } = { subject: `Settlement — ${p.name} — ${monthLabel}`, body: r };
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
                      }}
                      style={{ border: "1px solid #bfdbfe", color: "#1d4ed8" }}
                    >
                      <Mail size={11} /> Email
                    </button>
                    <button
                      className="fe-btn fe-btn-ghost"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildPartnerReport(p, monthLabel))}`, "_blank")}
                      style={{ border: "1px solid #86efac", backgroundColor: "#f0fdf4", color: "#15803d" }}
                    >
                      <MessageCircle size={11} /> WA
                    </button>
                    <button
                      className="fe-btn fe-btn-ghost"
                      onClick={() => exportPartnerExcel(p, monthLabel)}
                      style={{ border: "1px solid #d1fae5", backgroundColor: "#f0fdf4", color: "#065f46" }}
                    >
                      <FileDown size={11} /> Excel
                    </button>
                  </div>

                  {/* Employee table */}
                  <div style={{ overflowX: "auto" }}>
                    <table className="fe-table" style={{ width: "100%", minWidth: 620 }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f9fafb" }}>
                          {["Employee", "Client", "Total Package", "Partner Payout", "Fisheye Margin", "Fisheye Profit", "Mode"].map(h => (
                            <th key={h} style={{ ...tdBase, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textAlign: h === "Employee" || h === "Client" || h === "Mode" ? "left" : "right", fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {p.employees.map((e, i) => {
                          const payout   = calcPartnerPayout(e);
                          const billing  = calcClientBilling(e);
                          const profit   = calcProfit(e);
                          return (
                            <tr key={e._id || i} style={rowStyle}>
                              <td style={{ ...tdBase, fontWeight: 600 }}>
                                {e.name}
                                <div style={{ fontSize: 10, color: "#9ca3af" }}>{e.position || ""}</div>
                              </td>
                              <td style={{ ...tdBase, color: "#6b7280" }}>{e.client || "—"}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace" }}>{fmtSAR(e.totalPackage)}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontWeight: 700, color: "#7c3aed", fontFamily: "monospace" }}>{fmtSAR(payout)}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", color: M }}>{fmtSAR(billing)}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontWeight: 700, color: profit > 0 ? "#16a34a" : "#dc2626", fontFamily: "monospace" }}>{fmtSAR(profit)}</td>
                              <td style={{ ...tdBase }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, backgroundColor: e.profitMode === "direct" ? "#dbeafe" : "#f3e8ff", color: e.profitMode === "direct" ? "#1e40af" : "#6b21a8" }}>
                                  {e.profitMode === "direct" ? "⚡ Direct" : "🤝 Partner"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Subtotal row */}
                        <tr style={{ backgroundColor: "#fdf8f8" }}>
                          <td colSpan={3} style={{ ...tdBase, fontWeight: 700, color: M }}>Total — {p.name}</td>
                          <td style={{ ...tdBase, textAlign: "right", fontWeight: 900, color: "#7c3aed", fontFamily: "monospace" }}>{fmtSAR(p.totalPayout)}</td>
                          <td style={{ ...tdBase, textAlign: "right", fontWeight: 900, color: M, fontFamily: "monospace" }}>{fmtSAR(p.totalBilling)}</td>
                          <td style={{ ...tdBase, textAlign: "right", fontWeight: 900, color: "#16a34a", fontFamily: "monospace" }}>{fmtSAR(p.totalProfit)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            );
          })}

          {/* Partners total footer */}
          {partnerData.length > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 10, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderLeft: "4px solid #7c3aed", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total — {monthLabel}</span>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ textAlign: "right", padding: "4px 12px", borderRadius: 8, backgroundColor: "#faf5ff", border: "1px solid #ddd6fe" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Payouts</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#7c3aed", fontFamily: "monospace" }}>{fmtSAR(totalPayout)}</p>
                </div>
                <div style={{ textAlign: "right", padding: "4px 12px", borderRadius: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Profit</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#16a34a", fontFamily: "monospace" }}>{fmtSAR(totalProfit)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ CLIENTS VIEW ══════════ */}
      {view === "clients" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {clientData.map(c => {
            const isOpen = openRows[`c-${c.name}`];
            const clientMarginPct = c.totalBilling > 0 ? Math.round((c.totalProfit / c.totalBilling) * 100) : 0;
            const accentColor = M; // maroon per client (Finance module brand)
            return (
            <div key={c.name} style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              {/* Client header row */}
              <div
                onClick={() => toggle(`c-${c.name}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                  cursor: "pointer", borderLeft: `4px solid ${accentColor}`,
                  backgroundColor: isOpen ? "#fff5f5" : "white",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: accentColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 11, flexShrink: 0, letterSpacing: "0.04em" }}>
                  {c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#111827" }}>{c.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                    {c.employees.length} employees
                    {c.directCount > 0 && ` · ${c.directCount} direct`}
                    {c.partnerCount > 0 && ` · ${c.partnerCount} via partner`}
                  </p>
                </div>
                {/* KPI mini-strip */}
                <div style={{ display: "flex", gap: 8, alignItems: "stretch", flexShrink: 0 }}>
                  <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 8, backgroundColor: "#fff5f5", border: `1px solid ${accentColor}22` }}>
                    <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Billing</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: accentColor, fontFamily: "monospace" }}>{fmtSAR(c.totalBilling)}</p>
                  </div>
                  <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profit</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#16a34a", fontFamily: "monospace" }}>{fmtSAR(c.totalProfit)}</p>
                  </div>
                  <div style={{ textAlign: "right", padding: "4px 10px", borderRadius: 8, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", minWidth: 44 }}>
                    <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Margin</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: clientMarginPct >= 15 ? "#059669" : clientMarginPct >= 8 ? "#d97706" : M, fontFamily: "monospace" }}>
                      {c.totalBilling > 0 ? `${clientMarginPct}%` : "—"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", paddingLeft: 4 }}>
                    {isOpen ? <ChevronDown size={15} style={{ color: "#9ca3af" }} /> : <ChevronRight size={15} style={{ color: "#9ca3af" }} />}
                  </div>
                </div>
              </div>

              {/* Expanded: employee table */}
              {openRows[`c-${c.name}`] && (
                <div>
                  {/* Share actions */}
                  <div style={{ padding: "8px 16px", backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Share billing:</span>
                    <CopyBtn text={buildClientReport(c, monthLabel)} label="Copy text" />
                    <button
                      className="fe-btn fe-btn-ghost"
                      onClick={() => {
                        const body = buildClientReport(c, monthLabel);
                        window.open(`mailto:?subject=${encodeURIComponent(`Billing Summary — ${c.name} — ${monthLabel}`)}&body=${encodeURIComponent(body)}`, "_blank");
                      }}
                      style={{ border: "1px solid #bfdbfe", color: "#1d4ed8" }}
                    >
                      <Mail size={11} /> Email
                    </button>
                    <button
                      className="fe-btn fe-btn-ghost"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildClientReport(c, monthLabel))}`, "_blank")}
                      style={{ border: "1px solid #86efac", backgroundColor: "#f0fdf4", color: "#15803d" }}
                    >
                      <MessageCircle size={11} /> WA
                    </button>
                    <button
                      className="fe-btn fe-btn-ghost"
                      onClick={() => exportClientExcel(c, monthLabel)}
                      style={{ border: "1px solid #d1fae5", backgroundColor: "#f0fdf4", color: "#065f46" }}
                    >
                      <FileDown size={11} /> Excel
                    </button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table className="fe-table" style={{ width: "100%", minWidth: 620 }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f9fafb" }}>
                          {["Employee", "Position", "Total Package", "Fisheye Margin", "Partner Payout", "Fisheye Profit", "Mode"].map(h => (
                            <th key={h} style={{ ...tdBase, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textAlign: ["Employee","Position","Mode"].includes(h) ? "left" : "right", fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {c.employees.map((e, i) => {
                          const billing  = calcClientBilling(e);
                          const payout   = calcPartnerPayout(e);
                          const profit   = calcProfit(e);
                          return (
                            <tr key={e._id || i} style={rowStyle}>
                              <td style={{ ...tdBase, fontWeight: 600 }}>{e.name}</td>
                              <td style={{ ...tdBase, color: "#6b7280", fontSize: 11 }}>{e.position || "—"}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace" }}>{fmtSAR(e.totalPackage)}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontWeight: 700, color: M, fontFamily: "monospace" }}>{fmtSAR(billing)}</td>
                              <td style={{ ...tdBase, textAlign: "right", color: "#7c3aed", fontFamily: "monospace" }}>{payout > 0 ? fmtSAR(payout) : "—"}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontWeight: 700, color: profit > 0 ? "#16a34a" : "#dc2626", fontFamily: "monospace" }}>{fmtSAR(profit)}</td>
                              <td style={{ ...tdBase }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, backgroundColor: e.profitMode === "direct" ? "#dbeafe" : "#f3e8ff", color: e.profitMode === "direct" ? "#1e40af" : "#6b21a8" }}>
                                  {e.profitMode === "direct" ? "⚡ Direct" : "🤝 Partner"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Subtotal */}
                        <tr style={{ backgroundColor: "#f0fdf4" }}>
                          <td colSpan={3} style={{ ...tdBase, fontWeight: 700, color: "#16a34a" }}>Total — {c.name}</td>
                          <td style={{ ...tdBase, textAlign: "right", fontWeight: 900, color: M, fontFamily: "monospace" }}>{fmtSAR(c.totalBilling)}</td>
                          <td style={{ ...tdBase, textAlign: "right", fontWeight: 900, color: "#7c3aed", fontFamily: "monospace" }}>{fmtSAR(c.employees.reduce((s,e)=>s+calcPartnerPayout(e),0))}</td>
                          <td style={{ ...tdBase, textAlign: "right", fontWeight: 900, color: "#16a34a", fontFamily: "monospace" }}>{fmtSAR(c.totalProfit)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            );
          })}

          {/* Clients total footer */}
          {clientData.length > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 10, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderLeft: `4px solid ${M}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total — {monthLabel}</span>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ textAlign: "right", padding: "4px 12px", borderRadius: 8, backgroundColor: "#fff5f5", border: `1px solid ${M}22` }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Billing</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: M, fontFamily: "monospace" }}>{fmtSAR(totalBilling)}</p>
                </div>
                <div style={{ textAlign: "right", padding: "4px 12px", borderRadius: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Profit</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#16a34a", fontFamily: "monospace" }}>{fmtSAR(totalProfit)}</p>
                </div>
                <div style={{ textAlign: "right", padding: "4px 12px", borderRadius: 8, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Margin</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#374151", fontFamily: "monospace" }}>{totalBilling > 0 ? `${Math.round((totalProfit / totalBilling) * 100)}%` : "—"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ PARTNER COMMISSIONS VIEW ══════════ */}
      {view === "commissions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {commissionsByPartner.length === 0 && (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0", fontSize: 13 }}>
              لا توجد فواتير مدفوعة لأي بارتنر في النظام بعد
            </p>
          )}

          {commissionsByPartner.map(({ partnerName, poRows, paid, pending, totalCommissionPaid, totalCommissionPending }) => {
            const hasPending = pending.length > 0;
            const cardKey    = `pcomm-${partnerName}`;
            const paidKey    = `pcomm-paid-${partnerName}`;

            return (
              <div key={partnerName} style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                {/* Partner name divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: M, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 11 }}>
                    {partnerName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>{partnerName}</h3>
                  <div style={{ display: "flex", gap: 10, marginLeft: "auto", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>✓ SR {totalCommissionPaid.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} paid</span>
                    {hasPending && <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>⚠ SR {totalCommissionPending.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} pending</span>}
                  </div>
                </div>

                {/* ── Commissioned invoices (collapsible) ── */}
                {paid.length > 0 && (
                  <div className="fe-card" style={{ overflow: "hidden", border: "1.5px solid #bbf7d0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", backgroundColor: openRows[paidKey] ? "#f0fdf4" : "white" }}>
                      <div onClick={() => toggle(paidKey)} style={{ display:"flex", alignItems:"center", gap:12, flex:1, cursor:"pointer" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                          <Check size={13} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>Commission Paid</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>{paid.length} invoices · SR {totalCommissionPaid.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                        </div>
                        {openRows[paidKey] ? <ChevronDown size={15} style={{ color: "#9ca3af" }}/> : <ChevronRight size={15} style={{ color: "#9ca3af" }}/>}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); exportPaidCSV(partnerName, paid); }}
                        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:700, border:"1px solid #86efac", backgroundColor:"white", color:"#16a34a", cursor:"pointer", flexShrink:0 }}
                      ><FileDown size={12}/> Export</button>
                    </div>
                    {openRows[paidKey] && (() => {
                      // Group paid items by batch
                      const byBatch = new Map();
                      paid.forEach(x => {
                        const b = x.batch || x.inv.partnerCommissionBatch || 'Paid';
                        if (!byBatch.has(b)) byBatch.set(b, []);
                        byBatch.get(b).push(x);
                      });
                      const batchOrder = ['1st Invoice','2nd Invoice','3rd Invoice','4th Invoice','5th Invoice','6th Invoice'];
                      const sortedBatches = [...byBatch.keys()].sort((a,b)=>{
                        const ai=batchOrder.indexOf(a), bi=batchOrder.indexOf(b);
                        return (ai===-1?99:ai)-(bi===-1?99:bi);
                      });
                      return (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ backgroundColor: "#f0fdf4" }}>
                                {[
                                  {label:"Batch",sub:null},
                                  {label:"PO Number",sub:null},
                                  {label:"Invoice #(s)",sub:null},
                                  {label:"Invoiced Amount",sub:"pre-VAT"},
                                  {label:"Rate",sub:"partner %"},
                                  {label:"Commission Paid",sub:"actual amount"},
                                ].map(({label,sub},i)=>(
                                  <th key={i} style={{ padding:"8px 14px", textAlign: i>=3?"right":"left", fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid #86efac", whiteSpace:"nowrap" }}>
                                    {label}{sub && <><br/><span style={{fontWeight:500,color:"#9ca3af",textTransform:"none",letterSpacing:0}}>({sub})</span></>}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sortedBatches.map(batchLabel => {
                                const bItems = byBatch.get(batchLabel);
                                const poMap = new Map();
                                bItems.forEach(x => {
                                  const po = x.inv.poNumber||'—';
                                  if(!poMap.has(po)) poMap.set(po,[]);
                                  poMap.get(po).push(x);
                                });
                                return [...poMap.entries()].map(([po, items], i) => {
                                  const preVat     = items.reduce((s,x)=>s+((x.inv.totalDue||0)-(x.inv.vat||0)),0);
                                  const commission = items.reduce((s,x)=>s+x.commission,0);
                                  // Actual rate = commission ÷ invoiced (derived, not hardcoded)
                                  const ratePct    = preVat > 0 ? (commission / preVat * 100).toFixed(2) + '%' : '—';
                                  return (
                                    <tr key={`${batchLabel}-${po}`} style={{ borderBottom:"1px solid #f9fafb", backgroundColor:"white" }}>
                                      <td style={{ ...tdBase, fontSize:11, fontWeight:i===0?700:400, color:i===0?"#16a34a":"transparent", whiteSpace:"nowrap" }}>{i===0?batchLabel:''}</td>
                                      <td style={{ ...tdBase, fontWeight:800, fontFamily:"monospace", color:"#111827" }}>{po}</td>
                                      <td style={{ ...tdBase, color:"#6b7280", fontSize:11, fontFamily:"monospace" }}>{items.map(x=>x.inv.invoiceNumber).join("  ·  ")}</td>
                                      <td style={{ ...tdBase, textAlign:"right", fontFamily:"monospace", fontWeight:700, color:M }}>{preVat.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                      <td style={{ ...tdBase, textAlign:"right", fontFamily:"monospace", fontWeight:600, color:"#6b7280" }}>{ratePct}</td>
                                      <td style={{ ...tdBase, textAlign:"right", fontFamily:"monospace", fontWeight:700, color:"#16a34a" }}>{commission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                    </tr>
                                  );
                                });
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── Pending commission table ── */}
                {hasPending && (
                  <div className="fe-card" style={{ overflow: "hidden", border: "1.5px solid #fca5a5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", backgroundColor: openRows[cardKey] ? "#fef2f2" : "white" }}>
                      <div onClick={() => toggle(cardKey)} style={{ display:"flex", alignItems:"center", gap:12, flex:1, cursor:"pointer" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                          <AlertCircle size={13} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>Pending Commission</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>{pending.length} invoices collected from client — commission not paid to {partnerName} yet</p>
                        </div>
                        <div style={{ textAlign: "right", marginRight: 8 }}>
                          <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Total Due</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#dc2626", fontFamily: "monospace" }}>SR {totalCommissionPending.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                        </div>
                        {openRows[cardKey] ? <ChevronDown size={15} style={{ color: "#9ca3af" }}/> : <ChevronRight size={15} style={{ color: "#9ca3af" }}/>}
                      </div>
                      {/* ── Export pending ── */}
                      <button
                        onClick={e => { e.stopPropagation(); exportPendingCSV(partnerName, pending); }}
                        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:700, border:"1px solid #fca5a5", backgroundColor:"white", color:"#dc2626", cursor:"pointer", flexShrink:0 }}
                      ><FileDown size={12}/> Export</button>
                      {/* ── Mark all as paid ── */}
                      {showBatchInput[partnerName] ? (
                        <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                          <input
                            autoFocus
                            placeholder="Batch name (e.g. 4th Invoice)"
                            value={batchInputs[partnerName] || ''}
                            onChange={e => setBatchInputs(b=>({...b,[partnerName]:e.target.value}))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && batchInputs[partnerName]?.trim()) {
                                markAllPaid(pending, batchInputs[partnerName]);
                                setShowBatchInput(s=>({...s,[partnerName]:false}));
                                setBatchInputs(b=>({...b,[partnerName]:''}));
                              }
                              if (e.key === 'Escape') setShowBatchInput(s=>({...s,[partnerName]:false}));
                            }}
                            style={{ padding:"4px 8px", borderRadius:7, border:"1.5px solid #86efac", fontSize:11, width:180, outline:"none" }}
                          />
                          <button
                            disabled={!batchInputs[partnerName]?.trim()}
                            onClick={e => {
                              e.stopPropagation();
                              if (!batchInputs[partnerName]?.trim()) return;
                              markAllPaid(pending, batchInputs[partnerName]);
                              setShowBatchInput(s=>({...s,[partnerName]:false}));
                              setBatchInputs(b=>({...b,[partnerName]:''}));
                            }}
                            style={{ padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:700, border:"none", backgroundColor: batchInputs[partnerName]?.trim() ? "#16a34a" : "#d1fae5", color:"white", cursor: batchInputs[partnerName]?.trim() ? "pointer":"default" }}
                          >✓ Confirm</button>
                          <button onClick={e=>{e.stopPropagation();setShowBatchInput(s=>({...s,[partnerName]:false}));}} style={{ padding:"4px 8px", borderRadius:7, fontSize:11, border:"1px solid #e5e7eb", backgroundColor:"white", cursor:"pointer", color:"#6b7280" }}>✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={e=>{e.stopPropagation();setShowBatchInput(s=>({...s,[partnerName]:true}));}}
                          style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:700, border:"1.5px solid #16a34a", backgroundColor:"white", color:"#16a34a", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}
                        >
                          <Check size={11} /> Mark All as Paid
                        </button>
                      )}
                    </div>
                    {openRows[cardKey] && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#fef2f2" }}>
                              {[
                                {label:"PO Number",sub:null},
                                {label:"Invoice #(s)",sub:null},
                                {label:"Invoiced Amount",sub:null},
                                {label:"Fisheye Fees",sub:"6%"},
                                {label:"Commission Due",sub:"8% of 6%"},
                              ].map(({label,sub},i)=>(
                                <th key={i} style={{ padding:"8px 14px", textAlign: i>=2?"right":"left", fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid #fca5a5", whiteSpace:"nowrap" }}>
                                  {label}{sub && <><br/><span style={{fontWeight:500,color:"#9ca3af",textTransform:"none",letterSpacing:0}}>({sub})</span></>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {poRows.filter(r => r.invoices.some(x=>!x.inv.partnerCommissionPaid)).map(({ po, invoices: poInvs }) => {
                              const unpaid      = poInvs.filter(x=>!x.inv.partnerCommissionPaid);
                              if (!unpaid.length) return null;
                              const preVat      = unpaid.reduce((s,x)=>s+((x.inv.totalDue||0)-(x.inv.vat||0)),0);
                              const fisheyeFees = Math.round(preVat*0.06*100)/100;
                              const commission  = unpaid.reduce((s,x)=>s+x.commission,0);
                              return (
                                <tr key={po} style={{ borderBottom: "1px solid #fef2f2", backgroundColor: "white" }}>
                                  <td style={{ ...tdBase, fontWeight: 800, fontFamily: "monospace", color: "#111827" }}>{po}</td>
                                  <td style={{ ...tdBase, color: "#6b7280", fontSize: 11, fontFamily: "monospace" }}>{unpaid.map(x=>x.inv.invoiceNumber).join("  ·  ")}</td>
                                  <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: M }}>{preVat.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                  <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#374151" }}>{fisheyeFees.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                  <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#dc2626" }}>{commission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: "#fee2e2", borderTop: "2px solid #fca5a5" }}>
                              <td colSpan={2} style={{ ...tdBase, fontWeight: 800, color: "#dc2626" }}>{pending.length} invoices pending</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: M }}>{pending.reduce((s,x)=>s+((x.inv.totalDue||0)-(x.inv.vat||0)),0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#374151" }}>{(Math.round(pending.reduce((s,x)=>s+((x.inv.totalDue||0)-(x.inv.vat||0)),0)*0.06*100)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#dc2626" }}>{totalCommissionPending.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}

      {/* ══════════ OPERATIONS VIEW ══════════ */}
      {view === "operations" && <OperationalPartners hideKpis={true} />}
    </div>
  );
}