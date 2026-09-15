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
