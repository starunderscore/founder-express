"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Group, Title, Badge, ActionIcon, Alert, Text, Button, Modal, Stack } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { updateCRMRecord, restoreCRMRecord, deleteCRMRecord } from '@/services/crm';
import { useToast } from '@/components/ToastProvider';

type VendorLike = {
  id: string;
  name?: string;
  isArchived?: boolean;
  deletedAt?: number;
  doNotContact?: boolean;
};

export default function VendorHeader({
  vendor,
  current,
  baseVendor,
  backBase,
  rightSlot,
}: {
  vendor: VendorLike;
  current: 'overview' | 'notes' | 'contacts' | 'actions';
  baseVendor: string; // e.g., '/employee/customers/vendors' or '/employee/crm/vendor'
  backBase: string; // e.g., '/employee/customers/vendors' or '/employee/crm'
  rightSlot?: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const id = vendor.id;
  const computedBack = vendor.deletedAt
    ? `${backBase}/removed`
    : (vendor.isArchived ? `${backBase}/archive` : backBase);

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
            <Title order={2}>{vendor.name || 'Vendor'}</Title>
            <Badge color="orange" variant="filled">Vendor</Badge>
            {vendor.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
          </Group>
        </Group>
        {rightSlot && (
          <Group>
            {rightSlot}
          </Group>
        )}
      </Group>

      {vendor.isArchived && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This vendor is archived and hidden from the Database view.</Text>
            <Button variant="light" onClick={() => setUnarchiveOpen(true)}>Unarchive</Button>
          </Group>
        </Alert>
      )}

      {vendor.deletedAt && (
        <Alert color="red" variant="light" mb="md" title="Removed">
          <Group justify="space-between" align="center">
            <Text>This vendor is removed. You can restore it or permanently delete it.</Text>
            <Group gap="xs">
              <Button variant="light" onClick={() => setRestoreOpen(true)}>Restore</Button>
              <Button color="red" variant="light" onClick={() => setDeleteOpen(true)}>Delete permanently</Button>
            </Group>
          </Group>
        </Alert>
      )}

      <Modal opened={unarchiveOpen} onClose={() => setUnarchiveOpen(false)} centered>
        <Stack>
          <Text>Unarchive this vendor? They will return to the Database view.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUnarchiveOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await updateCRMRecord(id, { isArchived: false }); setUnarchiveOpen(false); toast.show({ title: 'Vendor unarchived', message: 'Moved back to Database.' }); }}>Unarchive</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} centered>
        <Stack>
          <Text>Restore this vendor back to the Database view?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await restoreCRMRecord(id); setRestoreOpen(false); toast.show({ title: 'Vendor restored', message: 'Moved back to Database.' }); }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} centered>
        <Stack>
          <Text>Permanently delete this vendor? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button color="red" onClick={async () => { await deleteCRMRecord(id); setDeleteOpen(false); toast.show({ title: 'Vendor deleted', message: 'Permanently deleted.' }); router.push(backBase); }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      <RouteTabs
        value={current}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `${baseVendor}/${id}` },
          { value: 'notes', label: 'Notes', href: `${baseVendor}/${id}/notes` },
          { value: 'contacts', label: 'Contacts', href: `${baseVendor}/${id}/contacts` },
          { value: 'actions', label: 'Actions', href: `${baseVendor}/${id}/actions` },
        ]}
      />
    </>
  );
}
