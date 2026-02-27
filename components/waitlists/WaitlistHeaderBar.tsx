"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Group, Title, Text, Button, ActionIcon, Alert, Modal, Stack } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import WaitlistDeletePermanentModal from '@/components/waitlists/WaitlistDeletePermanentModal';
import { RouteTabs } from '@/components/RouteTabs';

export type WaitlistHeaderBarProps = {
  listId: string;
  name: string;
  current: 'sent' | 'drafts' | 'form' | 'settings';
  onAdd?: () => void;
  onSend?: () => void;
  backHref?: string;
  archiveAt?: number | null;
  removedAt?: number | null;
};

export default function WaitlistHeaderBar({ listId, name, current, onAdd, onSend, backHref, archiveAt, removedAt }: WaitlistHeaderBarProps) {
  const router = useRouter();
  const add = onAdd || (() => {});
  const send = onSend || (() => router.push(`/employee/email-subscriptions/waiting/${listId}/send`));
  const computedBack = backHref || (removedAt ? '/employee/email-subscriptions/waiting/removed' : (archiveAt ? '/employee/email-subscriptions/waiting/archive' : '/employee/email-subscriptions/waiting'));
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Group justify="space-between" mb="xs">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(computedBack as any)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2}>{name}</Title>
            <Text c="dimmed" mt={4}>Waiting List</Text>
          </div>
        </Group>
        <Group gap="xs">
          <Button variant="light" onClick={add}>Add to waiting list</Button>
          <Button onClick={send}>Send email</Button>
        </Group>
      </Group>

      {removedAt && (
        <Alert color="red" variant="light" mb="md" title="Removed">
          <Group justify="space-between" align="center">
            <Text>This waiting list is removed. You can restore it or permanently delete it.</Text>
            <Group gap="xs">
              <Button variant="light" onClick={() => setRestoreOpen(true)}>Restore</Button>
              <Button color="red" variant="light" onClick={() => setDeleteOpen(true)}>Delete permanently</Button>
            </Group>
          </Group>
        </Alert>
      )}
      {!removedAt && archiveAt && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This waiting list is archived and hidden from the Active list.</Text>
            <Button variant="light" onClick={() => setUnarchiveOpen(true)}>Unarchive</Button>
          </Group>
        </Alert>
      )}

      <RouteTabs
        value={current}
        mb="md"
        tabs={[
          { value: 'sent', label: 'Emails sent', href: `/employee/email-subscriptions/waiting/${listId}` },
          { value: 'drafts', label: 'Email drafts', href: `/employee/email-subscriptions/waiting/${listId}/drafts` },
          { value: 'form', label: 'Copy & paste form', href: `/employee/email-subscriptions/waiting/${listId}/form` },
          { value: 'settings', label: 'List settings', href: `/employee/email-subscriptions/waiting/${listId}/settings` },
        ]}
      />

      <Modal opened={unarchiveOpen} onClose={() => setUnarchiveOpen(false)} centered>
        <Stack>
          <Text>Unarchive this waiting list? It will return to Active.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUnarchiveOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              await updateDoc(doc(db(), 'ep_waitlists', listId), { archiveAt: null, isArchived: false });
              setUnarchiveOpen(false);
              router.push('/employee/email-subscriptions/waiting');
            }}>Unarchive</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} centered>
        <Stack>
          <Text>Restore this waiting list back to Active?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              await updateDoc(doc(db(), 'ep_waitlists', listId), { removedAt: null, archiveAt: null, isArchived: false });
              setRestoreOpen(false);
              router.push('/employee/email-subscriptions/waiting');
            }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      <WaitlistDeletePermanentModal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        listName={name || ''}
        onConfirm={async () => {
          await deleteDoc(doc(db(), 'ep_waitlists', listId));
          setDeleteOpen(false);
          router.push('/employee/email-subscriptions/waiting');
        }}
      />
    </>
  );
}
