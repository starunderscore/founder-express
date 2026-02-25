"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Group, Title, Text, Button, ActionIcon, Alert } from '@mantine/core';
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
          This waiting list is removed and appears in the Removed tab.
        </Alert>
      )}
      {!removedAt && archiveAt && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          This waiting list is archived and hidden from the Active list.
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
    </>
  );
}
