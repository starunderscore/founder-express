import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { getDoc, doc, type Firestore } from 'firebase/firestore';
import { setupRulesTestEnv } from '../../utils/emulator';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { archiveRole, createRole, deleteRole, listRoles, removeRole, restoreRole, updateRole } from '../../../services/roles/firestore';

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

describe('services/roles firestore (business logic)', () => {
  it('create and list roles', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createRole({ name: 'Role A', permissionIds: [] }, { getDb: () => adminDb });
      const rows = await listRoles('active', { getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.name).toBe('Role A');
    });
  });

  it('update clears description via deleteField mapping', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createRole({ name: 'Role B', permissionIds: [], description: 'desc' }, { getDb: () => adminDb });
      await updateRole(id, { description: '' }, { getDb: () => adminDb });
      const snap = await getDoc(doc(adminDb, 'ep_employee_roles', id));
      const data = snap.data() as any;
      expect('description' in (data || {})).toBe(false);
    });
  });

  it('archive/remove/restore affect list filters', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createRole({ name: 'Role C', permissionIds: [] }, { getDb: () => adminDb });

      await archiveRole(id, { getDb: () => adminDb });
      expect((await listRoles('archived', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);
      expect((await listRoles('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);

      await removeRole(id, { getDb: () => adminDb });
      expect((await listRoles('removed', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);

      await restoreRole(id, { getDb: () => adminDb });
      expect((await listRoles('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(true);
      expect((await listRoles('removed', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);

      await deleteRole(id, { getDb: () => adminDb });
      expect((await listRoles('active', { getDb: () => adminDb })).some(r => r.id === id)).toBe(false);
    });
  });
});
