import type { GeneralPatchInput, GeneralSettings } from './types';

const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

export function normalizeSettings(raw: any): GeneralSettings {
  const currency = typeof raw?.currency === 'string' ? raw.currency.trim().toUpperCase() : 'USD';
  const safeCurrency = ALLOWED_CURRENCIES.includes(currency as any) ? currency : 'USD';
  const daysRaw = typeof raw?.gracePeriodDays === 'number' ? raw.gracePeriodDays : Number(raw?.gracePeriodDays);
  const gracePeriodDays = Number.isFinite(daysRaw) ? Math.max(0, Math.floor(daysRaw)) : 0;
  const enforceTax = typeof raw?.enforceTax === 'boolean' ? raw.enforceTax : true;
  return { currency: safeCurrency, gracePeriodDays, enforceTax };
}

export function buildGeneralPatch(input: GeneralPatchInput): Partial<GeneralSettings> {
  const out: Partial<GeneralSettings> = {};
  if (typeof input?.currency === 'string') {
    const cur = input.currency.trim().toUpperCase();
    if (ALLOWED_CURRENCIES.includes(cur as any)) out.currency = cur;
  }
  if (input?.gracePeriodDays !== undefined && input?.gracePeriodDays !== null && input?.gracePeriodDays !== '') {
    const n = Math.max(0, Math.floor(Number(input.gracePeriodDays)));
    if (Number.isFinite(n)) out.gracePeriodDays = n;
  }
  if (typeof input?.enforceTax === 'boolean') out.enforceTax = input.enforceTax;
  return out;
}

export function applyGeneralPatch(settings: GeneralSettings, patch: Partial<GeneralSettings>): GeneralSettings {
  const next = { ...settings };
  if (typeof patch.currency === 'string') next.currency = patch.currency;
  if (typeof patch.gracePeriodDays === 'number') next.gracePeriodDays = Math.max(0, Math.floor(patch.gracePeriodDays));
  if (typeof patch.enforceTax === 'boolean') next.enforceTax = patch.enforceTax;
  return next;
}

export function isAllowedCurrency(code: string): boolean {
  return ALLOWED_CURRENCIES.includes(code?.toUpperCase() as any);
}

export function listAllowedCurrencies(): string[] {
  return [...ALLOWED_CURRENCIES];
}

