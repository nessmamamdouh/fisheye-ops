import React, { useState, useMemo, useEffect } from "react";
import { supabase } from './utils/supabase';
import { upsertInvoices } from './utils/invoiceSync';
import {
  ChevronDown, ChevronRight, Check, FileDown, AlertCircle, Send, Undo2,
} from "lucide-react";


// Normalize PO number: uppercase + strip trailing _N suffix
const normPO = po => String(po || '').trim().toUpperCase().replace(/_\d+$/, '');

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
  {
    id: 'bc4', label: '4th Invoice', totalInvoiced: 6008531.89, totalFisheye: 360511.93, totalBC: 28840.86,
    rows: [
      { po:'PO-34866', invNums:['2301375','2301307','2301252','2301440','2301441','2301442','2301443','2301444','2301445','2301446','2301447'], invoicedAmt:144221.59, bcFee:692.22 },
      { po:'PO-34954', invNums:['2301377','2301309','2301254'], invoicedAmt:101919.93, bcFee:489.21 },
      { po:'PO-32100', invNums:['2301281','2301196','2300970','2300969','2301080'], invoicedAmt:77781, bcFee:373.36 },
      { po:'PO-32679', invNums:['2301282','2301199','2301083'], invoicedAmt:76528.8, bcFee:367.35 },
      { po:'PO-33426', invNums:['2301284','2301208','2301119'], invoicedAmt:189690, bcFee:910.5 },
      { po:'PO-33273', invNums:['2301285','2301209','2301121'], invoicedAmt:149724.93, bcFee:718.68 },
      { po:'PO-33669', invNums:['2301286'], invoicedAmt:66780, bcFee:320.54 },
      { po:'PO-33756', invNums:['2301287','2301215','2301146','2301147'], invoicedAmt:42400, bcFee:203.52 },
      { po:'PO-32652', invNums:['2301288','2301216','2301148'], invoicedAmt:48600, bcFee:233.28 },
      { po:'PO-34026', invNums:['2301289','2301217','2301151'], invoicedAmt:95880, bcFee:460.23 },
      { po:'PO-34426', invNums:['2301292','2301222'], invoicedAmt:93792, bcFee:450.2 },
      { po:'PO-34680', invNums:['2301294','2301225'], invoicedAmt:30240, bcFee:145.16 },
      { po:'PO-34611', invNums:['2301295'], invoicedAmt:47700, bcFee:228.96 },
      { po:'PO-34596', invNums:['2301296'], invoicedAmt:24380, bcFee:117.02 },
      { po:'PO-34469', invNums:['2301297','2301228'], invoicedAmt:33920, bcFee:162.82 },
      { po:'PO-34279', invNums:['2301298','2301229'], invoicedAmt:33920, bcFee:162.82 },
      { po:'PO-34663', invNums:['2301299','2301231'], invoicedAmt:124886.66, bcFee:599.46 },
      { po:'PO-34579', invNums:['2301300'], invoicedAmt:22420, bcFee:107.62 },
      { po:'PO-34319', invNums:['2301302','2301240'], invoicedAmt:43520, bcFee:208.9 },
      { po:'PO-34317', invNums:['2301303','2301241'], invoicedAmt:21200, bcFee:101.76 },
      { po:'PO-34979', invNums:['2301304'], invoicedAmt:31800, bcFee:152.64 },
      { po:'PO-34986', invNums:['2301305','2301250'], invoicedAmt:21200, bcFee:101.76 },
      { po:'PO-34765', invNums:['2301306','2301251'], invoicedAmt:27880, bcFee:133.82 },
      { po:'PO-34931', invNums:['2301308','2301253'], invoicedAmt:21200, bcFee:101.76 },
      { po:'PO-34769', invNums:['2301310','2301255'], invoicedAmt:21200, bcFee:101.76 },
      { po:'PO-34775', invNums:['2301311','2301256'], invoicedAmt:24200, bcFee:116.16 },
      { po:'PO-34781', invNums:['2301312'], invoicedAmt:15280, bcFee:73.34 },
      { po:'PO-34993', invNums:['2301313','2301258'], invoicedAmt:34240, bcFee:164.36 },
      { po:'PO-35140', invNums:['2301331'], invoicedAmt:46219.08, bcFee:221.85 },
      { po:'PO-35067', invNums:['2301332'], invoicedAmt:12720, bcFee:61.06 },
      { po:'PO-35125', invNums:['2301333'], invoicedAmt:27880, bcFee:133.82 },
      { po:'PO-35123', invNums:['2301334'], invoicedAmt:5460, bcFee:26.21 },
      { po:'PO-35079', invNums:['2301335'], invoicedAmt:29840, bcFee:143.23 },
      { po:'PO-35071', invNums:['2301336','2301342'], invoicedAmt:162180, bcFee:778.46 },
      { po:'PO-35055', invNums:['2301337','2301341'], invoicedAmt:31800, bcFee:152.64 },
      { po:'PO-35056', invNums:['2301338','2301339'], invoicedAmt:102212, bcFee:490.62 },
      { po:'PO-33444', invNums:['2301237'], invoicedAmt:47453.32, bcFee:227.78 },
      { po:'PO-34243', invNums:['2301236'], invoicedAmt:6520, bcFee:31.3 },
      { po:'PO-34425', invNums:['2301235'], invoicedAmt:10600, bcFee:50.88 },
      { po:'PO-34497', invNums:['2301233'], invoicedAmt:57240, bcFee:274.75 },
      { po:'PO-34508', invNums:['2301224','2301293'], invoicedAmt:31800, bcFee:152.64 },
      { po:'PO-34032', invNums:['2301219'], invoicedAmt:14840, bcFee:71.23 },
      { po:'PO-34149', invNums:['2301218','2301152','2301153'], invoicedAmt:57240, bcFee:274.74 },
      { po:'PO-33448', invNums:['2301206','2301117'], invoicedAmt:191120, bcFee:917.38 },
      { po:'PO-32408', invNums:['2301197','2301013','2301081'], invoicedAmt:79500, bcFee:381.6 },
      { po:'PO-32782', invNums:['2301198','2301082','2301015','2301143'], invoicedAmt:249562, bcFee:1197.88 },
      { po:'PO-32895', invNums:['2301200','2301020','2301086'], invoicedAmt:470794.62, bcFee:2259.81 },
      { po:'PO-33181', invNums:['2301202','2301054','2301088'], invoicedAmt:247621.32, bcFee:1188.57 },
      { po:'PO-33179', invNums:['2301203','2301055','2301089'], invoicedAmt:44520, bcFee:213.69 },
      { po:'PO-33371', invNums:['2301204','2301115'], invoicedAmt:539810, bcFee:2591.08 },
      { po:'PO-33812', invNums:['2301205','2301116'], invoicedAmt:40280, bcFee:193.34 },
      { po:'PO-33899', invNums:['2301136'], invoicedAmt:14167.33, bcFee:68 },
      { po:'PO-33857', invNums:['2301132'], invoicedAmt:15900, bcFee:76.32 },
      { po:'PO-34125', invNums:['2301149'], invoicedAmt:9540, bcFee:45.79 },
      { po:'PO-34156', invNums:['2301150'], invoicedAmt:102820, bcFee:493.54 },
      { po:'PO-34034', invNums:['2301154'], invoicedAmt:444387.71, bcFee:2133.06 },
      { po:'PO-30940', invNums:['2300854','2300931'], invoicedAmt:112219.13, bcFee:538.65 },
      { po:'PO-31391', invNums:['2300937','2301079'], invoicedAmt:43366.66, bcFee:208.16 },
      { po:'PO-32287', invNums:['2300974','2301009'], invoicedAmt:115916.49, bcFee:556.4 },
      { po:'PO-32490', invNums:['2301012'], invoicedAmt:21200, bcFee:101.76 },
      { po:'PO-32807', invNums:['2301017','2301084'], invoicedAmt:85944, bcFee:412.54 },
      { po:'PO-32489', invNums:['2301018','2301085'], invoicedAmt:21200, bcFee:101.76 },
      { po:'PO-32488', invNums:['2301019'], invoicedAmt:9540, bcFee:45.79 },
      { po:'PO-32762', invNums:['2301021'], invoicedAmt:377360, bcFee:1811.33 },
      { po:'PO-31910', invNums:['2301023'], invoicedAmt:19080, bcFee:91.58 },
      { po:'PO-33077', invNums:['2301056','2301090'], invoicedAmt:111229.32, bcFee:533.9 },
      { po:'PO-29453', invNums:['2300788'], invoicedAmt:56180, bcFee:269.66 },
      { po:'PO-31371', invNums:['2301005'], invoicedAmt:8480, bcFee:40.7 },
      { po:'PO-30954', invNums:['2301004'], invoicedAmt:7420, bcFee:35.62 },
      { po:'PO-33025', invNums:['2301066'], invoicedAmt:16150, bcFee:77.52 },
      { po:'PO-31306', invNums:['2301007'], invoicedAmt:31692, bcFee:152.12 },
      { po:'PO-31665', invNums:['2301006'], invoicedAmt:93982, bcFee:451.11 },
      { po:'PO-33376', invNums:['2301114'], invoicedAmt:15280, bcFee:73.34 },
      { po:'PO-33450', invNums:['2301118'], invoicedAmt:15900, bcFee:76.32 },
      { po:'PO-33382', invNums:['2301120'], invoicedAmt:77380, bcFee:371.42 },
      { po:'PO-29491', invNums:['2300743'], invoicedAmt:8480, bcFee:40.7 },
    ],
  },
];

