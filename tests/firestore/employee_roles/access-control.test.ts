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

describe('employee_roles rules — access control', () => {
  it('denies unauthenticated access', async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(anon, 'employee_roles'), { name: 'X', permissionIds: [] }));
  });

  it('allows owner to create/list/update/delete roles', async () => {
    // Seed owner doc
    const ownerDb = ownerCtx('owner');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
    });

    // Create
    const ref = await assertSucceeds(addDoc(collection(ownerDb, 'employee_roles'), { name: 'Role A', permissionIds: [], isArchived: false, createdAt: Date.now() }));
    // List
    await assertSucceeds(getDocs(collection(ownerDb, 'employee_roles')));
    // Update
    await assertSucceeds(setDoc(doc(ownerDb, 'employee_roles', (ref as any).id), { name: 'Role A1', permissionIds: [] }, { merge: true }));
    // Delete
    await assertSucceeds(deleteDoc(doc(ownerDb, 'employee_roles', (ref as any).id)));
  });

  it('allows admin employee to manage roles; denies normal employee', async () => {
    // Seed owner and two employees: admin and normal
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
      await setDoc(doc(adminDb, 'employees', 'admin-1'), { name: 'Admin', email: 'a@example.com', isAdmin: true, roleIds: [], permissionIds: [], isArchived: false });
      await setDoc(doc(adminDb, 'employees', 'emp-1'), { name: 'User', email: 'u@example.com', isAdmin: false, roleIds: [], permissionIds: [], isArchived: false });
    });

    const adminDb = employeeCtx('admin-1');
    const userDb = employeeCtx('emp-1');

    // Admin can create and list
    await assertSucceeds(addDoc(collection(adminDb, 'employee_roles'), { name: 'Role B', permissionIds: [], isArchived: false, createdAt: Date.now() }));
    await assertSucceeds(getDocs(collection(adminDb, 'employee_roles')));

    // Normal employee denied
    await assertFails(addDoc(collection(userDb, 'employee_roles'), { name: 'Role C', permissionIds: [] }));
    await assertFails(getDocs(collection(userDb, 'employee_roles')));
  });
});
