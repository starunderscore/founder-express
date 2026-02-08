import { readFileSync } from 'fs';
import { afterAll, beforeAll, beforeEach, describe, it } from '@jest/globals';
import { initializeTestEnvironment, type RulesTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

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

describe('owner claim rules', () => {
  it('public read, single create by authed, no update/delete', async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(anon, 'meta/owner')));

    const ownerDb = testEnv.authenticatedContext('owner').firestore();
    await assertSucceeds(setDoc(doc(ownerDb, 'meta/owner'), { ownerUid: 'owner' }));

    // Second create denied
    await assertFails(setDoc(doc(ownerDb, 'meta/owner'), { ownerUid: 'owner' }));

    // Update denied
    await assertFails(setDoc(doc(ownerDb, 'meta/owner'), { ownerUid: 'someone-else' }, { merge: true }));
    // Delete denied
    await assertFails(deleteDoc(doc(ownerDb, 'meta/owner')));
  });
});

