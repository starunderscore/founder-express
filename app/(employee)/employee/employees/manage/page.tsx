"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, Table, Text, Title, Badge, Menu, ActionIcon, Center, Loader, Tabs } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';

type EmployeeDoc = { id: string; name: string; email: string; roleIds: string[]; permissionIds: string[]; isAdmin?: boolean; isArchived?: boolean; deletedAt?: number };

export default function EmployerEmployeesManagePage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    const qRoles = query(collection(db(), 'employee_roles'));
    const unsub = onSnapshot(qRoles, (snap) => {
      const list: Array<{ id: string; name: string }> = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (!data.deletedAt) list.push({ id: d.id, name: data.name || '' });
      });
      setRoles(list);
    });
    return () => unsub();
  }, []);
  const [employees, setEmployees] = useState<EmployeeDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
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
    }, (e) => {
      setError(e?.message || 'Failed to load employees');
      setEmployees([]);
    });
    return () => unsub();
  }, []);

  const onRemove = async (id: string) => {
    try {
      await updateDoc(doc(db(), 'employees', id), { deletedAt: Date.now() });
    } catch (e: any) {
      setError(e?.message || 'Failed to remove employee');
    }
  };

  const roleName = (rid: string) => roles.find((r) => r.id === rid)?.name || null;

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
          <Group gap="xs" align="center">
            <IconUsers size={20} />
            <div>
              <Title order={2} mb={4}>Employee management</Title>
              <Text c="dimmed">Assign roles and permissions to employees.</Text>
            </div>
          </Group>
        </Group>
        <Button component={Link as any} href="/employee/employees/manage/new">Add employee</Button>
      </Group>

      <Tabs value={'active'}>
        <Tabs.List>
          <Tabs.Tab value="active"><Link href="/employee/employees/manage">Active</Link></Tabs.Tab>
          <Tabs.Tab value="archive"><Link href="/employee/employees/manage/archive">Archive</Link></Tabs.Tab>
          <Tabs.Tab value="removed"><Link href="/employee/employees/manage/removed">Removed</Link></Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Card withBorder>
        {error && <Text c="red" size="sm" mb="sm">{error}</Text>}
        <Table verticalSpacing="sm">
          <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Admin</Table.Th>
                <Table.Th>Roles</Table.Th>
                <Table.Th>Additional permissions</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees.filter((e)=>!e.isArchived && !e.deletedAt).map((e) => (
              <Table.Tr key={e.id}>
                <Table.Td>
                  <Link href={`/employee/employees/manage/${e.id}/edit`} style={{ textDecoration: 'none' }}>{e.name}</Link>
                </Table.Td>
                <Table.Td>{e.email}</Table.Td>
                <Table.Td>{e.isAdmin ? <Badge size="xs" variant="light" color="indigo">admin</Badge> : '—'}</Table.Td>
                <Table.Td>
                  <Group gap={6}>
                    {e.roleIds.map((rid) => {
                      const rn = roleName(rid);
                      return rn ? <Badge key={rid} variant="light">{rn}</Badge> : null;
                    })}
                    {e.roleIds.length === 0 && <Text c="dimmed">—</Text>}
                  </Group>
                </Table.Td>
                <Table.Td>{e.permissionIds.length}</Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item component={Link as any} href={`/employee/employees/manage/${e.id}/edit`}>Edit</Menu.Item>
                        <Menu.Item onClick={async () => { await updateDoc(doc(db(), 'employees', e.id), { isArchived: true }); }}>Archive</Menu.Item>
                        <Menu.Item color="red" onClick={() => onRemove(e.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {employees.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed">No employees yet</Text>
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
