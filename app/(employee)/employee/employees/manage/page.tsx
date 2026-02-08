"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, Text, Title, Badge, Menu, ActionIcon, Tabs } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';

type EmployeeDoc = { id: string; name: string; email: string; roleIds: string[]; permissionIds: string[]; isAdmin?: boolean; isArchived?: boolean; deletedAt?: number };

export default function EmployerEmployeesManagePage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    const qRoles = query(collection(db(), 'ep_employee_roles'));
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

  const roleName = (rid: string) => roles.find((r) => r.id === rid)?.name || null;
  const [refreshKey, setRefreshKey] = useState(0);

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
        <FirestoreDataTable
          collectionPath="employees"
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r: EmployeeDoc) => (<Link href={`/employee/employees/manage/${r.id}/edit`} style={{ textDecoration: 'none' }}>{r.name || '—'}</Link>),
            },
            { key: 'email', header: 'Email', accessor: (r: EmployeeDoc) => r.email || '—' },
            { key: 'isAdmin', header: 'Admin', width: 100, render: (r: EmployeeDoc) => (r.isAdmin ? <Badge size="xs" variant="light" color="indigo">admin</Badge> : '—') },
            {
              key: 'roleIds', header: 'Roles', render: (r: EmployeeDoc) => (
                <Group gap={6}>
                  {Array.isArray(r.roleIds) && r.roleIds.length > 0 ? r.roleIds.map((rid) => {
                    const rn = roleName(rid);
                    return rn ? <Badge key={rid} variant="light">{rn}</Badge> : null;
                  }) : <Text c="dimmed">—</Text>}
                </Group>
              ),
            },
            { key: 'permissionIds', header: 'Additional permissions', width: 180, accessor: (r: EmployeeDoc) => Array.isArray(r.permissionIds) ? r.permissionIds.length : 0 },
            {
              key: 'actions', header: '', width: 1, render: (r: EmployeeDoc) => (
                <Group justify="flex-end">
                  <Menu withinPortal position="bottom-end" shadow="md" width={180}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" aria-label="More actions">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="5" cy="12" r="2" fill="currentColor"/>
                          <circle cx="12" cy="12" r="2" fill="currentColor"/>
                          <circle cx="19" cy="12" r="2" fill="currentColor"/>
                        </svg>
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item component={Link as any} href={`/employee/employees/manage/${r.id}/edit`}>Edit</Menu.Item>
                      <Menu.Item onClick={async () => { await updateDoc(doc(db(), 'employees', r.id), { isArchived: true }); setRefreshKey((k) => k + 1); }}>Archive</Menu.Item>
                      <Menu.Item color="red" onClick={async () => { await updateDoc(doc(db(), 'employees', r.id), { deletedAt: Date.now() }); setRefreshKey((k) => k + 1); }}>Remove</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              )
            }
          ] as Column<EmployeeDoc>[]}
          initialSort={{ field: 'name', direction: 'asc' }}
          clientFilter={(r: any) => r.isArchived !== true && !r.deletedAt}
          defaultPageSize={25}
          enableSelection={false}
          refreshKey={refreshKey}
        />
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
