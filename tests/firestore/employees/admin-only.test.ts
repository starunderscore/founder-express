import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, it } from '@jest/globals';
import { initializeTestEnvironment, type RulesTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rules = readFileSync('firebase/firestore.rules', 'utf8');
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST;
  if (hostPort) {
    const [host, portStr] = hostPort.split(':');
    const port = Number(portStr);
    testEnv = await initializeTestEnvironment({ projectId: 'pattern-typing-test', firestore: { rules, host, port } });
  } else {
    testEnv = await initializeTestEnvironment({ projectId: 'pattern-typing-test', firestore: { rules } });
  }
});

afterAll(async () => { await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

describe('employees collection — admin-only access', () => {
  it('admin (owner) can CRUD; normal employee denied', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
      await setDoc(doc(adminDb, 'employees', 'emp-1'), { name: 'User', email: 'u@example.com', isAdmin: false, isArchived: false });
    });

    const owner = testEnv.authenticatedContext('owner').firestore();
    const emp = testEnv.authenticatedContext('emp-1').firestore();

    // Owner can create/list/get/update/delete employees
    const ref = await assertSucceeds(addDoc(collection(owner, 'employees'), { name: 'A', email: 'a@example.com', isAdmin: false }));
    await assertSucceeds(getDocs(collection(owner, 'employees')));
    await assertSucceeds(getDoc(doc(owner, 'employees', (ref as any).id)));
    await assertSucceeds(updateDoc(doc(owner, 'employees', (ref as any).id), { isAdmin: true }));
    await assertSucceeds(deleteDoc(doc(owner, 'employees', (ref as any).id)));

    // Normal employee denied on list/get/create/update/delete
    await assertFails(getDocs(collection(emp, 'employees')));
    await assertFails(getDoc(doc(emp, 'employees', 'emp-1')));
    await assertFails(addDoc(collection(emp, 'employees'), { name: 'X', email: 'x@example.com', isAdmin: false }));
  });
});

