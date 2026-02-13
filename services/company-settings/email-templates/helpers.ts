import type { EmailTemplate, EmailTemplateCreateInput, EmailTemplatePatchInput } from './types';

export function normalizeEmailTemplate(id: string, raw: any): EmailTemplate {
  const name = String(raw?.name || '').trim();
  const subject = String(raw?.subject || '').trim();
  const body = String(raw?.body || '');
  const createdAt = typeof raw?.createdAt === 'number' ? raw.createdAt as number : undefined;
  const updatedAt = typeof raw?.updatedAt === 'number' ? raw.updatedAt as number : undefined;
  const archivedAt = typeof raw?.archivedAt === 'number' ? raw.archivedAt as number : (raw?.archivedAt === null ? null : (raw?.archivedAt ? Date.now() : null));
  const deletedAt = typeof raw?.deletedAt === 'number' ? raw.deletedAt as number : (raw?.deletedAt === null ? null : null);
  return { id, name, subject, body, createdAt, updatedAt, archivedAt: archivedAt ?? null, deletedAt: deletedAt ?? null };
}

export function buildEmailTemplateCreate(input: EmailTemplateCreateInput): Record<string, any> {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('name is required');
  const subject = String(input.subject || '').trim();
  if (!subject) throw new Error('subject is required');
  const body = String(input.body || '');
  const now = Date.now();
  return { name, subject, body, createdAt: now, updatedAt: now };
}

export function buildEmailTemplatePatch(input: EmailTemplatePatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') {
    const nm = input.name.trim();
    if (!nm) throw new Error('name cannot be blank');
    out.name = nm;
  }
  if (typeof input.subject === 'string') {
    const sbj = input.subject.trim();
    if (!sbj) throw new Error('subject cannot be blank');
    out.subject = sbj;
  }
  if (typeof input.body === 'string') out.body = input.body;
  if ('archivedAt' in (input as any)) out.archivedAt = (input as any).archivedAt ?? null;
  if ('deletedAt' in (input as any)) out.deletedAt = (input as any).deletedAt ?? null;
  // updatedAt is applied in the firestore functions
  return out;
}

