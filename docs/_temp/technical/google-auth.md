# Google Auth — showing the button

Founder Express uses Firebase Authentication for Google sign‑in. Once you enable the Google provider in your Firebase project, users can authenticate with Google.

UI toggle for the Google button

- During setup, you can surface the “Continue with Google” button on the sign‑in screens by setting a public env var at build time:
  - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=1`
- After you’ve finished configuration/verification, you can hide the button again by removing the env var. Authentication will continue to work as long as the provider remains enabled in Firebase — this switch only controls the UI.

Where the button appears (when enabled)

- Client sign‑in: `/account/signin`
- Employee sign‑in: `/employee/signin`

Requirements

1) Enable Google as a sign‑in provider in Firebase Console (Auth → Sign‑in method).
2) (Optional UI) Add `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=1` and rebuild to show the button while you’re setting things up.

Notes

- `NEXT_PUBLIC_*` env vars are inlined at build time; rebuild/restart after changes.
- This is a presentation toggle — no secrets in `NEXT_PUBLIC_*` values.
