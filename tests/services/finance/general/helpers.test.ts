import { describe, it, expect } from '@jest/globals';
import { applyGeneralPatch, buildGeneralPatch, isAllowedCurrency, listAllowedCurrencies, normalizeSettings } from '../../../../services/finance/general/helpers';

describe('services/finance/general helpers', () => {
  it('normalizes settings with defaults and validation', () => {
    const s = normalizeSettings({ currency: 'eur', gracePeriodDays: '14', enforceTax: false });
    expect(s.currency).toBe('EUR');
    expect(s.gracePeriodDays).toBe(14);
    expect(s.enforceTax).toBe(false);

    const s2 = normalizeSettings({ currency: 'XYZ', gracePeriodDays: -5, enforceTax: 'nope' });
    expect(s2.currency).toBe('USD');
    expect(s2.gracePeriodDays).toBe(0);
    expect(s2.enforceTax).toBe(true);
  });

  it('builds a safe patch from partial input', () => {
    const p1 = buildGeneralPatch({ currency: ' gbp ' });
    expect(p1).toEqual({ currency: 'GBP' });

    const p2 = buildGeneralPatch({ currency: 'xyz', gracePeriodDays: '30.9', enforceTax: true });
    expect(p2).toEqual({ gracePeriodDays: 30, enforceTax: true });
  });

  it('applies patch immutably and clamps numbers', () => {
    const base = normalizeSettings({ currency: 'USD', gracePeriodDays: 7, enforceTax: true });
    const next = applyGeneralPatch(base, { currency: 'EUR', gracePeriodDays: -3, enforceTax: false });
    expect(next).toEqual({ currency: 'EUR', gracePeriodDays: 0, enforceTax: false });
    expect(base.currency).toBe('USD');
  });

  it('currency helpers', () => {
    expect(isAllowedCurrency('usd')).toBe(true);
    expect(isAllowedCurrency('cad')).toBe(false);
    const list = listAllowedCurrencies();
    expect(list).toEqual(['USD', 'EUR', 'GBP']);
  });
});

