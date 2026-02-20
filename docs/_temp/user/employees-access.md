# Employees Admin & Permissions (Overview)

This note explains how access works in the employee portal. It stays intentionally brief so we can evolve details as features ship.

Goals
- Keep the Employees section (management + roles) admin‑only.
- Use role/permission checks for the rest of the employee portal features.

Admin‑only areas
- Employees management: `Employees → Manage`
- Roles: `Employees → Roles`
- Admin definition:
  - Owner (the UID stored in `meta/owner.ownerUid`), or
- A user with an employee document `ep_employees/{uid}` where `isAdmin: true`.
- Enforcement layers:
  - UI: wrapped with `components/EmployerAdminGate`.
  - Rules: Firestore rules restrict listing/creating/deleting employees to the owner; adjust as we migrate writes.
- First owner: when the first owner claims, an `ep_employees/{ownerUid}` doc is created with `isAdmin: true` so the owner appears in the list and can manage others.

Permissioned sections (non‑admin)
- Other sections in the employee portal can be opened based on permissions granted via roles; you can also assign additional (direct) permissions to employees outside of roles. The Permissions Matrix defines resources and actions:
  - Customers — read/edit/delete
  - Email subscriptions — read/edit/delete
  - Website — News Bar + Blogs (read/edit/delete)
  - Finance — read/edit/delete
  - Tag Manager — read/edit/delete
  - Reports — read only
  - Company settings — read/edit
  - Employees — admin‑only (not grantable via roles)

How to assign access
- Create/adjust roles under `Employees → Roles` and assign roles to employees.
- Direct (extra) permissions can be granted per employee when needed.

Notes
- This is a living document. As each section moves from mocked state to Firestore‑backed, update rules and this doc accordingly.
- Canonical rules live at `firebase/firestore.rules` and deploy via Firebase CLI.
