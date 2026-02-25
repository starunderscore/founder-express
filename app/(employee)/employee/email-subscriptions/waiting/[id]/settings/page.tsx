"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Card, Stack, Group, Title, Text, Button } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import WaitlistHeaderBar from '@/components/waitlists/WaitlistHeaderBar';
import { useToast } from '@/components/ToastProvider';

type Waitlist = { id: string; name: string; archiveAt: number | null; removedAt: number | null };

export default function WaitingSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState<Waitlist | null>(null);

  useEffect(() => {
    const ref = doc(db(), 'ep_waitlists', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setList(null); return; }
      const d = snap.data() as any;
      const archiveAt = typeof d.archiveAt === 'number' ? d.archiveAt : (d?.isArchived ? (d?.updatedAt || d?.createdAt || Date.now()) : null);
      const removedAt = typeof d.removedAt === 'number' ? d.removedAt : (typeof d.deletedAt === 'number' ? d.deletedAt : null);
      setList({ id: snap.id, name: d.name || '', archiveAt: archiveAt ?? null, removedAt: removedAt ?? null });
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
        <WaitlistHeaderBar listId={list.id} name={list.name} current="settings" archiveAt={list.archiveAt} removedAt={list.removedAt} />

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
                await updateDoc(doc(db(), 'ep_waitlists', list.id), { removedAt: Date.now() });
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
