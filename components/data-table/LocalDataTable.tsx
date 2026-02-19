"use client";
import { useMemo, useState } from 'react';
import { Box, Button, Group, Loader, Select, Table, Text } from '@mantine/core';

export type Column<T = any> = {
  key: string;
  header: string;
  width?: number | string;
  accessor?: (row: T) => any;
  render?: (row: T) => React.ReactNode;
};

export default function LocalDataTable<T = any>({
  rows,
  columns,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  enableSelection = false,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  enableSelection?: boolean;
}) {
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);

  const pageRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pageIndex, pageSize]);

  const hasNext = (pageIndex + 1) * pageSize < rows.length;

  return (
    <Box>
      <Group justify="space-between" mb="sm" wrap="wrap">
        <Group gap="xs" align="center"></Group>
        <Group gap="xs" align="center">
          <Select
            data={pageSizeOptions.map((n) => ({ value: String(n), label: `${n}/page` }))}
            value={String(pageSize)}
            onChange={(v) => { const n = Number(v || defaultPageSize); setPageSize(n); setPageIndex(0); }}
            maw={120}
          />
        </Group>
      </Group>

      <Table verticalSpacing="xs" highlightOnHover withRowBorders>
        <Table.Thead>
          <Table.Tr>
            {enableSelection && (<Table.Th style={{ width: 36 }}></Table.Th>)}
            {columns.map((c) => (
              <Table.Th key={c.key} style={{ width: c.width }}>{c.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pageRows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (enableSelection ? 1 : 0)}><Text c="dimmed">No records</Text></Table.Td>
            </Table.Tr>
          ) : (
            pageRows.map((r: any, idx: number) => (
              <Table.Tr key={idx}>
                {enableSelection && (<Table.Td></Table.Td>)}
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
        <Text size="sm" c="dimmed">{rows.length} items</Text>
        <Group gap="xs">
          <Button variant="default" disabled={pageIndex === 0} onClick={() => setPageIndex((i) => Math.max(0, i - 1))}>Prev</Button>
          <Button variant="default" disabled={!hasNext} onClick={() => setPageIndex((i) => i + 1)}>Next</Button>
        </Group>
      </Group>
    </Box>
  );
}

