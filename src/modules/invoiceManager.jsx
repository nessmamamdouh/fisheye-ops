import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Plus, X, Search, AlertTriangle, Check, Clock, FileText, Users, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../utils/supabase';

// ─── SheetJS loader (CDN, lazy — only fetched when ImportModal opens) ──────────
let xlsxPromise = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxPromise) return xlsxPromise;
  xlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload  = () => resolve(window.XLSX);
    s.onerror = () => reject(new Error('Failed to load SheetJS'));
    document.head.appendChild(s);
  });
  return xlsxPromise;
}

// ─── PDF.js loader (CDN, lazy — only fetched when PDFImportModal opens) ─────────
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

    // Group items by y-position (3-px buckets) so each visual line is one group
    const lineMap = new Map();
    for (const item of tc.items) {
      if (!item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], str: item.str });
    }

    // Sort top-to-bottom (higher y = higher on page in PDF space)
    // Within each line sort left-to-right by x so English labels precede Arabic labels
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

function parseFisheyePDF(text) {
  // Work on the full text — preserve newlines for section detection
  const t = text.replace(/[ \t]+/g, ' ');

  // ── helpers ──────────────────────────────────────────────────────────────────
  const first = (patterns) => {
    for (const re of patterns) {
      const m = t.match(re);
      if (m) return m[1].trim();
    }
    return '';
  };
  const firstNum = (patterns) => {
    for (const re of patterns) {
      const m = t.match(re);
      if (m) { const n = parseFloat(m[1].replace(/,/g, '')); if (n > 0) return n; }
    }
    return 0;
  };

  // ── Invoice number ──────────────────────────────────────────────────────────
  // Fisheye numbers are always 7 digits starting with 230xxxx or 231xxxx
  const invoiceNumber = first([
    /Invoice#?\s*:?\s*(\d{7,})/i,
    /(\d{7,})\s*#?\s*:?\s*Invoice/i,        // reversed label order
    /(\b23[01]\d{4}\b)/,                     // pattern match as last resort
  ]);

  // ── PO Number ───────────────────────────────────────────────────────────────
  // Most reliable: just find "PO-XXXXX" or "PO XXXXX" anywhere in text
  const rawPO = first([
    /P\.O\.#?\s*:?\s*(PO[-\s]?\d{4,})/i,
    /(PO[-]\d{4,})/i,                        // plain PO-XXXXX pattern
    /PO\s+(\d{4,})/i,
  ]);
  const poNumber = rawPO ? rawPO.replace(/\s+/, '-').toUpperCase() : '';

  // ── Invoice Date ─────────────────────────────────────────────────────────────
  const rawDate = first([
    /Invoice Issue Date\s*:?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /Issue Date\s*:?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
  ]);
  let invoiceDate = '';
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d)) invoiceDate = d.toISOString().split('T')[0];
  }

  // ── Totals ───────────────────────────────────────────────────────────────────
  // Allow any characters (incl. Arabic) between label and number
  const totalDue = firstNum([
    /Balance Due[\s\S]{0,80}?([\d,]+\.\d{2})\s*SAR/i,
    /Total Amount Due[\s\S]{0,120}?([\d,]+\.\d{2})\s*SAR/i,
  ]);
  const vat = firstNum([
    /Total VAT[\s\S]{0,80}?([\d,]+\.\d{2})\s*SAR/i,
  ]);
  // Pre-VAT = Total Due − VAT (always, not just taxable portion)
  const amountPreVat = totalDue != null && vat != null
    ? Math.round((totalDue - vat) * 100) / 100
    : (totalDue || 0);

  // ── Candidate names ───────────────────────────────────────────────────────────
  // Find names between "Employees Salaries" and "Management Fee" / "Total Taxable"
  const NON_NAMES = /^(SAR|Per|To|From|Procurement|Engineer|Manager|Analyst|Officer|Specialist|Monthly|Services?|Senior|Junior|Coordinator|Director|Head|Lead|Supervisor|Consultant|Sales|IT|HR|Finance|Accounting|Administrative|Executive|Developer|Designer|Support|Technical|Operation)$/i;
  let candidateNames = '';

  const empSection = text.match(/Employees?\s+Salaries?\s*\n?([\s\S]*?)(?:Management\s+Fee|Total\s+Taxable|Total\s+Amount)/i);
  if (empSection) {
    const lines = empSection[1].split('\n').map(l => l.trim()).filter(Boolean);
    const names = lines.filter(l =>
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z']+){1,3}$/.test(l) && !NON_NAMES.test(l)
    );
    candidateNames = [...new Set(names)].join('; ');
  }

  // Fallback: scan all lines for "First Last" patterns if section not found
  if (!candidateNames) {
    const lines = text.split('\n').map(l => l.trim());
    const names = lines.filter(l =>
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z']+){1,3}$/.test(l) &&
      !NON_NAMES.test(l) &&
      !/^(Tax Invoice|Invoice|Management|Fisheye|Summary|Saudi Arabia)/.test(l)
    );
    candidateNames = [...new Set(names)].join('; ');
  }

  return { invoiceNumber, poNumber, invoiceDate, candidateNames, amountPreVat, vat, totalDue };
}

function matchClientPartner(poNumber, employees) {
  if (!poNumber || !employees.length) return { clientName: '', partnerName: '' };
  const normed = normalizePO(poNumber);
  const hits   = employees.filter(emp => empPOSet(emp).has(normed));
  if (!hits.length) return { clientName: '', partnerName: '' };
  return { clientName: hits[0].client || '', partnerName: hits[0].partnerName || '' };
}

const M = '#800000';
const STORAGE_KEY = 'fisheye_invoices_v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN = n => Number(n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2 });
const fmtSAR = n => `SAR ${fmtN(n)}`;

function loadInvoices() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveInvoices(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function parseCSVLine(line) {
  const res = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { res.push(cur); cur = ''; }
    else cur += ch;
  }
  res.push(cur);
  return res.map(v => v.trim().replace(/^"|"$/g, '').replace(/,/g, ''));
}

// ─── Shared column detector (used by both CSV + Excel parsers) ─────────────────
function detectColumns(headers) {
  const col = (names) => {
    for (const name of names) {
      const i = headers.findIndex(h => h.includes(name));
      if (i >= 0) return i;
    }
    return -1;
  };
  return {
    iPoNum:  col(['po number', 'po num', 'po#']),
    iInvNum: col(['invoice number', 'invoice no', 'inv num', 'invoice#']),
    iDate:   col(['invoice date', 'date']),
    iNames:  col(['candidate name', 'candidate', 'name']),
    iPreVat: col(['pre-vat', 'pre vat', 'cost pre-vat', 'total cost pre']),
    iVat:    col(['vat (sar)', 'vat']),
    iTotal:  col(['total amount due', 'total amount', 'amount due', 'total due']),
  };
}

function buildRow(poNum, invoiceNum, invoiceDate, names, preVat, vat, totalDue, i) {
  return {
    id: `${invoiceNum || i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    poNumber: String(poNum || '').trim(),
    invoiceNumber: String(invoiceNum || '').trim(),
    invoiceDate: String(invoiceDate || '').trim(),
    candidateNames: String(names || '').trim(),
    amountPreVat: preVat,
    vat,
    totalDue: totalDue || (preVat + vat),
    status: 'sent',
    paidDate: null,
    partnerCommissionPaid: false,
    importedAt: new Date().toISOString(),
  };
}

// ── Detect which Excel format we're dealing with ──────────────────────────────
function detectExcelFormat(headers) {
  // "Paid sheet" format: PO Number | 1st Invoice | 2nd Invoice | 3rd Invoice | Candidate Name | Monthly Cost | Contract Cost
  if (headers.some(h => h.includes('1st invoice') || h.includes('2nd invoice'))) return 'paid_sheet';
  return 'standard';
}

// ── Parse "paid" multi-invoice format ─────────────────────────────────────────
// Columns: PO Number | 1st Invoice | 2nd Invoice | 3rd Invoice | Candidate Name | Total Monthly Cost | Total Contract Cost
function parsePaidSheetExcel(aoa) {
  const headers = aoa[0].map(h => String(h || '').toLowerCase().trim());

  const ci = (names) => {
    for (const n of names) { const i = headers.findIndex(h => h.includes(n)); if (i >= 0) return i; }
    return -1;
  };

  const iPoNum    = ci(['po number', 'po num', 'po#']);
  const iInv1     = ci(['1st invoice', '1st inv', 'invoice 1', 'inv1']);
  const iInv2     = ci(['2nd invoice', '2nd inv', 'invoice 2', 'inv2']);
  const iInv3     = ci(['3rd invoice', '3rd inv', 'invoice 3', 'inv3']);
  const iNames    = ci(['candidate name', 'candidate', 'name']);
  const iMonthly  = ci(['total monthly', 'monthly cost', 'monthly']);
  const iContract = ci(['total contract', 'contract cost', 'contract']);

  const getStr = (row, idx) => idx >= 0 ? String(row[idx] ?? '').trim() : '';
  const getNum = (row, idx) => {
    if (idx < 0) return 0;
    const v = row[idx];
    if (typeof v === 'number') return v;
    return parseFloat(String(v || '').replace(/,/g, '')) || 0;
  };

  const rows = [];
  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || row.length < 2) continue;

    const poNum    = getStr(row, iPoNum);
    const names    = getStr(row, iNames);
    const monthly  = getNum(row, iMonthly);
    const contract = getNum(row, iContract);

    // Collect non-empty invoice numbers
    const invNums = [iInv1, iInv2, iInv3]
      .map(idx => getStr(row, idx))
      .filter(Boolean);

    if (invNums.length === 0 && !names) continue;

    // One invoice record per invoice number found in this row
    invNums.forEach((invNum, idx) => {
      rows.push({
        id: `${invNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        poNumber: poNum,
        invoiceNumber: invNum,
        invoiceDate: '',          // no date column in this format
        candidateNames: names,
        amountPreVat: monthly,    // monthly cost = per-invoice amount
        vat: Math.round(monthly * 0.15 * 100) / 100,
        totalDue: monthly ? Math.round(monthly * 1.15 * 100) / 100 : 0,
        status: 'sent',
        paidDate: null,
        importedAt: new Date().toISOString(),
        _contractTotal: contract, // store for reference
        _invoiceIndex: idx + 1,   // 1st / 2nd / 3rd
      });
    });

    // If no invoice numbers but has a name/PO — add a placeholder
    if (invNums.length === 0 && (poNum || names)) {
      rows.push({
        id: `noinv-${i}-${Date.now()}`,
        poNumber: poNum,
        invoiceNumber: '',
        invoiceDate: '',
        candidateNames: names,
        amountPreVat: monthly,
        vat: Math.round(monthly * 0.15 * 100) / 100,
        totalDue: contract || monthly * 1.15,
        status: 'sent',
        paidDate: null,
        importedAt: new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) return { rows: [], error: 'No data rows found.' };
  return { rows, error: null, format: 'paid_sheet' };
}

// ── Parse Excel workbook using SheetJS sheet_to_json (raw numbers preserved) ──
function parseInvoiceExcel(XLSX, wb) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  // raw: true → numbers stay as JS numbers, not formatted strings
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  if (aoa.length < 2) return { rows: [], error: 'File appears empty.' };

  const headers = aoa[0].map(h => String(h || '').toLowerCase().trim());

  // ── Auto-detect format ─────────────────────────────────────────────────────
  if (detectExcelFormat(headers) === 'paid_sheet') {
    return parsePaidSheetExcel(aoa);
  }

  // ── Standard format (PO | Invoice# | Date | Candidate | Pre-VAT | VAT | Total) ─
  const { iPoNum, iInvNum, iDate, iNames, iPreVat, iVat, iTotal } = detectColumns(headers);

  const getStr = (row, idx, fb) => String(row[idx >= 0 ? idx : fb] ?? '').trim();
  const getNum = (row, idx, fb) => {
    const v = row[idx >= 0 ? idx : fb];
    if (typeof v === 'number') return v;
    return parseFloat(String(v || '').replace(/,/g, '')) || 0;
  };
  const fmtDate = (v) => {
    if (!v && v !== 0) return '';
    if (typeof v === 'number') {
      try {
        const d = XLSX.SSF.parse_date_code(v);
        return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
      } catch { return String(v); }
    }
    // Normalise string dates to YYYY-MM-DD
    const s = String(v).trim();
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // DD-Mon-YY or DD-Mon-YYYY  e.g. "15-Jan-26" or "15-Jan-2026"
    const m1 = s.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})$/);
    if (m1) {
      const months = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                       jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
      const mo = months[m1[2].toLowerCase()];
      const yr = m1[3].length === 2 ? `20${m1[3]}` : m1[3];
      return mo ? `${yr}-${mo}-${String(m1[1]).padStart(2,'0')}` : s;
    }
    // DD/MM/YYYY or MM/DD/YYYY — assume DD/MM/YYYY
    const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m2) return `${m2[3]}-${String(m2[2]).padStart(2,'0')}-${String(m2[1]).padStart(2,'0')}`;
    return s;
  };

  const rows = [];
  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || row.length < 3) continue;
    const invoiceNum = getStr(row, iInvNum, 1);
    const names      = getStr(row, iNames,  3);
    if (!invoiceNum && !names) continue;

    rows.push(buildRow(
      getStr(row, iPoNum,  0),
      invoiceNum,
      fmtDate(row[iDate >= 0 ? iDate : 2]),
      names,
      getNum(row, iPreVat, 4),
      getNum(row, iVat,    5),
      getNum(row, iTotal,  6),
      i,
    ));
  }
  if (rows.length === 0) return { rows: [], error: 'No data rows found. Check column headers.' };
  return { rows, error: null };
}

