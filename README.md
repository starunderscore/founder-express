**Pattern Typing Web (Next.js + Firebase)**

- Next.js App Router with multiple layouts: marketing, account, portal
- Firebase Auth (Google + Email/Password)
- State managed via lightweight services and Firestore where applicable

**Architecture**

- Service layer: business logic under `services/*`
- Firebase: `lib/firebase/*`
  - `client.ts` initializes app, auth, and db
  - `auth.ts` exposes `useAuthUser()`, `signInWithGoogle()`, `signOut()`
  - `firestore.ts` session helpers: create/listen/update
- UI: `app/` pages grouped by layouts, `components/` (AuthGate, MarketingHeader, PortalHeader)

**Routing & Layouts**

- Marketing: `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`
  - Header shows brand + single "Explore" CTA (no login/signout in header)
- Account: `app/(account)/layout.tsx`
  - `app/(account)/signin`, `signup`, `forgot-password`
- Portal: `app/(portal)/layout.tsx`, `app/(portal)/page.tsx`
  - Auth-gated client area with its own header and sign out

**Why this state system?**

- Event-oriented: every change is an action with origin metadata, enabling AI/remote controllers to operate like first-class inputs.
- Simple reducer core: predictable updates with Immer, easy to test and extend.
- Sync-friendly design without enforcing sessions; can add bridges later for realtime.
- Future-ready control: control actions and role checks can gate dispatch in middleware before reduce.

**Planned Extensions**

- Permission layer: introduce roles (owner, controller, viewer) and gate actions
- Presence: mark online/typing status via RTDB/Firestore (optional)
- AI controller: plugin subscribes to store and dispatches `ai/*` actions
- Multi-user control (future): dedicated `controls` slice and invitations
- Layout transitions: add fancy transitions across route groups

Security

- First‑owner auth for the employee portal (how the first signed‑in user claims ownership, and only the owner can add employees): see docs/first-owner-auth.md
- Deploying Firestore rules via Firebase CLI: see docs/firebase-cli-setup.md

**Setup**

1) Create Firebase project. Enable Auth (Google) and Firestore.
2) Copy `.env.example` to `.env.local` and fill values.
3) Install dependencies and run:

```
npm install
npm run dev
```

Open `http://localhost:3000`.

**File Guide**

- app/(marketing)/layout.tsx
- app/(marketing)/page.tsx
- app/(account)/layout.tsx
- app/(account)/account/signin/page.tsx
- app/(account)/account/signup/page.tsx
- app/(account)/account/forgot-password/page.tsx
- app/(portal)/portal/layout.tsx
- app/(portal)/portal/page.tsx
- components/MarketingHeader.tsx
- components/PortalHeader.tsx
- components/AuthGate.tsx
- lib/firebase/client.ts
- lib/firebase/auth.ts
- lib/firebase/firestore.ts
- services/presence.ts

Pattern Typing Web (Next.js + Firebase)

This project is a Next.js App Router app with an employee portal, role/permission UI, and Firebase Auth integration. State is managed with Zustand; UI uses Mantine.

What’s here
- Employee portal with:
  - Roles (read‑only list + editor pages)
  - Employee management (add/edit employees; admin flag respected)
  - Settings pages (company settings, user settings)
  - Website tools (News Bar, Blogs manager)
- Reusable permissions matrix component (with dependency logic: delete → edit → read)
- First‑owner flow scaffolding (owner claim page)

Run locally
1) Copy `.env.example` to `.env.local` and fill Firebase values.
2) Install and run:
```
npm install
npm run dev
```
Open `http://localhost:3000`.

Security and ownership
- First‑owner auth pattern and access model: see docs/first-owner-auth.md
- Firebase CLI setup + deploying Firestore rules: see docs/firebase-cli-setup.md
- Rules file path: `firebase/firestore.rules`

Key paths
- Employee sign‑in: `app/(employee)/employee/signin/page.tsx`
- First owner claim: `app/(employee)/employee/first-owner/page.tsx`
- Employees: `app/(employee)/employee/employees/manage`
- Roles: `app/(employee)/employee/employees/roles`

Notes
- The sign‑in page renders without the dashboard chrome.

**Testing with Firebase Emulator**

- Install dev deps (already in package.json): `firebase-tools`, `@firebase/rules-unit-testing`, `jest`, `ts-jest`.
- Run all tests with Firestore emulator:
  - `npm test` (spins up Firestore emulator, applies `firebase/firestore.rules`, runs Jest in-band)
- Troubleshooting:
  - If emulator ports are busy, adjust in `firebase.json` under `emulators` (hub/logging/firestore/websocketPort).
  - To run Jest directly without wrapping (advanced), export `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` then `jest --runInBand`.
  - First run may download emulator binaries; ensure network access and that `firebase-tools` is available.

Service-layer tests
- Business logic lives in `services/roles/*` and is covered by unit/emulator tests under `tests/services/roles/*`.
- Rules authorization is covered under `tests/firestore/*` using the emulator.
 
