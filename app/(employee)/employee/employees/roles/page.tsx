"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Group, Stack, Text, Title, ActionIcon, Tabs, Menu, Modal } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { archiveRole, removeRole } from '@/services/roles';
import { useToast } from '@/components/ToastProvider';
import RoleRemoveModal from '@/components/roles/RoleRemoveModal';

export default function EmployerRolesPage() {
  const router = useRouter();

  const [target, setTarget] = useState<any | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const openArchive = (row: any) => { setTarget(row); setConfirmArchive(true); };
  const openRemove = (row: any) => { setTarget(row); setConfirmRemove(true); };

  const onArchive = async () => {
    if (!target) return;
    await archiveRole(target.id);
    setConfirmArchive(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Role archived', message: target.name, color: 'green' });
  };
  const onRemove = async () => {
    if (!target) return;
    await removeRole(target.id);
    setConfirmRemove(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Role moved to removed', message: target.name, color: 'orange' });
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => (<Link href={`/employee/employees/roles/${r.id}/edit`} style={{ textDecoration: 'none' }}>{r.name || '—'}</Link>),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (<Text c="dimmed" lineClamp={2}>{r.description || '—'}</Text>),
    },
    {
      key: 'permissionIds',
      header: 'Permissions',
      width: 120,
      accessor: (r) => Array.isArray(r.permissionIds) ? r.permissionIds.length : 0,
    },
    {
      key: 'actions',
      header: '',
      width: 1,
      render: (r) => (
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
              <Menu.Item onClick={() => router.push(`/employee/employees/roles/${r.id}/edit`)}>View</Menu.Item>
              <Menu.Item onClick={() => openArchive(r)}>Archive</Menu.Item>
              <Menu.Item color="red" onClick={() => openRemove(r)}>Remove</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      ),
    },
  ];

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
              <IconShieldCheck size={20} />
              <div>
                <Title order={2} mb={4}>Roles</Title>
                <Text c="dimmed">Bundle permissions into reusable roles.</Text>
              </div>
            </Group>
          </Group>
          <Button component={Link as any} href="/employee/employees/roles/new">Add role</Button>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/employees/roles">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/employees/roles/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/employees/roles/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <FirestoreDataTable
            collectionPath="ep_employee_roles"
            columns={columns}
            initialSort={{ field: 'name', direction: 'asc' }}
            clientFilter={(r) => !r.archiveAt && !r.removedAt}
            defaultPageSize={25}
            enableSelection={false}
            refreshKey={refreshKey}
          />
        </Card>

        <Modal opened={confirmArchive} onClose={() => setConfirmArchive(false)} withCloseButton={false} centered>
          <Stack>
            <Text>Archive this role? It will move to Archive and can be restored later.</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmArchive(false)}>Cancel</Button>
              <Button onClick={onArchive}>Archive</Button>
            </Group>
          </Stack>
        </Modal>

        <RoleRemoveModal opened={confirmRemove} onClose={() => setConfirmRemove(false)} roleName={target?.name || ''} onConfirm={onRemove} />
      </Stack>
    </EmployerAdminGate>
  );
}
