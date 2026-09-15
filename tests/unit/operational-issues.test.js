import { describe, it, expect } from 'vitest';
import { computeOperationalIssues, daysUntil } from '../../src/useOperationalIssues.js';

// Helper: build an ISO date string N days from "now" (matches daysUntil's own
// TODAY-at-midnight reference), so these tests never go stale/flaky.
const isoInDays = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

let seq = 0;
const emp = (overrides = {}) => ({ _id: `e${++seq}`, client: 'Sela', status: 'active', ...overrides });

describe('daysUntil', () => {
  it('returns 0 for today, positive for the future, negative for the past', () => {
    expect(daysUntil(isoInDays(0))).toBe(0);
    expect(daysUntil(isoInDays(5))).toBe(5);
    expect(daysUntil(isoInDays(-5))).toBe(-5);
  });

  it('returns the 9999 sentinel for no date at all (never flags as urgent)', () => {
    expect(daysUntil(null)).toBe(9999);
    expect(daysUntil(undefined)).toBe(9999);
    expect(daysUntil('')).toBe(9999);
  });
});

describe('computeOperationalIssues — urgent bucket', () => {
  it('flags a contract expiring within 7 days as urgent, and within 3 days as critical severity', () => {
    const e5 = emp({ endDate: isoInDays(5) });
    const e2 = emp({ endDate: isoInDays(2) });
    const r = computeOperationalIssues([e5, e2]);
    const u5 = r.urgent.find(i => i.employee._id === e5._id);
    const u2 = r.urgent.find(i => i.employee._id === e2._id);
    expect(u5.severity).toBe('high');
    expect(u2.severity).toBe('critical');
  });

  it('does not flag a contract expiring in 8+ days as urgent (it lands in renewals instead)', () => {
    const e = emp({ endDate: isoInDays(8) });
    const r = computeOperationalIssues([e]);
    expect(r.urgent.some(i => i.employee._id === e._id)).toBe(false);
    expect(r.renewals.some(i => i.employee._id === e._id)).toBe(true);
  });

  it('flags an "Agreement Sent" employee as urgent, escalating to critical once stale (>5 days unsigned)', () => {
    const fresh = emp({ workflowStatus: 'Agreement Sent', wfDate: isoInDays(-2) });
    const stale = emp({ workflowStatus: 'Agreement Sent', wfDate: isoInDays(-10) });
    const r = computeOperationalIssues([fresh, stale]);
    expect(r.urgent.find(i => i.employee._id === fresh._id).severity).toBe('high');
    expect(r.urgent.find(i => i.employee._id === stale._id).severity).toBe('critical');
  });

  it('flags "Docs Requested" as urgent once overdue (>3 days, or no wfDate at all)', () => {
    const noDate = emp({ workflowStatus: 'Docs Requested' });
    const overdue = emp({ workflowStatus: 'Docs Requested', wfDate: isoInDays(-6) });
    const tooSoon = emp({ workflowStatus: 'Docs Requested', wfDate: isoInDays(-1) });
    const r = computeOperationalIssues([noDate, overdue, tooSoon]);
    expect(r.urgent.some(i => i.employee._id === noDate._id)).toBe(true);
    expect(r.urgent.some(i => i.employee._id === overdue._id)).toBe(true);
    expect(r.urgent.some(i => i.employee._id === tooSoon._id)).toBe(false);
  });

  it('excludes expired/resigned employees from urgent checks entirely', () => {
    const gone = emp({ status: 'resigned', endDate: isoInDays(1) });
    const r = computeOperationalIssues([gone]);
    expect(r.urgent.length).toBe(0);
  });
});

describe('computeOperationalIssues — payroll bucket (missing PO)', () => {
  it('flags a missing PO only for a client that requires one (Sela, by default)', () => {
    const sela = emp({ client: 'Sela', poNumbers: '' });
    const other = emp({ client: 'SPL', poNumbers: '' });
    const r = computeOperationalIssues([sela, other]);
    expect(r.payroll.some(i => i.employee._id === sela._id && i.subtype === 'missing_po')).toBe(true);
    expect(r.payroll.some(i => i.employee._id === other._id)).toBe(false);
  });

  it('still flags an EXPIRED Sela employee with no PO (as critical — salary paid but can’t invoice), unlike other checks that exclude expired employees', () => {
    const expiredNoPO = emp({ client: 'Sela', status: 'expired', poNumbers: '' });
    const r = computeOperationalIssues([expiredNoPO]);
    const issue = r.payroll.find(i => i.employee._id === expiredNoPO._id);
    expect(issue).toBeTruthy();
    expect(issue.severity).toBe('critical');
  });

  it('does not flag a resigned Sela employee with no PO', () => {
    const resignedNoPO = emp({ client: 'Sela', status: 'resigned', poNumbers: '' });
    const r = computeOperationalIssues([resignedNoPO]);
    expect(r.payroll.some(i => i.employee._id === resignedNoPO._id)).toBe(false);
  });

  it('does not flag a Sela employee that has a PO', () => {
    const withPO = emp({ client: 'Sela', poNumbers: 'PO-99' });
    const r = computeOperationalIssues([withPO]);
    expect(r.payroll.some(i => i.employee._id === withPO._id)).toBe(false);
  });

  it('flags a partner-mode employee with no partner cost set', () => {
    const noCost = emp({ profitMode: 'partner', partnerCost: 0 });
    const r = computeOperationalIssues([noCost]);
    expect(r.payroll.some(i => i.employee._id === noCost._id && i.subtype === 'missing_partner_cost')).toBe(true);
  });
});

