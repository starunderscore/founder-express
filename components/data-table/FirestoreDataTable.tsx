"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Checkbox, Group, Loader, Select, Table, Text, TextInput, Button } from "@mantine/core";
import { db } from "@/lib/firebase/client";
import {
  QueryConstraint,
  collection,
  getDocs,
  limit as fbLimit,
  orderBy as fbOrderBy,
  query as fbQuery,
  startAfter as fbStartAfter,
  where as fbWhere,
  DocumentSnapshot,
} from "firebase/firestore";

export type Column<T = any> = {
  key: string;
  header: string;
  width?: number | string;
  accessor?: (row: T) => any;
  render?: (row: T) => React.ReactNode;
};

type WhereTuple = [field: string, op: any, value: any];

export type FirestoreDataTableProps<T = any> = {
  collectionPath: string;
  columns: Column<T>[];
  initialSort?: { field: string; direction: "asc" | "desc" };
  where?: WhereTuple[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  rowKey?: string; // defaults to id
  search?: { field: string; placeholder?: string };
  onRowClick?: (row: T) => void;
  clientFilter?: (row: T) => boolean; // optional client-side filter to avoid composite indexes
  enableSelection?: boolean; // show selection checkbox column
  refreshKey?: any; // change to force reload
};

export function FirestoreDataTable<T = any>({
  collectionPath,
  columns,
  initialSort,
  where,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  rowKey = "id",
  search,
  onRowClick,
  clientFilter,
  enableSelection = true,
  refreshKey,
}: FirestoreDataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | undefined>(initialSort);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasNext, setHasNext] = useState(false);

  // Keep track of page cursors (last doc per page)
  const pageCursors = useRef<Array<DocumentSnapshot | null>>([]);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rowId = (r: any) => (r[rowKey] ?? (r.id as string)) as string;

  // Build constraints
  const constraints = useMemo(() => {
    const cs: QueryConstraint[] = [];
    // Search overrides sort to be on the search field
    const activeSearch = search && searchTerm.trim().length > 0;
    const sField = activeSearch ? search!.field : sort?.field;
    const sDir = activeSearch ? "asc" : sort?.direction || "asc";
    if (where && where.length) {
      for (const [f, op, v] of where) cs.push(fbWhere(f as any, op, v));
    }
    if (activeSearch) {
      const q = searchTerm.trim();
      // Prefix search. Requires a field that is normalized for search (e.g., lowercased)
      cs.push(fbWhere(sField as any, ">=", q));
      cs.push(fbWhere(sField as any, "<=", q + "\uf8ff"));
      cs.push(fbOrderBy(sField as any, "asc"));
    } else if (sField) {
      cs.push(fbOrderBy(sField as any, sDir));
    }
    cs.push(fbLimit(pageSize));
    const prevCursor = pageIndex > 0 ? pageCursors.current[pageIndex - 1] : null;
    if (prevCursor) cs.push(fbStartAfter(prevCursor));
    return cs;
  }, [where, sort?.field, sort?.direction, pageSize, pageIndex, searchTerm, search?.field]);

  // Reset paging when sort/filter/search changes
  useEffect(() => {
    pageCursors.current = [];
    setPageIndex(0);
  }, [JSON.stringify(where || []), sort?.field, sort?.direction, searchTerm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const q = fbQuery(collection(db(), collectionPath), ...constraints);
        const snap = await getDocs(q);
        if (cancelled) return;
        const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];
        setRows(docs as any);
        // Update cursors
        const last = snap.docs[snap.docs.length - 1] || null;
        pageCursors.current[pageIndex] = last;
        setHasNext(docs.length === pageSize);
      } catch (e: any) {
        // Move errors to console instead of UI
        if (!cancelled) {
          const msg = e?.message || "Failed to load";
          setError(msg);
          // eslint-disable-next-line no-console
          console.error('[FirestoreDataTable]', msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionPath, constraints, pageIndex, pageSize, refreshKey]);

  const allOnPageIds = rows.map((r) => rowId(r));
  const allOnPageSelected = allOnPageIds.every((id) => selected.has(id));
  const someOnPageSelected = !allOnPageSelected && allOnPageIds.some((id) => selected.has(id));

  const toggleAllOnPage = (checked: boolean) => {
    const next = new Set(selected);
    for (const id of allOnPageIds) {
      if (checked) next.add(id); else next.delete(id);
    }
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const viewRows = useMemo(() => (clientFilter ? (rows as any[]).filter((r) => clientFilter(r)) : rows), [rows, clientFilter]);

  return (
    <Box>
      <Group justify="space-between" mb="sm" wrap="wrap">
        <Group gap="xs" align="center">
          {search && (
            <TextInput
              placeholder={search.placeholder || "Search"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />
          )}
        </Group>
        <Group gap="xs" align="center">
          <Select
            data={pageSizeOptions.map((n) => ({ value: String(n), label: `${n}/page` }))}
            value={String(pageSize)}
            onChange={(v) => setPageSize(Number(v || defaultPageSize))}
            maw={120}
          />
        </Group>
      </Group>

      <Table verticalSpacing="xs" highlightOnHover withRowBorders>
        <Table.Thead>
          <Table.Tr>
            {enableSelection && (
              <Table.Th style={{ width: 36 }}>
                <Checkbox
                  checked={allOnPageSelected}
                  indeterminate={someOnPageSelected}
                  onChange={(e) => toggleAllOnPage(e.currentTarget.checked)}
                  aria-label="Select all"
                />
              </Table.Th>
            )}
            {columns.map((c) => (
              <Table.Th key={c.key} style={{ width: c.width }}>{c.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (enableSelection ? 1 : 0)}>
                <Group justify="center" p="md"><Loader size="sm" /></Group>
              </Table.Td>
            </Table.Tr>
          ) : viewRows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (enableSelection ? 1 : 0)}><Text c="dimmed">No records</Text></Table.Td>
            </Table.Tr>
          ) : (
            viewRows.map((r: any) => (
              <Table.Tr key={rowId(r)} onClick={() => onRowClick?.(r)} style={{ cursor: onRowClick ? "pointer" : undefined }}>
                {enableSelection && (
                  <Table.Td>
                    <Checkbox checked={selected.has(rowId(r))} onChange={(e) => toggleOne(rowId(r), e.currentTarget.checked)} aria-label="Select row" />
                  </Table.Td>
                )}
                {columns.map((c) => (
                  <Table.Td key={c.key} style={{ width: c.width }}>
                    {c.render ? c.render(r) : (c.accessor ? c.accessor(r) : (r[c.key] ?? "—"))}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Group justify="space-between" mt="sm">
        <Text size="sm" c="dimmed">{viewRows.length} items</Text>
        <Group gap="xs">
          <Button variant="default" disabled={pageIndex === 0} onClick={() => setPageIndex((i) => Math.max(0, i - 1))}>Prev</Button>
          <Button variant="default" disabled={!hasNext} onClick={() => setPageIndex((i) => i + 1)}>Next</Button>
        </Group>
      </Group>
    </Box>
  );
}

export default FirestoreDataTable;
