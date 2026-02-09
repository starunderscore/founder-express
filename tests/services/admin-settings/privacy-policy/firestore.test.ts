import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { createPrivacyPolicy, listPrivacyPolicies, setActiveClientPolicy, updatePrivacyPolicy } from '../../../../services/admin-settings/privacy-policy/firestore';

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

describe('services/admin-settings/privacy-policy firestore (business logic)', () => {
  it('create and list policies', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createPrivacyPolicy({ title: 'Policy A', bodyHtml: '<p>a</p>' }, { getDb: () => adminDb });
      const rows = await listPrivacyPolicies({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.title).toBe('Policy A');
    });
  });

  it('update title and set active client policy', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id1 = await createPrivacyPolicy({ title: 'Policy 1' }, { getDb: () => adminDb });
      const id2 = await createPrivacyPolicy({ title: 'Policy 2' }, { getDb: () => adminDb });
      await updatePrivacyPolicy(id1, { title: 'P1' }, { getDb: () => adminDb });
      await setActiveClientPolicy(id2, { getDb: () => adminDb });
      const rows = await listPrivacyPolicies({ getDb: () => adminDb });
      const p1 = rows.find(r => r.id === id1)!; const p2 = rows.find(r => r.id === id2)!;
      expect(p1.title).toBe('P1');
      expect(p1.isActive).toBeFalsy();
      expect(p2.isActive).toBeTruthy();
    });
  });
});

