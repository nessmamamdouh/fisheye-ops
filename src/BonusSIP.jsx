import React, { useState, useEffect, useMemo } from 'react';
import { getClientsList } from './utils/helpers';
import { supabase } from './utils/supabase';
import { calcLine, calcPartnerPayout, parseDate } from './FinanceModule';

// Implements the SIP Outsourcing Policy (Ref. FE-2026-010) incentive calculator:
// Gross Margin achievement vs. annual target → CAT 1-3 incentive tiers, year-end
// over-achievement, and (for Account Management) margin-sharing on handed-over
// clients. Used two ways: as the "My Bonus" sidebar tab inside the main app shell
// (embedded=true, no own page chrome) and as a standalone page at /my-bonus
// (embedded=false, renders its own full-page background/header).

const M  = '#A02843';
const MD = '#00293A';
const STORAGE_KEY = 'fisheye_bonus_sip_v1';

const fC = n => Number(n || 0).toLocaleString('en-SA', { maximumFractionDigits: 0 });
const fPct = n => `${(Number(n || 0) * 100).toFixed(1)}%`;

// Same three helpers used by the Forecast tab's contract-based GM logic —
// duplicated locally (rather than imported) since they're one-liners tied to the
// employee record shape, not worth coupling two standalone pages over.
const hasPO = e => !!(e.poNumbers && String(e.poNumbers).trim() !== '');
const hasPricing = e => (e.profitMode === 'partner' ? Number(e.clientPrice || 0) > 0 : Number(e.fisheyeMargin || 0) > 0);
const isActiveInMonth = (e, year, month) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const start = parseDate(e.startDate);
  const end = parseDate(e.endDate);
  return (!start || start <= monthEnd) && (!end || end >= monthStart);
};

// Manual GM correction — Sela's system-computed H1 2026 GM (SAR 564,063.72) sits
// below the official finance figure from Ahmed Talaat's H1 email (SAR 596,682.45),
// a known ~32,619 SAR gap the system doesn't yet capture (contract-timing/invoice
// lag, not a data error worth reconciling employee-by-employee across 474 records).
// Applied ONLY here in the bonus calculator, added to H1 gm/nm alongside the
// system total — the Forecast tab is left untouched and stays 100% system-derived.
const GM_CORRECTIONS = {
  Sela: { period: 'H1', amount: 596682.45 - 564063.72 }, // = 32,618.73
};

// CAT 1-3 tiers from the policy §5.1 — same table for both roles.
const categoryFor = pct => {
  if (pct >= 1)    return { name: 'CAT 1 — Outstanding',        rate: 0.15, color: '#059669' };
  if (pct >= 0.9)  return { name: 'CAT 2 — Strong',              rate: 0.10, color: '#0369a1' };
  if (pct >= 0.8)  return { name: 'CAT 3 — Acceptable',          rate: 0.05, color: '#d97706' };
  return               { name: 'Below 80% — Not Eligible',   rate: 0,    color: '#9ca3af' };
};

