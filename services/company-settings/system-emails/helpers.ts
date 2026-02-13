import type { SystemEmail, SystemEmailId, SystemEmailUpsertInput } from './types';

export function normalizeSystemEmail(id: SystemEmailId, raw: any): SystemEmail {
  const subject = String(raw?.subject || '').trim();
  const body = String(raw?.body || '');
  const updatedAt = typeof raw?.updatedAt === 'number' ? raw.updatedAt as number : undefined;
  return { id, subject, body, updatedAt };
}

export function buildSystemEmailUpsert(input: SystemEmailUpsertInput): Record<string, any> {
  const subject = String(input.subject || '').trim();
  if (!subject) throw new Error('subject is required');
  const body = String(input.body || '');
  return { subject, body, updatedAt: Date.now() };
}

