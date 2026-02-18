"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Group, Title, Badge, ActionIcon, Alert, Text, Button, Modal, Stack } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { updateCRMRecord, restoreCRMRecord, deleteCRMRecord } from '@/services/crm';
import { useToast } from '@/components/ToastProvider';

type CustomerLike = {
  id: string;
  name?: string;
  isBlocked?: boolean;
  doNotContact?: boolean;
  isArchived?: boolean;
  deletedAt?: number;
};

export function CustomerHeader({
  customer,
  current,
  backHref = '/employee/customers/crm',
}: {
  customer: CustomerLike;
  current: 'overview' | 'notes' | 'actions';
  backHref?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false); // unarchive
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const id = customer.id;
  const computedBack = customer.deletedAt
    ? '/employee/customers/crm/removed'
    : (customer.isArchived ? '/employee/customers/crm/archive' : backHref);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(computedBack)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={2}>{customer.name || 'Customer'}</Title>
            <Badge color="blue" variant="filled">Customer</Badge>
            {customer.isBlocked && <Badge color="red" variant="filled">Blocked</Badge>}
            {customer.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
          </Group>
        </Group>
      </Group>

      {customer.isArchived && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This customer is archived and hidden from the Database view.</Text>
            <Button variant="light" onClick={() => setConfirmOpen(true)}>Unarchive</Button>
          </Group>
        </Alert>
      )}

      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} centered>
        <Stack>
          <Text>Unarchive this customer? They will return to the Database view.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await updateCRMRecord(id, { isArchived: false }); setConfirmOpen(false); toast.show({ title: 'Customer unarchived', message: 'Moved back to Database.' }); }}>Unarchive</Button>
          </Group>
        </Stack>
      </Modal>

      {customer.deletedAt && (
        <Alert color="red" variant="light" mb="md" title="Removed">
          <Group justify="space-between" align="center">
            <Text>This customer is removed. You can restore it or permanently delete it.</Text>
            <Group gap="xs">
              <Button variant="light" onClick={() => setRestoreOpen(true)}>Restore</Button>
              <Button color="red" variant="light" onClick={() => setDeleteOpen(true)}>Delete permanently</Button>
            </Group>
          </Group>
        </Alert>
      )}

      <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} centered>
        <Stack>
          <Text>Restore this customer back to the Database view?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await restoreCRMRecord(id); setRestoreOpen(false); toast.show({ title: 'Customer restored', message: 'Moved back to Database.' }); }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} centered>
        <Stack>
          <Text>Permanently delete this customer? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button color="red" onClick={async () => { await deleteCRMRecord(id); setDeleteOpen(false); toast.show({ title: 'Customer deleted', message: 'Permanently deleted.' }); router.push('/employee/customers/crm'); }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      <RouteTabs
        value={current}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/customers/crm/customer/${id}` },
          { value: 'notes', label: 'Notes', href: `/employee/customers/crm/customer/${id}/notes` },
          { value: 'actions', label: 'Actions', href: `/employee/customers/crm/customer/${id}/actions` },
        ]}
      />
    </>
  );
}

export default CustomerHeader;
