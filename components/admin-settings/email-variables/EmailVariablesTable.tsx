"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Group, Loader, Table, Text } from "@mantine/core";
import type { Column } from "@/components/data-table/FirestoreDataTable";
import { listenEmailVars, type EmailVar } from "@/services/company-settings/email-variables";

export type EmailVarsTableProps = {
  filter: "active" | "archive" | "removed";
  columns: Column<EmailVar & { id: string }>[];
  onRowClick?: (row: EmailVar & { id: string }) => void;
  enableSelection?: boolean; // reserved for future use
  refreshKey?: any; // change to force reload
};

export default function EmailVariablesTable({ filter, columns, onRowClick, refreshKey }: EmailVarsTableProps) {
  const [rows, setRows] = useState<Array<EmailVar & { id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const off = listenEmailVars((list) => {
      setRows(list as any);
      setLoading(false);
    });
    return () => off();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const viewRows = useMemo(() => {
    switch (filter) {
      case "archive":
        return rows.filter((r) => !!r.archivedAt && !r.deletedAt);
      case "removed":
        return rows.filter((r) => !!r.deletedAt);
      default:
        return rows.filter((r) => !r.archivedAt && !r.deletedAt);
    }
  }, [rows, filter]);

  return (
    <Box>
      <Table verticalSpacing="xs" highlightOnHover withRowBorders>
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th key={c.key} style={{ width: c.width }}>{c.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Group justify="center" p="md"><Loader size="sm" /></Group>
              </Table.Td>
            </Table.Tr>
          ) : viewRows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}><Text c="dimmed">No records</Text></Table.Td>
            </Table.Tr>
          ) : (
            viewRows.map((r: any) => (
              <Table.Tr key={r.id} onClick={() => onRowClick?.(r)} style={{ cursor: onRowClick ? "pointer" : undefined }}>
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
        {/* Pagination reserved for future if needed */}
      </Group>
    </Box>
  );
}

