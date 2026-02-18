"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Group, Anchor, Card, Menu, TextInput, Modal, Stack, Button, ActionIcon, CopyButton } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { RouteTabs } from '@/components/RouteTabs';
import { useRouter } from 'next/navigation';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { restoreCRMRecord, removeCRMRecord } from '@/services/crm';

export default function CRMArchivePage() {
  const router = useRouter();
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [archRestoreOpen, setArchRestoreOpen] = useState(false);
  const [archTarget, setArchTarget] = useState<{ id: string; name: string } | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [removeInput, setRemoveInput] = useState('');

  const columns: Column<any>[] = useMemo(() => ([
    {
      key: 'name', header: 'Name',
      render: (c: any) => (
        <Anchor component={Link as any} href={`/employee/customers/crm/customer/${c.id}` as any} underline="hover">{c.name || '—'}</Anchor>
      )
    },
    { key: 'email', header: 'Email', render: (c: any) => (<Text size="sm">{c.email || '—'}</Text>) },
    {
      key: 'actions', header: '', width: 1,
      render: (c: any) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Menu withinPortal position="bottom-end" shadow="md" width={200}>
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
              <Menu.Item onClick={() => { setArchTarget({ id: c.id, name: c.name }); setArchRestoreOpen(true); }}>Restore</Menu.Item>
              <Menu.Item color="red" onClick={() => { setArchTarget({ id: c.id, name: c.name }); setRemoveInput(''); setRemoveOpen(true); }}>Remove</Menu.Item>
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
        value={"archive"}
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
            return t === 'customer' && !!r.isArchived && !r.deletedAt && matches;
          }}
          defaultPageSize={25}
          enableSelection={false}
          refreshKey={refreshKey}
        />
      </Card>

      <Modal opened={archRestoreOpen} onClose={() => setArchRestoreOpen(false)} centered>
        <Stack>
          <Text>Restore this customer back to the Database view?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setArchRestoreOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!archTarget) return;
              await restoreCRMRecord(archTarget.id);
              setArchRestoreOpen(false);
              setRefreshKey((k) => k + 1);
              toast.show({ title: 'Customer restored', message: archTarget.name, color: 'green' });
              setArchTarget(null);
            }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={removeOpen} onClose={() => setRemoveOpen(false)} centered>
        <Stack>
          <Text>Move this customer to Removed? You can restore it later or delete permanently from the Removed tab.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Customer name" value={archTarget?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={archTarget?.name || ''}>{({ copied, copy }) => (
              <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
            )}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type customer name" value={removeInput} onChange={(e) => setRemoveInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRemoveOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(archTarget?.name?.length || 0) > 0 && removeInput !== (archTarget?.name || '')} onClick={async () => {
              if (!archTarget) return;
              await removeCRMRecord(archTarget.id);
              setRemoveOpen(false);
              setRefreshKey((k) => k + 1);
              toast.show({ title: 'Removed customer', message: archTarget.name, color: 'orange' });
              setArchTarget(null);
            }}>Remove</Button>
          </Group>
        </Stack>
      </Modal>
      <style jsx>{`
        .crm-thead { background: var(--mantine-color-gray-2); }
        [data-mantine-color-scheme="dark"] .crm-thead { background: var(--mantine-color-dark-6); }
        [data-mantine-color-scheme="dark"] .crm-thead th { color: var(--mantine-color-white); }
      `}</style>
    </EmployerAuthGate>
  );
}
