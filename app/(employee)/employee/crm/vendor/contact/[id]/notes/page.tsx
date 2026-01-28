"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Title, Text, Group, Badge, Button, Stack, Tabs, ActionIcon, Avatar, Textarea, Modal, Center, Loader } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { useAuthUser } from '@/lib/firebase/auth';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import type { Note, Contact } from '@/state/crmStore';

export default function VendorContactNotesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db(), 'crm_customers'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: any[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setCustomers(rows);
    });
    return () => unsub();
  }, []);

  const { vendor, contact } = useMemo(() => {
    for (const v of customers) {
      if (v.type !== 'vendor') continue;
      const c = (v.contacts || []).find((x: Contact) => x.id === params.id);
      if (c) return { vendor: v, contact: c };
    }
    return { vendor: null as any, contact: null as any };
  }, [customers, params.id]);

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

  const deriveTitleFromMarkdown = (body: string): string => {
    const text = (body || '').trim();
    if (!text) return 'Note';
    const firstNonEmpty = text.split('\n').find((l) => l.trim().length > 0) || '';
    const cleaned = firstNonEmpty.replace(/^#+\s*/, '').trim();
    return cleaned.slice(0, 60) || 'Note';
  };

  const addNote = async () => {
    if (!vendor || !contact) return;
    const body = noteBody.trim();
    if (!body) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: deriveTitleFromMarkdown(body),
      body,
      createdAt: Date.now(),
      createdByName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Unknown',
      createdByEmail: authUser?.email || undefined,
      createdByPhotoURL: authUser?.photoURL || undefined,
    };
    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, notes: [newNote, ...(c.notes || [])] } : c));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: prune(contacts) } as any);
    setNoteBody('');
    setNoteOpen(false);
  };

  const openEditNote = (id: string) => {
    const note = (contact?.notes || []).find((n: Note) => n.id === id);
    if (!note) return;
    setEditNoteId(id);
    setEditNoteBody(note.body || '');
    setEditNoteOpen(true);
  };

  const saveEditNote = async () => {
    if (!vendor || !contact || !editNoteId) return;
    const body = editNoteBody.trim();
    const title = deriveTitleFromMarkdown(body);
    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, notes: (contact.notes || []).map((n: Note) => (n.id === editNoteId ? { ...n, body, title } : n)) } : c));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: prune(contacts) } as any);
    setEditNoteOpen(false);
  };

  const openDeleteNote = (id: string) => {
    if (!contact) return;
    const note = (contact.notes || []).find((n: Note) => n.id === id);
    if (!note) return;
    const snippet = (note.body || '').trim().slice(0, 10);
    setDeleteNoteId(id);
    setDeleteNoteSnippet(snippet);
    setDeleteNoteInput('');
    setDeleteNoteOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!vendor || !contact || !deleteNoteId) return;
    const required = deleteNoteSnippet;
    if (required.length > 0 && deleteNoteInput !== required) return;
    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, notes: (contact.notes || []).filter((n: Note) => n.id !== deleteNoteId) } : c));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts: prune(contacts) } as any);
    setDeleteNoteOpen(false);
  };

  if (!vendor || !contact) {
    return (
      <EmployerAuthGate>
        <Center mih={240}><Loader size="sm" /></Center>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      {/* Vendor header row */}
      <Group justify="space-between" mb="xs">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(`/employee/crm/vendor/${vendor.id}/contacts`)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={4}>{vendor.name}</Title>
            <Badge color="orange" variant="filled">Vendor</Badge>
          </Group>
        </Group>
      </Group>

      {/* Contact header row */}
      <Group justify="space-between" mb="md" align="flex-end">
        <div>
          <Group gap="xs" align="center">
            <Title order={2} style={{ lineHeight: 1 }}>{contact.name}</Title>
            <Badge color="grape" variant="filled">Contact</Badge>
            {contact.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
          </Group>
        </div>
        <Group gap="xs">
          {(contact.emails?.length || 0) > 0 && <Badge variant="light">{contact.emails!.length} email{contact.emails!.length === 1 ? '' : 's'}</Badge>}
          {(contact.phones?.length || 0) > 0 && <Badge variant="light">{contact.phones!.length} phone{contact.phones!.length === 1 ? '' : 's'}</Badge>}
          {(contact.addresses?.length || 0) > 0 && <Badge variant="light">{contact.addresses!.length} address{contact.addresses!.length === 1 ? '' : 'es'}</Badge>}
        </Group>
      </Group>

      <RouteTabs
        value={"notes"}
        mb="md"
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/crm/vendor/contact/${contact.id}` },
          { value: 'notes', label: 'Notes', href: `/employee/crm/vendor/contact/${contact.id}/notes` },
          { value: 'actions', label: 'Actions', href: `/employee/crm/vendor/contact/${contact.id}/actions` },
        ]}
      />

      <Card withBorder radius="md" padding={0}>
        <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title order={4} m={0} style={{ color: 'inherit' }}>Notes</Title>
          <Button variant="default" onClick={() => setNoteOpen(true)}>Add note</Button>
        </div>
        <div style={{ padding: '12px 16px' }}>
          {Array.isArray(contact.notes) && contact.notes.length > 0 ? (
            <Stack>
              {contact.notes.map((n: Note) => (
                <Card key={n.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group gap={8} align="center">
                        <Avatar size="sm" radius="xl" src={n.createdByPhotoURL} color="grape">
                          {(n.createdByName || 'U').slice(0,1).toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={600}>{n.createdByName || 'Unknown'}</Text>
                        <Text size="xs" c="dimmed">{new Date(n.createdAt).toLocaleString()}</Text>
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{n.body || '—'}</Text>
                    </div>
                    <Group gap={8}>
                      <Button variant="subtle" size="xs" onClick={() => openEditNote(n.id)}>Edit</Button>
                      <Button variant="subtle" size="xs" color="red" onClick={() => openDeleteNote(n.id)}>Delete</Button>
                    </Group>
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
