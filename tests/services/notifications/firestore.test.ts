import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../utils/emulator';
import { createNotification, listNotifications, markRead } from '../../../services/notifications/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await setupRulesTestEnv();
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('services/notifications firestore (business logic)', () => {
  it('create and list notifications', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createNotification({ title: 'Hello', body: 'World', read: false }, { getDb: () => adminDb });
      const rows = await listNotifications({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.title).toBe('Hello');
    });
  });

  it('markRead toggles read state', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createNotification({ title: 'A' }, { getDb: () => adminDb });
      await markRead(id, true, { getDb: () => adminDb });
      const rows = await listNotifications({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.read).toBe(true);
    });
  });
});

