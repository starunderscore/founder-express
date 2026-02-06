"use client";
import { useEffect, useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Badge, Tabs, Anchor, Button, ActionIcon } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';
import Link from 'next/link';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

type Waitlist = { id: string; name: string; deletedAt?: number; isArchived?: boolean };

export default function WaitingListsArchivePage() {
  const router = useRouter();
  const [archived, setArchived] = useState<Waitlist[]>([]);
  useEffect(() => {
    const qW = query(collection(db(), 'waitlists'));
    const unsub = onSnapshot(qW, (snap) => {
      const arr: Waitlist[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (!!data.isArchived && typeof data.deletedAt !== 'number') arr.push({ id: d.id, name: data.name || '' });
      });
      setArchived(arr);
    });
    return () => unsub();
  }, []);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconClockHour4 size={20} />
              <div>
                <Title order={2} mb={4}>Waiting Lists</Title>
                <Text c="dimmed">Manage waiting lists and subscribers.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/email-subscriptions/waiting">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/email-subscriptions/waiting/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/email-subscriptions/waiting/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          {archived.length > 0 ? (
            <Stack>
              {archived.map((b) => (
                <Card key={b.id} withBorder>
                  <Group justify="space-between" align="center">
                    <div>
                      <Anchor component={Link as any} href={`/employee/email-subscriptions/waiting/${b.id}`} underline="hover">
                        <Text fw={600}>{b.name}</Text>
                      </Anchor>
                      <Badge ml={6} size="xs" variant="light" color="gray">archived</Badge>
                    </div>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={async () => { await updateDoc(doc(db(), 'waitlists', b.id), { isArchived: false }); }}>Restore</Button>
                      <Button size="xs" variant="subtle" color="red" onClick={async () => { await updateDoc(doc(db(), 'waitlists', b.id), { deletedAt: Date.now() }); }}>Remove</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed">No archived waiting lists</Text>
          )}
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
