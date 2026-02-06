"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Card, Group, Stack, Tabs, Text, Title, Button, TextInput, Table, Badge, Menu } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import VendorAddModal from '@/components/crm/vendor/VendorAddModal';

type Vendor = { id: string; name: string; email?: string; isArchived?: boolean; deletedAt?: number };

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

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
          <Group mb="sm" align="center" grow>
            <TextInput placeholder="Search vendors" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
          </Group>
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th style={{ width: 1 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((v) => (
                <Table.Tr key={v.id}>
                  <Table.Td>
                    <Link href={`/employee/customers/vendors/${v.id}`} style={{ textDecoration: 'none' }}>{v.name}</Link>
                  </Table.Td>
                  <Table.Td><Text size="sm">{v.email || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Menu shadow="md" width={180}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item component={Link as any} href={`/employee/customers/vendors/${v.id}`}>View</Menu.Item>
                          <Menu.Item onClick={async () => { await updateDoc(doc(db(), 'crm_customers', v.id), { isArchived: true }); }}>Archive</Menu.Item>
                          <Menu.Item color="red" onClick={async () => { await updateDoc(doc(db(), 'crm_customers', v.id), { deletedAt: Date.now() }); }}>Remove</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {filtered.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}><Text c="dimmed">No vendors found</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
      <VendorAddModal opened={addOpen} onClose={() => setAddOpen(false)} basePath="/employee/customers/vendors" />
    </EmployerAuthGate>
  );
}
