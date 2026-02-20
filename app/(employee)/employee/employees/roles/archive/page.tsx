"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Group, Stack, Text, Title, Menu, ActionIcon, Tabs, Modal } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { restoreRole, removeRole } from '@/services/roles';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useToast } from '@/components/ToastProvider';
import RoleRemoveModal from '@/components/roles/RoleRemoveModal';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';

type RoleDoc = { id: string; name: string; description?: string; permissionIds: string[]; isArchived?: boolean; deletedAt?: number };

export default function EmployerRolesArchivePage() {
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = useState<RoleDoc | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const restore = async (id: string) => { await restoreRole(id); };
  const softRemove = async (id: string) => { await removeRole(id); };

  const openRestore = (row: RoleDoc) => { setTarget(row); setConfirmRestore(true); };
  const openRemove = (row: RoleDoc) => { setTarget(row); setConfirmRemove(true); };

  const onConfirmRestore = async () => {
    if (!target) return;
    await restore(target.id);
    setConfirmRestore(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Role restored', message: target.name, color: 'green' });
  };
  const onConfirmRemove = async () => {
    if (!target) return;
    await softRemove(target.id);
    setConfirmRemove(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Role moved to removed', message: target.name, color: 'orange' });
  };

  const columns: Column<RoleDoc>[] = [
    { key: 'name', header: 'Name', render: (r) => (<Link href={`/employee/employees/roles/${r.id}/edit`} style={{ textDecoration: 'none' }}>{r.name || '—'}</Link>) },
    { key: 'description', header: 'Description', render: (r) => (<Text c="dimmed" lineClamp={2}>{r.description || '—'}</Text>) },
    { key: 'permissionIds', header: 'Permissions', width: 120, accessor: (r) => Array.isArray(r.permissionIds) ? r.permissionIds.length : 0 },
    {
      key: 'actions', header: '', width: 1,
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
              <Menu.Item onClick={() => router.push(`/employee/employees/roles/${r.id}/edit`)}>Edit</Menu.Item>
              <Menu.Item onClick={() => openRestore(r)}>Restore</Menu.Item>
              <Menu.Item color="red" onClick={() => openRemove(r)}>Remove</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    }
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
      </Group>

      <Tabs value={'archive'}>
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
          clientFilter={(r: any) => !!r.archiveAt && !r.removedAt}
          defaultPageSize={25}
          enableSelection={false}
          refreshKey={refreshKey}
        />
      </Card>

      <Modal opened={confirmRestore} onClose={() => setConfirmRestore(false)} withCloseButton={false} centered>
        <Stack>
          <Text>Restore this role back to Active?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmRestore(false)}>Cancel</Button>
            <Button onClick={onConfirmRestore}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      <RoleRemoveModal opened={confirmRemove} onClose={() => setConfirmRemove(false)} roleName={target?.name || ''} onConfirm={onConfirmRemove} />
    </Stack>
    </EmployerAdminGate>
  );
}
