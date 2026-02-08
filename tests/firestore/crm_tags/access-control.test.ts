/**
 * Firestore rules tests for crm_tags security.
 */
import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, it } from '@jest/globals';
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
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST; // e.g. "127.0.0.1:8080"
  const rules = readFileSync('firebase/firestore.rules', 'utf8');

  if (hostPort) {
    const [host, portStr] = hostPort.split(':');
    const port = Number(portStr);
    testEnv = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules, host, port } });
  } else {
    testEnv = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });
  }
});

afterAll(async () => { await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

function ownerDb() { return testEnv.authenticatedContext('owner').firestore(); }
function empDb(uid: string) { return testEnv.authenticatedContext(uid).firestore(); }

describe('ep_tags rules — admin-only access', () => {
  it('owner/admin can manage; normal employee denied', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
      await setDoc(doc(adminDb, 'employees', 'admin-1'), { name: 'Admin', email: 'a@example.com', isAdmin: true, isArchived: false });
      await setDoc(doc(adminDb, 'employees', 'emp-1'), { name: 'User', email: 'u@example.com', isAdmin: false, isArchived: false });
    });

    const owner = ownerDb();
    const admin = empDb('admin-1');
    const emp = empDb('emp-1');

    // Owner
    const ref = await assertSucceeds(addDoc(collection(owner, 'ep_tags'), { name: 'X', status: 'active', createdAt: Date.now() }));
    await assertSucceeds(getDocs(collection(owner, 'ep_tags')));
    await assertSucceeds(deleteDoc(doc(owner, 'ep_tags', (ref as any).id)));

    // Admin employee
    await assertSucceeds(addDoc(collection(admin, 'ep_tags'), { name: 'Y', status: 'active', createdAt: Date.now() }));
    await assertSucceeds(getDocs(collection(admin, 'ep_tags')));

    // Normal employee denied
    await assertFails(addDoc(collection(emp, 'ep_tags'), { name: 'Z', status: 'active', createdAt: Date.now() }));
    await assertFails(getDocs(collection(emp, 'ep_tags')));
  });

  it('rejects create/update when fields exceed limits', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'meta/owner'), { ownerUid: 'owner' });
    });

    const owner = ownerDb();
    // Too long name, description, color
    await assertFails(addDoc(collection(owner, 'ep_tags'), { name: 'X'.repeat(41), status: 'active', createdAt: Date.now() }));
    await assertFails(addDoc(collection(owner, 'ep_tags'), { name: 'Ok', description: 'Y'.repeat(281), status: 'active', createdAt: Date.now() }));
    await assertFails(addDoc(collection(owner, 'ep_tags'), { name: 'Ok', color: '#12345678901234567890X', status: 'active', createdAt: Date.now() }));

    // Valid create
    const ref = await assertSucceeds(addDoc(collection(owner, 'ep_tags'), { name: 'Ok', status: 'active', createdAt: Date.now() }));
    // Too long update
    await assertFails(setDoc(doc(owner, 'ep_tags', (ref as any).id), { description: 'Y'.repeat(281) }, { merge: true }));
    await assertFails(setDoc(doc(owner, 'ep_tags', (ref as any).id), { color: '#12345678901234567890X' }, { merge: true }));
  });
});
