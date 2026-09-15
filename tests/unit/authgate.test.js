import { describe, it, expect } from 'vitest';
import { isAllowedDomain } from '../../src/AuthGate.jsx';

describe('isAllowedDomain (signup domain gate — UX check, not the real security boundary)', () => {
  it('accepts an @fisheye.sa email', () => {
    expect(isAllowedDomain('nesma@fisheye.sa')).toBe(true);
  });

  it('is case-insensitive on the domain', () => {
    expect(isAllowedDomain('nesma@FISHEYE.SA')).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    expect(isAllowedDomain('  nesma@fisheye.sa  ')).toBe(true);
  });

  it('rejects a different domain', () => {
    expect(isAllowedDomain('someone@gmail.com')).toBe(false);
  });

  it('rejects a domain that merely contains fisheye.sa as a substring, not a suffix', () => {
    expect(isAllowedDomain('nesma@fisheye.sa.evil.com')).toBe(false);
  });

  it('rejects empty/undefined input', () => {
    expect(isAllowedDomain('')).toBe(false);
    expect(isAllowedDomain(undefined)).toBe(false);
  });
});
