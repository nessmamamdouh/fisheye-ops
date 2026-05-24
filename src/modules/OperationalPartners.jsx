import React, { useState, useMemo, useRef } from 'react';
import {
  Check, AlertCircle, FileDown, Plus, X,
  ChevronDown, ChevronRight, RefreshCw, Trash2, Upload,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
const OP_KEY = 'fisheye_op_invoices_v1';
const M = '#800000';
const tdBase = { padding: '10px 14px', fontSize: 12 };

const PARTNERS = {
  Emdad: {
    label: 'إمداد — Emdad',
    color: '#0891b2', bg: '#e0f2fe', border: '#7dd3fc',
    hasGuarantee: false,
  },
  Safwat: {
    label: 'صفوة الخليج — Safwat',
    color: '#7c3aed', bg: '#f3e8ff', border: '#c4b5fd',
    hasGuarantee: true,
  },
};

const INVOICE_TYPES = [
  { value: 'cost_service', label: 'Cost Service (نقل رعاية / إقامة)' },
  { value: 'monthly',      label: 'Monthly Invoice (شهري)'           },
  { value: 'guarantee',    label: 'Guarantee ضمان'                   },
];

const SERVICE_TYPES = [
  { value: 'sponsorship_transfer', label: 'Sponsorship Transfer — نقل رعاية',    defaultVat: '0'    },
  { value: 'iqama_renewal',        label: 'Iqama Renewal — تجديد إقامة',           defaultVat: '0'    },
  { value: 'salary',               label: 'Salary / Wages — رواتب وأجور',          defaultVat: '0'    },
  { value: 'actual_charges',       label: 'Actual Charges — رسوم فعلية',            defaultVat: '0'    },
  { value: 'service_fee_monthly',  label: 'Monthly Service Fee — رسوم خدمة شهرية', defaultVat: '0.15' },
  { value: 'other_fees',           label: 'Other Fees — رسوم أخرى',                defaultVat: '0.15' },
  { value: 'guarantee',            label: 'Guarantee — ضمان',                      defaultVat: '0'    },
];

const EMPTY_LINE   = { employeeName: '', employeeId: '', serviceType: 'salary', amount: '', vatRate: '0' };
const MONTHLY_LINE = { employeeName: '', employeeId: '', serviceType: 'monthly', salaryAmount: '', serviceFeeAmount: '' };
const EMPTY_FORM   = {
  partner: 'Emdad', invoiceNumber: '', invoiceDate: '',
  period: '', invoiceType: 'cost_service', contractNo: '',
  lineItems: [{ ...EMPTY_LINE }],
};

const fmt    = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtSAR = n => `SR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
const esc    = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

// ══════════════════════════════════════════════════════════════════════════════
// PDF EXTRACTION — shared helpers (same approach as invoiceManager.jsx)
// ══════════════════════════════════════════════════════════════════════════════

let pdfJsPromise = null;
function loadPDFjs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(s);
  });
  return pdfJsPromise;
}

async function extractPDFText(pdfjsLib, file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const allLines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc   = await page.getTextContent();
    const lineMap = new Map();
    for (const item of tc.items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], str: item.str });
    }
    const ys = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const line = lineMap.get(y)
        .sort((a, b) => a.x - b.x)
        .map(i => i.str)
        .join(' ')
        .trim();
      if (line) allLines.push(line);
    }
  }
  return allLines.join('\n');
}

// ── Operational PDF parser ────────────────────────────────────────────────────
function parseOperationalPDF(text, filename) {
  const t = text.replace(/[ \t]+/g, ' ');

  // ── Normalise slashes: "10 / 05 / 2026" → "10/05/2026" ─────────────────────
  const tD = t.replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');

  // ── Detect partner ──────────────────────────────────────────────────────────
  const isEmdad  = /301166178700003|EMDAD|إمداد|emdadhr|EMDADHuman|BS00000921|PRO-?\d/i.test(t);
  const isSafwat = /311087408800003|SafwatAlKhaleej|Safwat\s*Al[\s\-]*Khaleej|صفوة.*الخليج|SK\d{3,}|B2B\d|GU-?\d/i.test(t);
  const partner  = isEmdad ? 'Emdad' : isSafwat ? 'Safwat' : '';

  // ── Invoice number ──────────────────────────────────────────────────────────
  // Normalize spaces around dash: "PRO - 016838" → "PRO-016838"
  const tInv = tD.replace(/\b(PRO|B2B|GU)\s*-\s*(\d)/gi, '$1-$2');
  const invMatch = tInv.match(/((?:PRO|B2B|GU)-\d+)/i);
  const invoiceNumber = invMatch
    ? invMatch[1].toUpperCase()
    : (filename ? filename.replace(/\.pdf$/i, '') : '');

  // ── Invoice type ────────────────────────────────────────────────────────────
  const isGuarantee = /Invoice\s*Type\s+Gu[ar]+ante[e]?|^Guarantee\s*-/im.test(t);
  const isMonthly   = /monthly\s+Invoice|Invoice\s*Type\s+.*[Mm]onthly|[Mm]onthly\s*Invoice|Monthly\s*Services?\s*Charges?/i.test(t);
  const invoiceType = isGuarantee ? 'guarantee' : isMonthly ? 'monthly' : 'cost_service';

  // ── Invoice date ────────────────────────────────────────────────────────────
  let invoiceDate = '';
  const tryDate = raw => {
    if (!raw) return false;
    // Remove any remaining spaces around slashes just in case
    const clean = raw.replace(/\s*\/\s*/g, '/');
    let d;
    if (/^\d{4}\//.test(clean)) d = new Date(clean.replace(/\//g, '-'));
    else { const [dd, mm, yyyy] = clean.split('/'); d = new Date(`${yyyy}-${mm}-${dd}`); }
    if (!isNaN(d.getTime())) { invoiceDate = d.toISOString().split('T')[0]; return true; }
    return false;
  };
  const datePatterns = [
    /Invoice\s*Date\s*:?\s*(\d{4}\/\d{2}\/\d{2})/i,
    /Invoice\s*Date\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
    /Date\.\s*(\d{2}\/\d{2}\/\d{4})/i,
    /Due\s*Date\s*[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /Due\s*Date\s*[:\s]+(\d{4}\/\d{2}\/\d{2})/i,
    /(\d{4}\/\d{2}\/\d{2})\s+Invoice\s*Date/i,
    /(\d{2}\/\d{2}\/\d{4})\s+(?:Invoice\s*Date|Due\s*Date)/i,
  ];
  // Use tD (slash-normalised) for date matching
  for (const re of datePatterns) {
    const m = tD.match(re);
    if (m && tryDate(m[1])) break;
  }
  // Catch-all: first YYYY/MM/DD
  if (!invoiceDate) { const m = tD.match(/\b(\d{4}\/\d{2}\/\d{2})\b/); if (m) tryDate(m[1]); }
  // Catch-all: first DD/MM/YYYY
  if (!invoiceDate) { const m = tD.match(/\b(\d{2}\/\d{2}\/\d{4})\b/); if (m) tryDate(m[1]); }

  // ── Period ──────────────────────────────────────────────────────────────────
  let period = '';
  const monthPeriod = t.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s*[\/\s]?\s*(\d{4})\b/i);
  if (monthPeriod) {
    period = `${monthPeriod[1].charAt(0).toUpperCase() + monthPeriod[1].slice(1).toLowerCase()} ${monthPeriod[2]}`;
  }
  // Derive period from invoice date if not found in text
  if (!period && invoiceDate) {
    const pd = new Date(invoiceDate);
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    period = `${MONTHS[pd.getMonth()]} ${pd.getFullYear()}`;
  }

  // ── Contract number ─────────────────────────────────────────────────────────
  // Emdad: "37 - COST - PLUS - 2026/C" → normalise spaces around dashes
  const tContract = t.replace(/\s*-\s*/g, '-');
  const contractMatch =
    tContract.match(/(\d{2,4}-COST-[A-Z]+-\d{4}\/[A-Z])/i)   // Emdad format
    || t.match(/Contract\s*no\.?\s+([A-Z0-9\/\-]+)/i)          // generic
    || tD.match(/\b(SK\d{4,})\b/i);                            // Safwat fallback
  const contractNo = contractMatch ? contractMatch[1] : '';

  // ── Line items ──────────────────────────────────────────────────────────────
  let lineItems = [];

  if (invoiceType === 'monthly' && isSafwat) {
    // PDF places names on SEPARATE lines from the data row:
    //   "MOATAZ ELSAYED"              ← name-only line
    //   "2 11588 01/05/2026 ..."      ← data line (no name)
    //   "ABDULKHALEK MOUSA"           ← name continuation
    // Exception: first employee sometimes has name on the data line.
    const lines = t.split('\n').map(raw =>
      raw
        .replace(/(\d)\s*,\s*(\d)/g, '$1$2')
        .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
        .replace(/(\d)\s*\/\s*(\d)/g, '$1/$2')
        .replace(/\s+/g, ' ').trim()
    );
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Case A: serial + empID + NAME + date (all on same line — usually first employee)
      const mA = line.match(/^(\d{1,2})\s+(\d{5,6})\s+([A-Z][A-Z\s\-]+?)\s+(\d{2}\/\d{2}\/\d{4})/);
      // Case B: serial + empID + date immediately (name is on previous line)
      const mB = !mA ? line.match(/^(\d{1,2})\s+(\d{5,6})\s+(\d{2}\/\d{2}\/\d{4})/) : null;
      if (!mA && !mB) continue;
      const empId   = mA ? mA[2] : mB[2];
      let   empName = mA ? mA[3].trim() : '';
      // For case B: look back for an all-caps name line
      if (mB) {
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const prev = lines[j];
          if (prev && /^[A-Z][A-Z\s\-]+$/.test(prev)) {
            empName = prev.trim();
            break;
          }
        }
      }
      // Extract decimal numbers from the rest of the line (after matched prefix)
      const rest = line.slice((mA || mB)[0].length);
      const nums  = [...rest.matchAll(/(\d+\.\d+)/g)].map(n => parseFloat(n[1]));
      // Layout: [skip 2nd date] [0]=totalDays.xx [1]=0.00 [2]=netSalary [3]=serviceFee ...
      if (nums.length >= 4) {
        lineItems.push({
          employeeId:       empId,
          employeeName:     empName || empId,
          serviceType:      'monthly',
          salaryAmount:     String(nums[2] || 0),
          serviceFeeAmount: String(nums[3] || 0),
        });
      }
    }

  } else if (invoiceType === 'monthly' && isEmdad) {
    // Cost-category rows — PDF may have spaces inside labels and numbers
    // e.g. "Salaries and Wages" or "SalariesandWages", amounts "28 , 300 . 03"
    const tFE = t
      .replace(/(\d)\s*,\s*(\d)/g, '$1$2')
      .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');
    // Format: "EnglishLabel ArabicText Amount VAT% AmountAfterVAT"
    // e.g. "Monthly Services Charges شهرية خدمة رسوم 480.00 15 % 552.00"
    // [^0-9\n]* skips the Arabic text between label and first digit
    const cats = [
      { re: /Salaries\s*(?:and\s*)?Wages[^0-9\n]*([\d.,]+)\s+0\s*%/i,            name: 'Salaries & Wages',   type: 'salary',              isVat: false },
      { re: /Actual\s*Charges[^0-9\n]*([\d.,]+)\s+0\s*%/i,                         name: 'Actual Charges',      type: 'actual_charges',      isVat: false },
      { re: /Monthly\s*Services?\s*(?:Fee|Charges?)[^0-9\n]*([\d.,]+)\s+15\s*%/i, name: 'Monthly Service Fee', type: 'service_fee_monthly', isVat: true  },
      { re: /Other\s*Fees[^0-9\n]*([\d.,]+)\s+15\s*%/i,                            name: 'Other Fees',          type: 'other_fees',          isVat: true  },
    ];
    for (const cat of cats) {
      const m = tFE.match(cat.re);
      if (m) {
        const amt = parseFloat(m[1].replace(/,/g, ''));
        if (amt > 0) {
          lineItems.push({
            employeeId:       '',
            employeeName:     cat.name,
            serviceType:      cat.type,
            salaryAmount:     cat.isVat ? '' : String(amt),
            serviceFeeAmount: cat.isVat ? String(amt) : '',
          });
        }
      }
    }

  } else if (invoiceType === 'cost_service' && isEmdad) {
    // "Emp 50028404 : Sponsorship transfer fee..." then amount on same/next line
    // PDF may have spaces: "Emp 50028404 :" instead of "Emp50028404:"
    for (const m of t.matchAll(/Emp\s*(\d+)\s*:\s*([A-Za-z]+[A-Za-z\s]*?)[^]{0,120}?([\d,]+\.\d{2})\s+\d+\s+[\d,]+\.\d{2}\s+0%/gi)) {
      const svc = m[2].toLowerCase().trim();
      const serviceType = svc.includes('sponsor') ? 'sponsorship_transfer'
        : (svc.includes('iqama') || svc.includes('renewal') || svc.includes('permit')) ? 'iqama_renewal'
        : 'salary';
      lineItems.push({
        employeeId:   `Emp${m[1]}`,
        employeeName: `Emp${m[1]} — ${m[2].trim()}`,
        serviceType,
        amount:  m[3].replace(/,/g, ''),
        vatRate: '0',
      });
    }

  } else if (invoiceType === 'cost_service' && isSafwat) {
    // "Cost Invoice [name — may be Arabic or English] amount QTY amount 0%"
    // PDF may have "Cost Invoice" with or without space
    for (const m of t.matchAll(/Cost\s*Invoice\s+([^]{1,100}?)\s+([\d,]+\.\d{2})\s+\d+\s+[\d,]+\.\d{2}\s+0%/gi)) {
      const name = m[1].replace(/\s+/g, ' ').trim();
      if (!name || /^\d/.test(name)) continue;
      lineItems.push({
        employeeId:   '',
        employeeName: name,
        serviceType:  'salary',
        amount:  m[2].replace(/,/g, ''),
        vatRate: '0',
      });
    }

  } else if (invoiceType === 'guarantee') {
    // "Guarantee / Gurantee [name] amount QTY amount 0%"
    for (const m of t.matchAll(/Gu[ar]*ante[e]?\s+([^]{1,100}?)\s+([\d,]+\.\d{2})\s+\d+\s+[\d,]+\.\d{2}\s+0%/gi)) {
      const name = m[1].replace(/\s+/g, ' ').trim();
      if (!name || /^\d/.test(name)) continue;
      lineItems.push({
        employeeId:   '',
        employeeName: name,
        serviceType:  'guarantee',
        amount:  m[2].replace(/,/g, ''),
        vatRate: '0',
      });
    }
    // Fallback: "Guarantee" as single total line
    if (!lineItems.length) {
      const totalMatch = t.match(/Total\s*Invoice\s*(?:with\s*vat)?\s*([\d,]+\.\d{2})/i);
      if (totalMatch) {
        lineItems.push({
          employeeId: '', employeeName: 'Guarantee',
          serviceType: 'guarantee', amount: totalMatch[1].replace(/,/g, ''), vatRate: '0',
        });
      }
    }
  }

  // ── Safwat monthly: balance non-taxable total if PDF has extra charges ──────
  if (invoiceType === 'monthly' && isSafwat && lineItems.length) {
    // Fully-normalised text for amount matching
    const tFull = t
      .replace(/(\d)\s*,\s*(\d)/g, '$1$2')
      .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
      .replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');
    // Parse PDF summary totals
    const nonTaxMatch = tFull.match(/Total\s*Vat?\s*Exempt(?:ed|ion)?\s*Amount\s+([\d.]+)/i);
    const taxMatch    = tFull.match(/Total\s*Taxable\s*Amount\s*\([^)]*\)\s+([\d.]+)/i);
    const pdfNonTax   = nonTaxMatch ? parseFloat(nonTaxMatch[1]) : 0;
    const pdfTaxable  = taxMatch    ? parseFloat(taxMatch[1])    : 0;
    // Sum what we parsed
    const parsedSalaries = lineItems.reduce((s, li) => s + (parseFloat(li.salaryAmount) || 0), 0);
    const parsedFees     = lineItems.reduce((s, li) => s + (parseFloat(li.serviceFeeAmount) || 0), 0);
    const salaryGap = Math.round((pdfNonTax - parsedSalaries) * 100) / 100;
    const feeGap    = Math.round((pdfTaxable - parsedFees) * 100) / 100;
    if (salaryGap > 0.01) {
      lineItems.push({
        employeeId: '', employeeName: 'Actual Charges / Other',
        serviceType: 'monthly', salaryAmount: String(salaryGap), serviceFeeAmount: '0',
      });
    }
    if (feeGap > 0.01) {
      lineItems.push({
        employeeId: '', employeeName: 'Additional Service Fees',
        serviceType: 'monthly', salaryAmount: '0', serviceFeeAmount: String(feeGap),
      });
    }
  }

  // Fallback to empty line if parsing found nothing
  if (!lineItems.length) {
    lineItems = [invoiceType === 'monthly' ? { ...MONTHLY_LINE } : { ...EMPTY_LINE }];
  }

  return { partner, invoiceNumber, invoiceDate, period, contractNo, invoiceType, lineItems };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function OperationalPartners({ hideKpis = false }) {

  const [version,       setVersion]       = useState(0);
  const [showAdd,       setShowAdd]       = useState(false);
  const [form,          setForm]          = useState({ ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] });
  const [openCards,     setOpenCards]     = useState({});
  const [batchInputs,   setBatchInputs]   = useState({});
  const [showBatch,     setShowBatch]     = useState({});
  const [gConfirm,      setGConfirm]      = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({});
  const [pdfLoading,    setPdfLoading]    = useState(false);
  const [pdfError,      setPdfError]      = useState('');
  const [rawPdfText,    setRawPdfText]    = useState('');
  const [showDebug,     setShowDebug]     = useState(false);
  const fileInputRef = useRef(null);

  // ── Load invoices ──────────────────────────────────────────────────────────
  const invoices = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(OP_KEY) || '[]'); }
    catch { return []; }
  }, [version]);

  const toggle = key => setOpenCards(s => ({ ...s, [key]: !s[key] }));

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persist = updated => {
    localStorage.setItem(OP_KEY, JSON.stringify(updated));
    setVersion(v => v + 1);
  };

  // ── PDF upload handler ─────────────────────────────────────────────────────
  const handlePDFUpload = async (file) => {
    if (!file) return;
    setPdfLoading(true);
    setPdfError('');
    try {
      const pdfjsLib = await loadPDFjs();
      const text     = await extractPDFText(pdfjsLib, file);
      setRawPdfText(text);
      const parsed   = parseOperationalPDF(text, file.name);

      if (!parsed.partner) {
        setPdfError('لم يتم التعرف على البارتنر — تأكد إن الـ PDF من Emdad أو Safwat');
        setShowAdd(true); // still open modal so user can see debug
        return;
      }

      const isMonthly = parsed.invoiceType === 'monthly';
      setForm({
        partner:       parsed.partner,
        invoiceNumber: parsed.invoiceNumber || '',
        invoiceDate:   parsed.invoiceDate   || '',
        period:        parsed.period        || '',
        invoiceType:   parsed.invoiceType,
        contractNo:    parsed.contractNo    || '',
        lineItems:     parsed.lineItems.length
          ? parsed.lineItems
          : [isMonthly ? { ...MONTHLY_LINE } : { ...EMPTY_LINE }],
      });
      setShowAdd(true);
    } catch (err) {
      setPdfError('خطأ في قراءة الـ PDF: ' + err.message);
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── CRUD helpers ───────────────────────────────────────────────────────────
  const saveInvoice = () => {
    if (!form.invoiceNumber?.trim() || !form.invoiceDate) return;
    const isMonthly = form.invoiceType === 'monthly';
    const lineItems = form.lineItems.map(li => {
      if (isMonthly) {
        const salary = parseFloat(li.salaryAmount)     || 0;
        const fee    = parseFloat(li.serviceFeeAmount) || 0;
        const feeVat = Math.round(fee * 0.15 * 100)   / 100;
        return { ...li, salaryAmount: salary, serviceFeeAmount: fee,
                 amount: salary + fee, vatRate: fee > 0 ? 0.15 : 0,
                 vatAmount: feeVat, totalWithVat: Math.round((salary + fee + feeVat) * 100) / 100,
                 isRefundable: false };
      } else {
        const amt  = parseFloat(li.amount)  || 0;
        const vatR = parseFloat(li.vatRate) || 0;
        const vatA = Math.round(amt * vatR * 100) / 100;
        return { ...li, amount: amt, vatRate: vatR, vatAmount: vatA,
                 totalWithVat: Math.round((amt + vatA) * 100) / 100,
                 isRefundable: li.serviceType === 'guarantee' };
      }
    });
    const grandTotal = Math.round(lineItems.reduce((s, li) => s + li.totalWithVat, 0) * 100) / 100;
    const totalVat   = Math.round(lineItems.reduce((s, li) => s + li.vatAmount,   0) * 100) / 100;
    const newInv = {
      ...form, id: `op_${Date.now()}`, lineItems, grandTotal, totalVat,
      isGuarantee: form.invoiceType === 'guarantee',
      isPaid: false, paidDate: null, batchLabel: null,
      guaranteeRefunded: false, guaranteeRefundDate: null,
    };
    try {
      const all = JSON.parse(localStorage.getItem(OP_KEY) || '[]');
      persist([...all, newInv]);
      setShowAdd(false);
      setPdfError('');
      setForm({ ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] });
    } catch (_) {}
  };

  const markPaid = (id, batchLabel) => {
    try {
      const all = JSON.parse(localStorage.getItem(OP_KEY) || '[]');
      persist(all.map(inv => inv.id === id
        ? { ...inv, isPaid: true, paidDate: new Date().toISOString().split('T')[0], batchLabel: batchLabel || 'Paid' }
        : inv));
    } catch (_) {}
  };

  const markRefunded = id => {
    try {
      const all = JSON.parse(localStorage.getItem(OP_KEY) || '[]');
      persist(all.map(inv => inv.id === id
        ? { ...inv, guaranteeRefunded: true, guaranteeRefundDate: new Date().toISOString().split('T')[0] }
        : inv));
    } catch (_) {}
  };

  const deleteInvoice = id => {
    try {
      const all = JSON.parse(localStorage.getItem(OP_KEY) || '[]');
      persist(all.filter(inv => inv.id !== id));
      setDeleteConfirm(s => ({ ...s, [id]: false }));
    } catch (_) {}
  };

  // ── Per-partner aggregates ─────────────────────────────────────────────────
  const partnerData = useMemo(() =>
    Object.entries(PARTNERS).map(([key, cfg]) => {
      const all        = invoices.filter(inv => inv.partner === key);
      const guarantees = all.filter(inv =>  inv.isGuarantee);
      const regular    = all.filter(inv => !inv.isGuarantee);
      const paid       = regular.filter(inv =>  inv.isPaid);
      const pending    = regular.filter(inv => !inv.isPaid);
      const gPaid      = guarantees.filter(inv =>  inv.isPaid);
      const gPending   = guarantees.filter(inv => !inv.isPaid);
      const gOutstanding = gPaid.filter(inv => !inv.guaranteeRefunded);
      return {
        key, cfg, paid, pending, guarantees, gPaid, gPending, gOutstanding,
        totalPaid:         paid.reduce((s, inv)     => s + (inv.grandTotal || 0), 0),
        totalPending:      pending.reduce((s, inv)  => s + (inv.grandTotal || 0), 0),
        totalGPending:     gPending.reduce((s, inv) => s + (inv.grandTotal || 0), 0),
        totalGOutstanding: gOutstanding.reduce((s, inv) => s + (inv.grandTotal || 0), 0),
      };
    }),
  [invoices]);

  // ── CSV export ─────────────────────────────────────────────────────────────
  const dlCSV = (rows, filename) => {
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const exportCSV = (partnerKey, items, label) => {
    const rows = [['Invoice #','Date','Period','Type','Emp ID','Employee / Description','Service','Pre-VAT','VAT','Total','Status'].map(esc).join(',')];
    items.forEach(inv =>
      inv.lineItems.forEach(li =>
        rows.push([
          esc(inv.invoiceNumber), esc(fmt(inv.invoiceDate)), esc(inv.period),
          esc(inv.invoiceType), esc(li.employeeId || ''), esc(li.employeeName),
          esc(li.serviceType), esc(li.amount), esc(li.vatAmount), esc(li.totalWithVat),
          esc(inv.isPaid ? `Paid ${inv.paidDate}` : 'Pending'),
        ].join(','))
      )
    );
    dlCSV(rows, `${partnerKey}_${label}_Invoices.csv`);
  };
  const exportGuaranteeCSV = (partnerKey, items) => {
    const rows = [['Invoice #','Date','Emp ID','Employee','Amount','Paid Date','Refunded','Refund Date'].map(esc).join(',')];
    items.forEach(inv => inv.lineItems.forEach(li => {
      rows.push([
        esc(inv.invoiceNumber), esc(fmt(inv.invoiceDate)),
        esc(li.employeeId || ''), esc(li.employeeName),
        esc(li.totalWithVat || li.amount),
        esc(inv.isPaid ? fmt(inv.paidDate) : ''),
        esc(inv.guaranteeRefunded ? 'Yes' : 'No'),
        esc(inv.guaranteeRefunded ? fmt(inv.guaranteeRefundDate) : ''),
      ].join(','));
    }));
    dlCSV(rows, `${partnerKey}_Guarantee.csv`);
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const updLine = (i, field, val) =>
    setForm(f => { const ls = [...f.lineItems]; ls[i] = { ...ls[i], [field]: val }; return { ...f, lineItems: ls }; });
  const addLine = () =>
    setForm(f => ({ ...f, lineItems: [...f.lineItems, f.invoiceType === 'monthly' ? { ...MONTHLY_LINE } : { ...EMPTY_LINE }] }));
  const removeLine = i => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, j) => j !== i) }));
  const changeInvoiceType = newType => {
    const emptyLine = newType === 'monthly' ? { ...MONTHLY_LINE } : { ...EMPTY_LINE };
    setForm(f => ({ ...f, invoiceType: newType, lineItems: [emptyLine] }));
  };

  const isMonthlyForm = form.invoiceType === 'monthly';
  const formPreVat = isMonthlyForm
    ? form.lineItems.reduce((s, li) => s + (parseFloat(li.salaryAmount) || 0) + (parseFloat(li.serviceFeeAmount) || 0), 0)
    : form.lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);
  const formVat = isMonthlyForm
    ? form.lineItems.reduce((s, li) => s + (parseFloat(li.serviceFeeAmount) || 0) * 0.15, 0)
    : form.lineItems.reduce((s, li) => { const a = parseFloat(li.amount)||0; const v = parseFloat(li.vatRate)||0; return s + a*v; }, 0);
  const formTotal = formPreVat + formVat;

  // ── Mark-paid widget ───────────────────────────────────────────────────────
  const MarkPaidWidget = ({ id, color = '#16a34a', borderColor = '#86efac' }) => (
    showBatch[id] ? (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input autoFocus placeholder="Batch name" value={batchInputs[id] || ''}
          onChange={e => setBatchInputs(b => ({ ...b, [id]: e.target.value }))}
          onKeyDown={e => {
            if (e.key === 'Enter' && batchInputs[id]?.trim()) {
              markPaid(id, batchInputs[id]); setShowBatch(s => ({ ...s, [id]: false })); setBatchInputs(b => ({ ...b, [id]: '' }));
            }
            if (e.key === 'Escape') setShowBatch(s => ({ ...s, [id]: false }));
          }}
          style={{ padding: '3px 7px', borderRadius: 6, border: `1.5px solid ${borderColor}`, fontSize: 11, width: 130, outline: 'none' }} />
        <button disabled={!batchInputs[id]?.trim()}
          onClick={() => { if (!batchInputs[id]?.trim()) return; markPaid(id, batchInputs[id]); setShowBatch(s => ({ ...s, [id]: false })); setBatchInputs(b => ({ ...b, [id]: '' })); }}
          style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', backgroundColor: batchInputs[id]?.trim() ? color : '#d1fae5', color: 'white', cursor: batchInputs[id]?.trim() ? 'pointer' : 'default' }}>✓</button>
        <button onClick={() => setShowBatch(s => ({ ...s, [id]: false }))}
          style={{ padding: '3px 6px', borderRadius: 6, fontSize: 11, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', color: '#6b7280' }}>✕</button>
      </div>
    ) : (
      <button onClick={() => setShowBatch(s => ({ ...s, [id]: true }))}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: `1.5px solid ${color}`, backgroundColor: 'white', color, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <Check size={10} /> Mark Paid
      </button>
    )
  );

  // ── Invoice row ────────────────────────────────────────────────────────────
  const InvoiceRow = ({ inv, mode, rowIndex }) => {
    const preVat  = inv.lineItems.reduce((s, li) => s + (li.amount || 0), 0);
    const vat     = inv.totalVat || 0;
    const emps    = [...new Set(inv.lineItems.map(li => li.employeeName).filter(Boolean))].join(', ');
    const typeBg  = inv.invoiceType === 'monthly' ? '#dcfce7' : '#dbeafe';
    const typeClr = inv.invoiceType === 'monthly' ? '#15803d' : '#1e40af';
    const typeText = inv.invoiceType === 'monthly' ? 'Monthly' : 'Cost Svc';
    const rowBg = rowIndex % 2 === 0 ? 'white' : '#fafafa';
    return (
      <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: rowBg }}>
        <td style={{ ...tdBase, fontWeight: 800, fontFamily: 'monospace', color: '#111827', fontSize: 11 }}>{inv.invoiceNumber}</td>
        <td style={{ ...tdBase, color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(inv.invoiceDate)}</td>
        <td style={{ ...tdBase, color: '#6b7280', fontSize: 11 }}>{inv.period || '—'}</td>
        <td style={{ ...tdBase }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: typeBg, color: typeClr }}>{typeText}</span></td>
        <td style={{ ...tdBase, color: '#374151', fontSize: 11, maxWidth: 180 }}>{emps || '—'}</td>
        <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#374151', fontSize: 11 }}>
          {preVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', color: '#9ca3af', fontSize: 11 }}>
          {vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: mode === 'paid' ? '#16a34a' : '#dc2626', fontSize: 12 }}>
          {(inv.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>
          {mode === 'pending' ? <MarkPaidWidget id={inv.id} /> : <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>{inv.batchLabel || fmt(inv.paidDate)}</span>}
        </td>
        <td style={{ ...tdBase }}>
          {deleteConfirm[inv.id] ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => deleteInvoice(inv.id)} style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, border: 'none', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 700 }}>✓</button>
              <button onClick={() => setDeleteConfirm(s => ({ ...s, [inv.id]: false }))} style={{ padding: '2px 6px', borderRadius: 5, fontSize: 10, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setDeleteConfirm(s => ({ ...s, [inv.id]: true }))} style={{ padding: '3px 6px', borderRadius: 5, border: '1px solid #fee2e2', backgroundColor: '#fef2f2', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}><Trash2 size={11} /></button>
          )}
        </td>
      </tr>
    );
  };

  // ── Invoice table ──────────────────────────────────────────────────────────
  const InvoiceTable = ({ items, mode }) => {
    const accentColor = mode === 'paid' ? '#16a34a' : '#dc2626';
    const totalPreVat = items.reduce((s, inv) => s + inv.lineItems.reduce((ss, li) => ss + (li.amount || 0), 0), 0);
    const totalVat    = items.reduce((s, inv) => s + (inv.totalVat || 0), 0);
    const totalGrand  = items.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    return (
      <div style={{ overflowX: 'auto', borderTop: '1px solid #f3f4f6' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              {['Invoice #','Date','Period','Type','Employees','Pre-VAT','VAT','Total', mode === 'pending' ? 'Action' : 'Batch',''].map((h, i) => (
                <th key={i} style={{ padding: '7px 14px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: (i === 5 || i === 6 || i === 7) ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{items.map((inv, idx) => <InvoiceRow key={inv.id} inv={inv} mode={mode} rowIndex={idx} />)}</tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
              <td colSpan={5} style={{ ...tdBase, fontWeight: 700, color: '#6b7280', fontSize: 11 }}>{items.length} invoice{items.length !== 1 ? 's' : ''}</td>
              <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#374151', fontSize: 11 }}>{totalPreVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#9ca3af', fontSize: 11 }}>{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: accentColor, fontSize: 13 }}>{totalGrand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // ── Guarantee table ────────────────────────────────────────────────────────
  const GuaranteeTable = ({ items }) => (
    <div style={{ overflowX: 'auto', borderTop: '1px solid #f3f4f6' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            {['Invoice #','Date','Emp ID','Employees','Amount','Paid to Partner','Refunded?','Action',''].map((h, i) => (
              <th key={i} style={{ padding: '7px 14px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: (i === 4 || i === 5) ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((inv, rowIdx) => {
            const empIds = [...new Set(inv.lineItems.map(li => li.employeeId).filter(Boolean))].join(', ');
            const emps   = [...new Set(inv.lineItems.map(li => li.employeeName).filter(Boolean))].join(', ');
            return (
              <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: rowIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ ...tdBase, fontWeight: 800, fontFamily: 'monospace', color: '#111827', fontSize: 11 }}>{inv.invoiceNumber}</td>
                <td style={{ ...tdBase, color: '#6b7280', fontSize: 11 }}>{fmt(inv.invoiceDate)}</td>
                <td style={{ ...tdBase, color: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}>{empIds || '—'}</td>
                <td style={{ ...tdBase, color: '#374151', fontSize: 11 }}>{emps || '—'}</td>
                <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#92400e' }}>{(inv.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ ...tdBase, textAlign: 'right', fontSize: 11 }}>
                  {inv.isPaid ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ {fmt(inv.paidDate)}</span> : <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠ Pending</span>}
                </td>
                <td style={{ ...tdBase }}>
                  {inv.guaranteeRefunded ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ {fmt(inv.guaranteeRefundDate)}</span> : <span style={{ fontSize: 11, color: '#92400e', fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: '#fef3c7' }}>Outstanding</span>}
                </td>
                <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>
                  {!inv.isPaid ? (
                    <MarkPaidWidget id={inv.id} color="#f59e0b" borderColor="#fde68a" />
                  ) : !inv.guaranteeRefunded ? (
                    gConfirm[inv.id] ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { markRefunded(inv.id); setGConfirm(s => ({ ...s, [inv.id]: false })); }} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer' }}>✓ Confirm</button>
                        <button onClick={() => setGConfirm(s => ({ ...s, [inv.id]: false }))} style={{ padding: '3px 6px', borderRadius: 6, fontSize: 10, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', color: '#6b7280' }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setGConfirm(s => ({ ...s, [inv.id]: true }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1.5px solid #16a34a', backgroundColor: 'white', color: '#16a34a', cursor: 'pointer' }}>
                        <RefreshCw size={10} /> Mark Refunded
                      </button>
                    )
                  ) : <span style={{ fontSize: 10, color: '#9ca3af' }}>Done ✓</span>}
                </td>
                <td style={{ ...tdBase }}>
                  {deleteConfirm[inv.id] ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => deleteInvoice(inv.id)} style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, border: 'none', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 700 }}>✓</button>
                      <button onClick={() => setDeleteConfirm(s => ({ ...s, [inv.id]: false }))} style={{ padding: '2px 6px', borderRadius: 5, fontSize: 10, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', color: '#6b7280' }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(s => ({ ...s, [inv.id]: true }))} style={{ padding: '3px 6px', borderRadius: 5, border: '1px solid #fee2e2', backgroundColor: '#fef2f2', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}><Trash2 size={11} /></button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
            <td colSpan={4} style={{ ...tdBase, fontWeight: 700, color: '#6b7280', fontSize: 11 }}>{items.length} guarantee invoice{items.length !== 1 ? 's' : ''}</td>
            <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#b45309', fontSize: 13 }}>{items.reduce((s, inv) => s + (inv.grandTotal || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // ── Global KPIs ────────────────────────────────────────────────────────────
  const totalPending  = partnerData.reduce((s, p) => s + p.totalPending,      0);
  const totalGOut     = partnerData.reduce((s, p) => s + p.totalGOutstanding, 0);
  const totalGPending = partnerData.reduce((s, p) => s + p.totalGPending,     0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handlePDFUpload(f); }} />

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingBottom: 4 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            🏗️ Operational Partners
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>
            Emdad &amp; Safwat — invoices, payments &amp; guarantees
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pdfLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', cursor: pdfLoading ? 'default' : 'pointer', opacity: pdfLoading ? 0.6 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {pdfLoading ? <>⏳ Reading…</> : <><Upload size={13} /> Import PDF</>}
          </button>
          <button
            onClick={() => { setPdfError(''); setForm({ ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] }); setShowAdd(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1.5px solid ${M}`, backgroundColor: M, color: 'white', cursor: 'pointer', boxShadow: '0 2px 6px rgba(128,0,0,0.25)' }}>
            <Plus size={13} /> Add Manually
          </button>
        </div>
      </div>

      {/* PDF error (outside modal) */}
      {pdfError && !showAdd && (
        <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fca5a5', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} /> {pdfError}
          <button onClick={() => setPdfError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}><X size={13} /></button>
        </div>
      )}

      {/* ── KPI strip (hidden when parent shows it) ── */}
      {!hideKpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Pending Payments', val: fmtSAR(totalPending), sub: `${partnerData.reduce((s,p)=>s+p.pending.length,0)} invoices unpaid`, accent: totalPending > 0 ? '#dc2626' : '#16a34a', border: totalPending > 0 ? '#fca5a5' : '#bbf7d0', bg: totalPending > 0 ? '#fef2f2' : '#f0fdf4', icon: totalPending > 0 ? '⚠' : '✓' },
            { label: 'Guarantee Outstanding', val: fmtSAR(totalGOut), sub: 'Paid — awaiting refund', accent: totalGOut > 0 ? '#b45309' : '#6b7280', border: totalGOut > 0 ? '#fcd34d' : '#e5e7eb', bg: totalGOut > 0 ? '#fffbeb' : '#fafafa', icon: '🔒' },
            { label: 'Guarantee Pending', val: fmtSAR(totalGPending), sub: 'Not yet paid to partner', accent: totalGPending > 0 ? '#7c3aed' : '#6b7280', border: totalGPending > 0 ? '#c4b5fd' : '#e5e7eb', bg: totalGPending > 0 ? '#faf5ff' : '#fafafa', icon: '⏳' },
          ].map(k => (
            <div key={k.label} style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${k.border}`, backgroundColor: k.bg, borderLeft: `4px solid ${k.accent}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                <span style={{ fontSize: 14 }}>{k.icon}</span>
              </div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: k.accent, lineHeight: 1, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{k.val}</p>
              <p style={{ margin: '5px 0 0', fontSize: 10, color: '#9ca3af' }}>{k.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Per-partner sections ── */}
      {partnerData.map(({ key, cfg, paid, pending, guarantees, gPaid, gPending, gOutstanding,
                          totalPaid, totalPending: tPend, totalGOutstanding }) => {
        const hasAny  = paid.length > 0 || pending.length > 0 || guarantees.length > 0;
        const paidKey = `op-paid-${key}`;
        const pendKey = `op-pend-${key}`;
        const guarKey = `op-guar-${key}`;
        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 12, overflow: 'hidden', border: `1px solid ${cfg.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

            {/* Partner header bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', backgroundColor: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 14, flexShrink: 0, letterSpacing: '-0.01em', boxShadow: `0 2px 6px ${cfg.color}55` }}>{key.slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827' }}>{cfg.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>
                  {paid.length + pending.length} invoices
                  {cfg.hasGuarantee && ` · ${guarantees.length} guarantees`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                {totalPaid > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#16a34a', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{fmtSAR(totalPaid)}</p>
                  </div>
                )}
                {tPend > 0 && (
                  <div style={{ textAlign: 'right', padding: '4px 10px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#dc2626', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{fmtSAR(tPend)}</p>
                  </div>
                )}
                {totalGOutstanding > 0 && (
                  <div style={{ textAlign: 'right', padding: '4px 10px', borderRadius: 8, backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guarantee</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#b45309', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{fmtSAR(totalGOutstanding)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-sections wrapper */}
            <div style={{ backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: 0 }}>

              {!hasAny && (
                <div style={{ padding: '28px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                  No invoices yet — upload a PDF or click "Add Manually"
                </div>
              )}

              {paid.length > 0 && (
                <div style={{ borderBottom: pending.length > 0 || (cfg.hasGuarantee && guarantees.length > 0) ? '1px solid #f3f4f6' : 'none' }}>
                  <div
                    onClick={() => toggle(paidKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer', backgroundColor: openCards[paidKey] ? '#f0fdf4' : 'white', transition: 'background 0.15s', borderLeft: '4px solid #16a34a' }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}><Check size={13} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111827' }}>Paid Invoices</p>
                      <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af' }}>{paid.length} invoice{paid.length !== 1 ? 's' : ''}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#16a34a', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{fmtSAR(totalPaid)}</p>
                    <button onClick={e => { e.stopPropagation(); exportCSV(key, paid, 'Paid'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, border: '1px solid #86efac', backgroundColor: 'white', color: '#16a34a', cursor: 'pointer', flexShrink: 0 }}>
                      <FileDown size={12} /> Export
                    </button>
                    {openCards[paidKey] ? <ChevronDown size={15} style={{ color: '#9ca3af', flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                  </div>
                  {openCards[paidKey] && <InvoiceTable items={paid} mode="paid" />}
                </div>
              )}

              {pending.length > 0 && (
                <div style={{ borderBottom: cfg.hasGuarantee && guarantees.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
                  <div
                    onClick={() => toggle(pendKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer', backgroundColor: openCards[pendKey] ? '#fef2f2' : 'white', transition: 'background 0.15s', borderLeft: '4px solid #dc2626' }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}><AlertCircle size={13} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111827' }}>Pending Payment</p>
                      <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af' }}>{pending.length} invoice{pending.length !== 1 ? 's' : ''} unpaid</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#dc2626', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{fmtSAR(tPend)}</p>
                    <button onClick={e => { e.stopPropagation(); exportCSV(key, pending, 'Pending'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, border: '1px solid #fca5a5', backgroundColor: 'white', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}>
                      <FileDown size={12} /> Export
                    </button>
                    {openCards[pendKey] ? <ChevronDown size={15} style={{ color: '#9ca3af', flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                  </div>
                  {openCards[pendKey] && <InvoiceTable items={pending} mode="pending" />}
                </div>
              )}

              {cfg.hasGuarantee && guarantees.length > 0 && (
                <div>
                  <div
                    onClick={() => toggle(guarKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer', backgroundColor: openCards[guarKey] ? '#fffbeb' : 'white', transition: 'background 0.15s', borderLeft: '4px solid #f59e0b' }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, flexShrink: 0 }}>💰</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111827' }}>Guarantee Tracker <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>— ضمان مسترد</span></p>
                      <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af' }}>
                        {guarantees.length} invoice{guarantees.length !== 1 ? 's' : ''}
                        {gOutstanding.length > 0 && ` · ${gOutstanding.length} outstanding`}
                        {gPending.length > 0 && ` · ${gPending.length} not yet paid`}
                      </p>
                    </div>
                    {totalGOutstanding > 0 && <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#b45309', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{fmtSAR(totalGOutstanding)}</p>}
                    <button onClick={e => { e.stopPropagation(); exportGuaranteeCSV(key, guarantees); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, border: '1px solid #fcd34d', backgroundColor: 'white', color: '#b45309', cursor: 'pointer', flexShrink: 0 }}>
                      <FileDown size={12} /> Export
                    </button>
                    {openCards[guarKey] ? <ChevronDown size={15} style={{ color: '#9ca3af', flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                  </div>
                  {openCards[guarKey] && <GuaranteeTable items={guarantees} />}
                </div>
              )}

            </div>
          </div>
        );
      })}

      {/* ══════════ ADD / REVIEW INVOICE MODAL ══════════ */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

            {/* Modal header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Review & Save Invoice</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>Review extracted data then click Save — or edit any field manually</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Re-upload PDF from inside modal */}
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, border: '1.5px solid #0891b2', backgroundColor: 'white', color: '#0891b2', cursor: 'pointer' }}>
                  <Upload size={11} /> Change PDF
                </button>
                <button onClick={() => { setShowAdd(false); setPdfError(''); setForm({ ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] }); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><X size={18} /></button>
              </div>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Error banner inside modal */}
              {pdfError && (
                <div style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fca5a5', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {pdfError}
                  <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>— انقر "Show Raw PDF Text" أدناه لتشخيص المشكلة</span>
                  <button onClick={() => setPdfError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}><X size={13} /></button>
                </div>
              )}

              {/* Row 1: Partner + Type + Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Partner', content: (
                    <select value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none' }}>
                      {Object.keys(PARTNERS).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )},
                  { label: 'Invoice Type', content: (
                    <select value={form.invoiceType} onChange={e => changeInvoiceType(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none' }}>
                      {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  )},
                  { label: 'Period', content: (
                    <input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} placeholder="May 2026"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  )},
                ].map(({ label, content }) => (
                  <div key={label}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                    {content}
                  </div>
                ))}
              </div>

              {/* Row 2: Invoice #, Date, Contract */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Invoice Number *', value: form.invoiceNumber, placeholder: form.partner === 'Emdad' ? 'PRO-016838' : 'B2B0000830', key: 'invoiceNumber' },
                  { label: 'Invoice Date *',   value: form.invoiceDate,   placeholder: '', key: 'invoiceDate', type: 'date' },
                  { label: 'Contract No.',     value: form.contractNo,    placeholder: form.partner === 'Emdad' ? '37-COST-PLUS-2026/C' : 'SK00185', key: 'contractNo' },
                ].map(({ label, value, placeholder, key: fkey, type }) => (
                  <div key={fkey}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input type={type || 'text'} value={value} placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [fkey]: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1.5px solid ${(!value && fkey !== 'contractNo') ? '#fca5a5' : '#e5e7eb'}`, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {/* ── Line items ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
                    Line Items
                    {isMonthlyForm && <span style={{ fontSize: 10, fontWeight: 500, color: '#9ca3af', marginLeft: 6 }}>— Salary 0% VAT · Service Fee auto 15% VAT</span>}
                  </label>
                  <button onClick={addLine}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', color: '#374151' }}>
                    <Plus size={11} /> Add Row
                  </button>
                </div>

                {isMonthlyForm ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 1.3fr 1fr 0.4fr', gap: 6, marginBottom: 4, padding: '0 2px' }}>
                      {['Employee / Description','Emp ID','Salary (SAR)','Service Fee (SAR)','Total',''].map((h, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{h}</span>
                      ))}
                    </div>
                    {form.lineItems.map((li, i) => {
                      const sal = parseFloat(li.salaryAmount) || 0;
                      const fee = parseFloat(li.serviceFeeAmount) || 0;
                      const rowTotal = sal + fee + fee * 0.15;
                      return (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 1.3fr 1fr 0.4fr', gap: 6, marginBottom: 6 }}>
                          <input value={li.employeeName} onChange={e => updLine(i, 'employeeName', e.target.value)} placeholder="Employee name or category"
                            style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none' }} />
                          <input value={li.employeeId} onChange={e => updLine(i, 'employeeId', e.target.value)} placeholder="e.g. 11587"
                            style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none' }} />
                          <input type="number" value={li.salaryAmount} onChange={e => updLine(i, 'salaryAmount', e.target.value)} placeholder="0.00"
                            style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none', textAlign: 'right' }} />
                          <input type="number" value={li.serviceFeeAmount} onChange={e => updLine(i, 'serviceFeeAmount', e.target.value)} placeholder="0.00"
                            style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none', textAlign: 'right' }} />
                          <div style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #f3f4f6', backgroundColor: '#f9fafb', fontSize: 11, textAlign: 'right', fontFamily: 'monospace', color: rowTotal > 0 ? M : '#9ca3af' }}>
                            {rowTotal > 0 ? rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                          </div>
                          <button onClick={() => form.lineItems.length > 1 && removeLine(i)}
                            style={{ padding: '7px', borderRadius: 6, border: '1px solid #fee2e2', backgroundColor: form.lineItems.length > 1 ? '#fef2f2' : '#f9fafb', cursor: form.lineItems.length > 1 ? 'pointer' : 'default', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 10, color: '#9ca3af', padding: '4px 2px' }}>💡 Service Fee VAT (15%) calculated automatically · Salary is VAT-exempt</div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 1.8fr 1fr 0.7fr 0.4fr', gap: 6, marginBottom: 4, padding: '0 2px' }}>
                      {['Employee / Description','Emp ID','Service Type','Amount (SAR)','VAT',''].map((h, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{h}</span>
                      ))}
                    </div>
                    {form.lineItems.map((li, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 1.8fr 1fr 0.7fr 0.4fr', gap: 6, marginBottom: 6 }}>
                        <input value={li.employeeName} onChange={e => updLine(i, 'employeeName', e.target.value)} placeholder="Employee name or description"
                          style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none' }} />
                        <input value={li.employeeId} onChange={e => updLine(i, 'employeeId', e.target.value)} placeholder="Emp ID"
                          style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none' }} />
                        <select value={li.serviceType} onChange={e => { const st = SERVICE_TYPES.find(s => s.value === e.target.value); updLine(i, 'serviceType', e.target.value); if (st) updLine(i, 'vatRate', st.defaultVat); }}
                          style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none' }}>
                          {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input type="number" value={li.amount} onChange={e => updLine(i, 'amount', e.target.value)} placeholder="0.00"
                          style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none', textAlign: 'right' }} />
                        <select value={li.vatRate} onChange={e => updLine(i, 'vatRate', e.target.value)}
                          style={{ padding: '7px 9px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none' }}>
                          <option value="0">0%</option>
                          <option value="0.15">15%</option>
                        </select>
                        <button onClick={() => form.lineItems.length > 1 && removeLine(i)}
                          style={{ padding: '7px', borderRadius: 6, border: '1px solid #fee2e2', backgroundColor: form.lineItems.length > 1 ? '#fef2f2' : '#f9fafb', cursor: form.lineItems.length > 1 ? 'pointer' : 'default', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Total preview */}
                <div style={{ textAlign: 'right', marginTop: 6, padding: '9px 14px', backgroundColor: '#f9fafb', borderRadius: 8, display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Pre-VAT: <strong style={{ fontFamily: 'monospace', color: '#374151' }}>SR {formPreVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>VAT: <strong style={{ fontFamily: 'monospace', color: '#374151' }}>SR {formVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: M }}>Total: SR {formTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* ── Debug: raw PDF text ── */}
              {rawPdfText && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                  <button
                    onClick={() => setShowDebug(s => !s)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', cursor: 'pointer', color: '#6b7280' }}>
                    {showDebug ? '▲ Hide' : '▼ Show'} Raw PDF Text (debug)
                  </button>
                  {showDebug && (
                    <pre style={{ marginTop: 6, padding: '10px 12px', backgroundColor: '#1e1e2e', color: '#cdd6f4', borderRadius: 8, fontSize: 10, fontFamily: 'monospace', overflowX: 'auto', maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {rawPdfText}
                    </pre>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button onClick={() => { setShowAdd(false); setPdfError(''); setForm({ ...EMPTY_FORM, lineItems: [{ ...EMPTY_LINE }] }); }}
                  style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                  Cancel
                </button>
                <button onClick={saveInvoice} disabled={!form.invoiceNumber?.trim() || !form.invoiceDate}
                  style={{ padding: '8px 22px', borderRadius: 7, border: 'none', backgroundColor: form.invoiceNumber?.trim() && form.invoiceDate ? M : '#d1d5db', color: 'white', cursor: form.invoiceNumber?.trim() && form.invoiceDate ? 'pointer' : 'default', fontSize: 12, fontWeight: 700 }}>
                  Save Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
