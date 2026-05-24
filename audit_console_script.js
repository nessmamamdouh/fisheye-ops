// ══════════════════════════════════════════════════════════════
// FISHEYE INVOICE AUDIT — paste this in browser console
// while the Fisheye app is open (localhost)
// Data from BOTH SOAs: December 2025 + April 2026
// ══════════════════════════════════════════════════════════════

const SOA_PAID = new Set([
  // ── December 2025 SOA ────────────────────────────────────────
  // Payment 714 (09 Oct 2025)
  '2300648','2300650','2300651','2300672','2300673',
  '2300681','2300682','2300683','2300684','2300685','2300686','2300687','2300688',
  '2300705','2300706','2300707',
  '2300728','2300729','2300730','2300731','2300732','2300733','2300734','2300735',
  '2300742','2300743','2300744',
  '2300771','2300772','2300773','2300774','2300775','2300776','2300777','2300778',
  '2300779','2300780','2300781','2300782','2300783','2300784','2300785','2300786',
  '2300788','2300789',
  // Payment 738 (09 Nov 2025)
  '2300818','2300819','2300825','2300826','2300827','2300828','2300829',
  // Credit notes 2025
  '2300787', // CN-00120
  // ── April 2026 SOA ───────────────────────────────────────────
  // Payment 800 (01 Jan 2026)
  '2300855','2300856','2300887','2300929','2300930','2300932','2300933','2300934',
  '2300935','2300937','2300938','2300940','2300968','2300969','2300970','2300971',
  '2300973','2300974','2300975','2300976',
  // Payment 826 (05 Feb 2026)
  '2301012','2301013','2301015','2301017','2301018','2301019','2301020','2301021',
  '2301022','2301023','2301051','2301052','2301053','2301054','2301055','2301056',
  '2301143',
  // Payment 845 (09 Mar 2026)
  '2300854','2300931','2300972','2301004','2301005','2301006','2301007','2301009',
  '2301066','2301079','2301080','2301081','2301083','2301084','2301085','2301086',
  '2301088','2301089','2301090','2301114','2301115','2301116','2301117','2301118',
  '2301119','2301120',
  // Payment 910 applied (13 May 2026)
  '2301082','2301087','2301121','2301127','2301128','2301129','2301130','2301131',
  '2301132','2301134','2301135','2301136','2301146','2301147','2301148','2301149',
  '2301150','2301151','2301152','2301153','2301154',
  '2301196','2301197','2301198','2301199','2301200','2301201','2301202','2301203',
  '2301204','2301205','2301206','2301208','2301209','2301210','2301211','2301212',
  '2301213','2301215','2301216','2301217','2301218','2301219','2301220','2301221',
  '2301222','2301223','2301224','2301225','2301228','2301229','2301230','2301231',
  '2301232','2301233','2301235','2301236','2301237','2301238','2301239','2301240',
  '2301241','2301242','2301248','2301250','2301251','2301252','2301253','2301254',
  '2301255','2301256','2301258','2301309','2301375','2301377',
  // Payment 907 (29 Apr 2026)
  '2301281','2301282','2301284','2301285','2301286','2301287','2301288','2301289',
  '2301292','2301293','2301294','2301295','2301296','2301297','2301298','2301299',
  '2301300','2301302','2301303','2301304','2301305','2301306','2301307','2301308',
  '2301310','2301311','2301312','2301313',
  '2301331','2301332','2301333','2301334','2301335','2301336','2301337','2301338',
  '2301339','2301341','2301342',
  // Credit notes 2026
  '2301014', // CN-00185
  '2301126', // CN-00210
  '2301137', // CN-00211
]);

// All invoices in BOTH SOAs confirmed outstanding (issued, never paid)
const SOA_OUTSTANDING = new Set([
  // From Dec 2025 SOA — issued Oct/Dec, never paid in any payment
  '2300857',  // Oct 23 2025 — SAR 27,945
  '2301003',  // Dec 18 2025 — SAR 112,219.13
  '2301008',  // Dec 18 2025 — SAR 21,935.83
  '2301016',  // Dec 21 2025 — SAR 25,798.30
  // From Apr 2026 SOA — issued 2026, never paid
  '2301133',  // Jan 29
  '2301207','2301214','2301226','2301227','2301234','2301243',  // Mar 8
  '2301249','2301257',  // Mar 12
  '2301283','2301290','2301291','2301301',  // Mar 28
  // Apr 19 batch
  '2301359','2301360','2301361','2301362','2301363','2301364','2301365','2301366',
  '2301367','2301368','2301369','2301370','2301371','2301372','2301373','2301374',
  '2301376','2301378','2301379','2301380','2301381','2301382','2301383','2301384','2301385',
  // Apr 23 batch
  '2301408','2301409','2301410','2301411','2301412','2301413',
  // May 5 batch
  '2301426','2301427','2301428',
  // May 13 batch (partially funded by payment 910 but still shown as outstanding)
  '2301440','2301441','2301442','2301443','2301444','2301445','2301446','2301447',
]);

