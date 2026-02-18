import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { getDoc, doc, type Firestore } from 'firebase/firestore';
import { setupRulesTestEnv } from '../../utils/emulator';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { archiveCRMRecord, createCRMRecord, deleteCRMRecord, listCRM, removeCRMRecord, restoreCRMRecord, updateCRMRecord } from '../../../services/crm/firestore';

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

describe('services/crm firestore (business logic)', () => {
  it('create and list active CRM records', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createCRMRecord({ type: 'customer', name: 'Alice', email: 'a@example.com', tags: ['VIP'] }, { getDb: () => adminDb });
      const rows = await listCRM('active', { getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.name).toBe('Alice');
    });
  });

  it('update maps nullables to deleteField', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createCRMRecord({ type: 'customer', name: 'Bob', email: 'b@example.com', company: 'Co' }, { getDb: () => adminDb });
      await updateCRMRecord(id, { email: '', company: '' }, { getDb: () => adminDb });
      const snap = await getDoc(doc(adminDb, 'crm_customers', id));
      const data = snap.data() as any;
      expect('email' in (data || {})).toBe(false);
      expect('company' in (data || {})).toBe(false);
    });
  });

  it('archive/remove/restore lifecycle flows', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createCRMRecord({ type: 'customer', name: 'Charlie' }, { getDb: () => adminDb });

      await archiveCRMRecord(id, { getDb: () => adminDb });
      expect((await listCRM('archived', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);
      expect((await listCRM('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);

      await removeCRMRecord(id, { getDb: () => adminDb });
      expect((await listCRM('removed', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);

      await restoreCRMRecord(id, { getDb: () => adminDb });
      expect((await listCRM('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);
      expect((await listCRM('removed', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);

      await deleteCRMRecord(id, { getDb: () => adminDb });
      expect((await listCRM('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);
    });
  });
});