describe('computeOperationalIssues — renewals bucket', () => {
  it('flags a contract expiring in 8-60 days as needing renewal, high severity inside 20 days', () => {
    const close = emp({ endDate: isoInDays(15) });
    const far = emp({ endDate: isoInDays(45) });
    const r = computeOperationalIssues([close, far]);
    expect(r.renewals.find(i => i.employee._id === close._id).severity).toBe('high');
    expect(r.renewals.find(i => i.employee._id === far._id).severity).toBe('medium');
  });

  it('does not flag renewal beyond 60 days out', () => {
    const e = emp({ endDate: isoInDays(90) });
    const r = computeOperationalIssues([e]);
    expect(r.renewals.some(i => i.employee._id === e._id)).toBe(false);
  });

  it('flags an employee already marked "renewal" status with no new end date', () => {
    const e = emp({ status: 'renewal', endDate: null });
    const r = computeOperationalIssues([e]);
    expect(r.renewals.some(i => i.employee._id === e._id && i.subtype === 'renewal_no_date')).toBe(true);
  });
});

describe('computeOperationalIssues — approvals bucket', () => {
  it('flags Qiwa Submitted as pending approval, high severity once waiting >14 days', () => {
    const long = emp({ workflowStatus: 'Qiwa Submitted', wfDate: isoInDays(-20) });
    const r = computeOperationalIssues([long]);
    expect(r.approvals.find(i => i.employee._id === long._id).severity).toBe('high');
  });

  it('flags "Docs Received +" as awaiting review', () => {
    const e = emp({ workflowStatus: 'Docs Received +' });
    const r = computeOperationalIssues([e]);
    expect(r.approvals.some(i => i.employee._id === e._id && i.subtype === 'docs_plus_review')).toBe(true);
  });
});

describe('computeOperationalIssues — blockers bucket', () => {
  it('flags an active employee with no workflow status at all, EXCEPT within the 7-day grace period for new hires', () => {
    const oldNoWF = emp({ workflowStatus: '', startDate: isoInDays(-30) });
    const newNoWF = emp({ workflowStatus: '', startDate: isoInDays(-2) });
    const r = computeOperationalIssues([oldNoWF, newNoWF]);
    expect(r.blockers.some(i => i.employee._id === oldNoWF._id && i.subtype === 'no_workflow')).toBe(true);
    expect(r.blockers.some(i => i.employee._id === newNoWF._id && i.subtype === 'no_workflow')).toBe(false);
  });

  it('flags a missing start date and missing contact info', () => {
    const noStart = emp({ startDate: null });
    const noContact = emp({ phone: '', email: '' });
    const r = computeOperationalIssues([noStart, noContact]);
    expect(r.blockers.some(i => i.employee._id === noStart._id && i.subtype === 'no_start_date')).toBe(true);
    expect(r.blockers.some(i => i.employee._id === noContact._id && i.subtype === 'no_contact')).toBe(true);
  });
});

describe('computeOperationalIssues — partner ops routing', () => {
  it('routes a Qiwa Approved + assigned-partner employee to the partner tab', () => {
    const e = emp({ workflowStatus: 'Qiwa Approved', profitMode: 'partner', partnerAssigned: 'Acme Partner' });
    const r = computeOperationalIssues([e]);
    const issue = r.partner.find(i => i.employee._id === e._id);
    expect(issue.subtype).toBe('iqama_transfer');
    expect(issue._tab).toBe('partner');
  });

  it('routes a Qiwa Approved employee with no partner assigned to a manual follow-up instead', () => {
    const e = emp({ workflowStatus: 'Qiwa Approved', profitMode: 'direct' });
    const r = computeOperationalIssues([e]);
    const issue = r.partner.find(i => i.employee._id === e._id);
    expect(issue.subtype).toBe('followup_iqama');
    expect(issue._tab).toBe('followups');
  });
});

describe('computeOperationalIssues — summaries', () => {
  it('counts, byClient and byEmployee stay consistent with the bucket contents', () => {
    const a = emp({ client: 'Sela', endDate: isoInDays(2) }); // urgent + critical
    const b = emp({ client: 'SPL', endDate: isoInDays(15) }); // renewal
    const r = computeOperationalIssues([a, b]);

    expect(r.counts.urgent).toBe(r.urgent.length);
    expect(r.counts.renewals).toBe(r.renewals.length);
    expect(r.counts.total).toBe(r.all.length);
    expect(r.counts.critical).toBe(r.all.filter(i => i.severity === 'critical').length);

    expect(r.byClient['Sela'].length).toBeGreaterThan(0);
    expect(r.byClient['SPL'].length).toBeGreaterThan(0);
    expect(r.byEmployee[a._id].length).toBeGreaterThan(0);
  });

  it('returns all-empty buckets and zero counts for no employees', () => {
    const r = computeOperationalIssues([]);
    expect(r.all).toEqual([]);
    expect(r.counts.total).toBe(0);
    expect(r.counts.critical).toBe(0);
  });
});
