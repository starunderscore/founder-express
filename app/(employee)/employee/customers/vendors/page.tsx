"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Card, Group, Stack, Tabs, Text, Title, Button, TextInput, Menu, Modal, CopyButton } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import VendorAddModal from '@/components/crm/vendor/VendorAddModal';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { archiveCRMRecord, removeCRMRecord } from '@/services/crm';
import { useToast } from '@/components/ToastProvider';

type Vendor = { id: string; name: string; email?: string; isArchived?: boolean; deletedAt?: number };

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [removeInput, setRemoveInput] = useState('');

  useEffect(() => {
    const q = query(collection(db(), 'crm_customers'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Vendor[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (data.type === 'vendor') {
          rows.push({ id: d.id, name: data.name || '', email: data.email || undefined, isArchived: !!data.isArchived, deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined });
        }
      });
      setVendors(rows);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = vendors.filter((v) => !v.isArchived && !v.deletedAt);
    if (!term) return base;
    return base.filter((v) => (v.name || '').toLowerCase().includes(term) || (v.email || '').toLowerCase().includes(term));
  }, [vendors, search]);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/customers')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2} mb={4}>Vendors</Title>
              <Text c="dimmed">Vendors are your suppliers.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={() => setAddOpen(true)}>Add vendor</Button>
          </Group>
        </Group>

        <Tabs value={'database'}>
          <Tabs.List>
            <Tabs.Tab value="database"><Link href="/employee/customers/vendors">Database</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/customers/vendors/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/customers/vendors/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <div style={{ padding: '12px 0' }}>
            <TextInput placeholder="Search vendors" value={search} onChange={(e) => setSearch(e.currentTarget.value)} style={{ width: '100%' }} />
          </div>
          <FirestoreDataTable
            collectionPath="crm_customers"
            columns={([
              { key: 'name', header: 'Name', render: (r: any) => (<Link href={`/employee/customers/vendors/${r.id}`} style={{ textDecoration: 'none' }}>{r.name || '—'}</Link>) },
              {
                key: 'actions', header: '', width: 1,
                render: (r: any) => (
                  <Group justify="flex-end">
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="5" cy="12" r="2" fill="currentColor"/>
                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            <circle cx="19" cy="12" r="2" fill="currentColor"/>
                          </svg>
                        </ActionIcon>
                      </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item component={Link as any} href={`/employee/customers/vendors/${r.id}`}>View</Menu.Item>
                          <Menu.Item onClick={async () => { await archiveCRMRecord(r.id); setRefreshKey((k) => k + 1); toast.show({ title: 'Archived vendor', message: r.name, color: 'orange' }); }}>Archive</Menu.Item>
                          <Menu.Item color="red" onClick={() => { setTarget({ id: r.id, name: r.name }); setRemoveInput(''); setRemoveOpen(true); }}>Remove</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                  </Group>
                )
              },
            ]) as Column<any>[]}
            initialSort={{ field: 'name', direction: 'asc' }}
            clientFilter={(r: any) => {
              const q = (search || '').toLowerCase();
              const t = r?.type === 'vendor' ? 'vendor' : 'customer';
              const matches = !q || String(r.name || '').toLowerCase().includes(q);
              return t === 'vendor' && !r.isArchived && !r.deletedAt && matches;
            }}
            defaultPageSize={25}
            enableSelection={false}
            refreshKey={refreshKey}
          />
        </Card>
        <Modal opened={removeOpen} onClose={() => setRemoveOpen(false)} centered>
          <Stack>
            <Text>Move this vendor to Removed? You can restore it later or delete permanently from the Removed tab.</Text>
            <Group align="end" gap="sm">
              <TextInput label="Vendor name" value={target?.name || ''} readOnly style={{ flex: 1 }} />
              <CopyButton value={target?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
            </Group>
            <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={removeInput} onChange={(e) => setRemoveInput(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRemoveOpen(false)}>Cancel</Button>
              <Button color="red" disabled={(target?.name?.length || 0) > 0 && removeInput !== (target?.name || '')} onClick={async () => {
                if (!target) return;
                await removeCRMRecord(target.id);
                setRemoveOpen(false);
                setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Removed vendor', message: removeInput, color: 'orange' });
              }}>Remove</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
      <VendorAddModal opened={addOpen} onClose={() => setAddOpen(false)} basePath="/employee/customers/vendors" />
    </EmployerAuthGate>
  );
}
