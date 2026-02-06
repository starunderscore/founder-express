"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, TextInput, Badge, Modal, ActionIcon, Anchor } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { RichEmailEditor } from '@/components/RichEmailEditor';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, query, updateDoc, addDoc, increment } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';

type Entry = { id: string; email: string; name?: string; createdAt: number };
type Waitlist = { id: string; name: string; entriesCount?: number; deletedAt?: number };

export default function SendEmailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lists, setLists] = useState<Waitlist[]>([]);
  const [recipients, setRecipients] = useState<Entry[]>([]);
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(params.id);
  const list = useMemo(() => lists.find((b) => b.id === selectedId) || null, [lists, selectedId]);
  useEffect(() => {
    const qW = query(collection(db(), 'waitlists'));
    const unsub = onSnapshot(qW, (snap) => {
      const rows: Waitlist[] = [];
      snap.forEach((d) => { const data = d.data() as any; rows.push({ id: d.id, name: data.name || '', entriesCount: Number(data.entriesCount || 0) }); });
      setLists(rows.filter((x) => !x.deletedAt));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const unsub = onSnapshot(collection(db(), 'waitlists', selectedId, 'entries'), (snap) => {
      const rows: Entry[] = [];
      snap.forEach((d) => { const x = d.data() as any; rows.push({ id: d.id, email: x.email || '', name: x.name || undefined, createdAt: Number(x.createdAt || Date.now()) }); });
      setRecipients(rows);
    });
    return () => unsub();
  }, [selectedId]);

  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [chooseOpen, setChooseOpen] = useState(false);

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

  const sample = recipients[0] || null;
  const personalize = (text: string) => {
    const name = sample?.name || 'there';
    return text.replaceAll('{{name}}', name);
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !html.trim()) { setError('Subject and message required'); return; }
    await addDoc(collection(db(), 'waitlists', list.id, 'sent'), { subject: subject.trim(), body: html, sentAt: Date.now(), recipients: recipients.length });
    await updateDoc(doc(db(), 'waitlists', list.id), { sentCount: increment(1) });
    toast.show({ title: 'Sent', message: `Newsletter queued to ${recipients.length} recipients.` });
    router.push(`/employee/email-subscriptions/waiting/${list.id}`);
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(`/employee/email-subscriptions/waiting/${list.id}`)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconMail size={20} />
              <div>
                <Title order={2}>Send email</Title>
                <Group gap={8} mt={4}>
                  <Text c="dimmed">To: <Anchor component="button" underline="always" onClick={() => setChooseOpen(true)}>{list.name}</Anchor></Text>
                  <Badge variant="light">{recipients.length} recipients</Badge>
                </Group>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={async () => { await addDoc(collection(db(), 'waitlists', list.id, 'drafts'), { subject: subject.trim(), body: html, updatedAt: Date.now() }); await updateDoc(doc(db(), 'waitlists', list.id), { draftsCount: increment(1) }); toast.show({ title: 'Saved', message: 'Draft saved.' }); }}>Save draft</Button>
            <Button variant="light" onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button onClick={onSend}>Send</Button>
          </Group>
        </Group>

        <Card withBorder>
          <form onSubmit={onSend}>
            <Stack>
              <TextInput label="Subject" placeholder="e.g. Welcome to the beta" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} required autoFocus />
              <Card withBorder>
                <Stack gap={8}>
                  <RichEmailEditor placeholder="Write your message. Use {{name}} to personalize." onChangeHTML={setHtml} />
                </Stack>
              </Card>
              <Text size="sm" c="dimmed">Tip: Use {'{{name}}'} to personalize with each recipient's name.</Text>
              {error && <Text c="red" size="sm">{error}</Text>}
            </Stack>
          </form>
        </Card>

        <Modal opened={chooseOpen} onClose={() => setChooseOpen(false)} title="Select waiting list" centered>
          <Stack>
            {lists.length === 0 && <Text c="dimmed">No waiting lists available.</Text>}
            {lists.map((wl) => (
              <Card withBorder key={wl.id}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={600}>{wl.name}</Text>
                    <Text size="sm" c="dimmed">{Number(wl.entriesCount || 0)} recipients</Text>
                  </div>
                  <Button onClick={() => { setSelectedId(wl.id); setChooseOpen(false); router.replace(`/employee/email-subscriptions/waiting/${wl.id}/send`); }}>Select</Button>
                </Group>
              </Card>
            ))}
          </Stack>
        </Modal>

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview" size="lg" centered>
          <Stack>
            {sample ? (
              <>
                <Text size="sm" c="dimmed">Example recipient: {sample.name || sample.email}</Text>
                <Text><Text span fw={600}>Subject:</Text> {personalize(subject || '(no subject)')}</Text>
                <Card withBorder>
                  <div dangerouslySetInnerHTML={{ __html: personalize(html || '') }} />
                </Card>
              </>
            ) : (
              <Text c="dimmed">No recipients yet. Add entries to this waiting list to preview.</Text>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setPreviewOpen(false)}>Close</Button>
              <Button onClick={onSend}>Send</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
