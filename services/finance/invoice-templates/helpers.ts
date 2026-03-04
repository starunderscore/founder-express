import type { InvoiceTemplate, InvoiceTemplateCreateInput, InvoiceTemplateItem, InvoiceTemplatePatchInput } from './types';

export function normalizeInvoiceTemplate(id: string, raw: any): InvoiceTemplate {
  const name = String(raw?.name || '');
  const items: InvoiceTemplateItem[] = Array.isArray(raw?.items) ? (raw.items as any[]).map((r) => ({
    description: String(r?.description || ''),
    quantity: Math.max(0, Number(r?.quantity) || 0),
    unitPrice: Math.max(0, Number(r?.unitPrice) || 0),
  })) : [];
  const taxIds: string[] = Array.isArray(raw?.taxIds) ? (raw.taxIds as any[]).map(String) : [];
  const archiveAt = typeof raw?.archiveAt === 'number' ? (raw.archiveAt as number) : null;
  const removedAt = typeof raw?.removedAt === 'number' ? (raw.removedAt as number) : null;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  const updatedAt = typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined;
  return { id, name, items, taxIds, archiveAt, removedAt, createdAt, updatedAt };
}

export function buildInvoiceTemplateCreate(input: InvoiceTemplateCreateInput): Record<string, any> {
  const nm = String(input?.name || '').trim();
  if (!nm) throw new Error('name is required');
  const items: InvoiceTemplateItem[] = Array.isArray(input?.items) ? input.items.map((r) => ({
    description: String(r?.description || ''),
    quantity: Math.max(0, Number(r?.quantity) || 0),
    unitPrice: Math.max(0, Number(r?.unitPrice) || 0),
  })) : [];
  const taxIds: string[] = Array.isArray(input?.taxIds) ? input.taxIds.map(String) : [];
  return {
    name: nm,
    items,
    taxIds,
    archiveAt: null,
    removedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any;
}

export function buildInvoiceTemplatePatch(input: InvoiceTemplatePatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') out.name = input.name.trim();
  if (Array.isArray(input.items)) out.items = input.items.map((r) => ({
    description: String(r?.description || ''),
    quantity: Math.max(0, Number(r?.quantity) || 0),
    unitPrice: Math.max(0, Number(r?.unitPrice) || 0),
  }));
  if (Array.isArray(input.taxIds)) out.taxIds = input.taxIds.map(String);
  if (Object.keys(out).length) out.updatedAt = Date.now();
  return out;
}

export type TemplateStatus = 'active' | 'archived' | 'removed';

export function filterTemplatesByStatus<T extends Pick<InvoiceTemplate, 'archiveAt' | 'removedAt'>>(rows: T[], status: TemplateStatus): T[] {
  return rows.filter((r) => {
    if (r.removedAt != null) return status === 'removed';
    if (r.archiveAt != null) return status === 'archived';
    return status === 'active';
  });
}

