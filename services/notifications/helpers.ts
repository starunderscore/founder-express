import type { NotificationCreateInput, NotificationItem, NotificationPatchInput, RawNotificationDoc } from './types';

export function normalizeNotification(id: string, raw: RawNotificationDoc): NotificationItem {
  const title = String(raw?.title || '').trim() || 'Notification';
  const body = typeof raw?.body === 'string' && raw.body.trim().length > 0 ? String(raw.body) : undefined;
  const link = typeof raw?.link === 'string' && raw.link.trim().length > 0 ? String(raw.link) : undefined;
  const read = !!raw?.read;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : Date.now();
  return { id, title, body, link, read, createdAt };
}

export function buildNotificationCreate(input: NotificationCreateInput): Record<string, any> {
  const t = String(input.title || '').trim();
  if (!t) throw new Error('title is required');
  return {
    title: t,
    body: input.body?.trim() || null,
    link: input.link?.trim() || null,
    read: !!input.read,
    createdAt: typeof input.createdAt === 'number' ? input.createdAt : Date.now(),
  };
}

export function buildNotificationPatch(input: NotificationPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.title === 'string') {
    const t = input.title.trim();
    if (!t) throw new Error('title cannot be blank');
    out.title = t;
  }
  if (typeof input.body === 'string') out.body = input.body.trim() || null;
  if (typeof input.link === 'string') out.link = input.link.trim() || null;
  if (typeof input.read === 'boolean') out.read = input.read;
  return out;
}

