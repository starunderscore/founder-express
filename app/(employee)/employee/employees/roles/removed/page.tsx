"use client";
import Link from 'next/link';
import { Button, Card, Group, Stack, Text, Title, Table, Menu, ActionIcon, Tabs } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';

type RoleDoc = { id: string; name: string; description?: string; permissionIds: string[]; isArchived?: boolean; deletedAt?: number };

export default function EmployerRolesRemovedPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleDoc[]>([]);
  useEffect(() => {
    const q = query(collection(db(), 'employee_roles'));
    const unsub = onSnapshot(q, (snap) => {
      const list: RoleDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({ id: d.id, name: data.name || '', description: data.description || undefined, permissionIds: Array.isArray(data.permissionIds) ? data.permissionIds : [], isArchived: !!data.isArchived, deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined });
      });
      setRoles(list.filter((r) => !!r.deletedAt));
    });
    return () => unsub();
  }, []);

  const restore = async (id: string) => { await updateDoc(doc(db(), 'employee_roles', id), { deletedAt: undefined, isArchived: false }); };

  return (
    <EmployerAdminGate>
    <Stack>
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/employees')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Roles</Title>
            <Text c="dimmed">Bundle permissions into reusable roles.</Text>
          </div>
        </Group>
      </Group>

      <Tabs value={'removed'}>
        <Tabs.List>
          <Tabs.Tab value="active"><Link href="/employee/employees/roles">Active</Link></Tabs.Tab>
          <Tabs.Tab value="archive"><Link href="/employee/employees/roles/archive">Archive</Link></Tabs.Tab>
          <Tabs.Tab value="removed"><Link href="/employee/employees/roles/removed">Removed</Link></Tabs.Tab>
        </Tabs.List>
      </Tabs>

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
              {roles.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.name}</Table.Td>
                <Table.Td><Text c="dimmed" lineClamp={2}>{r.description || '—'}</Text></Table.Td>
                <Table.Td>{r.permissionIds.length}</Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => restore(r.id)}>Restore</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {roles.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}><Text c="dimmed">No removed roles.</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
