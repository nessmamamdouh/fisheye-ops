import { describe, it, expect } from 'vitest';
import { calcLine, calcPartnerPayout } from '../../src/FinanceModule.jsx';

describe('calcLine — partner mode', () => {
  it('computes margin as a percentage of clientPrice on totalPackage, plus 15% VAT on the margin only', () => {
    const emp = { profitMode: 'partner', totalPackage: 10000, clientPrice: 15, clientPriceType: 'percent' };
    const line = calcLine(emp);
    expect(line.margin).toBe(1500); // 15% of 10000
    expect(line.subTotal).toBe(11500); // totalPackage + margin
    expect(line.vat).toBe(225); // 15% of margin (1500 * 0.15)
    expect(line.total).toBe(11725);
  });

  it('computes a fixed-amount (SAR) margin instead of a percentage', () => {
    const emp = { profitMode: 'partner', totalPackage: 10000, clientPrice: 800, clientPriceType: 'fixed' };
    const line = calcLine(emp);
    expect(line.margin).toBe(800);
    expect(line.subTotal).toBe(10800);
    expect(line.vat).toBe(120);
  });
});

describe('calcLine — direct mode', () => {
  it('computes margin from fisheyeMargin instead of clientPrice', () => {
    const emp = { profitMode: 'direct', totalPackage: 10000, fisheyeMargin: 20, fisheyeMarginType: 'percent' };
    const line = calcLine(emp);
    expect(line.margin).toBe(2000);
    expect(line.subTotal).toBe(12000);
    expect(line.vat).toBe(300);
  });
});

describe('calcLine — missing/zero fields', () => {
  it('treats missing numeric fields as 0 rather than throwing or returning NaN', () => {
    const line = calcLine({ profitMode: 'partner' });
    expect(line.subTotal).toBe(0);
    expect(line.margin).toBe(0);
    expect(line.vat).toBe(0);
    expect(line.total).toBe(0);
  });
});

describe('calcPartnerPayout', () => {
  it('is 0 for direct-mode employees (no partner involved)', () => {
    expect(calcPartnerPayout({ profitMode: 'direct', totalPackage: 10000 })).toBe(0);
  });

  it('computes a percentage payout for partner-mode employees', () => {
    expect(calcPartnerPayout({ profitMode: 'partner', totalPackage: 10000, partnerCost: 92, partnerCostType: 'percent' })).toBe(9200);
  });

  it('computes a fixed payout for partner-mode employees', () => {
    expect(calcPartnerPayout({ profitMode: 'partner', totalPackage: 10000, partnerCost: 7500, partnerCostType: 'fixed' })).toBe(7500);
  });
});

import { calcProration, parseDate } from '../../src/FinanceModule.jsx';

