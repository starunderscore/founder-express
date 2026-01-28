"use client";
import Link from 'next/link';
import { Button, Card, Group, Stack, Text, Title, Table, Menu, ActionIcon } from '@mantine/core';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';

type RoleDoc = { id: string; name: string; description?: string; permissionIds: string[]; isArchived?: boolean; deletedAt?: number };

export default function EmployerRolesPage() {
  const [roles, setRoles] = useState<RoleDoc[]>([]);
  useEffect(() => {
    const q = query(collection(db(), 'employee_roles'));
    const unsub = onSnapshot(q, (snap) => {
      const list: RoleDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({ id: d.id, name: data.name || '', description: data.description || undefined, permissionIds: Array.isArray(data.permissionIds) ? data.permissionIds : [], isArchived: !!data.isArchived, deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined });
      });
      setRoles(list.filter((r) => !r.deletedAt));
    });
    return () => unsub();
  }, []);

  const softRemove = async (id: string) => {
    await updateDoc(doc(db(), 'employee_roles', id), { deletedAt: Date.now() });
  };

  return (
    <EmployerAdminGate>
    <Stack>
      <Group justify="space-between" align="end">
        <div>
          <Title order={2} mb={4}>Roles</Title>
          <Text c="dimmed">Bundle permissions into reusable roles.</Text>
        </div>
        <Button component={Link as any} href="/employee/employees/roles/new">Add role</Button>
      </Group>

      <Card withBorder>
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Permissions</Table.Th>
              <Table.Th style={{ width: 1 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
              {roles.filter((r) => !r.isArchived && !r.deletedAt).map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Link href={`/employee/employees/roles/${r.id}/edit`} style={{ textDecoration: 'none' }}>
                    {r.name}
                  </Link>
                </Table.Td>
                <Table.Td><Text c="dimmed" lineClamp={2}>{r.description || '—'}</Text></Table.Td>
                <Table.Td>{r.permissionIds.length}</Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item component={Link as any} href={`/employee/employees/roles/${r.id}/edit`}>Edit</Menu.Item>
                        <Menu.Item color="red" onClick={() => softRemove(r.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {roles.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}><Text c="dimmed">No roles yet. Create a role above.</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
