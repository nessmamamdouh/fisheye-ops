import { describe, it, expect } from 'vitest';
import { isExcluded, hasMissingPO, hasValidPO, isWFDone, getClientsList } from '../../src/utils/helpers.js';

describe('isExcluded', () => {
  it('excludes English status values', () => {
    expect(isExcluded({ status: 'expired' })).toBe(true);
    expect(isExcluded({ status: 'resigned' })).toBe(true);
  });

  it('excludes the Arabic status values used on real records (regression: these used to be invisible to the Status filter)', () => {
    expect(isExcluded({ status: 'مستقيل' })).toBe(true);
    expect(isExcluded({ status: 'منتهي' })).toBe(true);
  });

  it('does not exclude an active employee', () => {
    expect(isExcluded({ status: 'active' })).toBe(false);
  });

  it('is case/whitespace tolerant for the English values', () => {
    expect(isExcluded({ status: '  Expired ' })).toBe(true);
  });
});

describe('hasMissingPO / hasValidPO', () => {
  it('treats an empty/whitespace-only PO as missing', () => {
    expect(hasMissingPO({ poNumbers: '' })).toBe(true);
    expect(hasMissingPO({ poNumbers: '   ' })).toBe(true);
    expect(hasMissingPO({})).toBe(true);
  });

  it('treats a real PO number as present and valid', () => {
    expect(hasMissingPO({ poNumbers: 'PO-123' })).toBe(false);
    expect(hasValidPO({ poNumbers: 'PO-123' })).toBe(true);
  });
});

describe('isWFDone', () => {
  it('recognizes the three completion states, case-insensitively', () => {
    expect(isWFDone('Complete')).toBe(true);
    expect(isWFDone('Agreement Signed')).toBe(true);
    expect(isWFDone('Iqama Transferred')).toBe(true);
  });

  it('does not treat an in-progress status as done', () => {
    expect(isWFDone('Pending')).toBe(false);
    expect(isWFDone('')).toBe(false);
  });
});

describe('getClientsList (the correctly employee-derived version)', () => {
  it('returns a sorted, deduplicated list of clients actually on employee records', () => {
    const emps = [
      { client: 'Sela' }, { client: 'Pentagram' }, { client: 'Sela' }, { client: '' }, { client: null },
    ];
    expect(getClientsList(emps)).toEqual(['Pentagram', 'Sela']);
  });

  it('returns an empty list for no employees', () => {
    expect(getClientsList([])).toEqual([]);
  });
});
