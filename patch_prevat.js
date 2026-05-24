// ── Fisheye: Fix amountPreVat for ALL invoices ─────────────────────────────
// Paste in browser console. Sets amountPreVat = totalDue - vat for every invoice.

(function() {
  const KEY = 'fisheye_invoices_v1';
  let invoices;
  try { invoices = JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch(e) { console.error('Could not read invoices:', e); return; }

  let updated = 0;
  const patched = invoices.map(inv => {
    const td  = inv.totalDue  || 0;
    const vat = inv.vat       || 0;
    const correctPreVat = Math.round((td - vat) * 100) / 100;
    if (inv.amountPreVat === correctPreVat) return inv;
    updated++;
    return { ...inv, amountPreVat: correctPreVat };
  });

  localStorage.setItem(KEY, JSON.stringify(patched));
  console.log(`✓ Fixed amountPreVat for ${updated} invoices`);
  console.log('↺ Refresh the page to see changes.');
})();
