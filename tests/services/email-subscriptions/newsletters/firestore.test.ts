import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { createNewsletter, deleteNewsletterDoc, getNewsletterDoc, listNewsletters, listenNewsletters, markNewsletterSent, scheduleNewsletter, updateNewsletterDoc } from '../../../../services/email-subscriptions/newsletters/firestore';

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

describe('services/newsletters firestore', () => {
  it('create/list/get/update/schedule/sent/delete flows', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createNewsletter({ subject: 'Hello', body: 'Hi' }, { getDb: () => adminDb });
      await updateNewsletterDoc(id, { body: 'Hello world' }, { getDb: () => adminDb });
      await scheduleNewsletter(id, Date.now(), { getDb: () => adminDb });
      await markNewsletterSent(id, 42, Date.now(), { getDb: () => adminDb });
      const rows = await listNewsletters({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.subject).toBe('Hello');
      const row = await getNewsletterDoc(id, { getDb: () => adminDb });
      expect(row?.body).toBe('Hello world');

      // Listener sanity
      const events: any[] = [];
      const off = listenNewsletters((list) => events.push(list), { getDb: () => adminDb });
      await updateNewsletterDoc(id, { subject: 'Hi' }, { getDb: () => adminDb });
      await new Promise((r) => setTimeout(r, 10));
      off();
      expect(events.length).toBeGreaterThan(0);

      await deleteNewsletterDoc(id, { getDb: () => adminDb });
      const row2 = await getNewsletterDoc(id, { getDb: () => adminDb });
      expect(row2).toBeNull();
    });
  });
});

