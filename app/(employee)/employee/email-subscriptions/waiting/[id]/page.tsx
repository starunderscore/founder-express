"use client";
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Badge, Button, Table, TextInput, Modal, Tabs, ActionIcon } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc, increment } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';

type Entry = { id: string; email: string; name?: string; createdAt: number };
type DraftEmail = { id: string; subject: string; body: string; updatedAt: number };
type SentEmail = { id: string; subject: string; body: string; sentAt: number; recipients: number };
type Waitlist = { id: string; name: string };

export default function WaitingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [list, setList] = useState<Waitlist | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [drafts, setDrafts] = useState<DraftEmail[]>([]);
  const [sent, setSent] = useState<SentEmail[]>([]);
  const toast = useToast();
  useEffect(() => {
    const ref = doc(db(), 'waitlists', params.id);
    const unsubMain = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setList(null); return; }
      const d = snap.data() as any;
      setList({ id: snap.id, name: d.name || '' });
    });
    const unsubEntries = onSnapshot(collection(db(), 'waitlists', params.id, 'entries'), (snap) => {
      const rows: Entry[] = [];
      snap.forEach((d) => { const x = d.data() as any; rows.push({ id: d.id, email: x.email || '', name: x.name || undefined, createdAt: Number(x.createdAt || Date.now()) }); });
      // Latest first
      rows.sort((a, b) => (b.createdAt - a.createdAt));
      setEntries(rows);
    });
    const unsubDrafts = onSnapshot(collection(db(), 'waitlists', params.id, 'drafts'), (snap) => {
      const rows: DraftEmail[] = [];
      snap.forEach((d) => { const x = d.data() as any; rows.push({ id: d.id, subject: x.subject || '', body: x.body || '', updatedAt: Number(x.updatedAt || Date.now()) }); });
      rows.sort((a, b) => (b.updatedAt - a.updatedAt));
      setDrafts(rows);
    });
    const unsubSent = onSnapshot(collection(db(), 'waitlists', params.id, 'sent'), (snap) => {
      const rows: SentEmail[] = [];
      snap.forEach((d) => { const x = d.data() as any; rows.push({ id: d.id, subject: x.subject || '', body: x.body || '', sentAt: Number(x.sentAt || Date.now()), recipients: Number(x.recipients || 0) }); });
      rows.sort((a, b) => (b.sentAt - a.sentAt));
      setSent(rows);
    });
    return () => { unsubMain(); unsubEntries(); unsubDrafts(); unsubSent(); };
  }, [params.id]);

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
            <Group gap="xs" align="center">
              <IconClockHour4 size={20} />
              <div>
                <Title order={2}>{list.name}</Title>
                <Group gap={8} mt={4} align="center">
                  <Text c="dimmed">Waiting List</Text>
                  <Badge variant="light" color="indigo">{entries.length} emails</Badge>
                  <Badge variant="light" color="gray">drafts {drafts.length}</Badge>
                  <Badge variant="light" color="green">sent {sent.length}</Badge>
                </Group>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={() => { setError(null); setAddOpen(true); }}>Add to waiting list</Button>
            <Button onClick={() => router.push(`/employee/email-subscriptions/waiting/${list.id}/send`)}>Send email</Button>
          </Group>
        </Group>

        <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add to waiting list" centered>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const addr = email.trim().toLowerCase();
            if (!addr || !/.+@.+\..+/.test(addr)) { setError('Invalid email'); return; }
            const exists = entries.some((x) => x.email === addr);
            if (exists) { setError('Already in waiting list'); return; }
            try {
              await addDoc(collection(db(), 'waitlists', list.id, 'entries'), { email: addr, name: name.trim() || undefined, createdAt: Date.now() });
              await updateDoc(doc(db(), 'waitlists', list.id), { entriesCount: increment(1) });
              toast.show({ title: 'Added', message: 'Entry added to waiting list.' });
              setError(null); setEmail(''); setName(''); setAddOpen(false);
            } catch (err: any) {
              setError(err?.message || 'Failed to add');
            }
          }}>
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
              <Tabs.Tab value="drafts">Email drafts <Badge ml={6} size="xs" variant="light">{drafts.length}</Badge></Tabs.Tab>
              <Tabs.Tab value="list">Email list <Badge ml={6} size="xs" variant="light">{entries.length}</Badge></Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="sent" pt="md">
              {(sent.length === 0) ? (
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
                    {sent.map((e) => (
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
              {(drafts.length === 0) ? (
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
                    {drafts.map((d) => (
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
                  {entries.map((s) => (
                      <Table.Tr key={s.id}>
                      <Table.Td>{s.email}</Table.Td>
                      <Table.Td>{s.name || '—'}</Table.Td>
                      <Table.Td>{new Date(s.createdAt).toLocaleString()}</Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Button size="xs" variant="subtle" color="red" onClick={async () => { await deleteDoc(doc(db(), 'waitlists', list.id, 'entries', s.id)); await updateDoc(doc(db(), 'waitlists', list.id), { entriesCount: increment(-1) }); toast.show({ title: 'Removed', message: 'Entry removed.' }); }}>Remove</Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {entries.length === 0 && (
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
            <Button color="red" onClick={async () => { await updateDoc(doc(db(), 'waitlists', list.id), { deletedAt: Date.now() }); toast.show({ title: 'Deleted', message: 'Waiting list removed.' }); router.push('/employee/email-subscriptions/waiting'); }}>Delete waiting list</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
