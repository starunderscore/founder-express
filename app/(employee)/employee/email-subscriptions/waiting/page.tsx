"use client";
import { useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, Badge, Tabs, Anchor, Modal } from '@mantine/core';
import Link from 'next/link';
import { RouteTabs } from '@/components/RouteTabs';
import { useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ToastProvider';

type Waitlist = { id: string; name: string; createdAt: number; deletedAt?: number; isArchived?: boolean; entriesCount?: number; draftsCount?: number; sentCount?: number };

export default function WaitingListsPage() {
  const [waitlists, setWaitlists] = useState<Waitlist[]>([]);
  const toast = useToast();
  useEffect(() => {
    const qW = query(collection(db(), 'waitlists'));
    const unsub = onSnapshot(qW, (snap) => {
      const rows: Waitlist[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({
          id: d.id,
          name: data.name || '',
          createdAt: Number(data.createdAt || Date.now()),
          deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined,
          isArchived: !!data.isArchived,
          entriesCount: Number(data.entriesCount || 0),
          draftsCount: Number(data.draftsCount || 0),
          sentCount: Number(data.sentCount || 0),
        });
      });
      setWaitlists(rows);
    });
    return () => unsub();
  }, []);

  const [listName, setListName] = useState('');
  const [wError, setWError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const onAddWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    const nm = (listName || '').trim();
    if (!nm) { setWError('Waiting list name required'); return; }
    (async () => {
      await addDoc(collection(db(), 'waitlists'), { name: nm, createdAt: Date.now(), entriesCount: 0, draftsCount: 0, sentCount: 0 });
      toast.show({ title: 'Created', message: 'Waiting list created.' });
      setWError(null); setListName(''); setCreateOpen(false);
    })();
  };

  const dateStr = (ts: number) => new Date(ts).toLocaleString();

  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Email subscriptions</Title>
          <Text c="dimmed">Manage waiting lists and newsletter subscribers.</Text>
        </div>

        <RouteTabs
          value={"waiting"}
          tabs={[
            { value: 'newsletters', label: 'Newsletters', href: '/employee/email-subscriptions/newsletters' },
            { value: 'waiting', label: 'Waiting Lists', href: '/employee/email-subscriptions/waiting' },
            { value: 'archive', label: 'Archive', href: '/employee/email-subscriptions/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/email-subscriptions/removed' },
          ]}
        />

        <div style={{ paddingTop: 'var(--mantine-spacing-md)' }}>
            <Group justify="flex-end" mb="md">
              <Button onClick={() => { setCreateOpen(true); setWError(null); }}>Create waiting list</Button>
            </Group>

            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Create waiting list" centered>
              <form onSubmit={onAddWaitlist}>
                <Stack>
                  <TextInput label="Waiting list name" placeholder="e.g. Fall Launch Waiting List" value={listName} onChange={(e) => setListName(e.currentTarget.value)} required autoFocus />
                  {wError && <Text c="red" size="sm">{wError}</Text>}
                  <Group justify="flex-end" mt="xs">
                    <Button variant="default" onClick={() => setCreateOpen(false)} type="button">Cancel</Button>
                    <Button type="submit">Create</Button>
                  </Group>
                </Stack>
              </form>
            </Modal>

            {waitlists.filter((w:any)=>!w?.deletedAt).length > 0 ? (
              <Stack>
                {waitlists.filter((w:any)=>!w?.deletedAt).map((b) => (
                  <Card key={b.id} withBorder>
                    <Stack gap={6} style={{ cursor: 'default' }}>
                      <Group justify="space-between">
                        <Anchor component={Link as any} href={`/employee/email-subscriptions/waiting/${b.id}`} underline="hover">
                          <Text fw={600}>{b.name}</Text>
                        </Anchor>
                        <Group gap={6}>
                          <Badge variant="light" color="indigo">{Number(b.entriesCount || 0)} emails</Badge>
                          <Badge variant="light" color="gray">drafts {Number(b.draftsCount || 0)}</Badge>
                          <Badge variant="light" color="green">sent {Number(b.sentCount || 0)}</Badge>
                        </Group>
                      </Group>
                      <Text size="xs" c="dimmed">Created {dateStr(b.createdAt)}</Text>
                      <Group justify="flex-end" mt="xs">
                        <Button size="xs" variant="light" component={Link as any} href={`/employee/email-subscriptions/waiting/${b.id}`}>View</Button>
                        <Button size="xs" variant="subtle" color="red" onClick={async () => { await updateDoc(doc(db(), 'waitlists', b.id), { deletedAt: Date.now() }); toast.show({ title: 'Removed', message: 'Waiting list moved to Removed.' }); }}>Remove</Button>
                      </Group>
                  </Stack>
                </Card>
              ))}
              </Stack>
            ) : (
              <Card withBorder>
                <Text c="dimmed">No waiting lists yet</Text>
              </Card>
            )}
          </div>
      </Stack>
    </EmployerAuthGate>
  );
}
