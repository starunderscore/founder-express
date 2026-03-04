import type { Price, Product, ProductCreateInput, ProductPatchInput } from './types';

export function normalizeProduct(id: string, raw: any): Product {
  const name = String(raw?.name || '');
  const description = typeof raw?.description === 'string' && raw.description.trim() ? raw.description : undefined;
  const active = typeof raw?.active === 'boolean' ? raw.active : true;
  const defaultType = (raw?.defaultType === 'recurring' || raw?.defaultType === 'one_time') ? raw.defaultType : undefined;
  const prices = Array.isArray(raw?.prices) ? (raw.prices as any[]).map(normalizePrice).filter(Boolean) as Price[] : [];
  const archiveAt = typeof raw?.archiveAt === 'number' ? (raw.archiveAt as number) : null;
  const removedAt = typeof raw?.removedAt === 'number' ? (raw.removedAt as number) : null;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  const updatedAt = typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined;
  return { id, name, description, active, defaultType, prices, archiveAt, removedAt, createdAt, updatedAt };
}

export function normalizePrice(raw: any, idx?: number): Price | null {
  const type = raw?.type === 'recurring' ? 'recurring' : (raw?.type === 'one_time' ? 'one_time' : 'one_time');
  const currency = String(raw?.currency || '').toUpperCase() || 'USD';
  const unitAmount = Number(raw?.unitAmount) || 0;
  const id = typeof raw?.id === 'string' ? raw.id : `price-${Date.now()}-${Math.random().toString(36).slice(2,7)}${idx ? '-' + idx : ''}`;
  const recurring = type === 'recurring' ? {
    interval: (raw?.recurring?.interval === 'day' || raw?.recurring?.interval === 'week' || raw?.recurring?.interval === 'month' || raw?.recurring?.interval === 'year') ? raw.recurring.interval : 'month',
    intervalCount: Number(raw?.recurring?.intervalCount) || 1,
  } : undefined;
  return { id, currency, unitAmount, type, recurring };
}

export function buildProductCreate(input: ProductCreateInput): Record<string, any> {
  const nm = String(input?.name || '').trim();
  if (!nm) throw new Error('name is required');
  const out: Record<string, any> = {
    name: nm,
    description: (input?.description || '').trim() || undefined,
    active: input?.active !== false,
    defaultType: (input?.defaultType === 'recurring' || input?.defaultType === 'one_time') ? input.defaultType : undefined,
    prices: Array.isArray(input?.prices) ? input!.prices!.map((p, i) => normalizePrice(p, i)!) : [],
    archiveAt: null,
    removedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return out;
}

export function buildProductPatchObject(input: ProductPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') out.name = input.name.trim();
  if (typeof input.description === 'string') out.description = input.description.trim() || null;
  if (typeof input.active === 'boolean') out.active = !!input.active;
  if (input.defaultType === 'one_time' || input.defaultType === 'recurring') out.defaultType = input.defaultType;
  if (Array.isArray(input.prices)) out.prices = input.prices.map((p, i) => normalizePrice(p, i)!);
  if (Object.keys(out).length) out.updatedAt = Date.now();
  return out;
}

export type ProductStatus = 'active' | 'archived' | 'removed';

export function filterProductsByStatus<T extends Pick<Product, 'archiveAt' | 'removedAt'>>(rows: T[], status: ProductStatus): T[] {
  return rows.filter((r) => {
    if (r.removedAt != null) return status === 'removed';
    if (r.archiveAt != null) return status === 'archived';
    return status === 'active';
  });
}

