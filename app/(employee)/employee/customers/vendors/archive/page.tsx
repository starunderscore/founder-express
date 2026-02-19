"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Card, Group, Stack, Tabs, Text, Title, Table, Menu, TextInput, SegmentedControl, Modal, Button } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { restoreCRMRecord, removeCRMRecord } from '@/services/crm';
import { removeVendorContact, unarchiveVendorContact } from '@/services/crm/vendor-contacts';

type Vendor = { id: string; name: string; email?: string; isArchived?: boolean; deletedAt?: number; contacts?: any[] };

export default function VendorsArchivePage() {
  const router = useRouter();
  const getDb = () => db();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  useEffect(() => {
    const q = query(collection(db(), 'crm_customers'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Vendor[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (data.type === 'vendor') rows.push({ id: d.id, name: data.name || '', email: data.email || undefined, isArchived: !!data.isArchived, deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined, contacts: Array.isArray(data.contacts) ? data.contacts : [] });
      });
      setVendors(rows);
    });
    return () => unsub();
  }, []);

  const [search, setSearch] = useState('');
  const [view, setView] = useState<'vendors' | 'contacts'>('vendors');
  const archived = useMemo(() => vendors.filter((v) => v.isArchived && !v.deletedAt), [vendors]);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [removeInput, setRemoveInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
            <Group gap="xs" align="center">
              <IconBuilding size={20} />
              <div>
                <Title order={2} mb={4}>Vendors</Title>
                <Text c="dimmed">Vendors are your suppliers.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="database"><Link href="/employee/customers/vendors">Database</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/customers/vendors/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/customers/vendors/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder padding={0}>
          <div style={{ padding: '12px 16px' }}>
            <Group justify="space-between" align="center">
              <TextInput placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.currentTarget.value)} style={{ flex: 1 }} />
              <SegmentedControl
                data={[ { label: 'Vendors', value: 'vendors' }, { label: 'Vendor Contacts', value: 'contacts' } ]}
                value={view}
                onChange={(v: any) => setView(v)}
                styles={{ root: { background: 'var(--mantine-color-gray-3)' } }}
              />
            </Group>
          </div>
          {view === 'vendors' ? (
            <div style={{ padding: '0 16px 12px 16px' }}>
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
                          <Menu.Item onClick={() => { setTarget({ id: r.id, name: r.name }); setRestoreOpen(true); }}>Restore</Menu.Item>
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
                return t === 'vendor' && !!r.isArchived && !r.deletedAt && matches;
              }}
              defaultPageSize={25}
              enableSelection={false}
              refreshKey={refreshKey}
            />
            </div>
          ) : (
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Vendor</Table.Th>
                  <Table.Th style={{ width: 1 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {vendors.flatMap((v) => (v.contacts || []).filter((ct: any) => !!ct.isArchived && !ct.deletedAt).map((ct: any) => ({ vendor: v, contact: ct }))).filter(({ vendor, contact }) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (contact.name || '').toLowerCase().includes(q) || ((contact.emails && contact.emails[0]?.email) || '').toLowerCase().includes(q) || (vendor.name || '').toLowerCase().includes(q);
                }).map(({ vendor, contact }) => (
                  <Table.Tr key={contact.id}>
                    <Table.Td>{contact.name || '—'}</Table.Td>
                    <Table.Td><Text size="sm">{(contact.emails && contact.emails[0]?.email) || '—'}</Text></Table.Td>
                    <Table.Td><Link href={`/employee/customers/vendors/${vendor.id}`} style={{ textDecoration: 'none' }}>{vendor.name}</Link></Table.Td>
                    <Table.Td>
                      <Group justify="flex-end">
                        <Menu shadow="md" width={200}>
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
                            <Menu.Item onClick={async () => { await unarchiveVendorContact(vendor.id, contact.id, { getDb }); }}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={async () => { await removeVendorContact(vendor.id, contact.id, { getDb }); }}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {vendors.flatMap((v) => (v.contacts || []).filter((ct: any) => !!ct.isArchived && !ct.deletedAt)).length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}><Text c="dimmed">No archived vendor contacts</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Card>

        <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} centered>
          <Stack>
            <Text>Restore this vendor back to the Database view?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
              <Button onClick={async () => { if (!target) return; await restoreCRMRecord(target.id); setRestoreOpen(false); setTarget(null); setRefreshKey((k)=>k+1); }}>Restore</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={removeOpen} onClose={() => setRemoveOpen(false)} centered>
          <Stack>
            <Text>Move this vendor to Removed? You can restore it later or delete permanently from the Removed tab.</Text>
            <Group align="end" gap="sm">
              <TextInput label="Vendor name" value={target?.name || ''} readOnly style={{ flex: 1 }} />
              <Button variant="light" onClick={() => navigator.clipboard.writeText(target?.name || '')}>Copy</Button>
            </Group>
            <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={removeInput} onChange={(e) => setRemoveInput(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRemoveOpen(false)}>Cancel</Button>
              <Button color="red" disabled={(target?.name?.length || 0) > 0 && removeInput !== (target?.name || '')} onClick={async () => { if (!target) return; await removeCRMRecord(target.id); setRemoveOpen(false); setTarget(null); setRefreshKey((k)=>k+1); }}>Remove</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
