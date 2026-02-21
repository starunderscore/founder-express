"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Group, Title, Text, Button, ActionIcon } from '@mantine/core';

export type WaitlistHeaderProps = {
  listId: string;
  name: string;
  onAdd?: () => void;
  onSend?: () => void;
};

export default function WaitlistHeader({ listId, name, onAdd, onSend }: WaitlistHeaderProps) {
  const router = useRouter();
  const add = onAdd || (() => {});
  const send = onSend || (() => router.push(`/employee/email-subscriptions/waiting/${listId}/send`));
  return (
    <Group justify="space-between" mb="md">
      <Group>
        <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions/waiting')}>
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
        <Button variant="light" onClick={add}>Add user</Button>
        <Button onClick={send}>Send email</Button>
      </Group>
    </Group>
  );
}
