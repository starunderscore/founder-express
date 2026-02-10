import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { createAppearance, getAppearanceByUser, updateAppearance } from '../../../../services/user-settings/appearance/firestore';

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

describe('services/user-settings/appearance firestore (business logic)', () => {
  it('create and fetch appearance by user', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createAppearance({ userId: 'u1', theme: 'dark' }, { getDb: () => adminDb });
      const row = await getAppearanceByUser('u1', { getDb: () => adminDb });
      expect(row?.id).toBe(id);
      expect(row?.theme).toBe('dark');
    });
  });

  it('update theme', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createAppearance({ userId: 'u1', theme: 'light' }, { getDb: () => adminDb });
      await updateAppearance(id, { theme: 'auto' }, { getDb: () => adminDb });
      const row = await getAppearanceByUser('u1', { getDb: () => adminDb });
      expect(row?.theme).toBe('auto');
    });
  });
});

