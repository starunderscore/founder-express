"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Card, Stack, Tabs, Group, Title, Text, Button } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import WaitlistHeader from '@/components/waitlists/WaitlistHeader';
import { useToast } from '@/components/ToastProvider';

type Waitlist = { id: string; name: string };

export default function WaitingSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState<Waitlist | null>(null);

  useEffect(() => {
    const ref = doc(db(), 'ep_waitlists', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setList(null); return; }
      const d = snap.data() as any;
      setList({ id: snap.id, name: d.name || '' });
    });
    return () => unsub();
  }, [params.id]);

  if (!list) {
    return (
      <EmployerAuthGate>
        <Stack>
          <WaitlistHeader listId={params.id} name={'Waiting list'} />
          <Card withBorder>Waiting list not found</Card>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Stack>
        <WaitlistHeader listId={list.id} name={list.name} />

        <Tabs value={'settings'}>
          <Tabs.List>
            <Tabs.Tab value="sent"><Link href={`/employee/email-subscriptions/waiting/${list.id}`}>Emails sent</Link></Tabs.Tab>
            <Tabs.Tab value="drafts"><Link href={`/employee/email-subscriptions/waiting/${list.id}/drafts`}>Email drafts</Link></Tabs.Tab>
            <Tabs.Tab value="form"><Link href={`/employee/email-subscriptions/waiting/${list.id}/form`}>Copy & paste form</Link></Tabs.Tab>
            <Tabs.Tab value="settings"><Link href={`/employee/email-subscriptions/waiting/${list.id}/settings`}>List settings</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Title order={4} c="red">Danger Zone</Title>
        <Card withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={600}>Delete waiting list</Text>
              <Text c="dimmed" size="sm">Deleting this waiting list removes all emails within it. This action cannot be undone.</Text>
            </div>
            <Button
              color="red"
              onClick={async () => {
                await updateDoc(doc(db(), 'ep_waitlists', list.id), { deletedAt: Date.now() });
                toast.show({ title: 'Deleted', message: 'Waiting list removed.' });
                router.push('/employee/email-subscriptions/waiting');
              }}
            >
              Delete waiting list
            </Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

