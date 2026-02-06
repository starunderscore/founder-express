"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Group, Button, Table, Badge, Anchor, Card, ActionIcon, Menu, TextInput, Tabs, Modal, Stack, CopyButton, SegmentedControl } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { RouteTabs } from '@/components/RouteTabs';
import { useRouter } from 'next/navigation';
import { type Contact } from '@/state/crmStore';

export default function CRMRemovedPage() {
  const router = useRouter();
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
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteInput, setDeleteInput] = useState('');

  const removedCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => c.type === 'customer' && !!c.deletedAt)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
  }, [customers, search]);

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

      <Card withBorder padding={0}>
        <div style={{ padding: '12px 16px' }}>
          <TextInput placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
        </div>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead className="crm-thead">
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th style={{ width: 280, minWidth: 280 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {removedCustomers.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Anchor component={Link as any} href={`/employee/customers/crm/customer/${item.id}` as any} underline="hover">{item.name}</Anchor>
                </Table.Td>
                <Table.Td><Text size="sm">{item.email || '—'}</Text></Table.Td>
                <Table.Td style={{ width: 280, minWidth: 280, whiteSpace: 'nowrap' }}>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      aria-label="View"
                      component={Link as any}
                      href={`/employee/customers/crm/customer/${item.id}` as any}
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
                        <Menu.Item component={Link as any} href={`/employee/customers/crm/customer/${item.id}` as any}>View</Menu.Item>
                        <Menu.Item onClick={() => { setTarget({ id: item.id, name: item.name }); setRestoreOpen(true); }}>Restore</Menu.Item>
                        <Menu.Item color="red" onClick={() => { setTarget({ id: item.id, name: item.name }); setDeleteInput(''); setDeleteOpen(true); }}>Permanently delete</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {removedCustomers.length === 0 && (
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
      <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} title="Restore customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Restore this customer back to the Database view.</Text>
          <TextInput label="Name" value={target?.name || ''} readOnly />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!target) return;
              updateDoc(doc(db(), 'crm_customers', target.id), { deletedAt: undefined });
              setRestoreOpen(false);
              toast.show({ title: 'Restored', message: 'Customer restored successfully.' });
            }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete modal */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Permanently delete customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
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
              deleteDoc(doc(db(), 'crm_customers', target.id));
              setDeleteOpen(false);
              toast.show({ title: 'Deleted', message: 'Customer permanently deleted.' });
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
