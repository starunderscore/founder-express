import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { createCookiePolicy, listCookiePolicies, setActiveCookiePolicy, updateCookiePolicy } from '../../../../services/admin-settings/cookie-policy/firestore';

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

describe('services/admin-settings/cookie-policy firestore (business logic)', () => {
  it('create and list policies', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createCookiePolicy({ title: 'Policy A', bodyHtml: '<p>a</p>' }, { getDb: () => adminDb });
      const rows = await listCookiePolicies({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.title).toBe('Policy A');
    });
  });

  it('update title and set active policy', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id1 = await createCookiePolicy({ title: 'Policy 1' }, { getDb: () => adminDb });
      const id2 = await createCookiePolicy({ title: 'Policy 2' }, { getDb: () => adminDb });
      await updateCookiePolicy(id1, { title: 'P1' }, { getDb: () => adminDb });
      await setActiveCookiePolicy(id2, { getDb: () => adminDb });
      const rows = await listCookiePolicies({ getDb: () => adminDb });
      const p1 = rows.find(r => r.id === id1)!; const p2 = rows.find(r => r.id === id2)!;
      expect(p1.title).toBe('P1');
      expect(p1.isActive).toBeFalsy();
      expect(p2.isActive).toBeTruthy();
    });
  });
});

