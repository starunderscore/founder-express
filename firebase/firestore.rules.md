Firestore Rules Overview

This document explains the structure and intent of the Firestore security rules in firebase/firestore.rules.

Sections
- Functions
  - Client portal — empty (fresh start)
  - Employee portal — helper functions for authz
    - Tested boundary: a conspicuous line indicates which helpers are covered by tests (above) vs not yet covered (below).
    - authed(): convenience check for an authenticated request.
    - isEmployee(): true when the requester has an active employees/{uid} document (not archived/removed).
    - isAdmin(): true for the Owner (meta/owner.ownerUid) or an active employee with isAdmin == true.
- Gateway
  - Client portal — empty (fresh start)
  - Employee portal — match blocks for app data
    - Tested boundary: a conspicuous line indicates which gateway rules are covered by tests (above) vs not yet covered (below).
    - meta/owner: first-user owner claim; public read; no updates/deletes.
    - employees/{uid}: admin-only CRUD.
    - admin_settings/**: admin-only CRUD.
    - ep_tags/{id}, crm_customers/{id}: admin-only CRUD.
    - website/newsbar: public read, admin-only writes.
    - blogs/{id}: public read when published; admin-only writes.
    - ep_employee_roles/{id}: admin-only CRUD.
    - notifications/{id}: read for active employees/admin; admin-only writes.
    - catch-all deny: deny all unmatched reads/writes.

Testing
- The unit tests under tests/firestore cover authorization behavior for:
  - meta/owner (owner claim)
  - employees (admin-only access)
  - ep_employee_roles (admin-only access)
- A tested boundary comment in the rules file marks which helpers/gateway rules are currently covered.
- Run rules tests:
  - All tests: npm test
  - Roles rules only: npm run test:rules:roles