// ── Parse CSV / plain-text sheet ──────────────────────────────────────────────
function parseInvoiceSheet(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], error: 'File appears empty.' };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const { iPoNum, iInvNum, iDate, iNames, iPreVat, iVat, iTotal } = detectColumns(headers);

  const get = (vals, idx, fb) =>
    (vals[idx >= 0 ? idx : fb] || '').replace(/,/g, '').trim();

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length < 3) continue;
    const invoiceNum = get(vals, iInvNum, 1);
    const names      = get(vals, iNames,  3);
    if (!invoiceNum && !names) continue;

    rows.push(buildRow(
      get(vals, iPoNum,  0),
      invoiceNum,
      get(vals, iDate,   2),
      names,
      parseFloat(get(vals, iPreVat, 4)) || 0,
      parseFloat(get(vals, iVat,    5)) || 0,
      parseFloat(get(vals, iTotal,  6)) || 0,
      i,
    ));
  }
  if (rows.length === 0) return { rows: [], error: 'No data rows found. Check that the file has the right columns.' };
  return { rows, error: null };
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  sent:        { label: 'Sent',        color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
  paid:        { label: 'Paid',        color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  overdue:     { label: 'Overdue',     color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  credit_note: { label: 'Credit Note', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
};

// ─── SOA Reconciliation Data ──────────────────────────────────────────────────
// Extracted from SOA_December_2025.pdf and SOA_April_2026.pdf
// Each entry: invoiceNumber → { paymentRef, paymentDate }
const SOA_PAYMENT_INFO = {
  // ── Dec 2025 SOA · Payment ref 714 · 09 Oct 2025 ──
  '2300648':{ ref:'714', date:'2025-10-09' }, '2300650':{ ref:'714', date:'2025-10-09' },
  '2300651':{ ref:'714', date:'2025-10-09' }, '2300672':{ ref:'714', date:'2025-10-09' },
  '2300673':{ ref:'714', date:'2025-10-09' }, '2300681':{ ref:'714', date:'2025-10-09' },
  '2300682':{ ref:'714', date:'2025-10-09' }, '2300683':{ ref:'714', date:'2025-10-09' },
  '2300684':{ ref:'714', date:'2025-10-09' }, '2300685':{ ref:'714', date:'2025-10-09' },
  '2300686':{ ref:'714', date:'2025-10-09' }, '2300687':{ ref:'714', date:'2025-10-09' },
  '2300688':{ ref:'714', date:'2025-10-09' }, '2300705':{ ref:'714', date:'2025-10-09' },
  '2300706':{ ref:'714', date:'2025-10-09' }, '2300707':{ ref:'714', date:'2025-10-09' },
  '2300728':{ ref:'714', date:'2025-10-09' }, '2300729':{ ref:'714', date:'2025-10-09' },
  '2300730':{ ref:'714', date:'2025-10-09' }, '2300731':{ ref:'714', date:'2025-10-09' },
  '2300732':{ ref:'714', date:'2025-10-09' }, '2300733':{ ref:'714', date:'2025-10-09' },
  '2300734':{ ref:'714', date:'2025-10-09' }, '2300735':{ ref:'714', date:'2025-10-09' },
  '2300742':{ ref:'714', date:'2025-10-09' }, '2300743':{ ref:'714', date:'2025-10-09' },
  '2300744':{ ref:'714', date:'2025-10-09' }, '2300771':{ ref:'714', date:'2025-10-09' },
  '2300772':{ ref:'714', date:'2025-10-09' }, '2300773':{ ref:'714', date:'2025-10-09' },
  '2300774':{ ref:'714', date:'2025-10-09' }, '2300775':{ ref:'714', date:'2025-10-09' },
  '2300776':{ ref:'714', date:'2025-10-09' }, '2300777':{ ref:'714', date:'2025-10-09' },
  '2300778':{ ref:'714', date:'2025-10-09' }, '2300779':{ ref:'714', date:'2025-10-09' },
  '2300780':{ ref:'714', date:'2025-10-09' }, '2300781':{ ref:'714', date:'2025-10-09' },
  '2300782':{ ref:'714', date:'2025-10-09' }, '2300783':{ ref:'714', date:'2025-10-09' },
  '2300784':{ ref:'714', date:'2025-10-09' }, '2300785':{ ref:'714', date:'2025-10-09' },
  '2300786':{ ref:'714', date:'2025-10-09' }, '2300788':{ ref:'714', date:'2025-10-09' },
  '2300789':{ ref:'714', date:'2025-10-09' },
  // ── Dec 2025 SOA · Payment ref 738 · 09 Nov 2025 ──
  '2300818':{ ref:'738', date:'2025-11-09' }, '2300819':{ ref:'738', date:'2025-11-09' },
  '2300825':{ ref:'738', date:'2025-11-09' }, '2300826':{ ref:'738', date:'2025-11-09' },
  '2300827':{ ref:'738', date:'2025-11-09' }, '2300828':{ ref:'738', date:'2025-11-09' },
  '2300829':{ ref:'738', date:'2025-11-09' },
  // ── Apr 2026 SOA · Payment ref 800 · 01 Jan 2026 ──
  '2300855':{ ref:'800', date:'2026-01-01' }, '2300856':{ ref:'800', date:'2026-01-01' },
  '2300887':{ ref:'800', date:'2026-01-01' }, '2300929':{ ref:'800', date:'2026-01-01' },
  '2300930':{ ref:'800', date:'2026-01-01' }, '2300932':{ ref:'800', date:'2026-01-01' },
  '2300933':{ ref:'800', date:'2026-01-01' }, '2300934':{ ref:'800', date:'2026-01-01' },
  '2300935':{ ref:'800', date:'2026-01-01' }, '2300937':{ ref:'800', date:'2026-01-01' },
  '2300938':{ ref:'800', date:'2026-01-01' }, '2300940':{ ref:'800', date:'2026-01-01' },
  '2300968':{ ref:'800', date:'2026-01-01' }, '2300969':{ ref:'800', date:'2026-01-01' },
  '2300970':{ ref:'800', date:'2026-01-01' }, '2300971':{ ref:'800', date:'2026-01-01' },
  '2300973':{ ref:'800', date:'2026-01-01' }, '2300974':{ ref:'800', date:'2026-01-01' },
  '2300975':{ ref:'800', date:'2026-01-01' }, '2300976':{ ref:'800', date:'2026-01-01' },
  // ── Apr 2026 SOA · Payment ref 826 · 05 Feb 2026 ──
  '2301012':{ ref:'826', date:'2026-02-05' }, '2301013':{ ref:'826', date:'2026-02-05' },
  '2301015':{ ref:'826', date:'2026-02-05' }, '2301017':{ ref:'826', date:'2026-02-05' },
  '2301018':{ ref:'826', date:'2026-02-05' }, '2301019':{ ref:'826', date:'2026-02-05' },
  '2301020':{ ref:'826', date:'2026-02-05' }, '2301021':{ ref:'826', date:'2026-02-05' },
  '2301022':{ ref:'826', date:'2026-02-05' }, '2301023':{ ref:'826', date:'2026-02-05' },
  '2301051':{ ref:'826', date:'2026-02-05' }, '2301052':{ ref:'826', date:'2026-02-05' },
  '2301053':{ ref:'826', date:'2026-02-05' }, '2301054':{ ref:'826', date:'2026-02-05' },
  '2301055':{ ref:'826', date:'2026-02-05' }, '2301056':{ ref:'826', date:'2026-02-05' },
  '2301143':{ ref:'826', date:'2026-02-05' },
  // ── Apr 2026 SOA · Payment ref 845 · 09 Mar 2026 ──
  '2300854':{ ref:'845', date:'2026-03-09' }, '2300931':{ ref:'845', date:'2026-03-09' },
  '2300972':{ ref:'845', date:'2026-03-09' }, '2301004':{ ref:'845', date:'2026-03-09' },
  '2301005':{ ref:'845', date:'2026-03-09' }, '2301006':{ ref:'845', date:'2026-03-09' },
  '2301007':{ ref:'845', date:'2026-03-09' }, '2301009':{ ref:'845', date:'2026-03-09' },
  '2301066':{ ref:'845', date:'2026-03-09' }, '2301079':{ ref:'845', date:'2026-03-09' },
  '2301080':{ ref:'845', date:'2026-03-09' }, '2301081':{ ref:'845', date:'2026-03-09' },
  '2301083':{ ref:'845', date:'2026-03-09' }, '2301084':{ ref:'845', date:'2026-03-09' },
  '2301085':{ ref:'845', date:'2026-03-09' }, '2301086':{ ref:'845', date:'2026-03-09' },
  '2301088':{ ref:'845', date:'2026-03-09' }, '2301089':{ ref:'845', date:'2026-03-09' },
  '2301090':{ ref:'845', date:'2026-03-09' }, '2301114':{ ref:'845', date:'2026-03-09' },
  '2301115':{ ref:'845', date:'2026-03-09' }, '2301116':{ ref:'845', date:'2026-03-09' },
  '2301117':{ ref:'845', date:'2026-03-09' }, '2301118':{ ref:'845', date:'2026-03-09' },
  '2301119':{ ref:'845', date:'2026-03-09' }, '2301120':{ ref:'845', date:'2026-03-09' },
  // ── Apr 2026 SOA · Payment ref 907 · 29 Apr 2026 ──
  '2301281':{ ref:'907', date:'2026-04-29' }, '2301282':{ ref:'907', date:'2026-04-29' },
  '2301284':{ ref:'907', date:'2026-04-29' }, '2301285':{ ref:'907', date:'2026-04-29' },
  '2301286':{ ref:'907', date:'2026-04-29' }, '2301287':{ ref:'907', date:'2026-04-29' },
  '2301288':{ ref:'907', date:'2026-04-29' }, '2301289':{ ref:'907', date:'2026-04-29' },
  '2301292':{ ref:'907', date:'2026-04-29' }, '2301293':{ ref:'907', date:'2026-04-29' },
  '2301294':{ ref:'907', date:'2026-04-29' }, '2301295':{ ref:'907', date:'2026-04-29' },
  '2301296':{ ref:'907', date:'2026-04-29' }, '2301297':{ ref:'907', date:'2026-04-29' },
  '2301298':{ ref:'907', date:'2026-04-29' }, '2301299':{ ref:'907', date:'2026-04-29' },
  '2301300':{ ref:'907', date:'2026-04-29' },
  // 2301301 intentionally skipped — NOT in ref 907 payment list (outstanding)
  '2301302':{ ref:'907', date:'2026-04-29' }, '2301303':{ ref:'907', date:'2026-04-29' },
  '2301304':{ ref:'907', date:'2026-04-29' }, '2301305':{ ref:'907', date:'2026-04-29' },
  '2301306':{ ref:'907', date:'2026-04-29' }, '2301307':{ ref:'907', date:'2026-04-29' },
  '2301308':{ ref:'907', date:'2026-04-29' }, '2301310':{ ref:'907', date:'2026-04-29' },
  '2301311':{ ref:'907', date:'2026-04-29' }, '2301312':{ ref:'907', date:'2026-04-29' },
  '2301313':{ ref:'907', date:'2026-04-29' },
  '2301331':{ ref:'907', date:'2026-04-29' }, '2301332':{ ref:'907', date:'2026-04-29' },
  '2301333':{ ref:'907', date:'2026-04-29' }, '2301334':{ ref:'907', date:'2026-04-29' },
  '2301335':{ ref:'907', date:'2026-04-29' }, '2301336':{ ref:'907', date:'2026-04-29' },
  '2301337':{ ref:'907', date:'2026-04-29' }, '2301338':{ ref:'907', date:'2026-04-29' },
  '2301339':{ ref:'907', date:'2026-04-29' }, '2301341':{ ref:'907', date:'2026-04-29' },
  '2301342':{ ref:'907', date:'2026-04-29' },
  // ── Apr 2026 SOA · Payment Applied 910 · 13 May 2026 ──
  '2301082':{ ref:'910', date:'2026-05-13' }, '2301087':{ ref:'910', date:'2026-05-13' },
  '2301121':{ ref:'910', date:'2026-05-13' }, '2301127':{ ref:'910', date:'2026-05-13' },
  '2301128':{ ref:'910', date:'2026-05-13' }, '2301129':{ ref:'910', date:'2026-05-13' },
  '2301130':{ ref:'910', date:'2026-05-13' }, '2301131':{ ref:'910', date:'2026-05-13' },
  '2301132':{ ref:'910', date:'2026-05-13' }, '2301134':{ ref:'910', date:'2026-05-13' },
  '2301135':{ ref:'910', date:'2026-05-13' }, '2301136':{ ref:'910', date:'2026-05-13' },
  '2301146':{ ref:'910', date:'2026-05-13' }, '2301147':{ ref:'910', date:'2026-05-13' },
  '2301148':{ ref:'910', date:'2026-05-13' }, '2301149':{ ref:'910', date:'2026-05-13' },
  '2301150':{ ref:'910', date:'2026-05-13' }, '2301151':{ ref:'910', date:'2026-05-13' },
  '2301152':{ ref:'910', date:'2026-05-13' }, '2301153':{ ref:'910', date:'2026-05-13' },
  '2301154':{ ref:'910', date:'2026-05-13' },
  '2301196':{ ref:'910', date:'2026-05-13' }, '2301197':{ ref:'910', date:'2026-05-13' },
  '2301198':{ ref:'910', date:'2026-05-13' }, '2301199':{ ref:'910', date:'2026-05-13' },
  '2301200':{ ref:'910', date:'2026-05-13' }, '2301201':{ ref:'910', date:'2026-05-13' },
  '2301202':{ ref:'910', date:'2026-05-13' }, '2301203':{ ref:'910', date:'2026-05-13' },
  '2301204':{ ref:'910', date:'2026-05-13' }, '2301205':{ ref:'910', date:'2026-05-13' },
  '2301206':{ ref:'910', date:'2026-05-13' }, '2301208':{ ref:'910', date:'2026-05-13' },
  '2301209':{ ref:'910', date:'2026-05-13' }, '2301210':{ ref:'910', date:'2026-05-13' },
  '2301211':{ ref:'910', date:'2026-05-13' }, '2301212':{ ref:'910', date:'2026-05-13' },
  '2301213':{ ref:'910', date:'2026-05-13' }, '2301215':{ ref:'910', date:'2026-05-13' },
  '2301216':{ ref:'910', date:'2026-05-13' }, '2301217':{ ref:'910', date:'2026-05-13' },
  '2301218':{ ref:'910', date:'2026-05-13' }, '2301219':{ ref:'910', date:'2026-05-13' },
  '2301220':{ ref:'910', date:'2026-05-13' }, '2301221':{ ref:'910', date:'2026-05-13' },
  '2301222':{ ref:'910', date:'2026-05-13' }, '2301223':{ ref:'910', date:'2026-05-13' },
  '2301224':{ ref:'910', date:'2026-05-13' }, '2301225':{ ref:'910', date:'2026-05-13' },
  '2301228':{ ref:'910', date:'2026-05-13' }, '2301229':{ ref:'910', date:'2026-05-13' },
  '2301230':{ ref:'910', date:'2026-05-13' }, '2301231':{ ref:'910', date:'2026-05-13' },
  '2301232':{ ref:'910', date:'2026-05-13' }, '2301233':{ ref:'910', date:'2026-05-13' },
  '2301235':{ ref:'910', date:'2026-05-13' }, '2301236':{ ref:'910', date:'2026-05-13' },
  '2301237':{ ref:'910', date:'2026-05-13' }, '2301238':{ ref:'910', date:'2026-05-13' },
  '2301239':{ ref:'910', date:'2026-05-13' }, '2301240':{ ref:'910', date:'2026-05-13' },
  '2301241':{ ref:'910', date:'2026-05-13' }, '2301242':{ ref:'910', date:'2026-05-13' },
  '2301248':{ ref:'910', date:'2026-05-13' }, '2301250':{ ref:'910', date:'2026-05-13' },
  '2301251':{ ref:'910', date:'2026-05-13' }, '2301252':{ ref:'910', date:'2026-05-13' },
  '2301253':{ ref:'910', date:'2026-05-13' }, '2301254':{ ref:'910', date:'2026-05-13' },
  '2301255':{ ref:'910', date:'2026-05-13' }, '2301256':{ ref:'910', date:'2026-05-13' },
  '2301258':{ ref:'910', date:'2026-05-13' }, '2301309':{ ref:'910', date:'2026-05-13' },
  '2301375':{ ref:'910', date:'2026-05-13' }, '2301377':{ ref:'910', date:'2026-05-13' },
  '2301440':{ ref:'910', date:'2026-05-13' }, '2301441':{ ref:'910', date:'2026-05-13' },
  '2301442':{ ref:'910', date:'2026-05-13' }, '2301443':{ ref:'910', date:'2026-05-13' },
  '2301444':{ ref:'910', date:'2026-05-13' }, '2301445':{ ref:'910', date:'2026-05-13' },
  '2301446':{ ref:'910', date:'2026-05-13' }, '2301447':{ ref:'910', date:'2026-05-13' },
  // ── Credit-noted invoices (settled via credit note, not cash payment) ──
  '2300787':{ ref:'CN-00120', date:'2025-09-22' },
  '2301014':{ ref:'CN-00185', date:'2026-02-04' },  // -63,107.20 — Apr 2026 SOA
  '2301126':{ ref:'CN-00210', date:'2026-03-30' },  // -60,732.65 — Apr 2026 SOA
  '2301137':{ ref:'CN-00211', date:'2026-03-30' },  // -60,732.65 — Apr 2026 SOA
};
const SOA_PAID_NUMS = new Set(Object.keys(SOA_PAYMENT_INFO));

// Pre-built sets per SOA document (keyed by date prefix)
const SOA_2025_NUMS = new Set(
  Object.entries(SOA_PAYMENT_INFO)
    .filter(([, info]) => info.date.startsWith('2025'))
    .map(([num]) => num)
);
const SOA_2026_NUMS = new Set(
  Object.entries(SOA_PAYMENT_INFO)
    .filter(([, info]) => info.date.startsWith('2026'))
    .map(([num]) => num)
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// ─── PO Matching helpers ──────────────────────────────────────────────────────
function normalizePO(raw) {
  // Normalize "PO-32100", "PO 32100", "32100" → comparable string
  return String(raw || '').replace(/\s+/g, '').toUpperCase();
}

// ─── Billing calc (mirrors FinanceModule) ─────────────────────────────────────
function calcLineInv(emp) {
  const totalPkg = Number(emp.totalPackage || 0);
  let marginAmount = 0;
  if (emp.profitMode === 'partner') {
    const pValue = Number(emp.clientPrice || 0);
    const pType  = emp.clientPriceType || 'percent';
    marginAmount = pType === 'percent' ? (pValue / 100) * totalPkg : pValue;
  } else {
    const mValue = Number(emp.fisheyeMargin || 0);
    const mType  = emp.fisheyeMarginType || 'percent';
    marginAmount = mType === 'percent' ? (mValue / 100) * totalPkg : mValue;
  }
  return totalPkg + marginAmount + marginAmount * 0.15; // total incl. VAT
}

// For a given invoice PO, find all matching employees and sum expected billing
function calcExpected(invPO, employees) {
  if (!invPO) return null;
  const normed = normalizePO(invPO);
  const matched = employees.filter(emp => empPOSet(emp).has(normed));
  if (!matched.length) return null;
  return { total: matched.reduce((s, e) => s + calcLineInv(e), 0), count: matched.length };
}

function empPOSet(emp) {
  // Employee's poNumbers field can be "PO-32100" or "PO-32100, PO-32679" etc.
  const raw = String(emp.poNumbers || '');
  return new Set(
    raw.split(/[,;\n]/).map(p => normalizePO(p)).filter(Boolean)
  );
}

// ─── Duplicate detector ───────────────────────────────────────────────────────
// Duplicate = نفس رقم الفاتورة + نفس الـ PO (بعد normalization).
// ده معناه نفس الفاتورة اتسجّلت مرتين بالضبط.
// لو نفس الـ invoice number بس PO مختلف → مش duplicate (فاتورة واحدة لعقود مختلفة).
// مش بنحتاج employee matching هنا لأن الـ PO هو المعرّف للعقد مش الموظف.
function detectDuplicate(invoiceNumber, poNumber, existingInvoices) {
  const invNum = String(invoiceNumber || '').trim();
  const po     = String(poNumber     || '').trim();

  if (!invNum) return null;

  // لو في PO: نشوف لو نفس الـ (invoice# + PO) موجود
  if (po) {
    const normed = normalizePO(po);
    const hit = existingInvoices.find(inv =>
      String(inv.invoiceNumber || '').trim() === invNum &&
      inv.poNumber && normalizePO(inv.poNumber) === normed
    );
    if (hit) {
      return {
        label:  `فاتورة #${invNum} بنفس الـ PO موجودة بالفعل`,
        detail: `PO: ${po} · تاريخ: ${hit.invoiceDate || '—'} · ${STATUS[hit.status]?.label || hit.status}`,
        existing: hit,
      };
    }
    return null;
  }

  // لو مفيش PO: نشوف لو نفس رقم الفاتورة موجود (احتياط)
  const hit = existingInvoices.find(inv =>
    String(inv.invoiceNumber || '').trim() === invNum
  );
  if (hit) {
    return {
      label:  `فاتورة #${invNum} موجودة بالفعل`,
      detail: `تاريخ: ${hit.invoiceDate || '—'} · ${STATUS[hit.status]?.label || hit.status}`,
      existing: hit,
    };
  }

  return null;
}

// ─── Scan all stored invoices for duplicates ─────────────────────────────────
// Duplicate = نفس (invoiceNumber + normalizedPO).
// Returns array of groups: { key, invoiceNumber, poNumber, invoices[] }
function scanExistingDuplicates(invoices) {
  const groupMap = new Map();

  for (const inv of invoices) {
    const invNum = String(inv.invoiceNumber || '').trim();
    if (!invNum) continue;

    const po     = String(inv.poNumber || '').trim();
    const key    = po ? `${invNum}||${normalizePO(po)}` : `${invNum}||NO_PO`;

    if (!groupMap.has(key)) {
      groupMap.set(key, { key, invoiceNumber: invNum, poNumber: po, invoices: [] });
    }
    const grp = groupMap.get(key);
    if (!grp.invoices.find(x => x.id === inv.id)) {
      grp.invoices.push(inv);
    }
  }

  return [...groupMap.values()].filter(g => g.invoices.length > 1);
}

function appendInvoice(existing, newNum) {
  if (!newNum) return existing;
  const parts = String(existing || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  if (parts.includes(String(newNum))) return existing; // already there
  parts.push(String(newNum));
  return parts.join(', ');
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InvoiceManager({ employees = [], setEmployees = () => {} }) {
  const [invoices, setInvoices] = useState(loadInvoices);
  const [showImport, setShowImport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPDFImport, setShowPDFImport] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'client' | 'partner'
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [bulkEditField, setBulkEditField] = useState(null); // 'clientName' | 'partnerName' | null
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [showDupAudit, setShowDupAudit]       = useState(false);
  const [showSOAReconcile, setShowSOAReconcile] = useState(false);
  const [filterYear, setFilterYear]           = useState('all');

  // ── Load from Supabase on mount (prefer fisheye_invoices, fallback to app_data) ──
  useEffect(() => {
    supabase.from('fisheye_invoices').select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        saveInvoices(data);
        setInvoices(data);
      } else {
        // fallback: load from fisheye_app_data
        supabase.from('fisheye_app_data').select('data').eq('key', 'fisheye_invoices_v1').single()
          .then(({ data: row }) => {
            if (row?.data?.length > 0) { saveInvoices(row.data); setInvoices(row.data); }
          });
      }
    });
  }, []);

  const persist = (list) => {
    setInvoices(list);
    saveInvoices(list);
    // sync to Supabase in background
    const CHUNK = 50;
    (async () => {
      for (let i = 0; i < list.length; i += CHUNK) {
        const { error } = await supabase.from('fisheye_invoices').upsert(list.slice(i, i + CHUNK), { onConflict: 'id' });
        if (error) { console.warn('invoices sync error:', error.message); break; }
      }
    })();
  };

  const updateStatus = (id, status) => {
    persist(invoices.map(inv =>
      inv.id === id
        ? { ...inv, status, paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : inv.paidDate }
        : inv
    ));
  };

  const togglePartnerCommission = (id) => {
    persist(invoices.map(inv =>
      inv.id === id ? { ...inv, partnerCommissionPaid: !inv.partnerCommissionPaid } : inv
    ));
  };

  const deleteInvoice = (id) => {
    if (!window.confirm('Delete this invoice record?')) return;
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    persist(invoices.filter(inv => inv.id !== id));
  };

  // Mark a specific set of invoices as paid (used by SOA reconciliation)
  const bulkMarkPaidBySOA = (invoiceNumbers) => {
    const numSet = new Set(invoiceNumbers.map(n => String(n).trim()));
    persist(invoices.map(inv => {
      if (!numSet.has(String(inv.invoiceNumber || '').trim())) return inv;
      if (inv.status === 'paid') return inv; // already paid, don't overwrite date
      const info = SOA_PAYMENT_INFO[String(inv.invoiceNumber).trim()];
      return { ...inv, status: 'paid', paidDate: info ? info.date : new Date().toISOString().split('T')[0] };
    }));
  };

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = (visibleIds) => {
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); visibleIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); visibleIds.forEach(id => n.add(id)); return n; });
    }
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected invoice${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    persist(invoices.filter(inv => !selectedIds.has(inv.id)));
    setSelectedIds(new Set());
  };

  const bulkSetStatus = (status) => {
    if (selectedIds.size === 0) return;
    persist(invoices.map(inv =>
      selectedIds.has(inv.id)
        ? { ...inv, status, paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : inv.paidDate }
        : inv
    ));
    setSelectedIds(new Set());
  };

  const bulkSetClientPartner = () => {
    if (!bulkEditField || selectedIds.size === 0) return;
    persist(invoices.map(inv =>
      selectedIds.has(inv.id) ? { ...inv, [bulkEditField]: bulkEditValue.trim() } : inv
    ));
    setSelectedIds(new Set());
    setBulkEditField(null);
    setBulkEditValue('');
  };

  // ── PO Matching: update employees invoiceNumbers after import ──────────────
  const applyPOMatches = async (rows) => {
    // Build map: normalizedPO → invoice number
    const poToInvoice = {};
    rows.forEach(r => {
      if (r.poNumber) poToInvoice[normalizePO(r.poNumber)] = r.invoiceNumber;
    });

    const updates = []; // { emp, newInvoiceNumbers }

    employees.forEach(emp => {
      const empPOs = empPOSet(emp);
      let newInvNums = emp.invoiceNumbers || '';
      let changed = false;

      empPOs.forEach(po => {
        if (poToInvoice[po]) {
          const merged = appendInvoice(newInvNums, poToInvoice[po]);
          if (merged !== newInvNums) { newInvNums = merged; changed = true; }
        }
      });

      if (changed) updates.push({ emp, newInvoiceNumbers: newInvNums });
    });

    if (updates.length === 0) return 0;

    // Update local state immediately
    setEmployees(prev => prev.map(e => {
      const match = updates.find(u => u.emp._id === e._id);
      return match ? { ...e, invoiceNumbers: match.newInvoiceNumbers } : e;
    }));

    // Persist to Supabase
    await Promise.all(updates.map(({ emp, newInvoiceNumbers }) =>
      supabase
        .from('employees_master')
        .update({ invoiceNumbers: newInvoiceNumbers })
        .eq('_id', Number(emp._id))
    ));

    return updates.length;
  };

  const handleImport = async (rows, defStatus) => {
    const stamped = rows.map(r => ({
      ...r,
      status: defStatus,
      id: `${r.invoiceNumber}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    }));
    persist([...invoices, ...stamped]);

    const matched = await applyPOMatches(rows);
    setShowImport(false);

    if (matched > 0) {
      alert(`✅ Imported ${rows.length} invoices\n🔗 Invoice numbers added to ${matched} employee profile${matched !== 1 ? 's' : ''} via PO match`);
    }
  };

  // Extract 4-digit year from any stored date string
  const invYear = (inv) => {
    const d = String(inv.invoiceDate || '').trim();
    if (!d) return null;
    // YYYY-MM-DD
    if (/^\d{4}/.test(d)) return d.slice(0, 4);
    // DD-Mon-YY e.g. "15-Jan-26"
    const m = d.match(/(\d{2,4})$/);
    if (m) {
      const yr = m[1].length === 2 ? `20${m[1]}` : m[1];
      if (/^\d{4}$/.test(yr)) return yr;
    }
    return null;
  };

  // Determine whether an invoice belongs to the selected SOA filter:
  //   • Paid            → SOA payment list membership (reliable)
  //   • Sent / Overdue  → if invoice# appears in a SOA batch, use that SOA;
  //                       otherwise ALL outstanding belong to soa2026
  //                       (the April 2026 SOA carries forward ALL unpaid balances)
  const inSOAFilter = (inv, key) => {
    if (key === 'all') return true;
    const num    = String(inv.invoiceNumber || '').trim();
    const soaSet = key === 'soa2025' ? SOA_2025_NUMS : SOA_2026_NUMS;

    if (inv.status === 'paid' || inv.status === 'credit_note') {
      return soaSet.has(num);
    }

    // Sent or Overdue: if the invoice# is referenced in any SOA batch → follow that SOA
    if (SOA_PAID_NUMS.has(num)) return soaSet.has(num);
    // All remaining outstanding (regardless of date/year) → current open balance → soa2026
    return key === 'soa2026';
  };

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchSOA    = inSOAFilter(inv, filterYear);
    const q = search.toLowerCase();
    const matchSearch = !q
      || (inv.invoiceNumber || '').toLowerCase().includes(q)
      || (inv.poNumber || '').toLowerCase().includes(q)
      || (inv.candidateNames || '').toLowerCase().includes(q);
    return matchStatus && matchSOA && matchSearch;
  }), [invoices, filterStatus, filterYear, search]);

  // Stats pool uses the same SOA-aware logic
  const statsPool = useMemo(() =>
    filterYear === 'all' ? invoices : invoices.filter(i => inSOAFilter(i, filterYear)),
  [invoices, filterYear]);

  const stats = useMemo(() => ({
    sentAmt:         statsPool.filter(i => i.status === 'sent').reduce((s, i) => s + i.totalDue, 0),
    paidAmt:         statsPool.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalDue, 0),
    overdueAmt:      statsPool.filter(i => i.status === 'overdue').reduce((s, i) => s + i.totalDue, 0),
    credit_noteAmt:  statsPool.filter(i => i.status === 'credit_note').reduce((s, i) => s + i.totalDue, 0),
    sentCnt:         statsPool.filter(i => i.status === 'sent').length,
    paidCnt:         statsPool.filter(i => i.status === 'paid').length,
    overdueCnt:      statsPool.filter(i => i.status === 'overdue').length,
    credit_noteCnt:  statsPool.filter(i => i.status === 'credit_note').length,
  }), [statsPool]);

  const filteredTotal   = filtered.reduce((s, i) => s + i.totalDue, 0);
  const filteredPreVat  = filtered.reduce((s, i) => s + (i.totalDue - (i.vat || 0)), 0);
  const filteredVat     = filtered.reduce((s, i) => s + i.vat, 0);

  // Grouped view
  const grouped = useMemo(() => {
    if (viewMode === 'list') return null;
    const key = viewMode === 'client' ? 'clientName' : 'partnerName';
    const map = {};
    filtered.forEach(inv => {
      const g = (inv[key] || '').trim() || '(غير مسند)';
      if (!map[g]) map[g] = [];
      map[g].push(inv);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, viewMode]);

  const toggleGroup = (name) => setCollapsedGroups(prev => {
    const n = new Set(prev);
    n.has(name) ? n.delete(name) : n.add(name);
    return n;
  });

  // styles
  const th = { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', backgroundColor: '#f9fafb' };
  const td = { padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Awaiting Payment', cnt: stats.sentCnt,        amt: stats.sentAmt,       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', prefix: '' },
          { label: 'Collected',        cnt: stats.paidCnt,        amt: stats.paidAmt,        color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', prefix: '' },
          { label: 'Overdue',          cnt: stats.overdueCnt,     amt: stats.overdueAmt,     color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', prefix: '' },
          { label: 'Credit Notes',     cnt: stats.credit_noteCnt, amt: stats.credit_noteAmt, color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', prefix: '−' },
        ].map(k => (
          <div key={k.label} className="fe-stat-card" style={{
            padding: '13px 15px', borderRadius: 10,
            border: `1px solid ${k.border}`, borderLeft: `4px solid ${k.color}`,
            backgroundColor: k.bg,
          }}>
            <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {k.label}
            </p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: k.color, fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
              {k.prefix}{fmtSAR(k.amt)}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#9ca3af' }}>
              {k.cnt} invoice{k.cnt !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>

      {/* ── Bulk action bar (appears when rows are selected) ── */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 16px', backgroundColor: '#f8faff', border: '1.5px solid #bfdbfe', borderRadius: 10 }}>

          {/* Row 1: count + status + delete + cancel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8', marginRight: 4 }}>
              {selectedIds.size} selected
            </span>

            <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb', margin: '0 4px' }} />

            <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Mark as:</span>
            {Object.entries(STATUS).map(([k, cfg]) => (
              <button key={k} onClick={() => bulkSetStatus(k)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 13px', borderRadius: 7,
                border: `1.5px solid ${cfg.border}`,
                backgroundColor: cfg.bg, color: cfg.color,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                {k === 'paid' ? <Check size={11} /> : k === 'overdue' ? <AlertTriangle size={11} /> : k === 'credit_note' ? <FileText size={11} /> : <Clock size={11} />}
                {cfg.label}
              </button>
            ))}

            <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb', margin: '0 4px' }} />

            {/* Edit Client / Edit Partner triggers */}
            {[
              { field: 'clientName',  label: 'Edit Client',  icon: <Building2 size={11}/>, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
              { field: 'partnerName', label: 'Edit Partner', icon: <Users size={11}/>,    color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
            ].map(b => (
              <button key={b.field} onClick={() => {
                setBulkEditField(bulkEditField === b.field ? null : b.field);
                setBulkEditValue('');
              }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 13px', borderRadius: 7,
                border: `1.5px solid ${bulkEditField === b.field ? b.color : b.border}`,
                backgroundColor: bulkEditField === b.field ? b.bg : 'white',
                color: bulkEditField === b.field ? b.color : '#6b7280',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                {b.icon} {b.label}
              </button>
            ))}

            <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb', margin: '0 4px' }} />

            <button onClick={deleteSelected} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 13px', borderRadius: 7, border: 'none',
              backgroundColor: '#dc2626', color: 'white',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <X size={11} /> Delete
            </button>

            <button onClick={() => { setSelectedIds(new Set()); setBulkEditField(null); }} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              fontSize: 12, color: '#9ca3af', cursor: 'pointer', fontWeight: 600,
            }}>
              Cancel
            </button>
          </div>

          {/* Row 2: inline input for Client/Partner edit (shown only when active) */}
          {bulkEditField && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '1px solid #dbeafe' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                {bulkEditField === 'clientName' ? '🏢 Client name:' : '🤝 Partner name:'}
              </span>
              <input
                autoFocus
                value={bulkEditValue}
                onChange={e => setBulkEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') bulkSetClientPartner(); if (e.key === 'Escape') setBulkEditField(null); }}
                placeholder={`Enter ${bulkEditField === 'clientName' ? 'client' : 'partner'} name…`}
                style={{ flex: 1, maxWidth: 280, padding: '6px 10px', border: '1.5px solid #bfdbfe', borderRadius: 7, fontSize: 12 }}
              />
              <button onClick={bulkSetClientPartner} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none',
                backgroundColor: bulkEditField === 'clientName' ? '#1d4ed8' : '#16a34a',
                color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Apply to {selectedIds.size} invoice{selectedIds.size !== 1 ? 's' : ''}
              </button>
              <button onClick={() => setBulkEditField(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12,
              }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Row 1: Search + Status filters */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice #, PO, employee…"
              style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, boxSizing: 'border-box', outline: 'none', backgroundColor: 'white' }} />
          </div>

          {/* Status pill filters */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['all', 'sent', 'paid', 'overdue', 'credit_note'].map(s => {
              const cfg = STATUS[s];
              const isActive = filterStatus === s;
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '6px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${isActive ? (cfg?.color || M) : '#e5e7eb'}`,
                  backgroundColor: isActive ? (cfg?.bg || `${M}10`) : 'white',
                  color: isActive ? (cfg?.color || M) : '#6b7280',
                  transition: 'all 0.15s',
                }}>
                  {s === 'all' ? `All · ${invoices.length}` : `${cfg.label} · ${stats[`${s}Cnt`]}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: View toggle + SOA + Action buttons */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* View mode toggle */}
          <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { key: 'list',    icon: <Search size={11}/>,    label: 'List' },
              { key: 'client',  icon: <Building2 size={11}/>, label: 'Client' },
              { key: 'partner', icon: <Users size={11}/>,     label: 'Partner' },
            ].map((v, i, arr) => (
              <button key={v.key} onClick={() => setViewMode(v.key)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                backgroundColor: viewMode === v.key ? M : 'white',
                color: viewMode === v.key ? 'white' : '#6b7280',
                borderRight: i < arr.length - 1 ? '1px solid #e5e7eb' : 'none',
              }}>{v.icon}{v.label}</button>
            ))}
          </div>

          {/* SOA filter pills */}
          <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>SOA:</span>
          {[
            { key: 'all',     label: 'الكل',            cnt: invoices.length },
            { key: 'soa2025', label: 'ديس ٢٠٢٥',       cnt: invoices.filter(i => inSOAFilter(i, 'soa2025')).length },
            { key: 'soa2026', label: 'إبريل ٢٠٢٦',     cnt: invoices.filter(i => inSOAFilter(i, 'soa2026')).length },
          ].map(({ key, label, cnt }) => {
            const isActive = filterYear === key;
            return (
              <button key={key} onClick={() => setFilterYear(key)} style={{
                padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${isActive ? M : '#e5e7eb'}`,
                backgroundColor: isActive ? M : 'white',
                color: isActive ? 'white' : '#6b7280',
                transition: 'all 0.15s',
              }}>
                {label}{key !== 'all' && <span style={{ opacity: 0.7, marginLeft: 4 }}>· {cnt}</span>}
              </button>
            );
          })}

          {/* Action buttons — pushed to right */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {/* Dup audit */}
            {(() => {
              const dupGroups = scanExistingDuplicates(invoices);
              return (
                <button onClick={() => setShowDupAudit(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${dupGroups.length > 0 ? '#fca5a5' : '#e5e7eb'}`,
                  backgroundColor: dupGroups.length > 0 ? '#fef2f2' : 'white',
                  color: dupGroups.length > 0 ? '#dc2626' : '#9ca3af',
                }}>
                  <AlertTriangle size={12} />
                  {dupGroups.length > 0 ? `${dupGroups.length} مكرر` : 'مكررات'}
                </button>
              );
            })()}
            {/* SOA reconcile */}
            {(() => {
              const mismatch = invoices.filter(inv => {
                const num = String(inv.invoiceNumber || '').trim();
                return SOA_PAID_NUMS.has(num) && inv.status !== 'paid';
              }).length;
              return (
                <button onClick={() => setShowSOAReconcile(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${mismatch > 0 ? '#fed7aa' : '#e5e7eb'}`,
                  backgroundColor: mismatch > 0 ? '#fff7ed' : 'white',
                  color: mismatch > 0 ? '#c2410c' : '#9ca3af',
                }}>
                  <FileText size={12} />
                  {mismatch > 0 ? `SOA · ${mismatch}` : 'SOA'}
                </button>
              );
            })()}
            <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb', alignSelf: 'center' }} />
            <button onClick={() => setShowManual(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px',
              borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#374151',
            }}>
              <Plus size={12} /> Add
            </button>
            <button onClick={() => setShowPDFImport(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px',
              borderRadius: 8, border: '1.5px solid #bfdbfe', backgroundColor: '#eff6ff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#1d4ed8',
            }}>
              <FileText size={12} /> PDF
            </button>
            <button onClick={() => setShowImport(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px',
              borderRadius: 8, border: 'none', backgroundColor: M,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'white',
              boxShadow: '0 2px 6px rgba(128,0,0,0.25)',
            }}>
              <Upload size={12} /> Import
            </button>
          </div>
        </div>
      </div>

      {/* ── Grouped View ── */}
      {viewMode !== 'list' && grouped && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {grouped.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              No invoices match current filters
            </div>
          ) : grouped.map(([groupName, rows]) => {
            const isCollapsed = collapsedGroups.has(groupName);
            const groupTotal  = rows.reduce((s, i) => s + i.totalDue, 0);
            const groupPaid   = rows.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalDue, 0);
            return (
              <div key={groupName} style={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Group header */}
                <div onClick={() => toggleGroup(groupName)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer',
                    backgroundColor: isCollapsed ? 'white' : '#f9fafb',
                    borderBottom: isCollapsed ? 'none' : '1px solid #f3f4f6',
                    borderLeft: `4px solid ${M}` }}>
                  {isCollapsed ? <ChevronRight size={14} color={M}/> : <ChevronDown size={14} color={M}/>}
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#111827', flex: 1 }}>{groupName}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 8 }}>{rows.length} invoice{rows.length !== 1 ? 's' : ''}</span>
                  {groupPaid > 0 && (
                    <span style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', fontSize: 10, fontWeight: 700, marginRight: 8 }}>
                      Paid {fmtSAR(groupPaid)}
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 13, color: M }}>{fmtSAR(groupTotal)}</span>
                </div>
                {/* Group rows */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800, fontSize: 12 }}>
                      <tbody>
                        {rows.map(inv => {
                          const cfg = STATUS[inv.status] || STATUS.sent;
                          return (
                            <tr key={inv.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                              <td style={{ ...td, fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 12, width: 100 }}>{inv.invoiceNumber || '—'}</td>
                              <td style={{ ...td, color: '#6b7280', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{inv.poNumber || '—'}</td>
                              <td style={{ ...td, color: '#6b7280', whiteSpace: 'nowrap' }}>{inv.invoiceDate || '—'}</td>
                              <td style={{ ...td, maxWidth: 240 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inv.candidateNames}>
                                  {inv.candidateNames || '—'}
                                </div>
                              </td>
                              <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 900, color: M }}>{fmtN(inv.totalDue)}</td>
                              <td style={td}>
                                <select value={inv.status} onChange={e => updateStatus(inv.id, e.target.value)} style={{
                                  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                  border: `1.5px solid ${cfg.border}`, backgroundColor: cfg.bg, color: cfg.color,
                                }}>
                                  <option value="sent">Sent</option>
                                  <option value="paid">Paid</option>
                                  <option value="overdue">Overdue</option>
                                  <option value="credit_note">Credit Note</option>
                                </select>
                              </td>
                              <td style={{ ...td, textAlign: 'center', width: 32 }}>
                                <button onClick={() => deleteInvoice(inv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2 }}>
                                  <X size={13}/>
                                </button>
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
          })}
        </div>
      )}

      {/* ── Table (List View) ── */}
      {viewMode === 'list' && <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 36, textAlign: 'center', paddingRight: 4 }}>
                  {/* Select-all checkbox for visible rows */}
                  {filtered.length > 0 && (
                    <input type="checkbox"
                      checked={filtered.length > 0 && filtered.every(inv => selectedIds.has(inv.id))}
                      onChange={() => toggleSelectAll(filtered.map(inv => inv.id))}
                      style={{ cursor: 'pointer', accentColor: M }}
                      title="Select all visible"
                    />
                  )}
                </th>
                <th style={th}>Invoice #</th>
                <th style={th}>PO Number</th>
                <th style={th}>Date</th>
                <th style={{ ...th, minWidth: 160 }}>Candidate(s)</th>
                <th style={th}>Client</th>
                <th style={th}>Partner</th>
                <th style={{ ...th, textAlign: 'right' }}>Pre-VAT</th>
                <th style={{ ...th, textAlign: 'right' }}>VAT</th>
                <th style={{ ...th, textAlign: 'right', color: M }}>Total Due</th>
                <th style={{ ...th, textAlign: 'center' }}>Match</th>
                <th style={th}>Status</th>
                <th style={{ ...th, whiteSpace: 'nowrap' }}>Partner Comm.</th>
                <th style={{ ...th, width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    {invoices.length === 0
                      ? <>No invoices yet — <strong>Import Sheet</strong> to upload your monthly file, or <strong>Add Invoice</strong> manually</>
                      : 'No results for current filter'}
                  </td>
                </tr>
              ) : filtered.map((inv, rowIdx) => {
                const cfg = STATUS[inv.status] || STATUS.sent;
                const isSelected = selectedIds.has(inv.id);
                const rowBg = isSelected ? '#fff5f5' : rowIdx % 2 === 0 ? 'white' : '#fafafa';
                return (
                  <tr key={inv.id}
                    style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: rowBg, transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = rowBg; }}>

                    <td style={{ ...td, textAlign: 'center', paddingRight: 4, width: 36 }}>
                      <input type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(inv.id)}
                        style={{ cursor: 'pointer', accentColor: M }}
                      />
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {inv.invoiceNumber || '—'}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
                      {inv.poNumber || '—'}
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {inv.invoiceDate || '—'}
                    </td>
                    <td style={{ ...td, maxWidth: 200, fontSize: 12 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}
                        title={inv.candidateNames}>
                        {inv.candidateNames || '—'}
                      </div>
                    </td>
                    <td style={{ ...td, fontSize: 11 }}>
                      {inv.clientName
                        ? <span style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, whiteSpace: 'nowrap' }}>{inv.clientName}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ ...td, fontSize: 11 }}>
                      {inv.partnerName
                        ? <span style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>{inv.partnerName}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#374151' }}>
                      {fmtN(inv.totalDue - (inv.vat || 0))}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6b7280' }}>
                      {fmtN(inv.vat)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 900, color: M }}>
                      {fmtN(inv.totalDue)}
                    </td>
                    <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {(() => {
                        if (!inv.poNumber) return <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>;

                        const invVat    = Number(inv.vat || 0);
                        const invTotal  = Number(inv.totalDue || 0);
                        const invPreVat = invTotal - invVat; // salary + fee (pre-VAT)

                        // Can't back-calc without VAT
                        if (invVat <= 0) return <span title="No VAT recorded — cannot back-calculate rate" style={{ fontSize: 10, color: '#9ca3af' }}>No VAT</span>;

                        // Back-calculate: VAT = margin × 15%  →  margin = VAT ÷ 0.15
                        const impliedMargin = invVat / 0.15;
                        const impliedSalary = invPreVat - impliedMargin;

                        // Detect "full VAT" invoices (VAT on entire salary, no separate fee line)
                        // In that case impliedMargin ≈ invPreVat and impliedSalary ≈ 0
                        if (impliedSalary < 50) {
                          return <span title="Invoice charges VAT on full amount — rate comparison not applicable" style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:10, backgroundColor:'#f3f4f6', color:'#6b7280', fontSize:10, fontWeight:700 }}>Full VAT</span>;
                        }

                        const impliedRate = (impliedMargin / impliedSalary) * 100;

                        // Find matched employees by PO
                        const normed  = normalizePO(inv.poNumber);
                        const matched = employees.filter(emp => empPOSet(emp).has(normed));

                        if (!matched.length) return <span title="No employee found with this PO in the system" style={{ color: '#d1d5db', fontSize: 11 }}>—</span>;

                        // Get stored rate (use first matched employee — all on same PO should have same rate)
                        const emp0 = matched[0];
                        const isPartner   = emp0.profitMode === 'partner';
                        const storedRate  = isPartner
                          ? (emp0.clientPriceType  !== 'fixed' ? Number(emp0.clientPrice  || 0) : null)
                          : (emp0.fisheyeMarginType !== 'fixed' ? Number(emp0.fisheyeMargin || 0) : null);

                        if (storedRate === null) return <span title="Fixed-amount mode — rate comparison not applicable" style={{ fontSize: 10, color: '#9ca3af' }}>Fixed</span>;

                        // Also compare salary sum
                        const combinedPkg = matched.reduce((s, e) => s + Number(e.totalPackage || 0), 0);
                        const salaryDiff  = Math.round(impliedSalary - combinedPkg);
                        const rateDiff    = Math.round((impliedRate - storedRate) * 10) / 10;

                        const rateOk   = Math.abs(rateDiff)   < 0.2;
                        const salaryOk = Math.abs(salaryDiff) <= 50;

                        if (rateOk && salaryOk) {
                          return (
                            <span title={`Rate: ${impliedRate.toFixed(1)}% ✓ matches stored ${storedRate}%\nSalary: SAR ${Math.round(impliedSalary).toLocaleString()} ✓ matches ${matched.length} employee(s)`}
                              style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:10, backgroundColor:'#dcfce7', color:'#16a34a', fontSize:10, fontWeight:800 }}>
                              ✓ {impliedRate.toFixed(1)}%
                            </span>
                          );
                        }

                        // Build tooltip with detail
                        const tipParts = [];
                        if (!rateOk)   tipParts.push(`Rate on invoice: ${impliedRate.toFixed(1)}% | Stored in system: ${storedRate}%`);
                        if (!salaryOk) tipParts.push(`Salary on invoice: SAR ${Math.round(impliedSalary).toLocaleString()} | System total: SAR ${combinedPkg.toLocaleString()} (${matched.length} emp)`);

                        return (
                          <span title={tipParts.join('\n')}
                            style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:10,
                              backgroundColor: !rateOk ? '#fff7ed' : '#fef9c3',
                              color:           !rateOk ? '#c2410c' : '#854d0e',
                              fontSize:10, fontWeight:800, cursor:'default' }}>
                            {!rateOk ? `${impliedRate.toFixed(1)}% ≠ ${storedRate}%` : `Sal Δ${salaryDiff > 0 ? '+' : ''}${salaryDiff.toLocaleString()}`}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={td}>
                      <select value={inv.status} onChange={e => updateStatus(inv.id, e.target.value)} style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: `1.5px solid ${cfg.border}`,
                        backgroundColor: cfg.bg, color: cfg.color,
                      }}>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="credit_note">Credit Note</option>
                      </select>
                    </td>
                    <td style={td}>
                      {(() => {
                        if (inv.status !== 'paid') return <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>;
                        const emp = employees.find(e => {
                          const raw = String(e.poNumbers || '');
                          const pos = new Set(raw.split(/[,;\n]/).map(p => String(p || '').replace(/\s+/g,'').toUpperCase()).filter(Boolean));
                          return pos.has(String(inv.poNumber || '').replace(/\s+/g,'').toUpperCase());
                        });
                        if (!emp || emp.profitMode !== 'partner') return <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>;
                        const preVat = inv.totalDue != null
                          ? (inv.totalDue - (inv.vat || 0))
                          : (inv.amountPreVat || 0);
                        const commission = emp.partnerCostType === 'percent'
                          ? Math.round((emp.partnerCost / 100) * preVat * 100) / 100
                          : (emp.partnerCost || 0);
                        return inv.partnerCommissionPaid
                          ? (
                            <button onClick={() => togglePartnerCommission(inv.id)} title="Click to unmark" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, border: '1.5px solid #86efac', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <Check size={9} /> Paid
                            </button>
                          ) : (
                            <button onClick={() => togglePartnerCommission(inv.id)} title="Click to mark commission as paid" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, border: '1.5px solid #fca5a5', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <AlertTriangle size={9} /> {fmtN(commission)}
                            </button>
                          );
                      })()}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button onClick={() => deleteInvoice(inv.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2 }}
                        title="Delete">
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals footer */}
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                  <td />
                  <td colSpan={6} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                    {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                    {selectedIds.size > 0 && <span style={{ color: '#dc2626', marginLeft: 8, fontWeight: 800 }}>· {selectedIds.size} selected</span>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                    {fmtN(filteredPreVat)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                    {fmtN(filteredVat)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 900, color: M }}>
                    {fmtN(filteredTotal)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      }

      {/* ── Modals ── */}
      {showImport    && <ImportModal    onClose={() => setShowImport(false)}    onImport={handleImport} employees={employees} invoices={invoices} />}
      {showManual    && <ManualModal    onClose={() => setShowManual(false)}    onSave={inv => { persist([...invoices, inv]); setShowManual(false); }} employees={employees} invoices={invoices} />}
      {showPDFImport && <PDFImportModal onClose={() => setShowPDFImport(false)} onImport={handleImport} employees={employees} invoices={invoices} />}
      {showDupAudit      && <DupAuditModal      onClose={() => setShowDupAudit(false)}      invoices={invoices} employees={employees} onDelete={ids => persist(invoices.filter(inv => !ids.has(inv.id)))} />}
      {showSOAReconcile  && <SOAReconcileModal  onClose={() => setShowSOAReconcile(false)}  invoices={invoices} onMarkPaid={bulkMarkPaidBySOA} filterYear={filterYear} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ImportModal({ onClose, onImport, employees = [], invoices = [] }) {
  const [preview, setPreview]         = useState(null);
  const [detectedFormat, setFormat]   = useState('standard');
  const [error, setError]             = useState('');
  const [defStatus, setDefStatus]     = useState('sent');
  const [saving, setSaving]           = useState(false);

  // Compute PO matches for preview
  const matchSummary = useMemo(() => {
    if (!preview) return null;
    let matched = 0; let unmatched = 0;
    const details = []; // { po, invoiceNum, empNames[] }

    preview.forEach(row => {
      if (!row.poNumber) { unmatched++; return; }
      const normedPO = normalizePO(row.poNumber);
      const hits = employees.filter(emp => empPOSet(emp).has(normedPO));
      if (hits.length > 0) {
        matched++;
        details.push({ po: row.poNumber, invoice: row.invoiceNumber, employees: hits.map(e => e.name) });
      } else {
        unmatched++;
      }
    });
    return { matched, unmatched, details };
  }, [preview, employees]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(''); setPreview(null); setFormat('standard');

    const ext = file.name.split('.').pop().toLowerCase();
    const isExcel = ext === 'xlsx' || ext === 'xls';

    if (isExcel) {
      // ── Excel path: load SheetJS, read raw numeric values ──
      let XLSX;
      try {
        XLSX = await loadXLSX();
      } catch {
        setError('Could not load Excel parser. Check your internet connection and try again.');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: false });
          const { rows, error, format } = parseInvoiceExcel(XLSX, wb);
          if (error) { setError(error); return; }
          setFormat(format || 'standard');
          setPreview(rows);
        } catch (err) {
          setError(`Error reading Excel file: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // ── CSV / TXT path ──
      const reader = new FileReader();
      reader.onload = ev => {
        const { rows, error } = parseInvoiceSheet(ev.target.result);
        if (error) { setError(error); return; }
        setPreview(rows);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const confirm = async () => {
    setSaving(true);
    await onImport(preview, defStatus);
    setSaving(false);
  };

  const inp = { width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' };

  return (
    <Overlay onClose={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <ModalHeader title="📥 Import Invoice Sheet" sub="Supports two formats — Standard (PO · Invoice # · Date · Candidate · Pre-VAT · VAT · Total) or Paid Sheet (PO · 1st Invoice · 2nd Invoice · 3rd Invoice · Candidate · Monthly Cost · Contract Cost)" onClose={onClose} />

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Drop zone */}
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: '28px 20px', border: '2px dashed #d1d5db', borderRadius: 10,
            cursor: 'pointer', backgroundColor: '#fafafa', transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = M}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}>
            <Upload size={26} style={{ color: '#9ca3af' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>Click to choose your Excel or CSV file</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
                Accepts <strong>.xlsx</strong> · <strong>.xls</strong> · <strong>.csv</strong><br/>
                Expected columns: <strong>PO Number · Invoice Number · Invoice Date · Candidate Name(s) · Total Cost Pre-VAT (SAR) · VAT (SAR) · Total Amount Due (SAR)</strong>
              </p>
            </div>
            <input type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
          </label>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}

          {/* Default status selector */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Mark imported invoices as:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(STATUS).map(([k, cfg]) => (
                <button key={k} onClick={() => setDefStatus(k)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${defStatus === k ? cfg.color : '#e5e7eb'}`,
                  backgroundColor: defStatus === k ? cfg.bg : 'white',
                  color: defStatus === k ? cfg.color : '#6b7280',
                }}>{cfg.label}</button>
              ))}
            </div>
          </div>

          {/* Preview + Match summary */}
          {preview && matchSummary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Match banner */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #86efac', fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>🔗 {matchSummary.matched} invoice{matchSummary.matched !== 1 ? 's' : ''}</span>
                  <span style={{ color: '#374151' }}> matched to employee profiles by PO</span>
                </div>
                {matchSummary.unmatched > 0 && (
                  <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, backgroundColor: '#fffbeb', border: '1px solid #fde68a', fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#b45309' }}>⚠️ {matchSummary.unmatched}</span>
                    <span style={{ color: '#374151' }}> rows with no PO match</span>
                  </div>
                )}
              </div>

              {/* Match details */}
              {matchSummary.details.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                  <div style={{ padding: '7px 12px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PO Matches — invoice number will be added to these employees
                  </div>
                  {matchSummary.details.slice(0, 10).map((d, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6b7280', flexShrink: 0, fontSize: 11 }}>{d.po}</span>
                      <span style={{ color: '#374151', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0, fontSize: 11 }}>→ #{d.invoice}</span>
                      <span style={{ color: '#16a34a', fontSize: 11 }}>{d.employees.join(' · ')}</span>
                    </div>
                  ))}
                  {matchSummary.details.length > 10 && (
                    <div style={{ padding: '7px 12px', color: '#9ca3af', fontSize: 11, textAlign: 'center' }}>+{matchSummary.details.length - 10} more matches…</div>
                  )}
                </div>
              )}

              {/* Row preview */}
              <div>
                {(() => {
                  const dupCount = preview.filter(r => detectDuplicate(r.invoiceNumber, r.poNumber, invoices)).length;
                  return (
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Check size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
                      {preview.length} invoice rows total
                      {detectedFormat === 'paid_sheet' && (
                        <span style={{ padding: '2px 8px', borderRadius: 5, backgroundColor: '#ede9fe', color: '#7c3aed', fontSize: 10, fontWeight: 800, letterSpacing: '0.03em' }}>
                          PAID SHEET FORMAT — 1st/2nd/3rd Invoice
                        </span>
                      )}
                      {dupCount > 0 && (
                        <span style={{ padding: '2px 8px', borderRadius: 5, backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 800 }}>
                          🔴 {dupCount} مكرر
                        </span>
                      )}
                    </p>
                  );
                })()}
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        {['Invoice #', 'PO', 'Date', 'Candidate(s)', 'Total Due', ''].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 8).map((r, i) => {
                        const dup = detectDuplicate(r.invoiceNumber, r.poNumber, invoices);
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: dup ? '#fef2f2' : 'transparent' }}>
                            <td style={{ padding: '5px 10px', fontWeight: 700, fontFamily: 'monospace' }}>{r.invoiceNumber || '—'}</td>
                            <td style={{ padding: '5px 10px', color: '#6b7280', fontFamily: 'monospace' }}>{r.poNumber || '—'}</td>
                            <td style={{ padding: '5px 10px', color: '#6b7280', whiteSpace: 'nowrap' }}>{r.invoiceDate || '—'}</td>
                            <td style={{ padding: '5px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.candidateNames}>{r.candidateNames || '—'}</td>
                            <td style={{ padding: '5px 10px', fontWeight: 700, color: M, fontFamily: 'monospace', textAlign: 'right' }}>{r.totalDue.toLocaleString('en-SA', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '5px 10px', whiteSpace: 'nowrap' }}>
                              {dup && (
                                <span title={dup.detail} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 10 }}>
                                  🔴 مكرر
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {preview.length > 8 && (
                        <tr><td colSpan={6} style={{ padding: '6px 10px', color: '#9ca3af', textAlign: 'center' }}>+{preview.length - 8} more…</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={confirm} disabled={!preview} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            backgroundColor: preview ? M : '#e5e7eb',
            color: 'white', fontSize: 13, fontWeight: 700,
            cursor: preview ? 'pointer' : 'not-allowed', opacity: preview ? 1 : 0.6,
          }}>
            {preview ? `Import ${preview.length} invoices` : 'Choose a file first'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL ADD MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ManualModal({ onClose, onSave, employees = [], invoices = [] }) {
  const [form, setForm] = useState({
    invoiceNumber: '', poNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
    candidateNames: '', amountPreVat: '', vat: '', totalDue: '', status: 'sent',
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const dupWarning = useMemo(
    () => detectDuplicate(form.invoiceNumber, form.poNumber, invoices),
    [form.invoiceNumber, form.poNumber, invoices]
  );

  const preVat = parseFloat(form.amountPreVat) || 0;
  const vatAmt = form.vat !== '' ? parseFloat(form.vat) : Math.round(preVat * 0.15 * 100) / 100;
  const autoTotal = preVat + vatAmt;

  const save = () => {
    if (!form.invoiceNumber.trim()) { alert('Invoice number is required'); return; }
    if (dupWarning && !dupWarning.isSoftWarning) {
      if (!window.confirm(`${dupWarning.label}\n${dupWarning.detail || ''}\n\nهل تريد الإضافة على أي حال؟`)) return;
    }
    onSave({
      id: `${form.invoiceNumber}-${Date.now()}`,
      poNumber: form.poNumber,
      invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate,
      candidateNames: form.candidateNames,
      amountPreVat: preVat,
      vat: vatAmt,
      totalDue: form.totalDue ? parseFloat(form.totalDue) : autoTotal,
      status: form.status,
      paidDate: null,
      importedAt: new Date().toISOString(),
    });
  };

  const inp = { width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' };
  const lbl = { fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 };

  return (
    <Overlay onClose={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.22)' }}>
        <ModalHeader title="➕ Add Invoice" sub="Enter invoice details manually" onClose={onClose} />

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Invoice Number *</label>
              <input style={{
                ...inp,
                borderColor: dupWarning ? '#fca5a5' : undefined,
              }} value={form.invoiceNumber} onChange={e => upd('invoiceNumber', e.target.value)} placeholder="e.g. 2301359" />
            </div>
            <div>
              <label style={lbl}>PO Number</label>
              <input style={inp} value={form.poNumber} onChange={e => upd('poNumber', e.target.value)} placeholder="e.g. PO-32100" />
            </div>
          </div>

          {/* Duplicate warning */}
          {dupWarning && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px', borderRadius: 8,
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
            }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: '#dc2626' }} />
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                  🔴 {dupWarning.label}
                </p>
                {dupWarning.detail && (
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#dc2626' }}>
                    {dupWarning.detail}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label style={lbl}>Invoice Date</label>
            <input type="date" style={inp} value={form.invoiceDate} onChange={e => upd('invoiceDate', e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Candidate Name(s)</label>
            <input style={inp} value={form.candidateNames} onChange={e => upd('candidateNames', e.target.value)}
              placeholder="Name 1 - Name 2 - Name 3" />
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#9ca3af' }}>Separate multiple names with " - " (dash)</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>
                Pre-VAT (SAR)
                <span style={{ marginLeft: 4, fontWeight: 400, color: '#9ca3af', textTransform: 'none', fontSize: 9 }}>= Total − VAT</span>
              </label>
              <input type="number" style={{ ...inp, backgroundColor: '#f9fafb', color: '#6b7280' }}
                value={form.amountPreVat}
                readOnly
                placeholder="يتحسب تلقائياً"
                title="يتحسب تلقائياً: Total Due - VAT" />
            </div>
            <div>
              <label style={lbl}>VAT (SAR)</label>
              <input type="number" style={inp} value={form.vat}
                onChange={e => {
                  const v = e.target.value;
                  const vatVal  = parseFloat(v) || 0;
                  const total   = parseFloat(form.totalDue) || 0;
                  const preVat  = total ? String(Math.round((total - vatVal) * 100) / 100) : '';
                  setForm(p => ({ ...p, vat: v, amountPreVat: preVat }));
                }}
                placeholder={preVat ? `~${Math.round(preVat * 0.15)}` : '0.00'} />
            </div>
            <div>
              <label style={lbl}>Total Due (SAR)</label>
              <input type="number" style={inp} value={form.totalDue}
                onChange={e => {
                  const v = e.target.value;
                  const total  = parseFloat(v) || 0;
                  const vatVal = parseFloat(form.vat) || 0;
                  const preVat = total ? String(Math.round((total - vatVal) * 100) / 100) : '';
                  setForm(p => ({ ...p, totalDue: v, amountPreVat: preVat }));
                }}
                placeholder={autoTotal ? autoTotal.toFixed(2) : '0.00'} />
            </div>
          </div>

          <div>
            <label style={lbl}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(STATUS).map(([k, cfg]) => (
                <button key={k} onClick={() => upd('status', k)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${form.status === k ? cfg.color : '#e5e7eb'}`,
                  backgroundColor: form.status === k ? cfg.bg : 'white',
                  color: form.status === k ? cfg.color : '#6b7280',
                }}>{cfg.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: M, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Save Invoice
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF IMPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function PDFImportModal({ onClose, onImport, employees = [], invoices = [] }) {
  const [results, setResults]     = useState([]);  // [{filename, data, clientName, partnerName, error, rawText}]
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState('');
  const [defStatus, setDefStatus] = useState('sent');
  const [saving, setSaving]       = useState(false);
  const [showDebug, setShowDebug] = useState(false); // show raw extracted text
  const inputRef = useRef();

  const processPDFs = async (fileList) => {
    const pdfs = [...fileList].filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (!pdfs.length) return;

    setLoading(true);
    setResults([]);
    setLoadMsg('جاري تحميل PDF.js…');

    let pdfjs;
    try {
      pdfjs = await loadPDFjs();
    } catch {
      alert('تعذّر تحميل محلل PDF. تحقق من الاتصال بالإنترنت.');
      setLoading(false);
      return;
    }

    const out = [];
    for (let i = 0; i < pdfs.length; i++) {
      const file = pdfs[i];
      setLoadMsg(`جاري معالجة ${i + 1} / ${pdfs.length}: ${file.name}`);
      try {
        const text = await extractPDFText(pdfjs, file);
        const data = parseFisheyePDF(text);
        const { clientName, partnerName } = matchClientPartner(data.poNumber, employees);
        const duplicate = detectDuplicate(data.invoiceNumber, data.poNumber, invoices);
        out.push({ filename: file.name, data, clientName, partnerName, error: null, rawText: text, duplicate });
      } catch (e) {
        out.push({ filename: file.name, data: null, clientName: '', partnerName: '', error: e.message, rawText: '' });
      }
    }

    setResults(out);
    setLoading(false);
    setLoadMsg('');
  };

  const updateResult = (i, patch) =>
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, data: { ...r.data, ...patch } } : r));

  const updateMeta = (i, patch) =>
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const confirm = async () => {
    // Exclude confirmed duplicates (same invoice + same employee); user can override via "تجاهل"
    const valid = results.filter(r => r.data && !r.error && !r.duplicate);
    if (!valid.length) return;
    setSaving(true);
    const rows = valid.map(r => ({
      id: `${r.data.invoiceNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      poNumber:       r.data.poNumber,
      invoiceNumber:  r.data.invoiceNumber,
      invoiceDate:    r.data.invoiceDate,
      candidateNames: r.data.candidateNames,
      amountPreVat:   r.data.amountPreVat,
      vat:            r.data.vat,
      totalDue:       r.data.totalDue,
      clientName:     r.clientName,
      partnerName:    r.partnerName,
      status:         defStatus,
      paidDate:       null,
      importedAt:     new Date().toISOString(),
    }));
    await onImport(rows, defStatus);
    setSaving(false);
  };

  const fldStyle = { padding: '5px 8px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, width: '100%', boxSizing: 'border-box' };

  return (
    <Overlay onClose={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 720,
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        <ModalHeader title="📄 رفع فواتير PDF"
          sub="ارفع فاتورة أو أكثر — السيستم هيسحب البيانات تلقائياً ويربطها بالعميل والبارتنر"
          onClose={onClose} />

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Drop Zone */}
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: '28px 20px', border: '2px dashed #d1d5db', borderRadius: 10,
            cursor: 'pointer', backgroundColor: '#fafafa', transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}>
            <FileText size={28} style={{ color: '#1d4ed8' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>اختاري ملفات PDF</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
                ممكن ترفعي أكتر من فاتورة في نفس الوقت
              </p>
            </div>
            <input ref={inputRef} type="file" accept=".pdf" multiple
              onChange={e => processPDFs(e.target.files)}
              style={{ display: 'none' }} />
          </label>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              backgroundColor: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: 12, color: '#1d4ed8' }}>
              <Clock size={14} style={{ flexShrink: 0 }}/>
              {loadMsg}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              {/* Debug toggle */}
              <button onClick={() => setShowDebug(v => !v)} style={{
                alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6,
                border: '1px solid #e5e7eb', backgroundColor: showDebug ? '#fef3c7' : 'white',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#6b7280',
              }}>
                {showDebug ? '🔍 إخفاء النص الخام' : '🔍 إظهار النص المستخرج (تشخيص)'}
              </button>

              {/* Status selector */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  حالة الفواتير المستوردة:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(STATUS).map(([k, cfg]) => (
                    <button key={k} onClick={() => setDefStatus(k)} style={{
                      flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${defStatus === k ? cfg.color : '#e5e7eb'}`,
                      backgroundColor: defStatus === k ? cfg.bg : 'white',
                      color: defStatus === k ? cfg.color : '#6b7280',
                    }}>{cfg.label}</button>
                  ))}
                </div>
              </div>

              {/* Invoice cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    border: `1.5px solid ${r.error ? '#fca5a5' : '#e5e7eb'}`,
                    borderRadius: 10, overflow: 'hidden',
                  }}>
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      backgroundColor: r.error ? '#fef2f2' : '#fdf8f8', borderBottom: '1px solid #e5e7eb' }}>
                      <FileText size={14} color={r.error ? '#dc2626' : M} style={{ flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.error ? '#dc2626' : '#374151', flex: 1 }}>
                        {r.filename}
                      </span>
                      {r.data && !r.error && (
                        <>
                          {r.clientName && (
                            <span style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 700 }}>
                              {r.clientName}
                            </span>
                          )}
                          {r.partnerName && (
                            <span style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700 }}>
                              {r.partnerName}
                            </span>
                          )}
                          <span style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700 }}>
                            ✅ تم الاستخراج
                          </span>
                        </>
                      )}
                      {r.error && (
                        <span style={{ fontSize: 11, color: '#dc2626' }}>خطأ: {r.error}</span>
                      )}
                    </div>

                    {/* ── Duplicate warning banner ── */}
                    {r.duplicate && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 14px',
                        backgroundColor: '#fef2f2',
                        borderBottom: '1px solid #fca5a5',
                      }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1, color: '#dc2626' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                            🔴 {r.duplicate.label}
                          </p>
                          {r.duplicate.detail && (
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#dc2626' }}>
                              {r.duplicate.detail}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => updateMeta(i, { duplicate: null })}
                          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid #fca5a5', backgroundColor: 'white', color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          title="تجاهل التحذير وإضافة الفاتورة"
                        >
                          تجاهل وإضافة
                        </button>
                      </div>
                    )}

                    {/* Raw text debug panel */}
                    {showDebug && r.rawText && (
                      <div style={{ padding: '10px 14px', backgroundColor: '#fefce8', borderBottom: '1px solid #fde68a' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                          النص المستخرج من PDF (أول 3000 حرف)
                        </p>
                        <pre style={{
                          margin: 0, fontSize: 10, color: '#1c1917', backgroundColor: 'white',
                          border: '1px solid #e5e7eb', borderRadius: 6,
                          padding: '8px', maxHeight: 200, overflowY: 'auto',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word', direction: 'ltr',
                        }}>
                          {r.rawText.slice(0, 3000)}
                        </pre>
                      </div>
                    )}

                    {/* Extracted fields (editable) */}
                    {r.data && !r.error && (
                      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Invoice #</p>
                          <input style={fldStyle} value={r.data.invoiceNumber}
                            onChange={e => updateResult(i, { invoiceNumber: e.target.value })} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>PO Number</p>
                          <input style={fldStyle} value={r.data.poNumber}
                            onChange={e => {
                              const po = e.target.value;
                              const { clientName, partnerName } = matchClientPartner(po, employees);
                              updateResult(i, { poNumber: po });
                              updateMeta(i, { clientName, partnerName });
                            }} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Date</p>
                          <input type="date" style={fldStyle} value={r.data.invoiceDate}
                            onChange={e => updateResult(i, { invoiceDate: e.target.value })} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Candidate(s)</p>
                          <input style={fldStyle} value={r.data.candidateNames}
                            onChange={e => updateResult(i, { candidateNames: e.target.value })} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                            Pre-VAT (SAR)
                            <span style={{ marginLeft: 4, fontWeight: 400, color: '#9ca3af', textTransform: 'none' }}>= Total − VAT</span>
                          </p>
                          <input type="number" style={{ ...fldStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                            value={r.data.amountPreVat}
                            readOnly
                            title="يتحسب تلقائياً: Total Due - VAT"
                          />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>VAT (SAR)</p>
                          <input type="number" style={fldStyle} value={r.data.vat}
                            onChange={e => {
                              const vat = parseFloat(e.target.value) || 0;
                              const preVat = Math.round((r.data.totalDue - vat) * 100) / 100;
                              updateResult(i, { vat, amountPreVat: preVat });
                            }} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: M, textTransform: 'uppercase' }}>Total Due (SAR)</p>
                          <input type="number" style={{ ...fldStyle, fontWeight: 900, color: M, border: `1.5px solid ${M}` }}
                            value={r.data.totalDue}
                            onChange={e => {
                              const totalDue = parseFloat(e.target.value) || 0;
                              const preVat = Math.round((totalDue - r.data.vat) * 100) / 100;
                              updateResult(i, { totalDue, amountPreVat: preVat });
                            }} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Client</p>
                          <input style={fldStyle} value={r.clientName}
                            onChange={e => updateMeta(i, { clientName: e.target.value })} placeholder="(من PO أو يدوي)" />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Partner</p>
                          <input style={fldStyle} value={r.partnerName}
                            onChange={e => updateMeta(i, { partnerName: e.target.value })} placeholder="(من PO أو يدوي)" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {(() => {
              const total    = results.length;
              const dupCount = results.filter(r => r.duplicate).length;
              const ready    = results.filter(r => r.data && !r.error && !r.duplicate).length;
              return (
                <>
                  <span style={{ fontWeight: 700, color: ready > 0 ? '#16a34a' : '#9ca3af' }}>{ready}</span> / {total} جاهزة
                  {dupCount > 0 && <span style={{ marginLeft: 8, color: '#dc2626', fontWeight: 700 }}>· {dupCount} مكرر</span>}
                </>
              );
            })()}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              إلغاء
            </button>
            <button onClick={confirm} disabled={!results.some(r => r.data && !r.error) || saving} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              backgroundColor: results.some(r => r.data && !r.error) ? '#1d4ed8' : '#e5e7eb',
              color: 'white', fontSize: 13, fontWeight: 700,
              cursor: results.some(r => r.data && !r.error) ? 'pointer' : 'not-allowed',
            }}>
              {saving ? 'جاري الحفظ…' : `إضافة ${results.filter(r => r.data && !r.error).length} فواتير`}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUPLICATE AUDIT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function DupAuditModal({ onClose, invoices, employees, onDelete }) {
  const groups = useMemo(() => scanExistingDuplicates(invoices), [invoices]);

  // Per-group: which invoice ids are marked for deletion
  const [toDelete, setToDelete] = useState(() => {
    // Auto-select the newer duplicate in each group (keep first imported, delete later ones)
    const set = new Set();
    for (const g of scanExistingDuplicates(invoices)) {
      // Sort by importedAt ascending; keep first, mark rest for deletion
      const sorted = [...g.invoices].sort((a, b) =>
        new Date(a.importedAt || 0) - new Date(b.importedAt || 0)
      );
      sorted.slice(1).forEach(inv => set.add(inv.id));
    }
    return set;
  });

  const toggleDelete = (id) =>
    setToDelete(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const confirmDelete = () => {
    if (toDelete.size === 0) { onClose(); return; }
    if (!window.confirm(`حذف ${toDelete.size} فاتورة مكررة؟ هذا لا يمكن التراجع عنه.`)) return;
    onDelete(toDelete);
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{
        backgroundColor: 'white', borderRadius: 14, width: '100%', maxWidth: 680,
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <ModalHeader
          title="🔍 فحص الفواتير المكررة"
          sub="نفس رقم الفاتورة + نفس الموظف (عن طريق الـ PO)"
          onClose={onClose}
        />

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* No duplicates state */}
          {groups.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              padding: '40px 20px', backgroundColor: '#f0fdf4', borderRadius: 12,
              border: '1px solid #86efac',
            }}>
              <Check size={32} style={{ color: '#16a34a' }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                لا توجد فواتير مكررة ✅
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>
                كل الفواتير المسجّلة فريدة لكل موظف
              </p>
            </div>
          )}

          {/* Duplicate groups */}
          {groups.length > 0 && (
            <>
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                backgroundColor: '#fef2f2', border: '1px solid #fca5a5',
                fontSize: 12, color: '#991b1b', fontWeight: 600,
              }}>
                🔴 تم اكتشاف <strong>{groups.length}</strong> مجموعة مكررة
                — اختاري الفواتير اللي عايزة تحذفيها (المحددة تلقائياً هي الأحدث إضافةً)
              </div>

              {groups.map((g, gi) => {
                const sorted = [...g.invoices].sort(
                  (a, b) => new Date(a.importedAt || 0) - new Date(b.importedAt || 0)
                );
                return (
                  <div key={gi} style={{
                    border: '1.5px solid #fca5a5', borderRadius: 10, overflow: 'hidden',
                  }}>
                    {/* Group header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', backgroundColor: '#fef2f2',
                      borderBottom: '1px solid #fecaca',
                    }}>
                      <AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                        فاتورة #{g.invoiceNumber}
                      </span>
                      {g.poNumber && (
                        <>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>·</span>
                          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
                            {g.poNumber}
                          </span>
                        </>
                      )}
                      {/* Show employee names from PO match if available */}
                      {g.poNumber && (() => {
                        const normed = normalizePO(g.poNumber);
                        const emps = employees.filter(e => empPOSet(e).has(normed));
                        return emps.length > 0 ? (
                          <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>
                            · {emps.map(e => e.name).join(', ')}
                          </span>
                        ) : null;
                      })()}
                      <span style={{
                        marginLeft: 'auto', padding: '2px 8px', borderRadius: 5,
                        backgroundColor: '#fee2e2', color: '#dc2626',
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {g.invoices.length} نسخ
                      </span>
                    </div>

                    {/* Invoice rows */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#fafafa' }}>
                          <th style={{ padding: '6px 12px', textAlign: 'center', width: 32, color: '#6b7280', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #f3f4f6' }}>حذف</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #f3f4f6' }}>PO</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #f3f4f6' }}>تاريخ الفاتورة</th>
                          <th style={{ padding: '6px 12px', textAlign: 'right', color: '#6b7280', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #f3f4f6' }}>الإجمالي</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #f3f4f6' }}>الحالة</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #f3f4f6' }}>تاريخ الإضافة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((inv, ii) => {
                          const isMarked  = toDelete.has(inv.id);
                          const isFirst   = ii === 0;
                          const cfg       = STATUS[inv.status] || STATUS.sent;
                          const addedDate = inv.importedAt
                            ? new Date(inv.importedAt).toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—';
                          return (
                            <tr key={inv.id} style={{
                              borderBottom: '1px solid #f9fafb',
                              backgroundColor: isMarked ? '#fef2f2' : 'white',
                              opacity: isMarked ? 0.7 : 1,
                            }}>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isMarked}
                                  onChange={() => toggleDelete(inv.id)}
                                  style={{ cursor: 'pointer', accentColor: '#dc2626' }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6b7280' }}>
                                {inv.poNumber || '—'}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#374151' }}>
                                {inv.invoiceDate || '—'}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 900, color: M }}>
                                {fmtN(inv.totalDue)}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 5,
                                  backgroundColor: cfg.bg, color: cfg.color,
                                  fontSize: 10, fontWeight: 700,
                                }}>
                                  {cfg.label}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 11 }}>
                                {addedDate}
                                {isFirst && (
                                  <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 4, backgroundColor: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700 }}>
                                    الأصلية
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 12, color: toDelete.size > 0 ? '#dc2626' : '#6b7280', fontWeight: toDelete.size > 0 ? 700 : 400 }}>
            {toDelete.size > 0 ? `${toDelete.size} فاتورة محددة للحذف` : 'لا شيء محدد للحذف'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
              backgroundColor: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              إغلاق
            </button>
            {groups.length > 0 && (
              <button onClick={confirmDelete} disabled={toDelete.size === 0} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                backgroundColor: toDelete.size > 0 ? '#dc2626' : '#e5e7eb',
                color: 'white', fontSize: 13, fontWeight: 700,
                cursor: toDelete.size > 0 ? 'pointer' : 'not-allowed',
              }}>
                حذف {toDelete.size > 0 ? `${toDelete.size} فاتورة` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOA RECONCILIATION MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function SOAReconcileModal({ onClose, invoices, onMarkPaid, filterYear = 'all' }) {
  const [activeTab, setActiveTab] = useState('mismatch');
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated]   = useState(false);

  // Which SOA paid nums are relevant to the selected SOA filter
  const relevantPaidNums = useMemo(() => {
    if (filterYear === 'soa2025') return SOA_2025_NUMS;
    if (filterYear === 'soa2026') return SOA_2026_NUMS;
    return SOA_PAID_NUMS; // 'all'
  }, [filterYear]);

  // Build lookup: invoiceNumber → system invoice (scoped to SOA membership)
  const sysMap = useMemo(() => {
    const m = new Map();
    const pool = filterYear === 'all' ? invoices
      : invoices.filter(i => relevantPaidNums.has(String(i.invoiceNumber || '').trim()));
    for (const inv of pool) {
      const n = String(inv.invoiceNumber || '').trim();
      if (n) m.set(n, inv);
    }
    return m;
  }, [invoices, filterYear, relevantPaidNums]);

  // 1. SOA says PAID/settled but system is neither paid nor credit_note
  const needUpdate = useMemo(() =>
    [...relevantPaidNums].filter(num => {
      const inv = sysMap.get(num);
      return inv && inv.status !== 'paid' && inv.status !== 'credit_note';
    }).map(num => ({ num, inv: sysMap.get(num), info: SOA_PAYMENT_INFO[num] })),
    [sysMap, relevantPaidNums]
  );

  // 2. System says PAID or credit_note but SOA doesn't confirm
  const extraPaid = useMemo(() =>
    [...sysMap.values()].filter(inv => {
      const n = String(inv.invoiceNumber || '').trim();
      return (inv.status === 'paid' || inv.status === 'credit_note') && n && !relevantPaidNums.has(n);
    }),
    [sysMap, relevantPaidNums]
  );

  // 3. SOA invoices not found in system
  const notInSystem = useMemo(() =>
    [...relevantPaidNums].filter(num => !sysMap.has(num)),
    [sysMap, relevantPaidNums]
  );

  // System totals for current scope
  const pool = [...sysMap.values()];
  const sysPaidTotal       = pool.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalDue || 0), 0);
  const sysCreditNoteTotal = pool.filter(i => i.status === 'credit_note').reduce((s, i) => s + (i.totalDue || 0), 0);
  const sysSentTotal       = pool.filter(i => i.status === 'sent').reduce((s, i) => s + (i.totalDue || 0), 0);
  const sysOverdueTotal    = pool.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.totalDue || 0), 0);

  // SOA reference numbers — pick the right SOA based on filter
  const soaRows = filterYear === 'soa2026' ? [
    { label: 'الرصيد الافتتاحي (من ٢٠٢٥)', val: 2580402.88 },
    { label: 'مُفوتر في ٢٠٢٦', val: 7653624.54 },
    { label: 'مدفوع (إجمالي مع الرصيد المرحّل)', val: 8249836.14 },
    { label: 'الرصيد المتبقي · إبريل ٢٠٢٦', val: 1984191.28 },
  ] : filterYear === 'soa2025' ? [
    { label: 'رصيد افتتاحي ٢٠٢٥', val: 0 },
    { label: 'مُفوتر في ٢٠٢٥', val: 4538532.36 },
    { label: 'مدفوع في ٢٠٢٥', val: 1958129.48 },
    { label: 'الرصيد المتبقي · ديسمبر ٢٠٢٥', val: 2580402.88 },
  ] : [
    { label: 'ديسمبر ٢٠٢٥ · مُفوتر', val: 4538532.36 },
    { label: 'ديسمبر ٢٠٢٥ · مدفوع', val: 1958129.48 },
    { label: 'إبريل ٢٠٢٦ · مُفوتر', val: 7653624.54 },
    { label: 'إبريل ٢٠٢٦ · مدفوع (كامل)', val: 8249836.14 },
    { label: 'إبريل ٢٠٢٦ · الرصيد المتبقي', val: 1984191.28 },
  ];

  const soaLabel = filterYear === 'soa2026' ? 'SOA إبريل ٢٠٢٦ (يناير → مايو ٢٠٢٦)'
    : filterYear === 'soa2025' ? 'SOA ديسمبر ٢٠٢٥ (يوليو → ديسمبر ٢٠٢٥)'
    : 'SOA ديسمبر ٢٠٢٥ + إبريل ٢٠٢٦';

  const handleUpdateAll = async () => {
    setUpdating(true);
    onMarkPaid(needUpdate.map(x => x.num));
    setTimeout(() => { setUpdating(false); setUpdated(true); }, 400);
  };

  const tabs = [
    { id: 'mismatch', label: `يحتاج تحديث (${needUpdate.length})`, color: needUpdate.length > 0 ? '#c2410c' : '#6b7280' },
    { id: 'extra',    label: `مدفوعة بدون SOA (${extraPaid.length})`, color: extraPaid.length > 0 ? '#7c3aed' : '#6b7280' },
    { id: 'notfound', label: `مش في النظام (${notInSystem.length})`, color: notInSystem.length > 0 ? '#0369a1' : '#6b7280' },
    { id: 'summary',  label: 'المجاميع', color: '#374151' },
  ];

  const rowStyle = { display: 'grid', gridTemplateColumns: '130px 1fr 130px 110px 110px', gap: 0,
    borderBottom: '1px solid #f3f4f6', padding: '7px 14px', fontSize: 12, alignItems: 'center' };
  const hdrStyle = { ...rowStyle, backgroundColor: '#f9fafb', fontWeight: 700, color: '#374151',
    borderBottom: '2px solid #e5e7eb', fontSize: 11 };

  return (
    <Overlay onClose={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: 14, width: '92vw', maxWidth: 860,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>مقارنة SOA</h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>
                {soaLabel} · {relevantPaidNums.size} فاتورة مدفوعة
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '7px 14px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                backgroundColor: activeTab === t.id ? 'white' : 'transparent',
                color: activeTab === t.id ? t.color : '#9ca3af',
                borderBottom: activeTab === t.id ? '2px solid white' : 'none',
                marginBottom: activeTab === t.id ? -1 : 0,
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>

          {/* Tab: needs update */}
          {activeTab === 'mismatch' && (
            <div>
              {needUpdate.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#16a34a' }}>
                  <Check size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>كل الفواتير المدفوعة في SOA محدّثة في النظام ✓</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#c2410c', fontWeight: 700 }}>
                      {needUpdate.length} فاتورة · SOA يؤكد دفعها لكن الحالة في النظام مش "Paid"
                    </span>
                    {!updated ? (
                      <button onClick={handleUpdateAll} disabled={updating} style={{
                        padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        backgroundColor: '#16a34a', color: 'white', fontSize: 12, fontWeight: 700,
                      }}>
                        {updating ? '...' : `✓ تحديث الكل (${needUpdate.length})`}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✓ تم التحديث</span>
                    )}
                  </div>
                  <div style={hdrStyle}>
                    <span>رقم الفاتورة</span>
                    <span>المبلغ</span>
                    <span>الحالة في النظام</span>
                    <span>رقم الدفعة</span>
                    <span>تاريخ الدفع</span>
                  </div>
                  {needUpdate.map(({ num, inv, info }) => (
                    <div key={num} style={{ ...rowStyle, backgroundColor: '#fff7ed' }}>
                      <span style={{ fontWeight: 700, color: '#c2410c', fontFamily: 'var(--font-mono)' }}>{num}</span>
                      <span style={{ color: '#374151' }}>{fmtSAR(inv.totalDue)}</span>
                      <span>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          backgroundColor: STATUS[inv.status]?.bg, color: STATUS[inv.status]?.color }}>
                          {STATUS[inv.status]?.label || inv.status}
                        </span>
                      </span>
                      <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono)' }}>{info?.ref || '—'}</span>
                      <span style={{ color: '#6b7280' }}>{info?.date || '—'}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Tab: paid in system but not in SOA */}
          {activeTab === 'extra' && (
            <div>
              {extraPaid.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#16a34a' }}>
                  <Check size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>كل الفواتير المدفوعة في النظام موجودة في SOA ✓</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 14px', fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>
                    {extraPaid.length} فاتورة حالتها "Paid" في النظام لكن مش مؤكدة في SOA — تحقق منها
                  </div>
                  <div style={hdrStyle}>
                    <span>رقم الفاتورة</span>
                    <span>المبلغ</span>
                    <span>تاريخ الدفع</span>
                    <span>PO</span>
                    <span>تاريخ الفاتورة</span>
                  </div>
                  {extraPaid.map(inv => (
                    <div key={inv.id} style={{ ...rowStyle, backgroundColor: '#faf5ff' }}>
                      <span style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>{inv.invoiceNumber}</span>
                      <span style={{ color: '#374151' }}>{fmtSAR(inv.totalDue)}</span>
                      <span style={{ color: '#6b7280' }}>{inv.paidDate || '—'}</span>
                      <span style={{ color: '#6b7280', fontSize: 11 }}>{inv.poNumber || '—'}</span>
                      <span style={{ color: '#6b7280' }}>{inv.invoiceDate || '—'}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Tab: in SOA but not in system */}
          {activeTab === 'notfound' && (
            <div>
              {notInSystem.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#16a34a' }}>
                  <Check size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>كل الفواتير المدفوعة في SOA موجودة في النظام ✓</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 14px', fontSize: 12, color: '#0369a1', fontWeight: 700 }}>
                    {notInSystem.length} فاتورة مدفوعة في SOA مش موجودة في النظام — لازم تتضاف
                  </div>
                  <div style={{ ...hdrStyle, gridTemplateColumns: '130px 130px 1fr' }}>
                    <span>رقم الفاتورة</span>
                    <span>رقم الدفعة</span>
                    <span>تاريخ الدفع</span>
                  </div>
                  {notInSystem.map(num => {
                    const info = SOA_PAYMENT_INFO[num];
                    return (
                      <div key={num} style={{ ...rowStyle, gridTemplateColumns: '130px 130px 1fr', backgroundColor: '#f0f9ff' }}>
                        <span style={{ fontWeight: 700, color: '#0369a1', fontFamily: 'var(--font-mono)' }}>{num}</span>
                        <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono)' }}>{info?.ref || '—'}</span>
                        <span style={{ color: '#6b7280' }}>{info?.date || '—'}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Tab: summary */}
          {activeTab === 'summary' && (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* SOA totals */}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 10 }}>📄 {soaLabel}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {soaRows.map(({ label, val }) => (
                    <div key={label} style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: M, fontFamily: 'var(--font-mono)' }}>{fmtSAR(val)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System totals */}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 10 }}>
                  🖥️ النظام — {filterYear === 'soa2025' ? 'SOA ديسمبر ٢٠٢٥' : filterYear === 'soa2026' ? 'SOA إبريل ٢٠٢٦' : 'الحالة الكاملة'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Paid', val: sysPaidTotal, color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Credit Notes', val: sysCreditNoteTotal, color: '#7c3aed', bg: '#f5f3ff', prefix: '−' },
                    { label: 'Sent / Pending', val: sysSentTotal, color: '#2563eb', bg: '#dbeafe' },
                    { label: 'Overdue', val: sysOverdueTotal, color: '#dc2626', bg: '#fee2e2' },
                  ].map(({ label, val, color, bg, prefix = '' }) => (
                    <div key={label} style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: bg, border: `1px solid ${color}22` }}>
                      <div style={{ fontSize: 11, color, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontWeight: 900, fontSize: 14, color, fontFamily: 'var(--font-mono)' }}>{prefix}{fmtSAR(val)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delta */}
              <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: '#fefce8', border: '1px solid #fde047' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#713f12', marginBottom: 8 }}>⚡ التباين الحالي</div>
                <div style={{ fontSize: 12, color: '#713f12', lineHeight: 1.9 }}>
                  <div>فواتير SOA مؤكدة الدفع لكن في النظام مش Paid: <strong>{needUpdate.length} فاتورة</strong></div>
                  <div>فواتير Paid في النظام بدون تأكيد في SOA: <strong>{extraPaid.length} فاتورة</strong></div>
                  <div>فواتير في SOA غير موجودة في النظام: <strong>{notInSystem.length} فاتورة</strong></div>
                  {needUpdate.length > 0 && (
                    <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: '#fef9c3', borderRadius: 6 }}>
                      💡 افتح تبويب "يحتاج تحديث" واضغط "تحديث الكل" عشان تصلح الفرق دلوقتي
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 22px', borderRadius: 8, border: '1.5px solid #e5e7eb', backgroundColor: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            إغلاق
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  // Lock every scrollable element while modal is open
  useEffect(() => {
    const prevBody    = document.body.style.overflow;
    const prevHtml    = document.documentElement.style.overflow;
    document.body.style.overflow            = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Also lock the app's inner content scroll container (App.jsx content div)
    const contentEl = document.getElementById('app-main-content');
    const prevContent = contentEl ? contentEl.style.overflow : null;
    if (contentEl) contentEl.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow            = prevBody;
      document.documentElement.style.overflow = prevHtml;
      if (contentEl) contentEl.style.overflow = prevContent;
    };
  }, []);

  // Use a Portal so the modal DOM node is attached to <body> directly,
  // not inside the scrollable content container — prevents browser auto-scroll.
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, zIndex: 9999,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      {children}
    </div>,
    document.body
  );
}

function ModalHeader({ title, sub, onClose }) {
  return (
    <div style={{ padding: '16px 20px', background: `linear-gradient(135deg, #5c0000, ${M})`, borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h3 style={{ margin: 0, color: 'white', fontSize: 15, fontWeight: 700 }}>{title}</h3>
        {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,200,200,0.85)', maxWidth: 420 }}>{sub}</p>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', marginTop: 2 }}>
        <X size={16} />
      </button>
    </div>
  );
}
