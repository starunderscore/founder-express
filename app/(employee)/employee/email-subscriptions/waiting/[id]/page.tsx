"use client";
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Badge, Button, Table, TextInput, Modal, Tabs, ActionIcon } from '@mantine/core';

export default function WaitingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const waitlists = useSubscriptionsStore((s) => s.waitlists);
  const addToWaitlist = useSubscriptionsStore((s) => s.addToWaitlist);
  const removeEntry = useSubscriptionsStore((s) => s.removeWaitingEntry);
  const removeWaitlist = useSubscriptionsStore((s) => s.removeWaitlist);

  const list = useMemo(() => waitlists.find((b) => b.id === params.id) || null, [waitlists, params.id]);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  if (!list) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Waiting list not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/email-subscriptions/waiting')}>Back to list</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" mb="md">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions/waiting')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>{list.name}</Title>
              <Text c="dimmed">Waiting List</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={() => { setError(null); setAddOpen(true); }}>Add to waiting list</Button>
            <Button onClick={() => router.push(`/employee/email-subscriptions/waiting/${list.id}/send`)}>Send email</Button>
          </Group>
        </Group>

        <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add to waiting list" centered>
          <form onSubmit={(e) => { e.preventDefault(); const res = addToWaitlist(list.id, email, name); if (!res.ok) { setError(res.reason || 'Failed to add'); return; } setError(null); setEmail(''); setName(''); setAddOpen(false); }}>
            <Stack>
              <TextInput label="Email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required type="email" autoFocus />
              <TextInput label="Name" placeholder="Optional" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              {error && <Text c="red" size="sm">{error}</Text>}
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setAddOpen(false)} type="button">Cancel</Button>
                <Button type="submit">Add</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
        

        <Card withBorder style={{ minHeight: '50vh' }}>
          <Tabs defaultValue="sent">
            <Tabs.List>
              <Tabs.Tab value="sent">Emails sent</Tabs.Tab>
              <Tabs.Tab value="drafts">Email drafts <Badge ml={6} size="xs" variant="light">{(list.drafts?.length || 0)}</Badge></Tabs.Tab>
              <Tabs.Tab value="list">Email list <Badge ml={6} size="xs" variant="light">{list.entries.length}</Badge></Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="sent" pt="md">
              {(!list.sent || list.sent.length === 0) ? (
                <Text c="dimmed">No emails sent yet</Text>
              ) : (
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Subject</Table.Th>
                      <Table.Th>Recipients</Table.Th>
                      <Table.Th>Sent</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {list.sent!.map((e) => (
                      <Table.Tr key={e.id}>
                        <Table.Td>{e.subject}</Table.Td>
                        <Table.Td>{e.recipients}</Table.Td>
                        <Table.Td>{new Date(e.sentAt).toLocaleString()}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="drafts" pt="md">
              {(!list.drafts || list.drafts.length === 0) ? (
                <Text c="dimmed">No drafts yet</Text>
              ) : (
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Subject</Table.Th>
                      <Table.Th>Updated</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {list.drafts!.map((d) => (
                      <Table.Tr key={d.id}>
                        <Table.Td>{d.subject || '(Untitled draft)'}</Table.Td>
                        <Table.Td>{new Date(d.updatedAt).toLocaleString()}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="list" pt="md">
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Added</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {list.entries.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>{s.email}</Table.Td>
                      <Table.Td>{s.name || '—'}</Table.Td>
                      <Table.Td>{new Date(s.createdAt).toLocaleString()}</Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Button size="xs" variant="subtle" color="red" onClick={() => removeEntry(list.id, s.id)}>Remove</Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {list.entries.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={4}><Text c="dimmed">No entries yet</Text></Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>
          </Tabs>
        </Card>

        <Title order={4} c="red">Danger Zone</Title>
        <Card withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={600}>Delete waiting list</Text>
              <Text c="dimmed" size="sm">Deleting this waiting list removes all emails within it. This action cannot be undone.</Text>
            </div>
            <Button color="red" onClick={() => { removeWaitlist(list.id); router.push('/employee/email-subscriptions/waiting'); }}>Delete waiting list</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
