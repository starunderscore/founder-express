"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Card, Group, Stack, Tabs, Text, Title, Table, Menu, TextInput, SegmentedControl } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type Vendor = { id: string; name: string; email?: string; isArchived?: boolean; deletedAt?: number; contacts?: any[] };

export default function VendorsRemovedPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'vendors' | 'contacts'>('vendors');
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

  const removed = useMemo(() => vendors.filter((v) => !!v.deletedAt), [vendors]);

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
        </Group>

        <Tabs value={'removed'}>
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
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th style={{ width: 1 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {removed.filter((v) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (v.name || '').toLowerCase().includes(q);
                }).map((v) => (
                  <Table.Tr key={v.id}>
                    <Table.Td><Link href={`/employee/customers/vendors/${v.id}`} style={{ textDecoration: 'none' }}>{v.name}</Link></Table.Td>
                    <Table.Td>
                      <Group justify="flex-end">
                        <Menu shadow="md" width={180}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={async () => { await updateDoc(doc(db(), 'crm_customers', v.id), { deletedAt: undefined, isArchived: false }); }}>Restore</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {removed.filter((v) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (v.name || '').toLowerCase().includes(q);
                }).length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={2}><Text c="dimmed">No removed vendors</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
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
                {vendors.flatMap((v) => (v.contacts || []).filter((ct: any) => !!ct.deletedAt).map((ct: any) => ({ vendor: v, contact: ct }))).filter(({ vendor, contact }) => {
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
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={async () => {
                              const updated = (vendor.contacts || []).map((ct: any) => ct.id === contact.id ? { ...ct, deletedAt: undefined, isArchived: false } : ct);
                              await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: updated });
                            }}>Restore</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {vendors.flatMap((v) => (v.contacts || []).filter((ct: any) => !!ct.deletedAt)).length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}><Text c="dimmed">No removed vendor contacts</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