// BC_PO_SET includes POs from the 3 paid batches only.
// Commission for new batches is calculated dynamically at 0.48% of pre-VAT.
const BC_PO_SET = new Set(
  BC_BATCHES.flatMap(b => b.rows.map(r => normPO(r.po)))
);

// All invoice numbers already commissioned in the 3 paid batches
const BC_COMMISSIONED_INVS = new Set(
  BC_BATCHES.flatMap(b => b.rows.flatMap(r => r.invNums.map(n => String(n).trim())))
);

// Map: invoice number → batch label (e.g. '1st Invoice')
const BC_INV_TO_BATCH = new Map(
  BC_BATCHES.flatMap(b => b.rows.flatMap(r => r.invNums.map(n => [String(n).trim(), b.label])))
);

// Lookup: PO → fisheye fee rate (for commission estimation on new invoices)
const BC_PO_RATE = new Map();
BC_BATCHES.forEach(b => b.rows.forEach(r => {
  // derive rate from bcFee / invoicedAmt = fisheyeRate * 0.08
  if (!BC_PO_RATE.has(normPO(r.po))) {
    const fisheyeRate = r.bcFee / r.invoicedAmt / 0.08;
    BC_PO_RATE.set(normPO(r.po), Math.round(fisheyeRate * 100) / 100);
  }
}));

