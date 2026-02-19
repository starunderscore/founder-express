"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Group, Button, Badge, Anchor, Card, ActionIcon, Menu, TextInput, Tabs, Modal, Stack, CopyButton, SegmentedControl } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { RouteTabs } from '@/components/RouteTabs';
import { useRouter } from 'next/navigation';
import { type Contact } from '@/services/crm/types';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { restoreCRMRecord, deleteCRMRecord } from '@/services/crm';

export default function CRMRemovedPage() {
  const router = useRouter();
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const columns: Column<any>[] = useMemo(() => ([
    { key: 'name', header: 'Name', render: (c: any) => (<Anchor component={Link as any} href={`/employee/customers/crm/customer/${c.id}` as any} underline="hover">{c.name || '—'}</Anchor>) },
    { key: 'email', header: 'Email', render: (c: any) => (<Text size="sm">{c.email || '—'}</Text>) },
    {
      key: 'actions', header: '', width: 1,
      render: (c: any) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Menu withinPortal position="bottom-end" shadow="md" width={220}>
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
              <Menu.Item component={Link as any} href={`/employee/customers/crm/customer/${c.id}` as any}>View</Menu.Item>
              <Menu.Item onClick={() => { setTarget({ id: c.id, name: c.name }); setRestoreOpen(true); }}>Restore</Menu.Item>
              <Menu.Item color="red" onClick={() => { setTarget({ id: c.id, name: c.name }); setDeleteInput(''); setDeleteOpen(true); }}>Permanently delete</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    },
  ]), []);

  return (
    <EmployerAuthGate>
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/customers')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>CRM</Title>
            <Text c="dimmed">New users automatically appear in CRM (Customer Relationship Management).</Text>
          </div>
        </Group>
      </Group>

      <RouteTabs
        value={"removed"}
        mb="md"
        tabs={[
          { value: 'main', label: 'Database', href: '/employee/customers/crm' },
          { value: 'merge', label: 'Merge', href: '/employee/customers/crm/merge' },
          { value: 'archive', label: 'Archive', href: '/employee/customers/crm/archive' },
          { value: 'removed', label: 'Removed', href: '/employee/customers/crm/removed' },
        ]}
      />

      <Card withBorder>
        <div style={{ padding: '12px 0' }}>
          <TextInput placeholder="Search name or email" value={term} onChange={(e) => setTerm(e.currentTarget.value)} style={{ width: '100%' }} />
        </div>
        <FirestoreDataTable
          collectionPath="crm_customers"
          columns={columns}
          initialSort={{ field: 'name', direction: 'asc' }}
          clientFilter={(r: any) => {
            const q = (term || '').toLowerCase();
            const t = r?.type === 'vendor' ? 'vendor' : 'customer';
            const matches = !q || String(r.name || '').toLowerCase().includes(q) || String(r.email || '').toLowerCase().includes(q);
            return t === 'customer' && !!r.deletedAt && matches;
          }}
          defaultPageSize={25}
          enableSelection={false}
          refreshKey={refreshKey}
        />
      </Card>
      <style jsx>{`
        .crm-thead { background: var(--mantine-color-gray-2); }
        [data-mantine-color-scheme="dark"] .crm-thead { background: var(--mantine-color-dark-6); }
        [data-mantine-color-scheme="dark"] .crm-thead th { color: var(--mantine-color-white); }
      `}</style>

      {/* Restore modal */}
      <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text>Restore this customer back to the Database view?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!target) return;
              await restoreCRMRecord(target.id);
              setRestoreOpen(false);
              setRefreshKey((k) => k + 1);
              toast.show({ title: 'Customer restored', message: target.name, color: 'green' });
              setTarget(null);
            }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete modal */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text color="red">This action permanently deletes the customer and cannot be undone.</Text>
          <Text c="dimmed">To confirm, type the full customer name.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Name" value={target?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={target?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type customer name" value={deleteInput} onChange={(e) => setDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(target?.name?.length || 0) > 0 && deleteInput !== (target?.name || '')} onClick={async () => {
              if (!target) return;
              await deleteCRMRecord(target.id);
              setDeleteOpen(false);
              setRefreshKey((k) => k + 1);
              toast.show({ title: 'Customer deleted', message: target.name, color: 'red' });
              setTarget(null);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
