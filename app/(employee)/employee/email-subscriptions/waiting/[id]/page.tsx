"use client";
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Badge, Button, TextInput, Modal } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc, increment } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import WaitlistHeaderBar from '@/components/waitlists/WaitlistHeaderBar';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';

type Entry = { id: string; email: string; name?: string; createdAt: number };
type DraftEmail = { id: string; subject: string; body: string; updatedAt: number };
type SentEmail = { id: string; subject: string; body: string; sentAt: number; recipients: number };
type Waitlist = { id: string; name: string; archiveAt: number | null; removedAt: number | null };

export default function WaitingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [list, setList] = useState<Waitlist | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  // Drafts and sent tables are rendered via FirestoreDataTable; no local state needed
  const toast = useToast();
  useEffect(() => {
    const ref = doc(db(), 'ep_waitlists', params.id);
    const unsubMain = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setList(null); return; }
      const d = snap.data() as any;
      const archiveAt = typeof d.archiveAt === 'number' ? d.archiveAt : (d?.isArchived ? (d?.updatedAt || d?.createdAt || Date.now()) : null);
      const removedAt = typeof d.removedAt === 'number' ? d.removedAt : (typeof d.deletedAt === 'number' ? d.deletedAt : null);
      setList({ id: snap.id, name: d.name || '', archiveAt: archiveAt ?? null, removedAt: removedAt ?? null });
    });
    const unsubEntries = onSnapshot(collection(db(), 'ep_waitlists', params.id, 'entries'), (snap) => {
      const rows: Entry[] = [];
      snap.forEach((d) => { const x = d.data() as any; rows.push({ id: d.id, email: x.email || '', name: x.name || undefined, createdAt: Number(x.createdAt || Date.now()) }); });
      // Latest first
      rows.sort((a, b) => (b.createdAt - a.createdAt));
      setEntries(rows);
    });
    return () => { unsubMain(); unsubEntries(); };
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
        <WaitlistHeaderBar
          listId={list.id}
          name={list.name}
          current="sent"
          onAdd={() => { setError(null); setAddOpen(true); }}
          onSend={() => router.push(`/employee/email-subscriptions/waiting/${list.id}/send`)}
          archiveAt={list.archiveAt}
          removedAt={list.removedAt}
        />

        <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add to waiting list" centered>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const addr = email.trim().toLowerCase();
            if (!addr || !/.+@.+\..+/.test(addr)) { setError('Invalid email'); return; }
            const exists = entries.some((x) => x.email === addr);
            if (exists) { setError('Already in waiting list'); return; }
            try {
              await addDoc(collection(db(), 'ep_waitlists', list.id, 'entries'), { email: addr, name: name.trim() || undefined, createdAt: Date.now() });
              await updateDoc(doc(db(), 'ep_waitlists', list.id), { entriesCount: increment(1) });
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
        

        <Card withBorder>
          {(() => {
            const columns: Column<SentEmail>[] = [
              { key: 'subject', header: 'Subject', render: (r) => (r.subject || '(No subject)') },
              { key: 'recipients', header: 'Recipients', render: (r) => r.recipients },
              { key: 'sentAt', header: 'Sent', render: (r) => new Date(r.sentAt).toLocaleString() },
              { key: 'actions', header: '', width: 1, render: (_r) => null },
            ];
            return (
              <FirestoreDataTable
                collectionPath={`ep_waitlists/${list.id}/sent`}
                columns={columns}
                initialSort={{ field: 'sentAt', direction: 'desc' }}
                defaultPageSize={25}
                enableSelection={false}
              />
            );
          })()}
        </Card>

        {null}
      </Stack>
    </EmployerAuthGate>
  );
}
