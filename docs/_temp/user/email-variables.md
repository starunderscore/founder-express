# Email Variables

This app supports simple, Handlebars‑style variable tokens in email subjects and message bodies. Tokens are written using double curly braces and are injected via the editor’s “Insert variable” menu.

- Token syntax: `{{VARIABLE_NAME}}`
- Examples: `{{USERNAME}}`, `{{COMPANY_NAME}}`

## Where variables come from

- Built‑in
  - `{{USERNAME}}` – intended to resolve to the recipient’s display name, or the email local‑part (before `@`) when a name is not available.
- Admin‑defined (Firebase)
  - Managed in Employee → Company Settings → Email → Email variables
  - Stored in Firestore at: `admin_settings/global/email_vars`
  - Each variable has: `key` (string), `value` (string), and optional `description`.
  - Example: key: `COMPANY_NAME`, value: `Acme Inc.`

## How authors use variables

- In the WYSIWYG toolbar, select:
  - Text format: Paragraph/H1/H2/H3
  - Insert variable: choose from Built‑in (USERNAME) or the live list from Email variables
- The editor inserts the token (e.g., `{{USERNAME}}`) at the caret position.

## How variables are resolved

Rendering happens when sending emails (adapter/rendering layer). Recommended resolution order:

1) Built‑ins
   - `{{USERNAME}}` → recipient.name → email local‑part → fallback (`there`)
2) Admin variables (from Firestore)
   - For each `key`, replace `{{KEY}}` with its `value`

Notes
- Token names are case‑sensitive in this project (use uppercase for admin variables for clarity).
- Unknown tokens should be left as‑is (or removed) based on your policy.

## Preview behavior in app

- Waiting list “Send email” preview demonstrates personalization:
  - It substitutes `{{name}}` (lowercase) for a sample recipient. This is a minimal, local preview.
  - Going forward, prefer `{{USERNAME}}` for consistency with built‑ins.
- Newsletter and Template previews currently show tokens verbatim. The email adapter should handle final substitution on send.

## Suggested renderer (pseudo‑code)

```ts
function renderEmail(templateHtml: string, subject: string, ctx: {
  recipient: { name?: string; email: string };
  vars: Record<string, string>; // from Firestore: { COMPANY_NAME: 'Acme Inc.' }
}) {
  const name = ctx.recipient.name?.trim() || ctx.recipient.email.split('@')[0] || 'there';
  const map: Record<string, string> = {
    USERNAME: name,
    ...ctx.vars,
  };
  const render = (s: string) => s.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => map[key] ?? `{{${key}}}`);
  return {
    html: render(templateHtml),
    subject: render(subject),
  };
}
```

## Permissions and security

- Reads and standard writes under `admin_settings/**` require admin/owner (Firestore rules enforced).
- Deleting (hard delete) under `admin_settings/**` additionally requires the `Company settings: Delete` permission (or owner).
- Variables are not secrets; for secrets use integrations/config pages or environment variables.

## Tips

- Keep variable names UPPER_SNAKE_CASE for clarity (e.g., `COMPANY_NAME`).
- Use the Description field on the Email variables page to document intent (mobile UIs may not show helper text elsewhere).
- Test previews with realistic sample data before sending.

## Troubleshooting

- “No email variables yet”: add at least one in Company Settings → Email variables.
- Token not replaced: ensure the renderer includes the key in its map (built‑in or Firestore). Check casing.
- Layout shows raw `{{...}}`: expected in on‑device previews for newsletters/templates; final send should run through the renderer.
- “Can’t delete variable”: ensure your account has the `Company settings: Delete` permission or is the Owner.

## Archive vs Removed

- Active: a variable that is in use (`archivedAt = null`, `deletedAt = null`).
- Archive: a variable that is temporarily hidden from active use (`archivedAt` has a timestamp). You can restore it back to Active.
- Removed: a variable that is soft‑deleted (`deletedAt` has a timestamp). You can restore it back to Active, or Delete permanently.

UI flows
- From Active:
  - Archive → moves to Archive (sets `archivedAt`).
  - Remove → moves to Removed (sets `deletedAt`).
- From Archive:
  - Restore → moves to Active (clears `archivedAt`).
  - Remove → moves to Removed (sets `deletedAt`).
- From Removed:
  - Restore → moves to Active (clears `deletedAt`).
  - Delete permanently → hard delete (requires `Company settings: Delete`).

