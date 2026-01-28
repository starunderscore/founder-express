"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Title, Text, Group, Badge, Button, Stack, Modal, Textarea, ActionIcon, Menu, Avatar, Tabs } from '@mantine/core';
import { useAuthUser } from '@/lib/firebase/auth';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

export default function CustomerNotesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(ref, (snap) => setCustomer(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null));
    return () => unsub();
  }, [params.id]);
  const authUser = useAuthUser();
  const toast = useToast();

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [editNoteBody, setEditNoteBody] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteNoteSnippet, setDeleteNoteSnippet] = useState('');
  const [deleteNoteInput, setDeleteNoteInput] = useState('');

  const prune = (val: any): any => {
    if (Array.isArray(val)) return val.map(prune);
    if (val && typeof val === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(val)) {
        const pv = prune(v);
        if (pv !== undefined) out[k] = pv;
      }
      return out;
    }
    return val === undefined ? undefined : val;
  };

  const addNote = async () => {
    if (!customer) return;
    const body = noteBody.trim();
    if (!body) return;
    const newNote = {
      id: `note-${Date.now()}`,
      title: deriveTitleFromMarkdown(body),
      body,
      createdAt: Date.now(),
      createdByName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Unknown',
      createdByEmail: authUser?.email || undefined,
      createdByPhotoURL: authUser?.photoURL || undefined,
    };
    const notes = Array.isArray(customer.notes) ? [newNote, ...customer.notes] : [newNote];
    await updateDoc(doc(db(), 'crm_customers', customer.id), { notes: prune(notes) });
    setNoteBody('');
    setNoteOpen(false);
  };

  const openEditNote = (id: string) => {
    const note = (customer?.notes || []).find((n: any) => n.id === id);
    if (!note) return;
    setEditNoteId(id);
    setEditNoteBody(note.body || '');
    setEditNoteOpen(true);
  };

  const saveEditNote = async () => {
    if (!customer || !editNoteId) return;
    const body = editNoteBody.trim();
    const title = deriveTitleFromMarkdown(body);
    const notes = (customer.notes || []).map((n: any) => (n.id === editNoteId ? { ...n, body, title } : n));
    await updateDoc(doc(db(), 'crm_customers', customer.id), { notes: prune(notes) });
    setEditNoteOpen(false);
  };

  const openDeleteNote = (id: string) => {
    if (!customer) return;
    const note = (customer.notes || []).find((n: any) => n.id === id);
    if (!note) return;
    const snippet = (note.body || '').trim().slice(0, 10);
    setDeleteNoteId(id);
    setDeleteNoteSnippet(snippet);
    setDeleteNoteInput('');
    setDeleteNoteOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!customer || !deleteNoteId) return;
    const required = deleteNoteSnippet;
    if (required.length > 0 && deleteNoteInput !== required) return;
    const notes = (customer.notes || []).filter((n: any) => n.id !== deleteNoteId);
    await updateDoc(doc(db(), 'crm_customers', customer.id), { notes: prune(notes) });
    setDeleteNoteOpen(false);
  };

  if (!customer) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Customer not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/crm')}>Back to CRM</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(`/employee/crm/customer/${customer.id}`)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={2}>{customer.name}</Title>
            <Badge color="blue" variant="filled">Customer</Badge>
          </Group>
        </Group>
      </Group>

      <RouteTabs
        value={"notes"}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/crm/customer/${customer.id}` },
          { value: 'notes', label: 'Notes', href: `/employee/crm/customer/${customer.id}/notes` },
          { value: 'actions', label: 'Actions', href: `/employee/crm/customer/${customer.id}/actions` },
        ]}
      />

      <Card withBorder radius="md" padding={0}>
        <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title order={4} m={0} style={{ color: 'inherit' }}>Notes</Title>
          <Button variant="default" onClick={() => setNoteOpen(true)}>Add note</Button>
        </div>
        <div style={{ padding: '12px 16px' }}>
          {Array.isArray(customer.notes) && customer.notes.length > 0 ? (
            <Stack>
              {customer.notes.map((n: any) => (
                <Card key={n.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group gap={8} align="center">
                        <Avatar size="sm" radius="xl" src={n.createdByPhotoURL} color="indigo">
                          {(n.createdByName || 'U').slice(0,1).toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={600}>{n.createdByName || 'Unknown'}</Text>
                        <Text size="xs" c="dimmed">{new Date(n.createdAt).toLocaleString()}</Text>
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{n.body || '—'}</Text>
                    </div>
                    {n.createdByEmail && authUser?.email === n.createdByEmail && (
                      <Menu withinPortal position="bottom-end" shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Note actions">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="5" r="2" fill="currentColor"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                              <circle cx="12" cy="19" r="2" fill="currentColor"/>
                            </svg>
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => openEditNote(n.id)}>Edit</Menu.Item>
                          <Menu.Item color="red" onClick={() => openDeleteNote(n.id)}>Delete</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed">No notes</Text>
          )}
        </div>
      </Card>

      {/* Edit note modal */}
      <Modal opened={editNoteOpen} onClose={() => setEditNoteOpen(false)} title="Edit note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={10} value={editNoteBody} onChange={(e) => setEditNoteBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button onClick={saveEditNote}>Save changes</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add note modal */}
      <Modal opened={noteOpen} onClose={() => setNoteOpen(false)} title="Add note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={10} value={noteBody} onChange={(e) => setNoteBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button onClick={addNote}>Add note</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete note modal */}
      <Modal opened={deleteNoteOpen} onClose={() => setDeleteNoteOpen(false)} title="Delete note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Text c="dimmed">Type the first 10 characters of the note to confirm deletion.</Text>
          <Text size="sm">Required: <Badge variant="light">{deleteNoteSnippet || '—'}</Badge></Text>
          <Textarea label="Confirm" placeholder="Type here to confirm" value={deleteNoteInput} onChange={(e) => setDeleteNoteInput(e.currentTarget.value)} minRows={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteNoteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deleteNoteSnippet.length > 0 && deleteNoteInput !== deleteNoteSnippet} onClick={confirmDeleteNote}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}

const deriveTitleFromMarkdown = (body: string): string => {
  const text = (body || '').trim();
  if (!text) return 'Note';
  const firstNonEmpty = text.split('\n').find((l) => l.trim().length > 0) || '';
  const cleaned = firstNonEmpty.replace(/^#+\s*/, '').trim();
  return cleaned.slice(0, 60) || 'Note';
};
import { RouteTabs } from '@/components/RouteTabs';