export default function BonusSIP({ employees = [], embedded = false }) {
  const [role, setRole] = useState('Account Management');
  const [annualTarget, setAnnualTarget] = useState(0);
  const [selectedClients, setSelectedClients] = useState([]);
  const [marginSharing, setMarginSharing] = useState([]); // [{ client, gm }]
  const [adjustmentPct, setAdjustmentPct] = useState(0);   // manual §8 penalty deduction, if any
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState('idle');      // idle | saving | saved

  const allClients = useMemo(() => getClientsList(employees), [employees]);

  // ── Load saved settings from Supabase (fisheye_app_data) ───────────────────
  useEffect(() => {
    let cancelled = false;
    supabase.from('fisheye_app_data').select('data').eq('key', STORAGE_KEY).single()
      .then(({ data }) => {
        if (cancelled || !data?.data) return;
        const d = data.data;
        if (d.role) setRole(d.role);
        if (typeof d.annualTarget === 'number') setAnnualTarget(d.annualTarget);
        if (Array.isArray(d.selectedClients)) setSelectedClients(d.selectedClients);
        if (Array.isArray(d.marginSharing)) setMarginSharing(d.marginSharing);
        if (typeof d.adjustmentPct === 'number') setAdjustmentPct(d.adjustmentPct);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // ── Persist settings (debounced) once loaded ────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    setSaveState('saving');
    const t = setTimeout(() => {
      supabase.from('fisheye_app_data')
        .upsert({ key: STORAGE_KEY, data: { role, annualTarget, selectedClients, marginSharing, adjustmentPct } }, { onConflict: 'key' })
        .then(({ error }) => setSaveState(error ? 'idle' : 'saved'))
        .catch(() => setSaveState('idle'));
    }, 600);
    return () => clearTimeout(t);
  }, [loaded, role, annualTarget, selectedClients, marginSharing, adjustmentPct]);

  const now = new Date();
  const currentYear = now.getFullYear();

  // ── Achieved GM & Net Margin across selected clients, split H1 (Jan-Jun) /
  // H2 (Jul-Dec) ─ Same methodology as the Forecast tab: Gross Margin is always
  // the employee's real contracted margin rate (never Revenue minus Payroll),
  // Net Margin = Gross Margin minus partner payout (0 for direct-mode employees).
  // Summed across every month each contract was active this year — including
  // contracts that have since ended, since that margin was still genuinely
  // earned during the year.
  const gmBreakdown = useMemo(() => {
    let gmH1 = 0, gmH2 = 0, nmH1 = 0, nmH2 = 0;
    const perClient = [];
    selectedClients.forEach(clientName => {
      const clientEmployeesAll = employees.filter(e => String(e.client || '').trim() === clientName);
      const priced = clientEmployeesAll.filter(e => hasPO(e) && hasPricing(e) && Number(e.totalPackage || 0) > 0);
      const fallbackRatio = priced.length
        ? priced.reduce((s, e) => s + calcLine(e).margin / Number(e.totalPackage), 0) / priced.length
        : 0.15;
      const gmForEmp = e => (hasPricing(e) ? calcLine(e).margin : Number(e.totalPackage || 0) * fallbackRatio);
      let clientGM = 0, clientNM = 0;
      for (let month = 1; month <= 12; month++) {
        clientEmployeesAll.forEach(e => {
          if (isActiveInMonth(e, currentYear, month)) {
            const gm = gmForEmp(e);
            const nm = gm - calcPartnerPayout(e);
            clientGM += gm;
            clientNM += nm;
            if (month <= 6) { gmH1 += gm; nmH1 += nm; } else { gmH2 += gm; nmH2 += nm; }
          }
        });
      }
      const correction = GM_CORRECTIONS[clientName];
      if (correction) {
        clientGM += correction.amount;
        clientNM += correction.amount;
        if (correction.period === 'H1') { gmH1 += correction.amount; nmH1 += correction.amount; }
        else { gmH2 += correction.amount; nmH2 += correction.amount; }
      }
      perClient.push({ client: clientName, gm: clientGM, netMargin: clientNM, headcount: clientEmployeesAll.length, correction: correction?.amount || 0 });
    });
    return { gmH1, gmH2, gmAnnual: gmH1 + gmH2, nmH1, nmH2, nmAnnual: nmH1 + nmH2, perClient };
  }, [employees, selectedClients, currentYear]);

  // ── Policy math (§5 Incentives, §6 Margin Sharing) ──────────────────────────
  // Target, achievement %, category, and over-achievement all run on Net Margin
  // (Gross Margin minus partner payout) rather than raw Gross Margin.
  const annualPct = annualTarget > 0 ? gmBreakdown.nmAnnual / annualTarget : 0;
  const annualCategory = categoryFor(annualPct);
  // Category incentive rate applies up to the target only — capped at
  // min(achieved, target). Everything achieved beyond 100% of target is NOT paid
  // again at the (higher) category rate; it flows entirely into Over-achievement
  // below, at the lower 5%/10% rate, so it's never double-counted.
  const categoryIncentive = annualCategory.rate * Math.min(gmBreakdown.nmAnnual, annualTarget);

  const overAchievementRate = role === 'Sales Hunter' ? 0.10 : 0.05;
  const overAchievementBase = Math.max(0, gmBreakdown.nmAnnual - annualTarget);
  const overAchievementIncentive = annualPct > 1 ? overAchievementRate * overAchievementBase : 0;

  const marginSharingTotal = role === 'Account Management'
    ? marginSharing.reduce((s, m) => s + Number(m.gm || 0) * 0.05, 0)
    : 0;

  const grossTotal = categoryIncentive + overAchievementIncentive + marginSharingTotal;
  const adjustmentAmount = grossTotal * (Number(adjustmentPct || 0) / 100);
  const netTotal = grossTotal - adjustmentAmount;

  // 1st payment (End-August) is evaluated against 40% of the annual target (H1
  // sub-target) — same capping rule as above: paid up to min(H1 achieved, H1
  // sub-target), never on the excess. The 2nd payment (End-February) covers the
  // remaining 60% of the target's worth of CAT incentive, plus all over-
  // achievement and margin sharing, and always trues up to the real annual
  // figures above regardless.
  const h1TargetShare = annualTarget * 0.4;
  const h1Pct = h1TargetShare > 0 ? gmBreakdown.nmH1 / h1TargetShare : 0;
  const h1Category = categoryFor(h1Pct);
  const payment1 = h1Category.rate * Math.min(gmBreakdown.nmH1, h1TargetShare);
  const payment2 = grossTotal - payment1;

  const toggleClient = name => {
    setSelectedClients(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };
  const addMarginSharingRow = () => setMarginSharing(prev => [...prev, { client: '', gm: 0 }]);
  const updateMarginSharingRow = (idx, field, value) => setMarginSharing(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  const removeMarginSharingRow = idx => setMarginSharing(prev => prev.filter((_, i) => i !== idx));

  const card = { backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
  const label = { fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };
  const sectionTitle = { fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 };
  const sectionDesc = { fontSize: 11, color: '#9ca3af', marginBottom: 16 };

  const Wrapper = embedded ? React.Fragment : 'div';
  const wrapperProps = embedded ? {} : { style: { backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif', padding: '28px 32px' } };

  return (
    <Wrapper {...wrapperProps}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        {!embedded && (
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#111827', letterSpacing: '-0.3px' }}>My Bonus — SIP Outsourcing Policy</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Personal incentive calculator, Ref. FE-2026-010 · {currentYear}
            {saveState === 'saving' && <span style={{ marginLeft: 8, color: '#d97706' }}>saving…</span>}
            {saveState === 'saved' && <span style={{ marginLeft: 8, color: '#059669' }}>saved</span>}
          </div>
        </div>
        )}
        {embedded && (
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          Personal incentive calculator, Ref. FE-2026-010 · {currentYear}
          {saveState === 'saving' && <span style={{ marginLeft: 8, color: '#d97706' }}>saving…</span>}
          {saveState === 'saved' && <span style={{ marginLeft: 8, color: '#059669' }}>saved</span>}
        </div>
        )}

        {/* Settings */}
        <div style={card}>
          <div style={sectionTitle}>Settings</div>
          <div style={sectionDesc}>Set these once — they're saved automatically.</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
            <div>
              <div style={label}>Your role</div>
              <select value={role} onChange={e => setRole(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                <option value="Account Management">Account Management</option>
                <option value="Sales Hunter">Sales Hunter</option>
              </select>
            </div>
            <div>
              <div style={label}>Annual Net Margin Target ({currentYear}, SAR)</div>
              <input type="number" value={annualTarget || ''} onChange={e => setAnnualTarget(Number(e.target.value) || 0)}
                placeholder="e.g. 1,500,000"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }} />
            </div>
          </div>

          <div style={label}>Your clients ({selectedClients.length} selected — Net Margin is summed automatically from their contracts)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {allClients.map(c => (
              <button key={c} onClick={() => toggleClient(c)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${selectedClients.includes(c) ? M : '#e5e7eb'}`,
                  background: selectedClients.includes(c) ? `${M}12` : 'white',
                  color: selectedClients.includes(c) ? M : '#6b7280',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Net Margin Achievement */}
        <div style={{ ...card, backgroundColor: MD }}>
          <div style={{ ...sectionTitle, color: 'white' }}>Net Margin Achievement — {currentYear}</div>
          <div style={{ ...sectionDesc, color: '#93c5fd' }}>From your selected clients' contracts — Gross Margin minus partner payout (Gross Margin achieved: SAR {fC(gmBreakdown.gmAnnual)})</div>
          {gmBreakdown.perClient.some(c => c.correction) && (
            <div style={{ fontSize: 10, color: '#fcd34d', marginTop: -8, marginBottom: 14 }}>
              Includes a manual H1 correction for Sela (+SAR {fC(GM_CORRECTIONS.Sela.amount)}) to match Ahmed Talaat's official finance figures — bonus calculator only, Forecast tab is unaffected.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { l: 'H1 Achieved (Jan-Jun)', v: `SAR ${fC(gmBreakdown.nmH1)}` },
              { l: 'H2 Achieved (Jul-Dec)', v: `SAR ${fC(gmBreakdown.nmH2)}` },
              { l: 'Annual Achieved Net Margin', v: `SAR ${fC(gmBreakdown.nmAnnual)}` },
              { l: 'Achievement vs. Target', v: fPct(annualPct), accent: annualCategory.color },
            ].map((it, i) => (
              <div key={it.l} style={{ padding: i > 0 ? '0 16px' : '0 16px 0 0', borderLeft: i > 0 ? '1px solid #ffffff22' : 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{it.l}</div>
                <div style={{ fontSize: 19, fontWeight: 900, color: it.accent || 'white', fontFamily: 'monospace' }}>{it.v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: `${annualCategory.color}22`, border: `1px solid ${annualCategory.color}55` }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: annualCategory.color }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{annualCategory.name}</span>
          </div>
        </div>

        {/* Incentive breakdown */}
        <div style={card}>
          <div style={sectionTitle}>Incentive Breakdown</div>
          <div style={sectionDesc}>Category incentive on achieved Net Margin (§5.1), over-achievement (§5.2), margin sharing (§6)</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', color: '#374151' }}>Category incentive — {annualCategory.name} ({fPct(annualCategory.rate)}, capped at target — excess goes to Over-achievement below)</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>SAR {fC(categoryIncentive)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', color: '#374151' }}>
                  Over-achievement ({fPct(overAchievementRate)} of Net Margin above target, {role}, paid End-February)
                  {annualPct <= 1 && <span style={{ color: '#9ca3af', fontWeight: 600 }}> — not applicable yet (under 100%)</span>}
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>SAR {fC(overAchievementIncentive)}</td>
              </tr>
              {role === 'Account Management' && (
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 0', color: '#374151' }}>Margin sharing (5% of GM on handed-over clients)</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>SAR {fC(marginSharingTotal)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', color: '#374151', fontWeight: 800 }}>Gross total</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#374151' }}>SAR {fC(grossTotal)}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', color: '#374151' }}>
                  Governance adjustment / deduction (§8 — client non-payment up to 10%, gov. fines, etc.)
                  <input type="number" value={adjustmentPct || ''} onChange={e => setAdjustmentPct(Number(e.target.value) || 0)}
                    placeholder="0" style={{ width: 60, marginLeft: 8, padding: '3px 6px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace' }} />%
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>− SAR {fC(adjustmentAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 14, padding: '14px 18px', borderRadius: 10, background: `${M}10`, border: `1px solid ${M}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: M }}>Net Payable Incentive — {currentYear}</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: M, fontFamily: 'monospace' }}>SAR {fC(netTotal)}</span>
          </div>
        </div>

        {/* Margin sharing entries (only relevant for AM) */}
        {role === 'Account Management' && (
          <div style={card}>
            <div style={sectionTitle}>Margin Sharing — Handed-Over Clients</div>
            <div style={sectionDesc}>Add each client a Sales Hunter formally handed over to you, with that client's annual GM — you get 5% of it, on top of your standard incentive, at year-end</div>
            {marginSharing.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <select value={row.client} onChange={e => updateMarginSharingRow(idx, 'client', e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12 }}>
                  <option value="">Select client…</option>
                  {allClients.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" value={row.gm || ''} onChange={e => updateMarginSharingRow(idx, 'gm', Number(e.target.value) || 0)}
                  placeholder="Annual GM (SAR)" style={{ width: 180, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace' }} />
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 700, width: 100 }}>= SAR {fC(Number(row.gm || 0) * 0.05)}</span>
                <button onClick={() => removeMarginSharingRow(idx)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
              </div>
            ))}
            <button onClick={addMarginSharingRow}
              style={{ marginTop: 6, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${M}55`, background: 'white', color: M, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Add handed-over client
            </button>
          </div>
        )}

        {/* Payment schedule */}
        <div style={card}>
          <div style={sectionTitle}>Payment Schedule (§5.3)</div>
          <div style={sectionDesc}>
            1st payment is evaluated against 40% of the annual target (H1 sub-target); the 2nd payment covers the remaining 60% plus over-achievement
            and margin sharing, and always trues up to the real annual figures above.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <div style={label}>1st Payment — End-August</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#374151', fontFamily: 'monospace' }}>SAR {fC(payment1)}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>CAT incentive on H1 Net Margin only ({h1Category.name})</div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <div style={label}>2nd Payment — End-February</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#374151', fontFamily: 'monospace' }}>SAR {fC(payment2)}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>Remaining CAT incentive + over-achievement + margin sharing</div>
            </div>
          </div>
        </div>

        {/* Governance & penalties — informational, §7-8 */}
        <div style={{ fontSize: 11, color: '#6b7280', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', lineHeight: 1.6 }}>
          <strong style={{ color: '#374151' }}>Governance (§7):</strong> Management can adjust or withhold incentives for client non-payment 90+ days, contract cancellation,
          compliance violations, material pricing errors, or resignation.
          <br /><strong style={{ color: '#374151' }}>Penalties (§8):</strong> up to 10% deduction if a client's invoices remain overdue; government fines or compliance
          charges are deducted from GM before the incentive is calculated. All payments remain subject to Finance and Executive approval.
        </div>

      </div>
    </Wrapper>
  );
}
