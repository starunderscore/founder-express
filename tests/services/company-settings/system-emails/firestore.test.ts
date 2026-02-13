import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { getSystemEmailDoc, saveSystemEmailDoc } from '../../../../services/company-settings/system-emails/firestore';

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

describe('services/company-settings/system-emails firestore (business logic)', () => {
  it('save and get system email', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      await saveSystemEmailDoc('verify_email', { subject: 'Verify', body: '<p>Hi</p>' }, { getDb: () => adminDb });
      const row = await getSystemEmailDoc('verify_email', { getDb: () => adminDb });
      expect(row?.subject).toBe('Verify');
    });
  });
});

