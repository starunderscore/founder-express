"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Group, Stack, Table, Text, Title, Badge, SegmentedControl } from '@mantine/core';
import { useEmployerStore } from '@/state/employerStore';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { collection, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type EmployeeDoc = { id: string; name: string; email: string; roleIds: string[]; permissionIds: string[]; isAdmin?: boolean; isArchived?: boolean };

export default function EmployerEmployeesArchivePage() {
  const roles = useEmployerStore((s) => s.roles);
  const archiveRole = useEmployerStore((s) => s.archiveRole);
  const restoreRole = useEmployerStore((s) => s.restoreRole);

  const [mode, setMode] = useState<'employees' | 'roles'>('employees');
  const [employees, setEmployees] = useState<EmployeeDoc[] | null>(null);

  useEffect(() => {
    const q = query(collection(db(), 'employees'));
    const unsub = onSnapshot(q, (snap) => {
      const list: EmployeeDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          name: data.name || '',
          email: data.email || '',
          roleIds: Array.isArray(data.roleIds) ? data.roleIds : [],
          permissionIds: Array.isArray(data.permissionIds) ? data.permissionIds : [],
          isAdmin: !!data.isAdmin,
          isArchived: !!data.isArchived,
        });
      });
      setEmployees(list);
    }, () => setEmployees([]));
    return () => unsub();
  }, []);

  const archivedEmployees = useMemo(() => (employees || []).filter((e) => !!e.isArchived), [employees]);
  const archivedRoles = useMemo(() => roles.filter((r) => !!r.isArchived), [roles]);
  const activeRoles = useMemo(() => roles.filter((r) => !r.isArchived), [roles]);

  const setEmployeeArchived = async (id: string, flag: boolean) => {
    await updateDoc(doc(db(), 'employees', id), { isArchived: flag });
  };

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="end">
          <div>
            <Title order={2} mb={4}>Archive</Title>
            <Text c="dimmed">Archive or restore employees and roles.</Text>
          </div>
          <SegmentedControl data={[{ label: 'Employees', value: 'employees' }, { label: 'Roles', value: 'roles' }]} value={mode} onChange={(v) => setMode((v as any) || 'employees')} />
        </Group>

        {mode === 'employees' ? (
          <Card withBorder>
            <Title order={5} mb="sm">Archived employees</Title>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {archivedEmployees.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>
                      <Link href={`/employee/employees/manage/${e.id}/edit`} style={{ textDecoration: 'none' }}>{e.name}</Link>
                    </Table.Td>
                    <Table.Td>{e.email}</Table.Td>
                    <Table.Td>
                      <Group justify="flex-end">
                        <Button size="xs" variant="light" onClick={() => setEmployeeArchived(e.id, false)}>Restore</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {archivedEmployees.length === 0 && (
                  <Table.Tr><Table.Td colSpan={3}><Text c="dimmed">No archived employees</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        ) : (
          <Card withBorder>
            <Title order={5} mb="sm">Archived roles</Title>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {archivedRoles.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.name}</Table.Td>
                    <Table.Td><Badge variant="light" color="gray">archived</Badge></Table.Td>
                    <Table.Td>
                      <Group justify="flex-end">
                        <Button size="xs" variant="light" onClick={() => restoreRole(r.id)}>Restore</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {archivedRoles.length === 0 && (
                  <Table.Tr><Table.Td colSpan={3}><Text c="dimmed">No archived roles</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        )}
      </Stack>
    </EmployerAdminGate>
  );
}
