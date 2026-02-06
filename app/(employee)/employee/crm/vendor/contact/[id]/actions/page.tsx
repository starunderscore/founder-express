"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Stack, Group, Button, Tabs, Alert, Switch, Modal, TextInput, CopyButton, ActionIcon, Badge, Center, Loader } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import type { Contact } from '@/state/crmStore';

export default function VendorContactActionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isVendorsSection = typeof window !== 'undefined' && window.location.pathname.startsWith('/employee/customers/vendors');
  const baseVendor = isVendorsSection ? '/employee/customers/vendors' : '/employee/crm/vendor';
  const baseContact = isVendorsSection ? '/employee/customers/vendors/contact' : '/employee/crm/vendor/contact';
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

  const { vendor, contact } = useMemo(() => {
    for (const v of customers) {
      if (v.type !== 'vendor') continue;
      const c = (v.contacts || []).find((x: Contact) => x.id === params.id);
      if (c) return { vendor: v, contact: c };
    }
    return { vendor: null as any, contact: null as any };
  }, [customers, params.id]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveInput, setArchiveInput] = useState('');

  if (!vendor || !contact) {
    return (
      <EmployerAuthGate>
        <Center mih={240}><Loader size="sm" /></Center>
      </EmployerAuthGate>
    );
  }

  const writeContacts = async (next: any[]) => {
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: next } as any);
  };

  return (
    <EmployerAuthGate>
      {/* Vendor header row */}
      <Group justify="space-between" mb="xs">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(`${baseVendor}/${vendor.id}/contacts`)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={4}>{vendor.name}</Title>
            <Badge color="orange" variant="filled">Vendor</Badge>
          </Group>
        </Group>
      </Group>

      {/* Contact header row */}
      <Group justify="space-between" mb="md" align="flex-end">
        <div>
          <Group gap="xs" align="center">
            <Title order={2} style={{ lineHeight: 1 }}>{contact.name}</Title>
            <Badge color="grape" variant="filled">Contact</Badge>
            {contact.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
          </Group>
        </div>
        <Group gap="xs">
          {(contact.emails?.length || 0) > 0 && <Badge variant="light">{contact.emails!.length} email{contact.emails!.length === 1 ? '' : 's'}</Badge>}
          {(contact.phones?.length || 0) > 0 && <Badge variant="light">{contact.phones!.length} phone{contact.phones!.length === 1 ? '' : 's'}</Badge>}
          {(contact.addresses?.length || 0) > 0 && <Badge variant="light">{contact.addresses!.length} address{contact.addresses!.length === 1 ? '' : 'es'}</Badge>}
        </Group>
      </Group>

      <RouteTabs
        value={"actions"}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `${baseContact}/${contact.id}` },
          { value: 'notes', label: 'Notes', href: `${baseContact}/${contact.id}/notes` },
          { value: 'actions', label: 'Actions', href: `${baseContact}/${contact.id}/actions` },
        ]}
      />

      {contact.isArchived && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This contact is archived and hidden from active workflows.</Text>
            <Button variant="light" onClick={async () => {
              const next = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, isArchived: false } : c));
              await writeContacts(next);
            }}>Unarchive</Button>
          </Group>
        </Alert>
      )}

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={4}>Contact controls</Title>
          <Group>
            <Switch
              checked={!!contact.doNotContact}
              onChange={async (e) => {
                const next = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, doNotContact: e.currentTarget.checked } : c));
                await writeContacts(next);
              }}
              label="Do not contact"
            />
          </Group>
        </Stack>
      </Card>

      <Title order={4} c="red" mb="xs">Danger zone</Title>

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={5}>Archive contact</Title>
          <Group>
            <Button color="orange" variant="light" onClick={() => { setArchiveInput(''); setArchiveOpen(true); }}>Archive contact</Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={5}>Remove contact</Title>
          <Group>
            <Button color="red" variant="light" onClick={() => { setDeleteInput(''); setDeleteOpen(true); }}>Remove contact</Button>
          </Group>
        </Stack>
      </Card>

      {/* Remove contact modal */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove contact" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Move this contact to Removed. You can permanently delete it later. Type the identifier to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Identifier" value={contact.name || (contact.emails?.[0]?.email || '')} readOnly style={{ flex: 1 }} />
            <CopyButton value={contact.name || (contact.emails?.[0]?.email || '')}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type" value={deleteInput} onChange={(e) => setDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deleteInput !== (contact.name || (contact.emails?.[0]?.email || ''))} onClick={async () => {
              const next = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, deletedAt: Date.now() } : c));
              await writeContacts(next);
              setDeleteOpen(false);
              toast.show({ title: 'Contact removed', message: 'Moved to Removed.' });
              router.push(`/employee/crm/vendor/${vendor.id}`);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive contact modal */}
      <Modal opened={archiveOpen} onClose={() => setArchiveOpen(false)} title="Archive contact" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Archiving hides this contact from active workflows. Type the contact name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Contact name" value={contact.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={contact.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type contact name" value={archiveInput} onChange={(e) => setArchiveInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setArchiveOpen(false)}>Cancel</Button>
            <Button color="orange" disabled={archiveInput !== (contact.name || '')} onClick={async () => {
              const next = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, isArchived: true } : c));
              await writeContacts(next);
              setArchiveOpen(false);
              toast.show({ title: 'Contact archived', message: 'Moved to Archive.' });
            }}>Archive</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
import { RouteTabs } from '@/components/RouteTabs';
