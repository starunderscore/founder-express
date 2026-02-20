"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Group, Stack, Text, Title, Badge, Menu, ActionIcon, Tabs } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useRouter } from 'next/navigation';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { restoreEmployeeDoc, deleteEmployeeDoc, type Employee } from '@/services/employees';
import EmployeeRestoreModal from '@/components/employees/EmployeeRestoreModal';
import EmployeeDeletePermanentModal from '@/components/employees/EmployeeDeletePermanentModal';
import { useToast } from '@/components/ToastProvider';

type EmployeeDoc = Employee;

export default function EmployerEmployeesRemovedPage() {
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = useState<EmployeeDoc | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onConfirmRestore = async () => {
    if (!target) return;
    await restoreEmployeeDoc(target.id);
    setConfirmRestore(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Restored', message: 'Moved to Active', color: 'green' });
  };
  const onConfirmDelete = async () => {
    if (!target) return;
    await deleteEmployeeDoc(target.id);
    setConfirmDelete(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Deleted', message: 'Employee permanently deleted', color: 'red' });
  };

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
              <Text c="dimmed">Manage employees.</Text>
            </div>
          </Group>
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
        <FirestoreDataTable
          collectionPath="ep_employees"
          columns={[
            { key: 'name', header: 'Name', render: (r: EmployeeDoc) => (<Link href={`/employee/employees/manage/${r.id}/edit`} style={{ textDecoration: 'none' }}>{r.name || '—'}</Link>) },
            { key: 'email', header: 'Email', render: (r: EmployeeDoc) => (r.email || '—') },
            { key: 'isAdmin', header: 'Admin', width: 100, render: (r: EmployeeDoc) => (r.isAdmin ? <Badge size="xs" variant="light" color="indigo">admin</Badge> : '—') },
            
            { key: 'actions', header: '', width: 1, render: (r: EmployeeDoc) => (
              <Group justify="flex-end">
                <Menu shadow="md" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" aria-label="More actions">⋯</ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item component={Link as any} href={`/employee/employees/manage/${r.id}/edit`}>Edit</Menu.Item>
                    <Menu.Item onClick={() => { setTarget(r); setConfirmRestore(true); }}>Restore</Menu.Item>
                    <Menu.Item color="red" onClick={() => { setTarget(r); setConfirmDelete(true); }}>Delete permanently</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            ) }
          ] as Column<EmployeeDoc>[]}
          initialSort={{ field: 'name', direction: 'asc' }}
          clientFilter={(r: any) => !!r.removedAt}
          defaultPageSize={25}
          enableSelection={false}
          refreshKey={refreshKey}
        />
      </Card>

      <EmployeeRestoreModal opened={confirmRestore} onClose={() => setConfirmRestore(false)} employeeName={target?.name || ''} onConfirm={onConfirmRestore} />
      <EmployeeDeletePermanentModal opened={confirmDelete} onClose={() => setConfirmDelete(false)} employeeName={target?.name || ''} onConfirm={onConfirmDelete} />
    </Stack>
    </EmployerAdminGate>
  );
}
