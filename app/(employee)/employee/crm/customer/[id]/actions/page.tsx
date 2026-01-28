"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Stack, Group, Button, Tabs, Alert, Switch, Modal, TextInput, CopyButton, ActionIcon, Badge } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

export default function CustomerActionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [customer, setCustomer] = useState<any | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(ref, (snap) => setCustomer(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null));
    return () => unsub();
  }, [params.id]);

  // Modals and inputs
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [deleteCustomerInput, setDeleteCustomerInput] = useState('');
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleteInput, setPermDeleteInput] = useState('');
  const [archiveCustomerOpen, setArchiveCustomerOpen] = useState(false);
  const [archiveCustomerInput, setArchiveCustomerInput] = useState('');

  if (!customer) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Customer not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/crm')}>Back to CRM</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(`/employee/crm/customer/${customer.id}`)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={2}>{customer.name}</Title>
            <Badge color="blue" variant="filled">Customer</Badge>
          </Group>
        </Group>
      </Group>

      <RouteTabs
        value={"actions"}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/crm/customer/${customer.id}` },
          { value: 'notes', label: 'Notes', href: `/employee/crm/customer/${customer.id}/notes` },
          { value: 'actions', label: 'Actions', href: `/employee/crm/customer/${customer.id}/actions` },
        ]}
      />

      {customer.isBlocked && (
        <Alert color="red" variant="light" mb="md" title="This customer is blocked">
          Blocked customers cannot access their account until unblocked.
        </Alert>
      )}

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={4}>Account controls</Title>
          <Group>
            <Switch
              checked={!!customer.isBlocked}
              onChange={async (e) => { await updateDoc(doc(db(), 'crm_customers', customer.id), { isBlocked: e.currentTarget.checked }); }}
              label="Block customer"
            />
          </Group>
        </Stack>
      </Card>

      <Title order={4} c="red" mb="xs">Danger zone</Title>

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={5}>Archive customer</Title>
          <Group>
            <Button color="orange" variant="light" onClick={() => { setArchiveCustomerInput(''); setArchiveCustomerOpen(true); }}>Archive customer</Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={5}>Remove customer</Title>
          <Group>
            <Button color="red" variant="light" onClick={() => { setDeleteCustomerInput(''); setDeleteCustomerOpen(true); }}>Remove customer</Button>
          </Group>
        </Stack>
      </Card>

      {/* Remove customer modal */}
      <Modal opened={deleteCustomerOpen} onClose={() => setDeleteCustomerOpen(false)} title="Remove customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Removing moves this customer to the Removed list. Type the email to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Email" value={customer.email} readOnly style={{ flex: 1 }} />
            <CopyButton value={customer.email}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type email" value={deleteCustomerInput} onChange={(e) => setDeleteCustomerInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteCustomerOpen(false)}>Cancel</Button>
            <Button color="red" disabled={customer.email.length > 0 && deleteCustomerInput !== customer.email} onClick={async () => {
              await updateDoc(doc(db(), 'crm_customers', customer.id), { deletedAt: Date.now() });
              setDeleteCustomerOpen(false);
              toast.show({ title: 'Customer removed', message: 'Moved to Removed. You can restore or permanently delete it from the Removed tab.', color: 'green' });
            }}>Remove</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive customer modal */}
      <Modal opened={archiveCustomerOpen} onClose={() => setArchiveCustomerOpen(false)} title="Archive customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Archiving hides this customer from the Database view. Type the customer name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Customer name" value={customer.name} readOnly style={{ flex: 1 }} />
            <CopyButton value={customer.name}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type customer name" value={archiveCustomerInput} onChange={(e) => setArchiveCustomerInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setArchiveCustomerOpen(false)}>Cancel</Button>
            <Button color="orange" disabled={customer.name.length > 0 && archiveCustomerInput !== customer.name} onClick={async () => {
              await updateDoc(doc(db(), 'crm_customers', customer.id), { isArchived: true });
              setArchiveCustomerOpen(false);
              toast.show({ title: 'Customer archived', message: 'Moved to Archive.' });
            }}>Archive</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete customer modal */}
      <Modal opened={permDeleteOpen} onClose={() => setPermDeleteOpen(false)} title="Permanently delete customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">This action cannot be undone. Type the exact customer name to confirm permanent deletion.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Customer name" value={customer.name} readOnly style={{ flex: 1 }} />
            <CopyButton value={customer.name}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type customer name" value={permDeleteInput} onChange={(e) => setPermDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPermDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={customer.name.length > 0 && permDeleteInput !== customer.name} onClick={async () => {
              await deleteDoc(doc(db(), 'crm_customers', customer.id));
              setPermDeleteOpen(false);
              toast.show({ title: 'Customer deleted', message: 'Permanently deleted.' });
              router.push('/employee/crm');
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
import { RouteTabs } from '@/components/RouteTabs';
