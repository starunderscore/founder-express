import type { CRMLifecycle, CRMRecord, CRMRecordType, CRMCreateInput, CRMPatchInput, RawCRMDoc } from './types';

export const MAX_CRM_NAME = 120;
export const MAX_CRM_COMPANY = 120;
export const MAX_CRM_SOURCE_DETAIL = 200;

export function normalizeCRMRecord(id: string, raw: RawCRMDoc): CRMRecord {
  const type: CRMRecordType = (raw?.type === 'vendor' ? 'vendor' : 'customer');
  const name = String(raw?.name || '');
  const email = typeof raw?.email === 'string' && raw.email.trim() ? raw.email : undefined;
  const phone = typeof raw?.phone === 'string' && raw.phone.trim() ? raw.phone : undefined;
  const company = typeof raw?.company === 'string' && raw.company.trim() ? raw.company : undefined;
  const source = typeof raw?.source === 'string' && raw.source.trim() ? raw.source : undefined;
  const sourceDetail = typeof raw?.sourceDetail === 'string' && raw.sourceDetail.trim() ? raw.sourceDetail : undefined;
  const tags = Array.isArray(raw?.tags) ? (raw.tags as any[]).filter((t) => typeof t === 'string') : undefined;
  const ownerId = typeof raw?.ownerId === 'string' && raw.ownerId.trim() ? raw.ownerId : undefined;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  const isArchived = !!raw?.isArchived;
  const deletedAt = typeof raw?.deletedAt === 'number' ? (raw.deletedAt as number) : undefined;
  return { id, type, name, email, phone, company, source, sourceDetail, tags, ownerId, createdAt, isArchived, deletedAt };
}

export function buildCRMCreate(input: CRMCreateInput): Record<string, any> {
  const nm = String(input.name || '').trim();
  if (!nm) throw new Error('name is required');
  if (nm.length > MAX_CRM_NAME) throw new Error(`name must be <= ${MAX_CRM_NAME} characters`);
  const out: Record<string, any> = {
    type: (input.type === 'vendor' ? 'vendor' : 'customer') as CRMRecordType,
    name: nm,
    createdAt: Date.now(),
    isArchived: false,
    // deletedAt omitted by default
  };
  const email = (input.email ?? '').trim();
  if (email) out.email = email;
  const phone = (input.phone ?? '').trim();
  if (phone) out.phone = phone;
  const company = (input.company ?? '').trim();
  if (company) {
    if (company.length > MAX_CRM_COMPANY) throw new Error(`company must be <= ${MAX_CRM_COMPANY} characters`);
    out.company = company;
  }
  const source = (input.source ?? '').trim();
  if (source) out.source = source;
  const sourceDetail = (input.sourceDetail ?? '').trim();
  if (sourceDetail) {
    if (sourceDetail.length > MAX_CRM_SOURCE_DETAIL) throw new Error(`sourceDetail must be <= ${MAX_CRM_SOURCE_DETAIL} characters`);
    out.sourceDetail = sourceDetail;
  }
  if (Array.isArray(input.tags)) out.tags = input.tags.filter((t) => !!t);
  if (typeof input.ownerId === 'string' && input.ownerId.trim()) out.ownerId = input.ownerId.trim();
  return out;
}

// Patch builder returns plain object with optional fields; delete mapping done in firestore adapter
export function buildCRMPatchObject(input: CRMPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.type === 'string') out.type = (input.type === 'vendor' ? 'vendor' : 'customer');
  if (typeof input.name === 'string') {
    const nm = input.name.trim();
    if (!nm) throw new Error('name cannot be blank');
    if (nm.length > MAX_CRM_NAME) throw new Error(`name must be <= ${MAX_CRM_NAME} characters`);
    out.name = nm;
  }
  if (typeof input.email === 'string' || input.email === null) {
    const v = (input.email ?? '').trim();
    out.email = v ? v : null;
  }
  if (typeof input.phone === 'string' || input.phone === null) {
    const v = (input.phone ?? '').trim();
    out.phone = v ? v : null;
  }
  if (typeof input.company === 'string' || input.company === null) {
    const v = (input.company ?? '').trim();
    if (v && v.length > MAX_CRM_COMPANY) throw new Error(`company must be <= ${MAX_CRM_COMPANY} characters`);
    out.company = v ? v : null;
  }
  if (typeof input.source === 'string' || input.source === null) {
    const v = (input.source ?? '').trim();
    out.source = v ? v : null;
  }
  if (typeof input.sourceDetail === 'string' || input.sourceDetail === null) {
    const v = (input.sourceDetail ?? '').trim();
    if (v && v.length > MAX_CRM_SOURCE_DETAIL) throw new Error(`sourceDetail must be <= ${MAX_CRM_SOURCE_DETAIL} characters`);
    out.sourceDetail = v ? v : null;
  }
  if (Array.isArray(input.tags)) out.tags = input.tags.filter((t) => !!t);
  if (typeof input.ownerId === 'string' || input.ownerId === null) {
    const v = (input.ownerId ?? '').trim();
    out.ownerId = v ? v : null;
  }
  // Lifecycle flags can be passed through, but typical flows should use archive/remove helpers
  if (typeof input.isBlocked === 'boolean') out.isBlocked = input.isBlocked;
  if (typeof input.isArchived === 'boolean') out.isArchived = input.isArchived;
  if (typeof input.deletedAt === 'number' || input.deletedAt === null) out.deletedAt = input.deletedAt ?? null;
  // Pass-through arrays (assumed already validated by caller)
  if (Array.isArray((input as any).notes)) (out as any).notes = (input as any).notes;
  if (Array.isArray((input as any).phones)) (out as any).phones = (input as any).phones;
  if (Array.isArray((input as any).emails)) (out as any).emails = (input as any).emails;
  if (Array.isArray((input as any).addresses)) (out as any).addresses = (input as any).addresses;
  return out;
}

export function filterByLifecycle<T extends Pick<CRMRecord, 'isArchived' | 'deletedAt'>>(rows: T[], life: CRMLifecycle): T[] {
  return rows.filter((r) => {
    const archived = !!(r as any)?.isArchived;
    const removed = typeof (r as any)?.deletedAt === 'number';
    if (life === 'removed') return removed;
    if (life === 'archived') return archived && !removed;
    return !archived && !removed; // active
  });
}

export function crmBackLink(life: CRMLifecycle, base: 'crm' | 'customers-crm' = 'crm'): string {
  const root = base === 'customers-crm' ? '/employee/customers/crm' : '/employee/crm';
  if (life === 'removed') return `${root}/removed`;
  if (life === 'archived') return `${root}/archive`;
  return root;
}
