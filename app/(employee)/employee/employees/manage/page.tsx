"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, Text, Title, Badge, Menu, ActionIcon, Tabs } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { archiveEmployeeDoc, softRemoveEmployeeDoc, type Employee } from '@/services/employees';
import EmployeeArchiveModal from '@/components/employees/EmployeeArchiveModal';
import EmployeeRemoveModal from '@/components/employees/EmployeeRemoveModal';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { useToast } from '@/components/ToastProvider';

type EmployeeDoc = Employee;

export default function EmployerEmployeesManagePage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [target, setTarget] = useState<EmployeeDoc | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const toast = useToast();

  const openArchive = (row: EmployeeDoc) => { setTarget(row); setConfirmArchive(true); };
  const openRemove = (row: EmployeeDoc) => { setTarget(row); setConfirmRemove(true); };

  const onConfirmArchive = async () => {
    if (!target) return;
    await archiveEmployeeDoc(target.id, true);
    setConfirmArchive(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Archived', message: 'Moved to Archive', color: 'green' });
  };
  const onConfirmRemove = async () => {
    if (!target) return;
    await softRemoveEmployeeDoc(target.id);
    setConfirmRemove(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Removed', message: 'Moved to Removed', color: 'orange' });
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
          collectionPath="ep_employees"
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r: EmployeeDoc) => (<Link href={`/employee/employees/manage/${r.id}/edit`} style={{ textDecoration: 'none' }}>{r.name || '—'}</Link>),
            },
            { key: 'email', header: 'Email', accessor: (r: EmployeeDoc) => r.email || '—' },
            { key: 'isAdmin', header: 'Admin', width: 100, render: (r: EmployeeDoc) => (r.isAdmin ? <Badge size="xs" variant="light" color="indigo">admin</Badge> : '—') },
            
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
                      <Menu.Item onClick={() => openArchive(r)}>Archive</Menu.Item>
                      <Menu.Item color="red" onClick={() => openRemove(r)}>Remove</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              )
            }
          ] as Column<EmployeeDoc>[]}
          initialSort={{ field: 'name', direction: 'asc' }}
          clientFilter={(r: any) => !r.archiveAt && !r.removedAt}
          defaultPageSize={25}
          enableSelection={false}
          refreshKey={refreshKey}
        />
      </Card>

      <EmployeeArchiveModal opened={confirmArchive} onClose={() => setConfirmArchive(false)} employeeName={target?.name || ''} onConfirm={onConfirmArchive} />
      <EmployeeRemoveModal opened={confirmRemove} onClose={() => setConfirmRemove(false)} employeeName={target?.name || ''} onConfirm={onConfirmRemove} />
    </Stack>
    </EmployerAdminGate>
  );
}
