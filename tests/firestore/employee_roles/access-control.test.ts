/**
 * Firestore rules tests for employee_roles security.
 *
 * Requires dev deps:
 *   npm i -D @firebase/rules-unit-testing firebase-admin jest ts-jest
 * Run with emulator (recommended):
 *   npx jest tests/firestore/employee_roles/access-control.test.ts
 */
import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'pattern-typing-test';

beforeAll(async () => {
  // Support auto-discovery within `firebase emulators:exec`, or manual host:port via env
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST; // e.g. "127.0.0.1:8080"
  const rules = readFileSync('firebase/firestore.rules', 'utf8');

  if (hostPort) {
    const [host, portStr] = hostPort.split(':');
    const port = Number(portStr);
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules, host, port },
    });
  } else {
    // Fallback to emulator auto-discovery via Emulator Hub (works when running under emulators:exec)
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules },
    });
  }
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function ownerCtx(uid = 'owner-uid') {
  return testEnv.authenticatedContext(uid).firestore();
}

function employeeCtx(uid = 'emp-uid') {
  return testEnv.authenticatedContext(uid).firestore();
}

describe('ep_employee_roles rules — access control', () => {
  it('denies unauthenticated access', async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(anon, 'ep_employee_roles'), { name: 'X', permissionIds: [] }));
  });

  it('allows owner to create/list/update/delete roles', async () => {
    // Seed owner doc
    const ownerDb = ownerCtx('owner');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
    });

    // Create
    const ref = await assertSucceeds(addDoc(collection(ownerDb, 'ep_employee_roles'), { name: 'Role A', permissionIds: [], archiveAt: null, createdAt: Date.now() }));
    // List
    await assertSucceeds(getDocs(collection(ownerDb, 'ep_employee_roles')));
    // Update
    await assertSucceeds(setDoc(doc(ownerDb, 'ep_employee_roles', (ref as any).id), { name: 'Role A1', permissionIds: [] }, { merge: true }));
    // Delete
    await assertSucceeds(deleteDoc(doc(ownerDb, 'ep_employee_roles', (ref as any).id)));
  });

  it('rejects create/update when fields exceed limits', async () => {
    // Seed owner doc
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
    });

    const owner = ownerCtx('owner');
    // Too long name and description
    await assertFails(addDoc(collection(owner, 'ep_employee_roles'), { name: 'X'.repeat(41), permissionIds: [], archiveAt: null, createdAt: Date.now() }));
    await assertFails(addDoc(collection(owner, 'ep_employee_roles'), { name: 'Ok', description: 'Y'.repeat(281), permissionIds: [], archiveAt: null, createdAt: Date.now() }));

    // Valid create
    const ref = await assertSucceeds(addDoc(collection(owner, 'ep_employee_roles'), { name: 'Ok', permissionIds: [], archiveAt: null, createdAt: Date.now() }));
    // Too long update
    await assertFails(setDoc(doc(owner, 'ep_employee_roles', (ref as any).id), { name: 'X'.repeat(41) }, { merge: true }));
    await assertFails(setDoc(doc(owner, 'ep_employee_roles', (ref as any).id), { description: 'Y'.repeat(281) }, { merge: true }));
  });

  it('allows admin employee to manage roles; denies normal employee', async () => {
    // Seed owner and two employees: admin and normal
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
      await setDoc(doc(adminDb, 'ep_employees', 'admin-1'), { name: 'Admin', email: 'a@example.com', isAdmin: true, roleIds: [], permissionIds: [], isArchived: false });
      await setDoc(doc(adminDb, 'ep_employees', 'emp-1'), { name: 'User', email: 'u@example.com', isAdmin: false, roleIds: [], permissionIds: [], isArchived: false });
    });

    const adminDb = employeeCtx('admin-1');
    const userDb = employeeCtx('emp-1');

    // Admin can create and list
    await assertSucceeds(addDoc(collection(adminDb, 'ep_employee_roles'), { name: 'Role B', permissionIds: [], archiveAt: null, createdAt: Date.now() }));
    await assertSucceeds(getDocs(collection(adminDb, 'ep_employee_roles')));

    // Normal employee denied
    await assertFails(addDoc(collection(userDb, 'ep_employee_roles'), { name: 'Role C', permissionIds: [] }));
    await assertFails(getDocs(collection(userDb, 'ep_employee_roles')));
  });
});
