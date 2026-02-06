"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Badge, ActionIcon } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';

type Newsletter = { id: string; subject: string; status: 'Draft'|'Scheduled'|'Sent'; recipients: number; sentAt?: number; body?: string };

export default function NewsletterDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [nl, setNl] = useState<Newsletter | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'newsletters', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setNl(null); return; }
      const d = snap.data() as any;
      setNl({ id: snap.id, subject: d.subject || '', status: d.status || 'Draft', recipients: Number(d.recipients || 0), sentAt: typeof d.sentAt === 'number' ? d.sentAt : undefined, body: d.body || '' });
    });
    return () => unsub();
  }, [params.id]);

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
            <Group gap="xs" align="center">
              <IconMail size={20} />
              <div>
                <Title order={2}>{nl.subject}</Title>
                <Text c="dimmed" mt={4}>Newsletter</Text>
              </div>
            </Group>
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
            {/* Context removed in Firebase version */}
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
