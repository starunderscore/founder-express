import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { archiveEmailVarDoc, createEmailVar, listEmailVars, restoreEmailVarDoc, softRemoveEmailVarDoc, updateEmailVarDoc } from '../../../../services/company-settings/email-variables/firestore';

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

describe('services/admin-settings/email-variables firestore (business logic)', () => {
  it('create and list variables', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createEmailVar({ key: 'COMPANY_NAME', value: 'Acme' }, { getDb: () => adminDb });
      const rows = await listEmailVars({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.key).toBe('COMPANY_NAME');
    });
  });

  it('update, archive, remove and restore', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createEmailVar({ key: 'X', value: '1' }, { getDb: () => adminDb });
      await updateEmailVarDoc(id, { value: '2' }, { getDb: () => adminDb });
      await archiveEmailVarDoc(id, true, { getDb: () => adminDb });
      await softRemoveEmailVarDoc(id, { getDb: () => adminDb });
      await restoreEmailVarDoc(id, { getDb: () => adminDb });
      const rows = await listEmailVars({ getDb: () => adminDb });
      const item = rows.find(r => r.id === id)!;
      expect(item.value).toBe('2');
    });
  });
});

