"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Group, Stack, Table, Text, Title, SegmentedControl } from '@mantine/core';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';

type EmployeeDoc = { id: string; name: string; email: string; deletedAt?: number };

export default function EmployerEmployeesRemovedPage() {
  type RoleDoc = { id: string; name: string; deletedAt?: number };
  const [roles, setRoles] = useState<RoleDoc[]>([]);
  useEffect(() => {
    const qRoles = query(collection(db(), 'employee_roles'));
    const unsub = onSnapshot(qRoles, (snap) => {
      const list: RoleDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({ id: d.id, name: data.name || '', deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined });
      });
      setRoles(list);
    });
    return () => unsub();
  }, []);

  const [mode, setMode] = useState<'employees' | 'roles'>('employees');
  const [employees, setEmployees] = useState<EmployeeDoc[] | null>(null);

  useEffect(() => {
    const q = query(collection(db(), 'employees'));
    const unsub = onSnapshot(q, (snap) => {
      const list: EmployeeDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({ id: d.id, name: data.name || '', email: data.email || '', deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined });
      });
      setEmployees(list);
    }, () => setEmployees([]));
    return () => unsub();
  }, []);

  const removedEmployees = useMemo(() => (employees || []).filter((e) => !!e.deletedAt), [employees]);
  const removedRoles = useMemo(() => roles.filter((r) => !!r.deletedAt), [roles]);

  const restoreEmployee = async (id: string) => {
    await updateDoc(doc(db(), 'employees', id), { deletedAt: undefined });
  };
  const hardDeleteEmployee = async (id: string) => {
    await deleteDoc(doc(db(), 'employees', id));
  };

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="end">
          <div>
            <Title order={2} mb={4}>Removed</Title>
            <Text c="dimmed">Restore or permanently delete employees and roles.</Text>
          </div>
          <SegmentedControl data={[{ label: 'Employees', value: 'employees' }, { label: 'Roles', value: 'roles' }]} value={mode} onChange={(v) => setMode((v as any) || 'employees')} />
        </Group>

        {mode === 'employees' ? (
          <Card withBorder>
            <Title order={5} mb="sm">Removed employees</Title>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {removedEmployees.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>
                      <Link href={`/employee/employees/manage/${e.id}/edit`} style={{ textDecoration: 'none' }}>{e.name}</Link>
                    </Table.Td>
                    <Table.Td>{e.email}</Table.Td>
                    <Table.Td>
                      <Group justify="flex-end">
                        <Button size="xs" variant="light" onClick={() => restoreEmployee(e.id)}>Restore</Button>
                        <Button size="xs" variant="subtle" color="red" onClick={() => hardDeleteEmployee(e.id)}>Permanently delete</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {removedEmployees.length === 0 && (
                  <Table.Tr><Table.Td colSpan={3}><Text c="dimmed">No removed employees</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        ) : (
          <Card withBorder>
            <Title order={5} mb="sm">Removed roles</Title>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {removedRoles.map((r: any) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.name}</Table.Td>
                    <Table.Td>
                      <Group justify="flex-end">
                        <Button size="xs" variant="light" onClick={async () => { await updateDoc(doc(db(), 'employee_roles', r.id), { deletedAt: undefined }); }}>Restore</Button>
                        <Button size="xs" variant="subtle" color="red" onClick={async () => { await deleteDoc(doc(db(), 'employee_roles', r.id)); }}>Permanently delete</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {removedRoles.length === 0 && (
                  <Table.Tr><Table.Td colSpan={2}><Text c="dimmed">No removed roles</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        )}
      </Stack>
    </EmployerAdminGate>
  );
}
