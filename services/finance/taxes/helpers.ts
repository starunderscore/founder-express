import type { Tax, TaxCreateInput, TaxPatchInput } from './types';

export function normalizeTax(id: string, raw: any): Tax {
  const name = String(raw?.name || '');
  const rate = Number(raw?.rate) || 0;
  const enabled = typeof raw?.enabled === 'boolean' ? raw.enabled : true;
  const archiveAt = typeof raw?.archiveAt === 'number' ? (raw.archiveAt as number) : null;
  const removedAt = typeof raw?.removedAt === 'number' ? (raw.removedAt as number) : null;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  const updatedAt = typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined;
  return { id, name, rate, enabled, archiveAt, removedAt, createdAt, updatedAt };
}

export function buildTaxCreate(input: TaxCreateInput): Record<string, any> {
  const nm = String(input?.name || '').trim();
  if (!nm) throw new Error('name is required');
  const rate = Math.max(0, Number(input?.rate) || 0);
  const out: Record<string, any> = {
    name: nm,
    rate,
    enabled: input?.enabled !== false,
    archiveAt: null,
    removedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return out;
}

export function buildTaxPatchObject(input: TaxPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') out.name = input.name.trim();
  if (typeof input.rate === 'number') out.rate = Math.max(0, input.rate);
  if (typeof input.enabled === 'boolean') out.enabled = !!input.enabled;
  if (Object.keys(out).length) out.updatedAt = Date.now();
  return out;
}

export type TaxStatus = 'active' | 'archived' | 'removed';

export function filterTaxesByStatus<T extends Pick<Tax, 'archiveAt' | 'removedAt'>>(rows: T[], status: TaxStatus): T[] {
  return rows.filter((r) => {
    if (r.removedAt != null) return status === 'removed';
    if (r.archiveAt != null) return status === 'archived';
    return status === 'active';
  });
}

