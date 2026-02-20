# First‑Owner Auth (Employee Portal Ownership)

This pattern secures the employee portal by allowing exactly one signed‑in user to claim ownership the very first time. After ownership is claimed, only the owner can add employees. Everyone else must be explicitly added before they can access the employee portal.

Goals
- Single owner claim on first login (no race conditions).
- Owner can add/manage employees; non‑owners cannot self‑enroll.
- Employees can sign in but cannot access the employee portal until added by the owner.
- Keep “admin” as an account‑level flag (not assignable from roles UI).

Data model (Firestore)
- `meta/owner` (singleton)
  - `ownerUid` string (immutable once set)
  - `claimedAt` number (server timestamp)
- `ep_employees/{uid}`
  - `name` string, `email` string
  - `roleIds` string[] (assigned by owner)
  - `permissionIds` string[] (optional extras)
  - `isAdmin` boolean (set externally, not via portal)

Security rules
Managed via Firebase CLI. See docs/firebase-cli-setup.md and the canonical rules in `firebase/firestore.rules`.

Client‑side gating (recommended)
- On employee portal routes, gate access with this logic:
  1) If no `meta/owner` exists: the Employee sign‑in page at `/employee/signin` shows a subtle Help button in the bottom‑right that links to `/employee/first-owner`. If the employees list cannot be read due to rules, the Help button still appears (first‑run guidance).
  2) The First Owner page at `/employee/first-owner` lets you claim ownership in one step:
     - If you are not signed in, enter Your name + Email + Password, click “Create account & claim”. The page creates a Firebase Auth account, sets your display name, writes `meta/owner`, and creates `ep_employees/{uid}` with admin privileges.
     - If you are signed in, enter Your name and click “Claim ownership”. The page writes `meta/owner` and creates/updates `ep_employees/{uid}` accordingly.
     - If an owner already exists, it redirects back to `/employee/signin` (page is not navigable afterward).
 3) If `meta/owner` exists: allow employee portal access only if the current UID is `ownerUid`, or if an `ep_employees/{uid}` document exists.
- Owner flow: After claim, the owner lands on Employee management to add employees.
  - The claim process also creates `ep_employees/{ownerUid}` with:
    - `name` from the claim form (fallback to the authenticated user display name)
    - `email` from the authenticated user
    - `roleIds: []`, `permissionIds: []`
    - `isAdmin: true`
    - `createdAt: serverTimestamp()`
  - This ensures the owner appears in the employees list and can manage others.
- Non‑owner flow: Show “Ask your owner to add you” if no `ep_employees/{uid}`.

Example claim UI flow
- Visit `/employee/signin`. When no owner exists, you’ll see a Help button → click to open `/employee/first-owner`.
- On `/employee/first-owner`:
  - Option A: Not signed in → enter Your name, Email, Password → “Create account & claim”.
  - Option B: Signed in → enter Your name → “Claim ownership”.
- Internals: `setDoc(doc(db, 'meta', 'owner'), { ownerUid, claimedAt: serverTimestamp() })` then `setDoc(doc(db, 'ep_employees', ownerUid), { name, email, isAdmin: true, roleIds: [], permissionIds: [], createdAt })`.
- Redirects to `/employee/employees/manage` after claim.

Admin flag
- Keep `isAdmin` as an account‑level attribute (outside this portal), set via your admin console or a privileged backend.
- Rules above prevent changing `isAdmin` from the employee portal.

Roll‑out plan
- Deploy rules first (they’re deny‑by‑default apart from the explicit allow blocks).
- Ship claim screen and portal gating next.
- Migrate any legacy employees list into `ep_employees/{uid}`.
- Test race: open two sessions, click “Claim” simultaneously; rules ensure only the first succeeds.

Notes on enforcement
- The Help button is hidden by default and only shows a link/text when Firestore confirms no owner exists. Otherwise it renders nothing.
- For strict server‑side enforcement of “block claim when any employees exist”, use either an Admin SDK endpoint to atomically check+write, or maintain a `meta/stats` doc (e.g., `employeesCount`) updated by backend logic and reference it in rules. Firestore rules cannot list a collection to check emptiness directly.

FAQ
- Can the owner be transferred? Add a backend tool to write `meta/owner.ownerUid` with admin credentials (not from portal). Rules disallow in‑portal updates.
- Can employees self‑enroll? No — create is owner‑only.
- Can roles be read by employees? Yes, but writing roles/permissions is owner‑only by rules.

---

If you keep roles/permissions in client state (Zustand) for now, you still benefit from owner gating via `meta/owner` and `ep_employees/{uid}`. Move the rest server‑side when ready.

Deploying the rules with Firebase CLI
- Follow docs/firebase-cli-setup.md to install the CLI, log in, and deploy `firebase/firestore.rules`.
