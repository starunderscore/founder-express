import type { Newsletter, NewsletterCreateInput, NewsletterPatchInput } from './types';

export function normalizeNewsletter(id: string, raw: any): Newsletter {
  return {
    id,
    subject: String(raw?.subject || '').trim(),
    body: String(raw?.body || ''),
    status: (raw?.status as any) || 'Draft',
    recipients: typeof raw?.recipients === 'number' ? raw.recipients : Number(raw?.recipients || 0),
    scheduledAt: typeof raw?.scheduledAt === 'number' ? (raw.scheduledAt as number) : (raw?.scheduledAt ? Date.now() : null),
    sentAt: typeof raw?.sentAt === 'number' ? (raw.sentAt as number) : (raw?.sentAt ? Date.now() : null),
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt as number : undefined,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt as number : undefined,
  };
}

export function buildNewsletterCreate(input: NewsletterCreateInput): Record<string, any> {
  const subject = String(input.subject || '').trim();
  if (!subject) throw new Error('subject is required');
  const body = String(input.body || '');
  const now = Date.now();
  return {
    subject,
    body,
    status: (input.status || 'Draft') as any,
    recipients: 0,
    scheduledAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildNewsletterPatch(input: NewsletterPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.subject === 'string') {
    const s = input.subject.trim();
    if (!s) throw new Error('subject cannot be blank');
    out.subject = s;
  }
  if (typeof input.body === 'string') out.body = input.body;
  if (typeof input.status === 'string') out.status = input.status;
  if (typeof input.recipients === 'number') out.recipients = input.recipients;
  if ('scheduledAt' in (input as any)) out.scheduledAt = (input as any).scheduledAt ?? null;
  if ('sentAt' in (input as any)) out.sentAt = (input as any).sentAt ?? null;
  return out;
}

