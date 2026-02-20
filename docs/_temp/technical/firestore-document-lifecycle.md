# Firestore Document Lifecycle: Active, Archive, Removed

This spec standardizes how Firebase/Firestore documents represent lifecycle state and how UI tabs (Active, Archive, Removed) derive from those fields. It replaces ad‑hoc patterns (e.g., `isArchived`, `deletedAt`) with timestamped state for predictable sorting and consistent behavior across features (e.g., Tag Manager, Email Variables, Vendors, Customers).

## Goals

- Single, consistent state model usable by all collections.
- Timestamps determine list positioning within each tab.
- Clear, reversible state transitions (Archive, Remove, Restore).
- Queryable with straightforward Firestore filters and indexes.

## Canonical Fields

- `archiveAt` (Timestamp)
  - When set, the document is considered archived (unless removed).
  - Type: Firestore `Timestamp` preferred. If using numbers, use epoch ms consistently.
- `removedAt` (Timestamp)
  - When set, the document is considered removed/soft‑deleted and takes precedence over `archiveAt`.
  - Type: Firestore `Timestamp` preferred. If using numbers, use epoch ms consistently.
- `createdAt` (Timestamp)
  - Set on create. Used for audits and as a fallback for ordering.
- `updatedAt` (Timestamp)
  - Updated on any meaningful mutation. Used to sort Active tab by “recently changed”.

Notes
- Prefer Firestore `Timestamp` to enable security rules validation against `request.time`.
- If the current codebase stores epoch numbers, adopt these names immediately and plan migration to `Timestamp` when feasible.

## State Derivation (Tabs)

Exactly one tab applies per document using these rules:

1) Removed tab
- Condition: `removedAt != null`
- Sort: `removedAt` desc (most recently removed first)

2) Archive tab
- Condition: `removedAt == null && archiveAt != null`
- Sort: `archiveAt` desc (most recently archived first)

3) Active tab
- Condition: `removedAt == null && archiveAt == null`
- Sort: `updatedAt` desc (fallback to `createdAt` desc if `updatedAt` missing)

Precedence
- `removedAt` overrides `archiveAt` for state and tab placement. If both are set, the doc is considered Removed.

## UI Behavior Guidelines

- Tabs: Active | Archive | Removed
- Badges/cards on detail/edit pages:
  - Show “Removed” banner if `removedAt` is set.
  - Else show “Archived” banner if `archiveAt` is set.
  - Else show no state banner.
- Back navigation from detail/edit pages routes to the corresponding tab list for the current state.

## Transitions

- Archive (from Active): set `archiveAt = now`, ensure `removedAt = null`.
- Unarchive (from Archive): set `archiveAt = null`.
- Remove (from Active/Archive): set `removedAt = now`.
- Restore (from Removed): set `removedAt = null` and `archiveAt = null` (restores to Active).

Rationale
- Keeping `archiveAt` while removed is allowed but provides no benefit since Removed takes precedence. Clearing both on restore ensures a clean return to Active.

## Firestore Queries (Web v9 examples)

Active
```ts
// removedAt == null AND archiveAt == null
query(
  collection(db, '…'),
  where('removedAt', '==', null),
  where('archiveAt', '==', null),
  orderBy('updatedAt', 'desc'),
)
```

Archive
```ts
// removedAt == null AND archiveAt != null
query(
  collection(db, '…'),
  where('removedAt', '==', null),
  where('archiveAt', '!=', null),
  orderBy('archiveAt', 'desc'), // Firestore requires ordering on the inequality field
)
```

Removed
```ts
// removedAt != null
query(
  collection(db, '…'),
  where('removedAt', '!=', null),
  orderBy('removedAt', 'desc'),
)
```

Indexes
- Firestore will prompt for composite indexes the first time these are run. Add as needed.
- If your project disallows `!=` filters, an alternative is to store a helper boolean (e.g., `isArchived`, `isRemoved`) maintained in tandem. Prefer the pure timestamp approach when `!=` filters are enabled.

## Server/Rules Recommendations

Types
- Use Firestore `Timestamp` for `archiveAt`, `removedAt`, `createdAt`, `updatedAt`.

Setting timestamps
- `createdAt`: set once on create (`FieldValue.serverTimestamp()`).
- `updatedAt`: set on every write that changes user‑visible fields (serverTimestamp).
- `archiveAt`/`removedAt`: set/unset by user actions; prefer serverTimestamp via Cloud Functions or trusted backend when possible.

Security rules (sketch)
```rules
function isTimestampOrNull(v) {
  return v == null || v is timestamp;
}

match /databases/{database}/documents {
  match /{colId}/{docId} {
    allow create: if
      isTimestampOrNull(request.resource.data.archiveAt) &&
      isTimestampOrNull(request.resource.data.removedAt) &&
      request.resource.data.createdAt == request.time &&
      request.resource.data.updatedAt == request.time;

    allow update: if
      isTimestampOrNull(request.resource.data.archiveAt) &&
      isTimestampOrNull(request.resource.data.removedAt) &&
      request.resource.data.updatedAt == request.time;
  }
}
```

Notes
- If the client must write epoch numbers, you cannot validate against `request.time` precisely. Prefer backend/cloud function writes for state changes.

## Migration Guidance (from older fields)

Common legacy fields
- `deletedAt` -> `removedAt`
- `archivedAt` / `isArchived` -> `archiveAt` (timestamp)

Strategy
1) Dual‑write: On state changes, write both the legacy fields and the new canonical fields.
2) Backfill: Run an admin script to set `removedAt` = `deletedAt` and `archiveAt` = `archivedAt || (isArchived ? createdOrUpdatedAtGuess : null)`.
3) UI/Queries: Switch lists and detail pages to use `removedAt`/`archiveAt` and the tab rules above.
4) Cleanup: Remove legacy fields after verification.

Example (admin script sketch)
```ts
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const db = getFirestore()
async function migrate(colPath: string) {
  const snap = await db.collection(colPath).get()
  const batch = db.batch()
  for (const doc of snap.docs) {
    const d = doc.data()
    const update: any = {}
    if (d.deletedAt && !d.removedAt) update.removedAt = d.deletedAt
    if (d.archivedAt && !d.archiveAt) update.archiveAt = d.archivedAt
    if (d.isArchived && !d.archiveAt) update.archiveAt = d.updatedAt || d.createdAt || Timestamp.now()
    if (Object.keys(update).length) batch.update(doc.ref, update)
  }
  await batch.commit()
}
```

## Consuming in UI (shared helpers)

State helpers
```ts
export function isRemoved(d: { removedAt?: any }) {
  return !!d.removedAt
}
export function isArchived(d: { archiveAt?: any; removedAt?: any }) {
  return !d.removedAt && !!d.archiveAt
}
export function isActive(d: { archiveAt?: any; removedAt?: any }) {
  return !d.removedAt && !d.archiveAt
}
```

Sort keys
- Active: `updatedAt || createdAt`
- Archive: `archiveAt`
- Removed: `removedAt`

## Scope

- Applies to all entity types that support archive or soft‑remove (e.g., Tag Manager, Email Variables, Vendors, Customers, Roles).
- Listing pages implement the tab logic above. Detail/edit pages surface the status banner and route back to the correct tab.

