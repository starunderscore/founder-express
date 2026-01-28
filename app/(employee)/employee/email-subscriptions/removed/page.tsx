"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Badge, Tabs, Anchor, Button, Modal } from '@mantine/core';
import Link from 'next/link';
import { RouteTabs } from '@/components/RouteTabs';
import { useState } from 'react';

export default function EmailSubscriptionsRemovedPage() {
  const waitlists = useSubscriptionsStore((s) => s.waitlists);
  const restoreWaitlist = useSubscriptionsStore((s) => s.restoreWaitlist);
  const hardDeleteWaitlist = useSubscriptionsStore((s) => s.hardDeleteWaitlist);

  const removed = (waitlists || []).filter((w: any) => !!w?.deletedAt);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const openConfirm = (id: string) => { setTargetId(id); setConfirmOpen(true); };
  const doDelete = () => { if (targetId) hardDeleteWaitlist(targetId); setConfirmOpen(false); setTargetId(null); };

  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Email subscriptions</Title>
          <Text c="dimmed">Manage waiting lists and newsletter subscribers.</Text>
        </div>

        <RouteTabs
          value={"removed"}
          tabs={[
            { value: 'newsletters', label: 'Newsletters', href: '/employee/email-subscriptions/newsletters' },
            { value: 'waiting', label: 'Waiting Lists', href: '/employee/email-subscriptions/waiting' },
            { value: 'archive', label: 'Archive', href: '/employee/email-subscriptions/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/email-subscriptions/removed' },
          ]}
        />

        <Card withBorder>
          {removed.length > 0 ? (
            <Stack>
              {removed.map((b: any) => (
                <Card key={b.id} withBorder>
                  <Group justify="space-between" align="center">
                    <div>
                      <Anchor component={Link as any} href={`/employee/email-subscriptions/waiting/${b.id}`} underline="hover">
                        <Text fw={600}>{b.name}</Text>
                      </Anchor>
                      <Text size="xs" c="dimmed">Removed {new Date(b.deletedAt).toLocaleString()}</Text>
                    </div>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={() => restoreWaitlist(b.id)}>Restore</Button>
                      <Button size="xs" variant="subtle" color="red" onClick={() => openConfirm(b.id)}>Permanently delete</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed">No removed waiting lists</Text>
          )}
        </Card>

        <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Permanently delete" centered>
          <Stack>
            <Text c="dimmed">This action cannot be undone.</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button color="red" onClick={doDelete}>Delete</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
