# Firestore Rules Testing (Emulator + Jest)

This guide explains how to test Firestore security rules locally using the Firebase Emulator and Jest. The technique lets you prove your rules actually enforce ownership, admin permissions, and data model constraints — without touching production.

## Why test rules?

- Prevent accidental privilege escalations (e.g., normal users writing admin data)
- Lock down new collections before UI lands
- Catch regressions when rules change

## Tooling

- @firebase/rules-unit-testing — spins up an in‑memory test app wired to the Emulator rules engine
- Jest — test runner (any runner is fine; examples use Jest)

Install (dev only):

```
npm i -D @firebase/rules-unit-testing firebase-admin jest ts-jest @types/jest
```

Optional Jest config (jest.config.js):

```js
module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testMatch: ['**/tests/**/*.test.(ts|js)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
```

## Core pattern

1) Initialize a test environment with your real rules file:

```ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

const testEnv = await initializeTestEnvironment({
  projectId: 'local-test',
  firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8') },
});
```

2) Create clients with different identities:

```ts
const ownerDb = testEnv.authenticatedContext('owner-uid').firestore();
const adminDb = testEnv.authenticatedContext('admin-uid').firestore();
const userDb  = testEnv.authenticatedContext('user-uid').firestore();
const anonDb  = testEnv.unauthenticatedContext().firestore();
```

3) Seed prerequisite docs without rules (admin bypass):

```ts
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const admin = ctx.firestore();
  await setDoc(doc(admin, 'meta/owner'), { ownerUid: 'owner-uid' });
  await setDoc(doc(admin, 'employees', 'admin-uid'), { isAdmin: true });
  await setDoc(doc(admin, 'employees', 'user-uid'), { isAdmin: false });
});
```

4) Assert allows/denies:

```ts
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

await assertSucceeds(addDoc(collection(ownerDb, 'employee_roles'), { name: 'Role', permissionIds: [] }));
await expect(assertFails(getDocs(collection(anonDb, 'employee_roles'))));
```

5) Clean between tests:

```ts
beforeEach(async () => { await testEnv.clearFirestore(); });
```

## Example suite in repo

- File: `tests/firestore/employee_roles/access-control.test.ts`
- Covers unauthenticated denial, owner allow, admin employee allow, normal employee denial for `employee_roles`.
- Loads the real rules from `firebase/firestore.rules` so tests reflect production logic.

## Writing effective rule tests

- Seed only what the rule path depends on (e.g., `meta/owner`, `employees/{uid}`)
- Use minimal documents to reach the rule code path
- Keep each test focused on a single allow/deny
- Clear Firestore state between tests (fast, avoids bleed‑through)

## Common pitfalls

- Missing indexes: rule tests don’t create indexes; prefer simple queries in tests, or create composites in console when integration testing UI.
- Undefined vs null: Firestore filters only match existing fields; tests should align with how your app writes (e.g., `deletedAt: null` vs omit).
- UIDs: make sure seeded UIDs match the authenticated context used in the test.

## Running

Recommended (auto‑spawns Firestore Emulator via Firebase CLI):

```
npm run test:rules:emu
```

This wraps Jest with `firebase emulators:exec --only firestore`, which sets the proper environment variables and lifecycle for the rules engine.

Direct (assumes you started the Firestore emulator yourself on default port):

```
npx jest tests/firestore/employee_roles/access-control.test.ts
```
or
```
npm run test:rules
```

If you see “The host and port of the firestore emulator must be specified”, either run the `:emu` script above or start the emulator manually and set `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`.

Add more suites under `tests/firestore/` to cover other collections (CRM, Vendors, etc.) following the same pattern.
