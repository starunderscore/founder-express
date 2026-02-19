import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { doc, getDoc, type Firestore, updateDoc } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../../utils/emulator';
import { createCRMRecord } from '../../../../services/crm/firestore';
import {
  addVendorContactNote,
  archiveVendorContact,
  getVendorContactById,
  removeVendorContact,
  removeVendorContactNote,
  restoreVendorContact,
  setVendorContactDoNotContact,
  unarchiveVendorContact,
  updateVendorContact,
  updateVendorContactNote,
} from '../../../../services/crm/vendor-contacts/firestore';

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

async function seedVendorWithContact(adminDb: Firestore) {
  const vendorId = await createCRMRecord({ type: 'vendor', name: 'VendorCo' }, { getDb: () => adminDb });
  const contact = { id: 'ct-test-1', name: 'Alice', createdAt: Date.now(), notes: [], emails: [], phones: [], addresses: [], isArchived: false, doNotContact: false };
  await updateDoc(doc(adminDb, 'crm_customers', vendorId), { contacts: [contact] } as any);
  return { vendorId, contactId: contact.id };
}

describe('services/crm/vendor-contacts firestore', () => {
  it('finds vendor by contact id', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const { vendorId, contactId } = await seedVendorWithContact(adminDb);
      const res = await getVendorContactById(contactId, { getDb: () => adminDb });
      expect(res?.vendorId).toBe(vendorId);
      expect(res?.contact?.name).toBe('Alice');
    });
  });

  it('adds, updates, and removes a note for a contact', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const { vendorId, contactId } = await seedVendorWithContact(adminDb);

      const noteId = 'note-1';
      await addVendorContactNote(vendorId, contactId, { id: noteId, title: 'Start', body: 'Body', createdAt: Date.now() }, { getDb: () => adminDb });
      let snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      let vendor = snap.data() as any;
      expect(vendor.contacts[0].notes.length).toBe(1);
      expect(vendor.contacts[0].notes[0].title).toBe('Start');

      await updateVendorContactNote(vendorId, contactId, noteId, { title: 'Updated' }, { getDb: () => adminDb });
      snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      vendor = snap.data() as any;
      expect(vendor.contacts[0].notes[0].title).toBe('Updated');

      await removeVendorContactNote(vendorId, contactId, noteId, { getDb: () => adminDb });
      snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      vendor = snap.data() as any;
      expect(vendor.contacts[0].notes.length).toBe(0);
    });
  });

  it('updates flags and lifecycle on contact', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const { vendorId, contactId } = await seedVendorWithContact(adminDb);

      await setVendorContactDoNotContact(vendorId, contactId, true, { getDb: () => adminDb });
      let snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      let vendor = snap.data() as any;
      expect(vendor.contacts[0].doNotContact).toBe(true);

      await archiveVendorContact(vendorId, contactId, { getDb: () => adminDb });
      snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      vendor = snap.data() as any;
      expect(vendor.contacts[0].isArchived).toBe(true);

      await unarchiveVendorContact(vendorId, contactId, { getDb: () => adminDb });
      snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      vendor = snap.data() as any;
      expect(vendor.contacts[0].isArchived).toBe(false);

      await removeVendorContact(vendorId, contactId, { getDb: () => adminDb });
      snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      vendor = snap.data() as any;
      expect(typeof vendor.contacts[0].deletedAt).toBe('number');

      await restoreVendorContact(vendorId, contactId, { getDb: () => adminDb });
      snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      vendor = snap.data() as any;
      expect('deletedAt' in vendor.contacts[0]).toBe(false);

      await updateVendorContact(vendorId, contactId, { title: 'CTO' }, { getDb: () => adminDb });
      snap = await getDoc(doc(adminDb, 'crm_customers', vendorId));
      vendor = snap.data() as any;
      expect(vendor.contacts[0].title).toBe('CTO');
    });
  });
});

