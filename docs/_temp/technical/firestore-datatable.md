Firestore DataTable (React + Firestore)

Component: components/data-table/FirestoreDataTable.tsx

Features
- Cursor pagination with Next/Prev
- Sorting (single column)
- Optional prefix search on a chosen field
- Selection (per-row + select all on page)
- Page size control
- Typed columns with custom cell renderers

Usage

import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';

const columns: Column<any>[] = [
  { key: 'name', header: 'Name', accessor: (r) => r.name },
  { key: 'email', header: 'Email', width: 260, accessor: (r) => r.email },
  { key: 'createdAt', header: 'Joined', accessor: (r) => new Date(r.createdAt).toLocaleDateString() },
];

<FirestoreDataTable
  collectionPath="crm_customers"
  columns={columns}
  initialSort={{ field: 'createdAt', direction: 'desc' }}
  where={[[ 'deletedAt', '==', null ]]}
  search={{ field: 'name', placeholder: 'Search name (prefix)' }}
  defaultPageSize={25}
/>;

Notes
- Search uses a Firestore prefix query on the configured field. Ensure that field is normalized (e.g., lowercased) or adjust logic accordingly. Firestore may require composite indexes in the console for combined where/orderBy.
- When filters/sort/search change, pagination resets to page 0.
- For real-time updates, a variant using onSnapshot can be added; this version uses one-off reads per page to keep logic simple with cursors.

