"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Stack, Group, Button, Tabs, Alert, Switch, Modal, TextInput, CopyButton, ActionIcon, Badge, Center, Loader } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

export default function VendorActionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [vendor, setVendor] = useState<any | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(ref, (snap) => setVendor(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null));
    return () => unsub();
  }, [params.id]);

  const [deleteVendorOpen, setDeleteVendorOpen] = useState(false);
  const [deleteVendorInput, setDeleteVendorInput] = useState('');
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleteInput, setPermDeleteInput] = useState('');
  const [archiveVendorOpen, setArchiveVendorOpen] = useState(false);
  const [archiveVendorInput, setArchiveVendorInput] = useState('');

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
        value={"actions"}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/crm/vendor/${vendor.id}` },
          { value: 'notes', label: 'Notes', href: `/employee/crm/vendor/${vendor.id}/notes` },
          { value: 'contacts', label: 'Contacts', href: `/employee/crm/vendor/${vendor.id}/contacts` },
          { value: 'actions', label: 'Actions', href: `/employee/crm/vendor/${vendor.id}/actions` },
        ]}
      />

      {vendor.isArchived && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This vendor is archived and hidden from the Database view.</Text>
            <Button variant="light" onClick={async () => { await updateDoc(doc(db(), 'crm_customers', vendor.id), { isArchived: false } as any); }}>Unarchive</Button>
          </Group>
        </Alert>
      )}

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={4}>Account controls</Title>
          <Group>
            <Switch
              checked={!!vendor.doNotContact}
              onChange={async (e) => { await updateDoc(doc(db(), 'crm_customers', vendor.id), { doNotContact: e.currentTarget.checked } as any); }}
              label="Do not contact"
            />
          </Group>
        </Stack>
      </Card>

      <Title order={4} c="red" mb="xs">Danger zone</Title>

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={5}>Archive vendor</Title>
          <Group>
            <Button color="orange" variant="light" onClick={() => { setArchiveVendorInput(''); setArchiveVendorOpen(true); }}>Archive vendor</Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={5}>Remove vendor</Title>
          <Group>
            <Button color="red" variant="light" onClick={() => { setDeleteVendorInput(''); setDeleteVendorOpen(true); }}>Remove vendor</Button>
          </Group>
        </Stack>
      </Card>

      {/* Remove vendor modal */}
      <Modal opened={deleteVendorOpen} onClose={() => setDeleteVendorOpen(false)} title="Remove vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Move this vendor to Removed. You can permanently delete it from the Removed tab later. Type the vendor name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Vendor name" value={vendor.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={vendor.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={deleteVendorInput} onChange={(e) => setDeleteVendorInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteVendorOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(vendor.name?.length || 0) > 0 && deleteVendorInput !== (vendor.name || '')} onClick={async () => {
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { deletedAt: Date.now() } as any);
              setDeleteVendorOpen(false);
              toast.show({ title: 'Vendor removed', message: 'Moved to Removed. You can restore or permanently delete it from the Removed tab.' });
            }}>Remove</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete vendor modal */}
      <Modal opened={permDeleteOpen} onClose={() => setPermDeleteOpen(false)} title="Permanently delete vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">This action cannot be undone. Type the exact vendor name to confirm permanent deletion.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Vendor name" value={vendor.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={vendor.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={permDeleteInput} onChange={(e) => setPermDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPermDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(vendor.name?.length || 0) > 0 && permDeleteInput !== (vendor.name || '')} onClick={async () => {
              await deleteDoc(doc(db(), 'crm_customers', vendor.id));
              setPermDeleteOpen(false);
              toast.show({ title: 'Vendor deleted', message: 'Permanently deleted.' });
              router.push('/employee/crm');
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive vendor modal */}
      <Modal opened={archiveVendorOpen} onClose={() => setArchiveVendorOpen(false)} title="Archive vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Archiving hides this vendor from the Database view. Type the vendor name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Vendor name" value={vendor.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={vendor.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={archiveVendorInput} onChange={(e) => setArchiveVendorInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setArchiveVendorOpen(false)}>Cancel</Button>
            <Button color="orange" disabled={(vendor.name?.length || 0) > 0 && archiveVendorInput !== (vendor.name || '')} onClick={async () => {
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { isArchived: true } as any);
              setArchiveVendorOpen(false);
              toast.show({ title: 'Vendor archived', message: 'Moved to Archive.' });
            }}>Archive</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
import { RouteTabs } from '@/components/RouteTabs';
