import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { getNewsbarDoc, listenNewsbar, saveNewsbarDoc } from '../../../../services/website/newsbar/firestore';

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

describe('services/website/newsbar firestore', () => {
  it('save and get newsbar doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      await saveNewsbarDoc({ enabled: true, primaryHtml: 'A', secondaryHtml: 'B', updatedBy: 'u1' }, { getDb: () => adminDb });
      const row = await getNewsbarDoc({ getDb: () => adminDb });
      expect(row?.enabled).toBe(true);
      expect(row?.primaryHtml).toBe('A');
    });
  });

  it('listen newsbar doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const events: any[] = [];
      const off = listenNewsbar((d) => events.push(d), { getDb: () => adminDb });
      await saveNewsbarDoc({ enabled: false, primaryHtml: 'X', secondaryHtml: 'Y' }, { getDb: () => adminDb });
      // give some time for snapshot
      await new Promise((r) => setTimeout(r, 10));
      off();
      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1]?.primaryHtml).toBe('X');
    });
  });
});

