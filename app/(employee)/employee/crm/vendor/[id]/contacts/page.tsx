"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Stack, Group, Button, Tabs, TextInput, Table, Badge, Anchor, Menu, ActionIcon, Modal, Center, Loader } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

type Contact = {
  id: string;
  name: string;
  title?: string;
  createdAt?: number;
  deletedAt?: number;
  emails?: any[];
  phones?: any[];
  addresses?: any[];
  notes?: any[];
  isBlocked?: boolean;
  isArchived?: boolean;
  doNotContact?: boolean;
};

export default function VendorContactsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vendor, setVendor] = useState<any | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(ref, (snap) => setVendor(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null));
    return () => unsub();
  }, [params.id]);

  const [queryText, setQueryText] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [titleText, setTitleText] = useState('');

  const contacts = useMemo(() => {
    const list: Contact[] = Array.isArray(vendor?.contacts) ? vendor.contacts : [];
    const q = queryText.trim().toLowerCase();
    const filtered = list.filter((c) => {
      if (c.deletedAt) return false;
      if (c.isArchived) return false;
      if (!q) return true;
      const name = (c.name || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      const emails = (c.emails || []).some((e: any) => (e.email || '').toLowerCase().includes(q));
      const phones = (c.phones || []).some((p: any) => (p.number || '').toLowerCase().includes(q));
      return name.includes(q) || title.includes(q) || emails || phones;
    });
    return filtered;
  }, [vendor?.contacts, queryText]);

  const addContact = async () => {
    if (!vendor) return;
    const nm = name.trim();
    if (!nm) return;
    const id = `ct-${Date.now()}`;
    const c: Contact = { id, name: nm, title: titleText.trim() || undefined, createdAt: Date.now(), emails: [], phones: [], addresses: [], notes: [] };
    const next = Array.isArray(vendor.contacts) ? [c, ...vendor.contacts] : [c];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: next } as any);
    setName(''); setTitleText(''); setAddOpen(false);
    router.push(`/employee/crm/vendor/contact/${id}` as any);
  };

  const deleteContact = async (id: string) => {
    if (!vendor) return;
    const next = (vendor.contacts || []).map((x: any) => (x.id === id ? { ...x, deletedAt: Date.now() } : x));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: next } as any);
  };

  if (!vendor) {
    return (
      <EmployerAuthGate>
        <Center mih={240}><Loader size="sm" /></Center>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/crm')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={2}>{vendor.name}</Title>
            <Badge color="orange" variant="filled">Vendor</Badge>
          </Group>
        </Group>
      </Group>

      <RouteTabs
        value={"contacts"}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/crm/vendor/${vendor.id}` },
          { value: 'notes', label: 'Notes', href: `/employee/crm/vendor/${vendor.id}/notes` },
          { value: 'contacts', label: 'Contacts', href: `/employee/crm/vendor/${vendor.id}/contacts` },
          { value: 'actions', label: 'Actions', href: `/employee/crm/vendor/${vendor.id}/actions` },
        ]}
      />

      <Card withBorder radius="md" padding={0}>
        <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title order={4} m={0} style={{ color: 'inherit' }}>Contacts</Title>
          <Button variant="default" onClick={() => setAddOpen(true)}>Add contact</Button>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <TextInput placeholder="Search contacts (name, title, email, phone)" value={queryText} onChange={(e) => setQueryText(e.currentTarget.value)} />
        </div>
        <Table verticalSpacing="sm" highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contacts.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>
                  <Anchor component={Link as any} href={`/employee/crm/vendor/contact/${c.id}`} underline="hover">{c.name}</Anchor>
                </Table.Td>
                <Table.Td>{c.title || '—'}</Table.Td>
                <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <ActionIcon variant="subtle" aria-label="View" component={Link as any} href={`/employee/crm/vendor/contact/${c.id}` as any}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="currentColor"/>
                      </svg>
                    </ActionIcon>
                    <Menu withinPortal position="bottom-end" shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Contact actions">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="5" r="2" fill="currentColor"/>
                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            <circle cx="12" cy="19" r="2" fill="currentColor"/>
                          </svg>
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item component={Link as any} href={`/employee/crm/vendor/contact/${c.id}` as any}>View</Menu.Item>
                        <Menu.Item color="red" onClick={() => deleteContact(c.id)}>Delete</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {contacts.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3}><Text c="dimmed">No contacts</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add contact" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
          <TextInput label="Title" value={titleText} onChange={(e) => setTitleText(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button onClick={addContact}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
