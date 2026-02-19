"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Stack, Group, Button, Tabs, Alert, Switch, Modal, TextInput, CopyButton, ActionIcon, Badge, Center, Loader } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import VendorHeader from '@/components/crm/VendorHeader';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateCRMRecord, archiveCRMRecord, removeCRMRecord, deleteCRMRecord } from '@/services/crm';

export default function VendorActionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isVendorsSection = typeof window !== 'undefined' && window.location.pathname.startsWith('/employee/customers/vendors');
  const baseVendor = isVendorsSection ? '/employee/customers/vendors' : '/employee/crm/vendor';
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
      <VendorHeader vendor={vendor} current="actions" baseVendor={baseVendor} backBase={isVendorsSection ? '/employee/customers/vendors' : '/employee/crm'} />

      {/* Archived alert moved to shared header */}

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={4}>Account controls</Title>
          <Group>
            <Switch checked={!!vendor.doNotContact} onChange={async (e) => { await updateCRMRecord(vendor.id, { doNotContact: e.currentTarget.checked } as any); }} label="Do not contact" />
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
              await removeCRMRecord(vendor.id);
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
              await deleteCRMRecord(vendor.id);
              setPermDeleteOpen(false);
              toast.show({ title: 'Vendor deleted', message: 'Permanently deleted.' });
              router.push(isVendorsSection ? '/employee/customers/vendors' : '/employee/crm');
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
              await archiveCRMRecord(vendor.id);
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