describe('parseDate', () => {
  it('parses ISO YYYY-MM-DD as a LOCAL date, not shifted by UTC midnight', () => {
    const d = parseDate('2026-01-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0); // January
    expect(d.getDate()).toBe(15); // regression: new Date("2026-01-15") (UTC) can read back as the 14th in negative-UTC-offset zones
  });

  it('parses ISO date even with a trailing time/zone suffix, ignoring the suffix', () => {
    const d = parseDate('2026-01-15T00:00:00.000Z');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it('parses MM/DD/YY with a 2-digit year as 20xx, not 19xx (the "1926 bug")', () => {
    const d = parseDate('01/15/26');
    expect(d.getFullYear()).toBe(2026); // must NOT be 1926
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it('parses MM/DD/YYYY with a 4-digit year as-is', () => {
    const d = parseDate('01/15/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it('parses single-digit month/day slash dates', () => {
    const d = parseDate('1/5/26');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
  });

  it('returns null for empty, missing, or unrecognized input', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('not a date')).toBeNull();
  });
});

describe('calcProration — full month (no start/end date this month)', () => {
  it('gives the full 30/30 days and the whole package with no GOSI when gosiOption is off', () => {
    const emp = { totalPackage: 13500 }; // basic 10000 / hra 2500 / tpt 1000 -- clean round numbers
    const r = calcProration(emp, 2026, 1);
    expect(r.workedDays).toBe(30);
    expect(r.totalDays).toBe(30);
    expect(r.factor).toBe(1);
    expect(r.isFullMonth).toBe(true);
    expect(r.isJoiner).toBe(false);
    expect(r.isLeaver).toBe(false);
    expect(r.proratedPkg).toBe(13500);
    expect(r.proratedBasic).toBe(10000);
    expect(r.proratedHRA).toBe(2500);
    expect(r.proratedTPT).toBe(1000);
    expect(r.gosiMonthly).toBe(0);
    expect(r.gosiDeduction).toBe(0);
    expect(r.netProrated).toBe(13500);
  });

  it('a start/end date outside the requested month does not trigger joiner/leaver proration', () => {
    const emp = { totalPackage: 13500, startDate: '2025-06-01', endDate: '2027-01-01' };
    const r = calcProration(emp, 2026, 1);
    expect(r.isFullMonth).toBe(true);
    expect(r.factor).toBe(1);
  });
});

describe('calcProration — joiner mid-month', () => {
  it('prorates from the start date through day 30', () => {
    const emp = { totalPackage: 13500, startDate: '2026-01-16' };
    const r = calcProration(emp, 2026, 1);
    expect(r.isJoiner).toBe(true);
    expect(r.isLeaver).toBe(false);
    expect(r.isFullMonth).toBe(false);
    expect(r.workedDays).toBe(15); // 30 - 16 + 1
    expect(r.factor).toBe(0.5);
    expect(r.proratedPkg).toBe(6750);
  });

  it('the Math.max(1, ...) guard keeps a joiner who starts on day 31 to at least 1 worked day', () => {
    const emp = { totalPackage: 13500, startDate: '2026-01-31' };
    const r = calcProration(emp, 2026, 1);
    expect(r.isJoiner).toBe(true);
    expect(r.workedDays).toBe(1); // would be 0 (30-31+1) without the guard
  });
});

describe('calcProration — leaver mid-month', () => {
  it('prorates from day 1 through the end date', () => {
    const emp = { totalPackage: 13500, endDate: '2026-01-10' };
    const r = calcProration(emp, 2026, 1);
    expect(r.isLeaver).toBe(true);
    expect(r.isJoiner).toBe(false);
    expect(r.isFullMonth).toBe(false);
    expect(r.workedDays).toBe(10);
    expect(r.factor).toBeCloseTo(1 / 3, 10);
    expect(r.proratedPkg).toBe(4500);
  });

  it('caps a leaver on a real calendar day 31 at the fixed 30-day payroll month (full pay despite isLeaver=true)', () => {
    const emp = { totalPackage: 13500, endDate: '2026-01-31' };
    const r = calcProration(emp, 2026, 1);
    expect(r.isLeaver).toBe(true);
    expect(r.workedDays).toBe(30); // min(31, 30) -- the 31-day-calendar-month cap
    expect(r.factor).toBe(1);
    expect(r.proratedPkg).toBe(13500);
  });
});

describe('calcProration — joiner and leaver in the same month', () => {
  it('prorates the days strictly between start and end (inclusive)', () => {
    const emp = { totalPackage: 13500, startDate: '2026-01-05', endDate: '2026-01-19' };
    const r = calcProration(emp, 2026, 1);
    expect(r.isJoiner).toBe(true);
    expect(r.isLeaver).toBe(true);
    expect(r.isFullMonth).toBe(false);
    expect(r.workedDays).toBe(15); // 19 - 5 + 1
    expect(r.factor).toBe(0.5);
  });

  it('the Math.max(1, ...) guard prevents zero/negative worked days from bad data (end before start)', () => {
    const emp = { totalPackage: 13500, startDate: '2026-01-20', endDate: '2026-01-15' };
    const r = calcProration(emp, 2026, 1);
    expect(r.workedDays).toBe(1); // 15 - 20 + 1 = -4, guarded to 1
  });
});

describe('calcProration — GOSI employee deduction', () => {
  const base = { totalPackage: 13500, gosiOption: true, nationalityType: 'saudi_national' };

  it('deducts 9.75% of (basic + HRA) for a Saudi national with gosiOption on, for a full month', () => {
    const r = calcProration(base, 2026, 1);
    // basic 10000, hra 2500 -> (10000+2500)*0.0975 = 1218.75 -> rounds to 1219
    expect(r.gosiMonthly).toBe(1219);
    expect(r.gosiDeduction).toBe(1219); // full month, factor 1
    expect(r.netProrated).toBe(13500 - 1219);
  });

  it('prorates the GOSI deduction by the same factor as a mid-month joiner', () => {
    const r = calcProration({ ...base, startDate: '2026-01-16' }, 2026, 1); // factor 0.5
    expect(r.gosiMonthly).toBe(1219); // full-month reference amount stays the same
    expect(r.gosiDeduction).toBe(Math.round(1219 * 0.5)); // 610
    expect(r.netProrated).toBe(r.proratedPkg - r.gosiDeduction);
  });

  it('applies no GOSI deduction for an expat even with gosiOption on', () => {
    const r = calcProration({ ...base, nationalityType: 'expat' }, 2026, 1);
    expect(r.gosiMonthly).toBe(0);
    expect(r.gosiDeduction).toBe(0);
    expect(r.netProrated).toBe(r.proratedPkg);
  });

  it('applies no GOSI deduction for a Saudi national when gosiOption is off', () => {
    const r = calcProration({ ...base, gosiOption: false }, 2026, 1);
    expect(r.gosiMonthly).toBe(0);
    expect(r.gosiDeduction).toBe(0);
  });

  it('is case-insensitive on nationalityType', () => {
    const r = calcProration({ ...base, nationalityType: 'Saudi_National' }, 2026, 1);
    expect(r.gosiMonthly).toBe(1219);
  });
});
