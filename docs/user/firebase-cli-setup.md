# Firebase CLI Setup and Deploying Firestore Rules

This guide helps you install the Firebase CLI, log in, select your project, and deploy Firestore security rules provided in `firebase/firestore.rules`.

Prerequisites
- Node.js 18+ and npm
- A Firebase project (Project ID available in the Firebase console)

Install the CLI
```
npm install -g firebase-tools
firebase --version
```

Authenticate
```
firebase login
```

Initialize or update local config
- If you have not set up local config yet:
  ```
  firebase init firestore
  ```
  - Choose your Firebase project
  - When prompted for “What file should be used for Firestore Rules?”, enter:
    `firebase/firestore.rules`
  - You can skip indexes for now

- If you already have a `firebase.json`, ensure it references `firebase/firestore.rules`:
  ```json
  {
    "firestore": {
      "rules": "firebase/firestore.rules"
    }
  }
  ```

Deploy Firestore rules only
```
firebase deploy --only firestore:rules
```

What these rules do
- Allow read (get) of the single doc `meta/owner` so the sign‑in view can determine whether an owner exists (to show the Help hint).
- Allow a one‑time create of `meta/owner` by the very first authenticated user (first‑owner claim).
- Deny all other reads/writes by default.

Next steps (optional)
- After you migrate employees/roles to Firestore, extend rules (and tests) to grant owner‑only writes for employee docs and self‑service edits where appropriate. See `docs/first-owner-auth.md` for a recommended access model.
