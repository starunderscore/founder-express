import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { archiveEmailTemplateDoc, createEmailTemplate, listEmailTemplates, restoreEmailTemplateDoc, softRemoveEmailTemplateDoc, updateEmailTemplateDoc } from '../../../../services/company-settings/email-templates/firestore';

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

describe('services/company-settings/email-templates firestore (business logic)', () => {
  it('create and list templates', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createEmailTemplate({ name: 'Welcome', subject: 'Hi', body: 'Hello' }, { getDb: () => adminDb });
      const rows = await listEmailTemplates({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.name).toBe('Welcome');
    });
  });

  it('update, archive, remove and restore', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createEmailTemplate({ name: 'A', subject: 'S', body: 'B' }, { getDb: () => adminDb });
      await updateEmailTemplateDoc(id, { subject: 'S2' }, { getDb: () => adminDb });
      await archiveEmailTemplateDoc(id, true, { getDb: () => adminDb });
      await softRemoveEmailTemplateDoc(id, { getDb: () => adminDb });
      await restoreEmailTemplateDoc(id, { getDb: () => adminDb });
      const rows = await listEmailTemplates({ getDb: () => adminDb });
      const item = rows.find(r => r.id === id)!;
      expect(item.subject).toBe('S2');
    });
  });
});