let invoices = [];
try { invoices = JSON.parse(localStorage.getItem('fisheye_invoices_v1') || '[]'); } catch {}

if (!invoices.length) {
  console.warn('❌ No invoices found in localStorage. Open the Fisheye app first, then run this.');
} else {
  const systemNums = invoices.map(i => String(i.invoiceNumber||'').trim());

  // ── 1. DUPLICATES ─────────────────────────────────────────────
  const freq = {};
  systemNums.forEach(n => { if(n) freq[n] = (freq[n]||0)+1; });
  const dups = Object.entries(freq).filter(([,c])=>c>1);

  console.group(`%c📋 INVOICE AUDIT (Both SOAs) — ${invoices.length} invoices in system`, 'font-size:14px;font-weight:bold;color:#800000');

  if (dups.length) {
    console.group(`%c⚠️ DUPLICATES — ${dups.length} invoice number(s) appear more than once`, 'color:#9d174d;font-weight:bold');
    dups.forEach(([num, count]) => {
      const rows = invoices.filter(i => String(i.invoiceNumber||'').trim() === num);
      console.log(`  ${num}  ×${count}  |  statuses: ${rows.map(r=>r.status).join(', ')}  |  imported: ${rows.map(r=>(r.importedAt||'').substring(0,10)).join(', ')}`);
    });
    console.groupEnd();
  } else {
    console.log('%c✅ No duplicates', 'color:#16a34a');
  }

  // ── 2. STATUS MISMATCHES ──────────────────────────────────────
  const mismatches = invoices.filter(inv => {
    const n = String(inv.invoiceNumber||'').trim();
    if (SOA_PAID.has(n) && inv.status !== 'paid') return true;
    if (SOA_OUTSTANDING.has(n) && inv.status === 'paid') return true;
    return false;
  });

  if (mismatches.length) {
    console.group(`%c⚠️ STATUS MISMATCHES — ${mismatches.length} invoice(s)`, 'color:#dc2626;font-weight:bold');
    console.table(mismatches.map(inv => {
      const n = String(inv.invoiceNumber||'').trim();
      return {
        'Invoice #': n,
        'System Status': inv.status,
        'SOA Says': SOA_PAID.has(n) ? 'PAID' : 'OUTSTANDING',
        'Fix': SOA_PAID.has(n) ? `Change to "paid"` : `SOA outstanding — verify before changing`,
      };
    }));
    console.groupEnd();
  } else {
    console.log('%c✅ No status mismatches', 'color:#16a34a');
  }

  // ── 3. OUTSTANDING IN SOA BUT MISSING FROM SYSTEM ────────────
  const inSystem = new Set(systemNums.filter(Boolean));
  const missing = [...SOA_OUTSTANDING].filter(n => !inSystem.has(n));

  if (missing.length) {
    console.group(`%c❌ OUTSTANDING in SOA but NOT in system — ${missing.length} invoices`, 'color:#a16207;font-weight:bold');
    console.log(missing.join(', '));
    console.groupEnd();
  } else {
    console.log('%c✅ All SOA outstanding invoices are in the system', 'color:#16a34a');
  }

  // ── 4. IN SYSTEM BUT NOT IN EITHER SOA ───────────────────────
  const notInSOA = invoices.filter(inv => {
    const n = String(inv.invoiceNumber||'').trim();
    return n && !SOA_PAID.has(n) && !SOA_OUTSTANDING.has(n);
  });

  if (notInSOA.length) {
    console.group(`%cℹ️ In system but NOT in either SOA — ${notInSOA.length} invoice(s)`, 'color:#6b7280;font-weight:bold');
    console.table(notInSOA.map(i=>({'Invoice #':i.invoiceNumber,'PO':i.poNumber,'Status':i.status,'Total':i.totalDue})));
    console.groupEnd();
  } else {
    console.log('%c✅ All system invoices appear in the SOAs', 'color:#16a34a');
  }

  // ── 5. FULL LIST ──────────────────────────────────────────────
  console.group('%c📄 Full invoice list', 'color:#374151;font-weight:bold');
  console.table(invoices
    .sort((a,b) => String(a.invoiceNumber).localeCompare(String(b.invoiceNumber)))
    .map(inv => {
      const n = String(inv.invoiceNumber||'').trim();
      const soaSt = SOA_PAID.has(n) ? 'PAID' : SOA_OUTSTANDING.has(n) ? 'OUTSTANDING' : 'NOT IN SOA';
      const match =
        (soaSt==='PAID' && inv.status==='paid') ||
        (soaSt==='OUTSTANDING' && inv.status!=='paid') ||
        soaSt==='NOT IN SOA';
      const isDup = (freq[n]||0) > 1;
      return {
        'Invoice #': isDup ? `${n} ⚠️DUP` : n,
        'PO': inv.poNumber,
        'System': inv.status,
        'SOA': soaSt,
        'Match?': soaSt==='NOT IN SOA' ? '—' : match ? '✅' : '❌',
        'Total Due': inv.totalDue,
      };
    })
  );
  console.groupEnd();

  console.groupEnd();
}
