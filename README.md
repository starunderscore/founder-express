**Pattern Typing Web (Next.js + Firebase)**

- Next.js App Router with multiple layouts: marketing, account, portal
- Firebase Auth (Google + Email/Password)
- Robust state system using Zustand + Immer with event origins for user/ai/remote

**Architecture**

- State Core: `state/store.ts`, `state/events.ts`, `state/selectors.ts`
  - Single source of truth per session: text, cursor, mode, aiEnabled
  - Actions carry origin: user | ai | remote
-  - Reducer applies actions (no session sync as requested)
-  - Extensible for permissions/control actions (request/grant/release)
- Firebase: `lib/firebase/*`
  - `client.ts` initializes app, auth, and db
  - `auth.ts` exposes `useAuthUser()`, `signInWithGoogle()`, `signOut()`
  - `firestore.ts` session helpers: create/listen/update
- UI: `app/` pages grouped by layouts, `components/` (AuthGate, PatternTypingCanvas, MarketingHeader, PortalHeader)

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
- components/PatternTypingCanvas.tsx
- lib/firebase/client.ts
- lib/firebase/auth.ts
- lib/firebase/firestore.ts
- state/events.ts
- state/store.ts
- state/selectors.ts
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
 
