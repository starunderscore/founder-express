# Notifications System

A lightweight notifications system surfaces updates to employees via a bell icon in the top app bar and a dedicated Notifications page. Unread items display a badge count; selecting the bell navigates to the list where items can be marked read/unread.

## Overview

- Bell entry point: top‑right of the employee header, visible across the dashboard.
- Badge count: shows the number of unread items in real time.
- Notifications page: lists items, supports mark read/unread, mark all read, and optional deep links.
- Storage: Firestore collection `ep_notifications`.

## Data Model

Collection: `ep_notifications`

Fields per document:
- `title` (string, required): short headline.
- `body` (string, optional): additional detail.
- `link` (string, optional): relative path to navigate when opening.
- `read` (boolean, default false): whether user has read the item.
- `createdAt` (number, ms epoch): for sorting newest first.

Example document:

```
{
  title: "Customer imported",
  body: "42 records added to CRM.",
  link: "/employee/crm",
  read: false,
  createdAt: 1705700000000
}
```

## UI Components

- Bell + badge: `components/NotificationsBell.tsx` (via `services/notifications`)
  - Subscribes to `where('read', '==', false)` and displays `Indicator` with unread count.
  - Clicking navigates to `/employee/notifications`.
- Header integration: `components/EmployerHeader.tsx` includes the bell on the right side.
- List view: `app/(employee)/employee/notifications/page.tsx` (via `services/notifications`)
  - Live reads via `orderBy('createdAt', 'desc')`.
  - Row menu (…): mark read/unread, open link.
  - “Mark all read” batches updates for convenience.

## Adding Notifications

Create a document in `ep_notifications` with the fields above. For example:

```ts
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

await addDoc(collection(db(), 'ep_notifications'), {
  title: 'Invoice export completed',
  body: '12 invoices exported to QuickBooks.',
  link: '/employee/finance/reports',
  read: false,
  createdAt: Date.now(),
});
```

## Behavior Notes

- Realtime: both the bell and the list subscribe via `onSnapshot` to reflect changes immediately.
- Read state: stored per notification; if per‑user read tracking is required, extend schema (e.g., `userId`, or a subcollection) and filter by current user.
- Access: the list is behind the employee auth gate (`EmployerAuthGate`).

## Extensibility

- Per‑user notifications: add `userId` and filter queries by the authenticated user. For multi‑tenant setups, include `orgId` as well.
- Types and icons: add `kind: 'info' | 'success' | 'warning' | 'error'` to control row accents or icons.
- Delivery hooks: wrap `addDoc` in helper functions in a service module (e.g., `services/notifications.ts`) to standardize payloads.

## References

- Bell: `components/NotificationsBell.tsx`
- Header integration: `components/EmployerHeader.tsx:16`
- Page: `app/(employee)/employee/notifications/page.tsx`
