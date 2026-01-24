"use client";
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Button, Badge, ActionIcon } from '@mantine/core';

export default function NewsletterDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const newsletters = useSubscriptionsStore((s) => s.newsletters);
  const waitlists = useSubscriptionsStore((s) => s.waitlists);
  const removeNewsletter = useSubscriptionsStore((s) => s.removeNewsletterCampaign);

  const nl = useMemo(() => newsletters.find((n) => n.id === params.id) || null, [newsletters, params.id]);
  const ctx = useMemo(() => (nl?.contextWaitlistId ? waitlists.find((w) => w.id === nl.contextWaitlistId) || null : null), [waitlists, nl?.contextWaitlistId]);

  if (!nl) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Newsletter not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/email-subscriptions/newsletters')}>Back to newsletters</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  const dateStr = (ts?: number) => (ts ? new Date(ts).toLocaleString() : '—');

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" mb="md">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions/newsletters')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>{nl.subject}</Title>
              <Text c="dimmed" mt={4}>Newsletter</Text>
            </div>
          </Group>
        </Group>

        <Card withBorder>
          <Stack gap={8}>
            <Text c="dimmed">Newsletter details</Text>
            <Group gap={10}>
              <Text fw={600} style={{ width: 100 }}>Subject</Text>
              <Text>{nl.subject}</Text>
            </Group>
            <Group gap={10}>
              <Text fw={600} style={{ width: 100 }}>Status</Text>
              <Badge variant="light" color={nl.status === 'Sent' ? 'green' : nl.status === 'Scheduled' ? 'indigo' : 'gray'}>{nl.status}</Badge>
            </Group>
            <Group gap={10}>
              <Text fw={600} style={{ width: 100 }}>Recipients</Text>
              <Text>{nl.recipients}</Text>
            </Group>
            <Group gap={10}>
              <Text fw={600} style={{ width: 100 }}>Sent</Text>
              <Text>{dateStr(nl.sentAt)}</Text>
            </Group>
            {ctx && (
              <Group gap={10}>
                <Text fw={600} style={{ width: 100 }}>Context</Text>
                <Text>{ctx.name} ({ctx.entries.length})</Text>
              </Group>
            )}
          </Stack>
        </Card>

        <Card withBorder>
          <Text c="dimmed" mb="xs">Message</Text>
          <div dangerouslySetInnerHTML={{ __html: nl.body || '<em>No content</em>' }} />
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
