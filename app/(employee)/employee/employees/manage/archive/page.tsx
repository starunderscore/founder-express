"use client";
import Link from 'next/link';
import { Button, Card, Group, Stack, Text, Title, Badge, Menu, ActionIcon, Tabs } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useRouter } from 'next/navigation';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { archiveEmployeeDoc, softRemoveEmployeeDoc, type Employee } from '@/services/employees';

type EmployeeDoc = Employee;

export default function EmployerEmployeesArchivePage() {
  const router = useRouter();

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
      </Group>

      <Tabs value={'archive'}>
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
            { key: 'name', header: 'Name', render: (r: EmployeeDoc) => (r.name || '—') },
            { key: 'email', header: 'Email', render: (r: EmployeeDoc) => (r.email || '—') },
            { key: 'isAdmin', header: 'Admin', width: 100, render: (r: EmployeeDoc) => (r.isAdmin ? <Badge size="xs" variant="light" color="indigo">admin</Badge> : '—') },
            { key: 'roleIds', header: 'Roles', render: (r: EmployeeDoc) => (Array.isArray(r.roleIds) ? r.roleIds.length : 0) },
            { key: 'actions', header: '', width: 1, render: (r: EmployeeDoc) => (
              <Group justify="flex-end">
                <Menu shadow="md" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" aria-label="More actions">⋯</ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={async () => { await archiveEmployeeDoc(r.id, false); }}>Restore</Menu.Item>
                    <Menu.Item color="red" onClick={async () => { await softRemoveEmployeeDoc(r.id); }}>Remove</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            ) }
          ] as Column<EmployeeDoc>[]}
          initialSort={{ field: 'name', direction: 'asc' }}
          clientFilter={(r: any) => !!r.isArchived && !r.deletedAt}
          defaultPageSize={25}
          enableSelection={false}
        />
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
