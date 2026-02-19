"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Group, Button, Table, Badge, Anchor, Card, ActionIcon, Menu, TextInput, Tabs, Modal, Stack, CopyButton, SegmentedControl } from '@mantine/core';
import { IconAddressBook } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { RouteTabs } from '@/components/RouteTabs';
import { type Contact } from '@/services/crm/types';

export default function CRMRemovedPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db(), 'crm_customers'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: any[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setCustomers(rows);
    });
    return () => unsub();
  }, []);
  const [search, setSearch] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target, setTarget] = useState<{ kind: 'customer' | 'vendor' | 'contact'; id: string; name: string; parentId?: string } | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'vendor' | 'contact'>('all');

  const mixed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const trashedRecords = customers.filter((c) => !!c.deletedAt).map((c) => ({
      kind: c.type as 'customer' | 'vendor', id: c.id, name: c.name, email: c.email || '', vendorName: '', vendorId: undefined as string | undefined,
    }));
    const trashedContacts = customers.flatMap((c) =>
      (c.contacts || [])
        .filter((ct: Contact) => !!ct.deletedAt)
        .map((ct: Contact) => ({ kind: 'contact' as const, id: ct.id, name: ct.name || '—', email: (ct.emails && ct.emails[0]?.email) || '', parentId: c.id, vendorName: c.type === 'vendor' ? c.name : '', vendorId: c.type === 'vendor' ? c.id : undefined }))
    );
    let all = [...trashedRecords, ...trashedContacts];
    if (typeFilter !== 'all') all = all.filter((it) => it.kind === (typeFilter as any));
    if (!q) return all;
    return all.filter((it) => it.name.toLowerCase().includes(q) || (it.email || '').toLowerCase().includes(q));
  }, [customers, search, typeFilter]);

  return (
    <EmployerAuthGate>
      <Group gap="xs" align="center" mb="md">
        <IconAddressBook size={20} />
        <div>
          <Title order={2} mb={4}>CRM</Title>
          <Text c="dimmed">New users automatically appear in CRM (Customer Relationship Management).</Text>
        </div>
      </Group>

      <RouteTabs
        value={"removed"}
        mb="md"
        tabs={[
          { value: 'main', label: 'Database', href: '/employee/crm' },
          { value: 'merge', label: 'Merge', href: '/employee/crm/merge' },
          { value: 'archive', label: 'Archive', href: '/employee/crm/archive' },
          { value: 'removed', label: 'Removed', href: '/employee/crm/removed' },
        ]}
      />

      <Card withBorder padding={0}>
        <div style={{ padding: '12px 16px' }}>
          <Group justify="space-between" align="center">
            <TextInput placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.currentTarget.value)} style={{ flex: 1 }} />
            <SegmentedControl
              data={[ { label: 'All', value: 'all' }, { label: 'Customers', value: 'customer' }, { label: 'Vendors', value: 'vendor' }, { label: 'Vendor Contacts', value: 'contact' } ]}
              value={typeFilter}
              onChange={(v) => setTypeFilter((v as any) || 'all')}
              color={typeFilter === 'vendor' ? 'orange' : typeFilter === 'customer' ? 'blue' : 'gray'}
              styles={{ root: { background: 'var(--mantine-color-gray-3)' } }}
            />
          </Group>
        </div>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead className="crm-thead">
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Vendor</Table.Th>
              <Table.Th style={{ width: 280, minWidth: 280 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {mixed.map((item) => (
              <Table.Tr key={`${item.kind}-${item.id}`}>
                <Table.Td>
                  {item.kind === 'contact' ? (
                    <Anchor component={Link as any} href={`/employee/crm/vendor/contact/${item.id}` as any} underline="hover">{item.name}</Anchor>
                  ) : (
                    <Anchor component={Link as any} href={`/employee/crm/${item.kind}/${item.id}` as any} underline="hover">{item.name}</Anchor>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{(item as any).email || '—'}</Text>
                </Table.Td>
                <Table.Td>
                  {((item as any).vendorName) ? (
                    <Anchor component={Link as any} href={`/employee/crm/vendor/${(item as any).vendorId}` as any} underline="hover">{(item as any).vendorName}</Anchor>
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Table.Td>
                <Table.Td style={{ width: 280, minWidth: 280, whiteSpace: 'nowrap' }}>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Badge color={item.kind === 'vendor' ? 'orange' : item.kind === 'customer' ? 'blue' : 'grape'} variant="light">
                      {item.kind === 'vendor' ? 'Vendor' : item.kind === 'customer' ? 'Customer' : 'Vendor contact'}
                    </Badge>
                    <div style={{ width: 16 }} />
                    <ActionIcon
                      variant="subtle"
                      aria-label="View"
                      component={Link as any}
                      href={item.kind === 'contact' ? (`/employee/crm/vendor/contact/${item.id}` as any) : (`/employee/crm/${item.kind}/${item.id}` as any)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="currentColor"/>
                      </svg>
                    </ActionIcon>
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
                        <Menu.Item component={Link as any} href={item.kind === 'contact' ? (`/employee/crm/vendor/contact/${item.id}` as any) : (`/employee/crm/${item.kind}/${item.id}` as any)}>View</Menu.Item>
                        <Menu.Item onClick={() => { setTarget(item as any); setRestoreOpen(true); }}>Restore</Menu.Item>
                        <Menu.Item color="red" onClick={() => { setTarget(item as any); setDeleteInput(''); setDeleteOpen(true); }}>Permanently delete</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {mixed.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed">No removed records</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
      <style jsx>{`
        .crm-thead { background: var(--mantine-color-gray-2); }
        [data-mantine-color-scheme="dark"] .crm-thead { background: var(--mantine-color-dark-6); }
        [data-mantine-color-scheme="dark"] .crm-thead th { color: var(--mantine-color-white); }
      `}</style>

      {/* Restore modal */}
      <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} title="Restore record" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Restore this {target?.kind || 'record'} back to the Database view.</Text>
          <TextInput label="Name" value={target?.name || ''} readOnly />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!target) return;
              if (target.kind === 'contact') {
                const parent = customers.find((x) => x.id === (target as any).parentId);
                if (!parent) return;
                const contacts = (parent.contacts || []).map((ct: any) => (ct.id === target.id ? { ...ct, deletedAt: undefined } : ct));
                updateDoc(doc(db(), 'crm_customers', parent.id), { contacts });
              } else {
                updateDoc(doc(db(), 'crm_customers', target.id), { deletedAt: undefined });
              }
              setRestoreOpen(false);
              toast.show({ title: 'Restored', message: `${target.kind[0].toUpperCase()}${target.kind.slice(1)} restored successfully.` });
            }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete modal */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Permanently delete" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">This action cannot be undone. Type the exact name to confirm permanent deletion.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Name" value={target?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={target?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type name" value={deleteInput} onChange={(e) => setDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(target?.name?.length || 0) > 0 && deleteInput !== (target?.name || '')} onClick={() => {
              if (!target) return;
              if (target.kind === 'contact') {
                const parent = customers.find((x) => x.id === (target as any).parentId);
                if (!parent) return;
                const contacts = (parent.contacts || []).filter((ct: any) => ct.id !== target.id);
                updateDoc(doc(db(), 'crm_customers', parent.id), { contacts });
              } else {
                deleteDoc(doc(db(), 'crm_customers', target.id));
              }
              setDeleteOpen(false);
              toast.show({ title: 'Deleted', message: `${target.kind[0].toUpperCase()}${target.kind.slice(1)} permanently deleted.` });
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
