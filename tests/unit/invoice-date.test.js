import { describe, it, expect } from 'vitest';
import { normalizeDate } from '../../src/modules/invoiceManager.jsx';

describe('normalizeDate', () => {
  it('passes through an already-ISO YYYY-MM-DD date unchanged', () => {
    expect(normalizeDate('2026-05-04')).toBe('2026-05-04');
  });

  it('converts DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(normalizeDate('28/03/2026')).toBe('2026-03-28');
  });

  it('converts "D-Mon-YY" and "DD-Mon-YYYY" to YYYY-MM-DD', () => {
    expect(normalizeDate('8-Mar-26')).toBe('2026-03-08');
    expect(normalizeDate('19-Apr-2026')).toBe('2026-04-19');
  });

  it('regression: "Oct" must not be corrupted by the letter-O typo fix', () => {
    // "Oct" is the one month abbreviation containing the letter "o" -- a
    // naive global O->0 replacement turns it into "0ct" and the date is
    // never recognized. This used to silently return "5-0ct-26" as-is.
    expect(normalizeDate('5-Oct-26')).toBe('2026-10-05');
    expect(normalizeDate('15-Oct-2026')).toBe('2026-10-15');
  });

  it('still fixes a genuine letter-O typo standing in for a 0 in the day or year', () => {
    expect(normalizeDate('1O-Mar-26')).toBe('2026-03-10'); // day "1O" -> "10"
    expect(normalizeDate('28/03/2O26')).toBe('2026-03-28'); // year "2O26" -> "2026"
  });

  it('returns an unrecognized 3-letter token as-is, after the numeric-typo pass (not a real month, so no date conversion happens)', () => {
    expect(normalizeDate('5-Xyz-26')).toBe('5-Xyz-26');
  });

  it('returns null/empty input as-is', () => {
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate(undefined)).toBeUndefined();
    expect(normalizeDate('')).toBe('');
  });
});