const M = "#A02843";
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtSAR = n => n ? `SR ${Number(n).toLocaleString()}` : "SR 0";

// Pre-VAT helper: handles cases where vat is null/0 (e.g. lost during Supabase sync)
// Priority: use vat if valid → derive from amountPreVat → reverse-calc 15% VAT from totalDue
const getPreVat = inv => {
  const total = inv.totalDue || 0;
  if (inv.vat != null && inv.vat > 0) return total - inv.vat;
  if (inv.amountPreVat != null && inv.amountPreVat > 0) return inv.amountPreVat;
  return Math.round(total * (100 / 115) * 100) / 100;
};

// Tri-state commission status: 'unpaid' | 'sent' (sent for payment) | 'paid'
// Falls back to the legacy boolean field for invoices written before this field existed.
const getCommissionStatus = inv =>
  inv.partnerCommissionStatus || (inv.partnerCommissionPaid ? 'paid' : 'unpaid');

// ── mirrors App.jsx calcProfit exactly ───────────────────────────────────────
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

export default function PartnerSettlementReport({ employees = [] }) {
  const [openRows, setOpenRows] = useState({});
  const [invoiceVersion, setInvoiceVersion] = useState(0);
  const [batchInputs,   setBatchInputs]   = useState({}); // {partnerName: string}
  const [showBatchInput, setShowBatchInput] = useState({}); // {partnerName: bool}
  const [batchActionType, setBatchActionType] = useState({}); // {partnerName: 'sent' | 'paid'}

  // ── Push a set of invoices back to Supabase (chunked upsert) ──────────────
  // NOTE: previously commission-paid marks made in this view were only ever
  // written to localStorage. On the next load, the Supabase fetch below would
  // overwrite localStorage with the (unchanged) server copy, silently
  // reverting anything marked here. Every write path in this file now also
  // upserts to Supabase, mirroring the pattern already used in invoiceManager.jsx.
  // Resilient upsert (see utils/invoiceSync.js) — if a field like
  // partnerCommissionStatus doesn't exist as a column yet, it strips that
  // field and retries instead of silently dropping the whole save.
  const persistInvoicesToSupabase = (rows) => upsertInvoices(rows);

  // ── Apply the Blue Cube hardcoded-batch migration to a given invoice list ──
  const applyBcMigration = (invs) => {
    let changed = false;
    const updated = invs.map(inv => {
      const invNum = String(inv.invoiceNumber || '').trim();
      const bcBatch = BC_INV_TO_BATCH.get(invNum);
      const needsPaid  = getCommissionStatus(inv) !== 'paid' && BC_COMMISSIONED_INVS.has(invNum);
      const needsBatch = bcBatch && inv.partnerCommissionBatch !== bcBatch;
      if (needsPaid || needsBatch) {
        changed = true;
        return {
          ...inv,
          partnerCommissionPaid:  needsPaid ? true : inv.partnerCommissionPaid,
          partnerCommissionStatus: needsPaid ? 'paid' : (inv.partnerCommissionStatus || (inv.partnerCommissionPaid ? 'paid' : undefined)),
          partnerCommissionBatch: bcBatch || inv.partnerCommissionBatch,
        };
      }
      return inv;
    });
    return { updated, changed };
  };

  // ── Load invoices from Supabase on mount, then re-apply BC migration ──────
  // Merges in any local-only rows the server doesn't have yet (instead of
  // blindly overwriting with server data) so a refresh can never wipe out a
  // save whose background upsert hadn't finished — or had silently failed.
  useEffect(() => {
    const STORAGE_KEY = 'fisheye_invoices_v1';
    supabase.from('fisheye_invoices').select('*').then(({ data, error }) => {
      const serverList = (!error && data) ? data : [];
      let localList = [];
      try { localList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (_) {}

      const serverIds = new Set(serverList.map(inv => inv.id));
      const localOnly = localList.filter(inv => inv.id && !serverIds.has(inv.id));
      const base = serverList.length > 0 || localOnly.length > 0 ? [...serverList, ...localOnly] : localList;

      const { updated, changed } = applyBcMigration(base);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setInvoiceVersion(v => v + 1);
      // Persist migration results + any unsynced local-only rows back to Supabase
      if (changed || localOnly.length > 0) {
        const changedIds = new Set([
          ...updated.filter((inv, idx) => JSON.stringify(inv) !== JSON.stringify(base[idx])).map(inv => inv.id),
          ...localOnly.map(inv => inv.id),
        ]);
        persistInvoicesToSupabase(updated.filter(inv => changedIds.has(inv.id)));
      }
    });
  }, []); // runs once on mount

  // ── Move a batch of items to a new commission status (unpaid → sent → paid) ──
  // Writes to localStorage AND Supabase so the change survives reloads / other devices.
  const updateCommissionStatus = (items, status, batchLabel) => {
    const STORAGE_KEY = 'fisheye_invoices_v1';
    const ids = new Set(items.map(x => x.inv.id));
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = all.map(inv =>
        ids.has(inv.id)
          ? {
              ...inv,
              partnerCommissionStatus: status,
              partnerCommissionPaid: status === 'paid',
              partnerCommissionBatch: batchLabel != null ? (batchLabel.trim() || inv.partnerCommissionBatch || 'New Batch') : inv.partnerCommissionBatch,
            }
          : inv
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setInvoiceVersion(v => v + 1);
      persistInvoicesToSupabase(updated.filter(inv => ids.has(inv.id)));
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
          const preVat     = items.reduce((s,x)=>s+(getPreVat(x.inv)),0);
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
      const preVat     = items.reduce((s,x)=>s+(getPreVat(x.inv)),0);
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
      // Calculate dynamically: partnerCost% of pre-VAT invoice amount
      const base = getPreVat(inv);
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

      const paid    = items.filter(x => getCommissionStatus(x.inv) === 'paid');
      const sent    = items.filter(x => getCommissionStatus(x.inv) === 'sent');
      const pending = items.filter(x => getCommissionStatus(x.inv) === 'unpaid');
      const totalCommissionPaid    = paid.reduce((s, x) => s + x.commission, 0);
      const totalCommissionSent    = sent.reduce((s, x) => s + x.commission, 0);
      const totalCommissionPending = pending.reduce((s, x) => s + x.commission, 0);

      return { partnerName, poRows, paid, sent, pending, totalCommissionPaid, totalCommissionSent, totalCommissionPending };
    }).sort((a, b) => b.pending.length - a.pending.length); // partners with pending first
  }, [allInvoices, employees]);

  const totalPendingCommission = commissionsByPartner.reduce((s, p) => s + p.totalCommissionPending, 0);
  const totalSentCommission    = commissionsByPartner.reduce((s, p) => s + p.totalCommissionSent, 0);
  const totalPaidCommission    = commissionsByPartner.reduce((s, p) => s + p.totalCommissionPaid,    0);


  const toggle = key => setOpenRows(r => ({ ...r, [key]: !r[key] }));

  const rowStyle = { borderBottom: "1px solid #f3f4f6", backgroundColor: "white" };
  const tdBase   = { padding: "11px 14px", fontSize: 12 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <Stat label="Pending Commission" value={`SR ${totalPendingCommission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub={`${commissionsByPartner.reduce((s,p)=>s+p.pending.length,0)} invoices unpaid`} color="#dc2626" accent="#dc2626" bg="#fef2f2" border="#fca5a5" />
          <Stat label="Sent for Payment"   value={`SR ${totalSentCommission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}    sub={`${commissionsByPartner.reduce((s,p)=>s+p.sent.length,0)} invoices sent`}       color="#d97706" accent="#d97706" bg="#fffbeb" border="#fcd34d" />
          <Stat label="Paid Commission"    value={`SR ${totalPaidCommission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}    sub={`${commissionsByPartner.reduce((s,p)=>s+p.paid.length,0)} invoices paid`}     color="#059669" accent="#059669" bg="#f0fdf4" border="#bbf7d0" />
          <Stat label="Partners"           value={commissionsByPartner.filter(p=>p.pending.length>0).length} sub={`of ${commissionsByPartner.length} have pending`}                                                                                    color={commissionsByPartner.some(p=>p.pending.length>0) ? "#dc2626" : "#059669"} accent="#7c3aed" bg="#faf5ff" border="#ddd6fe" />
        </div>
      {/* ══════════ PARTNER COMMISSIONS VIEW ══════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {commissionsByPartner.length === 0 && (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0", fontSize: 13 }}>
              لا توجد فواتير مدفوعة لأي بارتنر في النظام بعد
            </p>
          )}

          {commissionsByPartner.map(({ partnerName, poRows, paid, sent, pending, totalCommissionPaid, totalCommissionSent, totalCommissionPending }) => {
            const hasSent    = sent.length > 0;
            const hasPending = pending.length > 0;
            const cardKey    = `pcomm-${partnerName}`;
            const sentKey    = `pcomm-sent-${partnerName}`;
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
                    {hasSent && <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>📤 SR {totalCommissionSent.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} sent</span>}
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
                                  const preVat     = items.reduce((s,x)=>s+(getPreVat(x.inv)),0);
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

                {/* ── Sent for payment (collapsible) ── */}
                {hasSent && (
                  <div className="fe-card" style={{ overflow: "hidden", border: "1.5px solid #fcd34d" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", backgroundColor: openRows[sentKey] ? "#fffbeb" : "white" }}>
                      <div onClick={() => toggle(sentKey)} style={{ display:"flex", alignItems:"center", gap:12, flex:1, cursor:"pointer" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                          <Send size={13} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>Sent for Payment</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>{sent.length} invoices · SR {totalCommissionSent.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} · awaiting confirmation from {partnerName}</p>
                        </div>
                        {openRows[sentKey] ? <ChevronDown size={15} style={{ color: "#9ca3af" }}/> : <ChevronRight size={15} style={{ color: "#9ca3af" }}/>}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); exportPendingCSV(partnerName, sent); }}
                        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:700, border:"1px solid #fcd34d", backgroundColor:"white", color:"#d97706", cursor:"pointer", flexShrink:0 }}
                      ><FileDown size={12}/> Export</button>
                      <button
                        onClick={e => { e.stopPropagation(); updateCommissionStatus(sent, 'unpaid', null); }}
                        title="Move back to Pending"
                        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:700, border:"1px solid #e5e7eb", backgroundColor:"white", color:"#6b7280", cursor:"pointer", flexShrink:0 }}
                      ><Undo2 size={12}/> Revert</button>
                      <button
                        onClick={e => { e.stopPropagation(); updateCommissionStatus(sent, 'paid', null); }}
                        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:700, border:"none", backgroundColor:"#16a34a", color:"white", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}
                      ><Check size={11} /> Confirm Paid</button>
                    </div>
                    {openRows[sentKey] && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#fffbeb" }}>
                              {[
                                {label:"PO Number",sub:null},
                                {label:"Invoice #(s)",sub:null},
                                {label:"Invoiced Amount",sub:null},
                                {label:"Fisheye Fees",sub:"6%"},
                                {label:"Commission",sub:"sent for payment"},
                              ].map(({label,sub},i)=>(
                                <th key={i} style={{ padding:"8px 14px", textAlign: i>=2?"right":"left", fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid #fcd34d", whiteSpace:"nowrap" }}>
                                  {label}{sub && <><br/><span style={{fontWeight:500,color:"#9ca3af",textTransform:"none",letterSpacing:0}}>({sub})</span></>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {poRows.filter(r => r.invoices.some(x=>getCommissionStatus(x.inv)==='sent')).map(({ po, invoices: poInvs }) => {
                              const items       = poInvs.filter(x=>getCommissionStatus(x.inv)==='sent');
                              if (!items.length) return null;
                              const preVat      = items.reduce((s,x)=>s+(getPreVat(x.inv)),0);
                              const fisheyeFees = Math.round(preVat*0.06*100)/100;
                              const commission  = items.reduce((s,x)=>s+x.commission,0);
                              return (
                                <tr key={po} style={{ borderBottom: "1px solid #fffbeb", backgroundColor: "white" }}>
                                  <td style={{ ...tdBase, fontWeight: 800, fontFamily: "monospace", color: "#111827" }}>{po}</td>
                                  <td style={{ ...tdBase, color: "#6b7280", fontSize: 11, fontFamily: "monospace" }}>{items.map(x=>x.inv.invoiceNumber).join("  ·  ")}</td>
                                  <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: M }}>{preVat.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                  <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#374151" }}>{fisheyeFees.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                  <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#d97706" }}>{commission.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: "#fef3c7", borderTop: "2px solid #fcd34d" }}>
                              <td colSpan={2} style={{ ...tdBase, fontWeight: 800, color: "#d97706" }}>{sent.length} invoices sent</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: M }}>{sent.reduce((s,x)=>s+(getPreVat(x.inv)),0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#374151" }}>{(Math.round(sent.reduce((s,x)=>s+(getPreVat(x.inv)),0)*0.06*100)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#d97706" }}>{totalCommissionSent.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
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
                      {/* ── Send for payment (→ sent) or mark paid directly ── */}
                      {showBatchInput[partnerName] ? (
                        <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                          <input
                            autoFocus
                            placeholder="Batch name (e.g. 5th Invoice)"
                            value={batchInputs[partnerName] || ''}
                            onChange={e => setBatchInputs(b=>({...b,[partnerName]:e.target.value}))}
                            onKeyDown={e => {
                              const targetStatus = batchActionType[partnerName] || 'sent';
                              if (e.key === 'Enter' && batchInputs[partnerName]?.trim()) {
                                updateCommissionStatus(pending, targetStatus, batchInputs[partnerName]);
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
                              updateCommissionStatus(pending, batchActionType[partnerName] || 'sent', batchInputs[partnerName]);
                              setShowBatchInput(s=>({...s,[partnerName]:false}));
                              setBatchInputs(b=>({...b,[partnerName]:''}));
                            }}
                            style={{ padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:700, border:"none", backgroundColor: batchInputs[partnerName]?.trim() ? "#16a34a" : "#d1fae5", color:"white", cursor: batchInputs[partnerName]?.trim() ? "pointer":"default" }}
                          >✓ Confirm</button>
                          <button onClick={e=>{e.stopPropagation();setShowBatchInput(s=>({...s,[partnerName]:false}));}} style={{ padding:"4px 8px", borderRadius:7, fontSize:11, border:"1px solid #e5e7eb", backgroundColor:"white", cursor:"pointer", color:"#6b7280" }}>✕</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={e=>{e.stopPropagation();setBatchActionType(t=>({...t,[partnerName]:'sent'}));setShowBatchInput(s=>({...s,[partnerName]:true}));}}
                            style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:700, border:"1.5px solid #d97706", backgroundColor:"white", color:"#d97706", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}
                          >
                            <Send size={11} /> Mark as Sent for Payment
                          </button>
                          <button
                            onClick={e=>{e.stopPropagation();setBatchActionType(t=>({...t,[partnerName]:'paid'}));setShowBatchInput(s=>({...s,[partnerName]:true}));}}
                            style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:700, border:"1.5px solid #16a34a", backgroundColor:"white", color:"#16a34a", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}
                          >
                            <Check size={11} /> Mark Paid
                          </button>
                        </>
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
                            {poRows.filter(r => r.invoices.some(x=>getCommissionStatus(x.inv)==='unpaid')).map(({ po, invoices: poInvs }) => {
                              const unpaid      = poInvs.filter(x=>getCommissionStatus(x.inv)==='unpaid');
                              if (!unpaid.length) return null;
                              const preVat      = unpaid.reduce((s,x)=>s+(getPreVat(x.inv)),0);
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
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: M }}>{pending.reduce((s,x)=>s+(getPreVat(x.inv)),0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                              <td style={{ ...tdBase, textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#374151" }}>{(Math.round(pending.reduce((s,x)=>s+(getPreVat(x.inv)),0)*0.06*100)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
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
    </div>
  );
}