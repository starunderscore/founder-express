import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { Firestore } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setupRulesTestEnv } from '../../utils/emulator';
import { archiveEmployeeDoc, createEmployee, deleteEmployeeDoc, getEmployeeDoc, listEmployees, restoreEmployeeDoc, softRemoveEmployeeDoc, updateEmployeeDoc } from '../../../services/employees/firestore';

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

describe('services/employees firestore', () => {
  it('create and list employees', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createEmployee({ name: 'User A', email: 'a@example.com' }, { getDb: () => adminDb });
      const rows = await listEmployees({ getDb: () => adminDb });
      expect(rows.find(r => r.id === id)?.email).toBe('a@example.com');
    });
  });

  it('get/update/archive/remove/restore/delete', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore() as unknown as Firestore;
      const id = await createEmployee({ name: 'User B', email: 'b@example.com' }, { getDb: () => adminDb });
      await updateEmployeeDoc(id, { isAdmin: true }, { getDb: () => adminDb });
      await archiveEmployeeDoc(id, true, { getDb: () => adminDb });
      await softRemoveEmployeeDoc(id, { getDb: () => adminDb });
      await restoreEmployeeDoc(id, { getDb: () => adminDb });
      const row = await getEmployeeDoc(id, { getDb: () => adminDb });
      expect(row?.isAdmin).toBe(true);
      await deleteEmployeeDoc(id, { getDb: () => adminDb });
      const row2 = await getEmployeeDoc(id, { getDb: () => adminDb });
      expect(row2).toBeNull();
    });
  });
});

