import type { Invoice, InvoiceCreateInput, InvoiceItem, InvoicePatchInput } from './types';

export function normalizeInvoice(id: string, raw: any): Invoice {
  const items: InvoiceItem[] = Array.isArray(raw?.items) ? (raw.items as any[]).map((r) => ({
    id: String(r?.id || `row-${Math.random()}`),
    description: String(r?.description || ''),
    quantity: Math.max(0, Number(r?.quantity) || 0),
    unitPrice: Math.max(0, Number(r?.unitPrice) || 0),
    priceId: typeof r?.priceId === 'string' && r.priceId.trim() ? r.priceId : undefined,
  })) : [];
  return {
    id,
    customerId: String(raw?.customerId || ''),
    amount: Number(raw?.amount) || 0,
    currency: String(raw?.currency || 'USD').toUpperCase(),
    dueDate: String(raw?.dueDate || ''),
    status: (raw?.status === 'Paid' ? 'Paid' : 'Unpaid'),
    issuedAt: typeof raw?.issuedAt === 'number' ? (raw.issuedAt as number) : Date.now(),
    paidAt: typeof raw?.paidAt === 'number' ? (raw.paidAt as number) : undefined,
    notes: typeof raw?.notes === 'string' ? raw.notes : undefined,
    items,
    taxIds: Array.isArray(raw?.taxIds) ? (raw.taxIds as any[]).map(String) : undefined,
    subtotal: typeof raw?.subtotal === 'number' ? raw.subtotal : undefined,
    taxTotal: typeof raw?.taxTotal === 'number' ? raw.taxTotal : undefined,
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt : undefined,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : undefined,
  };
}

export function buildInvoiceCreate(input: InvoiceCreateInput): Record<string, any> {
  const items: InvoiceItem[] = Array.isArray(input?.items) ? input.items.map((r) => ({
    id: String(r?.id || `row-${Math.random()}`),
    description: String(r?.description || ''),
    quantity: Math.max(0, Number(r?.quantity) || 0),
    unitPrice: Math.max(0, Number(r?.unitPrice) || 0),
    priceId: typeof (r as any)?.priceId === 'string' && (r as any).priceId.trim() ? (r as any).priceId : undefined,
  })) : [];
  return {
    customerId: String(input.customerId),
    amount: Number(input.amount) || 0,
    currency: String(input.currency || 'USD').toUpperCase(),
    dueDate: String(input.dueDate || ''),
    status: 'Unpaid' as const,
    issuedAt: Date.now(),
    paidAt: undefined,
    notes: input.notes ? String(input.notes) : undefined,
    items,
    taxIds: Array.isArray(input.taxIds) ? input.taxIds.map(String) : undefined,
    subtotal: typeof input.subtotal === 'number' ? input.subtotal : undefined,
    taxTotal: typeof input.taxTotal === 'number' ? input.taxTotal : undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any;
}

export function buildInvoicePatch(input: InvoicePatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.customerId === 'string') out.customerId = input.customerId;
  if (typeof input.amount === 'number') out.amount = input.amount;
  if (typeof input.currency === 'string') out.currency = input.currency.toUpperCase();
  if (typeof input.dueDate === 'string') out.dueDate = input.dueDate;
  if (input.status === 'Paid' || input.status === 'Unpaid') out.status = input.status;
  if (typeof input.paidAt === 'number' || input.paidAt === undefined) out.paidAt = input.paidAt;
  if (typeof input.notes === 'string') out.notes = input.notes;
  if (Array.isArray(input.items)) out.items = input.items.map((r) => ({ id: r.id, description: r.description, quantity: Math.max(0, Number(r.quantity) || 0), unitPrice: Math.max(0, Number(r.unitPrice) || 0), priceId: typeof (r as any)?.priceId === 'string' && (r as any).priceId.trim() ? (r as any).priceId : undefined }));
  if (Array.isArray(input.taxIds)) out.taxIds = input.taxIds.map(String);
  if (typeof input.subtotal === 'number') out.subtotal = input.subtotal;
  if (typeof input.taxTotal === 'number') out.taxTotal = input.taxTotal;
  if (Object.keys(out).length) out.updatedAt = Date.now();
  return out;
}
