"use client";
import { useMemo, useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, Table, Badge, Tabs, Anchor, SimpleGrid, Modal } from '@mantine/core';
import Link from 'next/link';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';

export default function EmployerEmailSubscriptionsPage() {
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
          </div>

          
        
      </Stack>
    </EmployerAuthGate>
  );
}
