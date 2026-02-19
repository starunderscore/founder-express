"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Stack, Group, Button, Tabs, TextInput, Badge, Anchor, Menu, ActionIcon, Modal, Center, Loader } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import VendorHeader from '@/components/crm/VendorHeader';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import LocalDataTable, { type Column as LocalColumn } from '@/components/data-table/LocalDataTable';

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
  const isVendorsSection = typeof window !== 'undefined' && window.location.pathname.startsWith('/employee/customers/vendors');
  const baseVendor = isVendorsSection ? '/employee/customers/vendors' : '/employee/crm/vendor';
  const baseContact = isVendorsSection ? '/employee/customers/vendors/contact' : '/employee/crm/vendor/contact';
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
    const t = titleText.trim();
    const c: any = { id, name: nm, createdAt: Date.now(), emails: [], phones: [], addresses: [], notes: [] };
    if (t) c.title = t;
    const next = Array.isArray(vendor.contacts) ? [c, ...vendor.contacts] : [c];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: next } as any);
    setName(''); setTitleText(''); setAddOpen(false);
    router.push(`${baseContact}/${id}` as any);
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
      <VendorHeader
        vendor={vendor}
        current="contacts"
        baseVendor={baseVendor}
        backBase={isVendorsSection ? '/employee/customers/vendors' : '/employee/crm'}
        rightSlot={<Button variant="light" onClick={() => setAddOpen(true)}>Add contact</Button>}
      />

      <Card withBorder radius="md" padding={0}>
        <div style={{ padding: '12px 16px' }}>
          <TextInput placeholder="Search contacts (name, title, email, phone)" value={queryText} onChange={(e) => setQueryText(e.currentTarget.value)} />
        </div>
        <div style={{ padding: '0 16px 12px 16px' }}>
          <LocalDataTable
            rows={contacts}
            columns={([
              { key: 'name', header: 'Name', render: (c: any) => (<Anchor component={Link as any} href={`${baseContact}/${c.id}`} underline="hover">{c.name}</Anchor>) },
              { key: 'title', header: 'Title', render: (c: any) => (c.title || '—') },
              {
                key: 'actions', header: '', width: 1,
                render: (c: any) => (
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Menu withinPortal position="bottom-end" shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Contact actions">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="5" cy="12" r="2" fill="currentColor"/>
                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            <circle cx="19" cy="12" r="2" fill="currentColor"/>
                          </svg>
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item component={Link as any} href={`${baseContact}/${c.id}` as any}>View</Menu.Item>
                        <Menu.Item color="red" onClick={() => deleteContact(c.id)}>Delete</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                )
              },
            ]) as LocalColumn<any>[]}
            defaultPageSize={25}
            enableSelection={false}
          />
        </div>
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
