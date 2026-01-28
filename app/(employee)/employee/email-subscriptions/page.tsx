"use client";
import { useEffect, useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, Table, Badge, Tabs, Anchor, SimpleGrid, Modal } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import Link from 'next/link';
import { collection, addDoc, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ToastProvider';

type Waitlist = { id: string; name: string; createdAt: number; entriesCount?: number; draftsCount?: number; sentCount?: number; deletedAt?: number };

export default function EmployerEmailSubscriptionsPage() {
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
          entriesCount: Number(data.entriesCount || 0),
          draftsCount: Number(data.draftsCount || 0),
          sentCount: Number(data.sentCount || 0),
          deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined,
        });
      });
      setWaitlists(rows.filter((w) => !w.deletedAt));
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

  const CodeSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.example';
    const action = `${origin}/api/newsletter/subscribe`;
    const snippet = `<!-- Newsletter signup form -->\n<form action="${action}" method="POST">\n  <label>\n    Email\n    <input type="email" name="email" required />\n  </label>\n  <label>\n    Name (optional)\n    <input type="text" name="name" />\n  </label>\n  <!-- Optional: categorize where this submission came from -->\n  <input type="hidden" name="list" value="newsletter" />\n  <button type="submit">Subscribe</button>\n</form>`;
    const copy = async () => {
      try { await navigator.clipboard.writeText(snippet); } catch {}
    };
    return (
      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Text fw={600}>HTML form</Text>
          <Button size="xs" variant="light" onClick={copy}>Copy</Button>
        </Group>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{snippet}</pre>
      </Card>
    );
  };

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

            {waitlists.length > 0 ? (
              <Stack>
                {waitlists.map((b) => (
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
