# Client Access (Authentication‑only for now)

This note clarifies the current access model for the client portal. It’s intentionally short so we can evolve it as client features grow.

Goals
- Keep client portal simple: sign‑in required, no role/permission checks yet.
- Make it explicit that employee roles/permissions/admin status do not affect the client portal.

Current behavior
- Authentication: Required (users must sign in).
- Authorization: Not enforced yet. Roles, permissions, and `isAdmin` have no effect on client features at this time.
- Net result: Any authenticated client can use the client portal features exposed today.

Future direction (placeholder)
- As we add client‑side features that need restrictions, we’ll introduce scope‑based checks similar to the employee portal (roles/permissions) and update this doc accordingly.
