"use client";
import { useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, Badge, Tabs, Anchor, Modal } from '@mantine/core';
import Link from 'next/link';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';

export default function WaitingListsPage() {
  const waitlists = useSubscriptionsStore((s) => s.waitlists);
  const newsletters = useSubscriptionsStore((s) => s.newsletters);
  const addWaitlist = useSubscriptionsStore((s) => s.addWaitlist);
  const removeWaitlist = useSubscriptionsStore((s) => s.removeWaitlist);

  const [listName, setListName] = useState('');
  const [wError, setWError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const wCount = waitlists.length;
  const nlCount = newsletters.length;

  const onAddWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addWaitlist(listName);
    if (!res.ok) { setWError(res.reason || 'Failed to add'); return; }
    setWError(null); setListName(''); setCreateOpen(false);
  };

  const dateStr = (ts: number) => new Date(ts).toLocaleString();

  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Email subscriptions</Title>
          <Text c="dimmed">Manage waiting lists and newsletter subscribers.</Text>
        </div>

        <Tabs value={"waiting"}>
          <Tabs.List>
            <Tabs.Tab value="newsletters" component={Link as any} href={"/employee/email-subscriptions/newsletters" as any}>Newsletters</Tabs.Tab>
            <Tabs.Tab value="waiting" component={Link as any} href={"/employee/email-subscriptions/waiting" as any}>Waiting Lists</Tabs.Tab>
            <Tabs.Tab value="archive" component={Link as any} href={"/employee/email-subscriptions/archive" as any}>Archive</Tabs.Tab>
            <Tabs.Tab value="removed" component={Link as any} href={"/employee/email-subscriptions/removed" as any}>Removed</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="waiting" pt="md">
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
                        <Badge variant="light" color="indigo">{b.entries.length} emails</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">Created {dateStr(b.createdAt)}</Text>
                      <Group justify="flex-end" mt="xs">
                        <Button size="xs" variant="light" component={Link as any} href={`/employee/email-subscriptions/waiting/${b.id}`}>View</Button>
                        <Button size="xs" variant="subtle" color="red" onClick={() => removeWaitlist(b.id)}>Remove</Button>
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
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAuthGate>
  );
}
