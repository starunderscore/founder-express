"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, Table, Text, Title, Badge, Menu, ActionIcon, Center, Loader, Tabs } from '@mantine/core';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useRouter } from 'next/navigation';

type EmployeeDoc = { id: string; name: string; email: string; roleIds: string[]; permissionIds: string[]; isAdmin?: boolean; isArchived?: boolean; deletedAt?: number };

export default function EmployerEmployeesRemovedPage() {
  const router = useRouter();
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
          deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined,
        });
      });
      setEmployees(list.filter((e) => !!e.deletedAt));
    });
    return () => unsub();
  }, []);

  if (employees === null) {
    return (
      <Center mih={200}>
        <Loader size="sm" />
      </Center>
    );
  }

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
            <Title order={2} mb={4}>Employee management</Title>
            <Text c="dimmed">Assign roles and permissions to employees.</Text>
          </div>
        </Group>
      </Group>

      <Tabs value={'removed'}>
        <Tabs.List>
          <Tabs.Tab value="active"><Link href="/employee/employees/manage">Active</Link></Tabs.Tab>
          <Tabs.Tab value="archive"><Link href="/employee/employees/manage/archive">Archive</Link></Tabs.Tab>
          <Tabs.Tab value="removed"><Link href="/employee/employees/manage/removed">Removed</Link></Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Card withBorder>
        <Table verticalSpacing="sm">
          <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Admin</Table.Th>
                <Table.Th>Roles</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees.map((e) => (
              <Table.Tr key={e.id}>
                <Table.Td>{e.name}</Table.Td>
                <Table.Td>{e.email}</Table.Td>
                <Table.Td>{e.isAdmin ? <Badge size="xs" variant="light" color="indigo">admin</Badge> : '—'}</Table.Td>
                <Table.Td>{Array.isArray(e.roleIds) ? e.roleIds.length : 0}</Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={async () => { await updateDoc(doc(db(), 'employees', e.id), { deletedAt: undefined, isArchived: false }); }}>Restore</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {employees.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed">No removed employees</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}

