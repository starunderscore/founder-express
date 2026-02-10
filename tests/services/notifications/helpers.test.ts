import { describe, it, expect } from '@jest/globals';
import { buildNotificationCreate, buildNotificationPatch, normalizeNotification } from '../../../services/notifications';

describe('services/notifications helpers', () => {
  it('normalizeNotification maps fields safely', () => {
    const raw: any = { title: '  Title  ', body: 'x', link: '/test', read: true, createdAt: 1 };
    const n = normalizeNotification('id1', raw as any);
    expect(n).toEqual({ id: 'id1', title: 'Title', body: 'x', link: '/test', read: true, createdAt: 1 });
  });

  it('buildNotificationCreate validates and shapes payload', () => {
    expect(() => buildNotificationCreate({ title: '' })).toThrow();
    const p = buildNotificationCreate({ title: '  T  ', body: '  ', link: '  ', read: false });
    expect(p.title).toBe('T');
    expect(p.body).toBeNull();
    expect(p.link).toBeNull();
    expect(p.read).toBe(false);
    expect(typeof p.createdAt).toBe('number');
  });

  it('buildNotificationPatch validates and shapes payload', () => {
    expect(() => buildNotificationPatch({ title: '  ' })).toThrow();
    const p = buildNotificationPatch({ title: ' X ', body: '  y  ', link: '/z', read: true });
    expect(p).toEqual({ title: 'X', body: 'y', link: '/z', read: true });
  });
});

