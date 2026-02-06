"use client";
import { useEffect, useMemo, useState } from 'react';
import { Modal, Stack, Tabs, Group, Button, TextInput, Select, TagsInput, Title, Card, Badge, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { useAuthUser } from '@/lib/firebase/auth';

type EmailItem = { id: string; email: string; label?: string; kind?: 'Work' | 'Personal' };
type PhoneItem = { id: string; number: string; ext?: string; label?: string; kind?: 'Work' | 'Personal' };
type AddressItem = { id: string; label?: string; line1: string; line2?: string; city?: string; region?: string; postal?: string; country?: string; isHQ?: boolean };
type NoteItem = { id: string; title: string; body: string; createdAt: number; createdByName?: string; createdByEmail?: string; createdByPhotoURL?: string };

export type VendorAddModalProps = {
  opened: boolean;
  onClose: () => void;
  basePath?: string; // defaults to /employee/customers/vendors
  onCreated?: (id: string) => void;
};

const SOURCE_OPTIONS = ['no-source', 'Website', 'Referral', 'Paid Ads', 'Social', 'Event', 'Import', 'Waiting List', 'Other'];

export default function VendorAddModal({ opened, onClose, basePath = '/employee/customers/vendors', onCreated }: VendorAddModalProps) {
  const router = useRouter();
  const authUser = useAuthUser();
  const [employees, setEmployees] = useState<Array<{ value: string; label: string }>>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db(), 'employees'), (snap) => {
      const rows: Array<{ value: string; label: string }> = [];
      snap.forEach((d) => { const data = d.data() as any; rows.push({ value: d.id, label: data.name || '' }); });
      setEmployees(rows);
    });
    return () => unsub();
  }, []);

  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [name, setName] = useState('');
  const [source, setSource] = useState<string>('no-source');
  const [sourceDetail, setSourceDetail] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [newEmail, setNewEmail] = useState<EmailItem>({ id: '', email: '', label: '', kind: 'Work' });

  const [phones, setPhones] = useState<PhoneItem[]>([]);
  const [newPhone, setNewPhone] = useState<PhoneItem>({ id: '', number: '', ext: '', label: '', kind: 'Work' });

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [newAddress, setNewAddress] = useState<AddressItem>({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false });

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteBody, setNewNoteBody] = useState('');

  const addEmail = () => {
    const e = (newEmail.email || '').trim();
    if (!e) return;
    setEmails((arr) => [{ id: `em-${Date.now()}`, email: e, label: newEmail.label?.trim() || undefined, kind: newEmail.kind }, ...arr]);
    setNewEmail({ id: '', email: '', label: '', kind: 'Work' });
  };
  const addPhone = () => {
    const n = (newPhone.number || '').trim();
    if (!n) return;
    setPhones((arr) => [{ id: `ph-${Date.now()}`, number: n, ext: newPhone.ext?.trim() || undefined, label: newPhone.label?.trim() || undefined, kind: newPhone.kind }, ...arr]);
    setNewPhone({ id: '', number: '', ext: '', label: '', kind: 'Work' });
  };
  const addAddress = () => {
    const l1 = (newAddress.line1 || '').trim();
    if (!l1) return;
    const a: AddressItem = { id: `addr-${Date.now()}`, label: newAddress.label?.trim() || undefined, line1: l1, line2: newAddress.line2?.trim() || undefined, city: newAddress.city?.trim() || undefined, region: newAddress.region?.trim() || undefined, postal: newAddress.postal?.trim() || undefined, country: newAddress.country?.trim() || undefined, isHQ: !!newAddress.isHQ };
    setAddresses((arr) => [a, ...arr]);
    setNewAddress({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false });
  };
  const addNote = () => {
    const body = (newNoteBody || '').trim();
    if (!body) return;
    const firstLine = body.split('\n').find((l) => l.trim().length > 0) || 'Note';
    const title = firstLine.replace(/^#+\s*/, '').slice(0, 60) || 'Note';
    const n: NoteItem = { id: `note-${Date.now()}`, title, body, createdAt: Date.now(), createdByName: authUser?.displayName || authUser?.email || 'Unknown', createdByEmail: authUser?.email || undefined, createdByPhotoURL: authUser?.photoURL || undefined };
    setNotes((arr) => [n, ...arr]);
    setNewNoteBody('');
  };

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ref = await addDoc(collection(db(), 'crm_customers'), prune({
      name: name.trim(),
      email: (emails[0]?.email) || '',
      phone: (phones[0]?.number) || undefined,
      source,
      sourceDetail: source === 'Other' ? (sourceDetail.trim() || undefined) : undefined,
      notes,
      tags,
      emails,
      phones,
      addresses,
      ownerId: ownerId || undefined,
      type: 'vendor',
      createdAt: Date.now(),
      isArchived: false,
      isBlocked: false,
      doNotContact: false,
    }));
    onClose();
    onCreated ? onCreated(ref.id) : router.push(`${basePath}/${ref.id}`);
  };

  const resetAll = () => {
    setActiveTab('overview');
    setName(''); setSource('no-source'); setSourceDetail(''); setTags([]); setOwnerId(null);
    setEmails([]); setNewEmail({ id: '', email: '', label: '', kind: 'Work' });
    setPhones([]); setNewPhone({ id: '', number: '', ext: '', label: '', kind: 'Work' });
    setAddresses([]); setNewAddress({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false });
    setNotes([]); setNewNoteBody('');
  };

  useEffect(() => { if (!opened) resetAll(); }, [opened]);

  // nested modals for item inputs
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add vendor"
      centered
      size="80%"
      padding={0}
      styles={{ header: { padding: '12px 16px' } }}
    >
      <form onSubmit={onSubmit}>
        <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={activeTab} onChange={setActiveTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="email">Email</Tabs.Tab>
              <Tabs.Tab value="phone">Phone</Tabs.Tab>
              <Tabs.Tab value="address">Address</Tabs.Tab>
              <Tabs.Tab value="notes">Notes</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <Group align="end" grow>
                <TextInput label="Name" placeholder="Vendor name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
              </Group>
              <Group mt="sm" align="end" grow>
                <Select label="Source" data={SOURCE_OPTIONS} value={source} onChange={(v) => setSource(v || 'no-source')} allowDeselect={false} />
              </Group>
              {source === 'Other' && (
                <TextInput mt="sm" label="Other source" placeholder="Describe source" value={sourceDetail} onChange={(e) => setSourceDetail(e.currentTarget.value)} />
              )}
              <Group mt="sm" align="end" grow>
                <TagsInput label="Tags" placeholder="Add tags" value={tags} onChange={setTags} />
              </Group>
              <Group mt="sm" grow>
                <Select
                  label="Account owner"
                  placeholder="Assign owner"
                  data={employees}
                  value={ownerId}
                  onChange={(v) => setOwnerId(v)}
                  searchable
                  clearable
                  nothingFoundMessage="No employees"
                />
              </Group>
            </Tabs.Panel>

            <Tabs.Panel value="email" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Emails</Title>
                <Button variant="light" onClick={() => setEmailOpen(true)}>Add email</Button>
              </Group>
              <Stack>
                {emails.map((e) => (
                  <Card key={e.id} withBorder padding="sm"><Group justify="space-between"><Group gap={8}><Badge variant="light">{e.email}</Badge>{e.label && <Badge color="gray" variant="light">{e.label}</Badge>}{e.kind && <Badge color="blue" variant="light">{e.kind}</Badge>}</Group><Button size="xs" variant="subtle" color="red" onClick={() => setEmails((arr) => arr.filter((x) => x.id !== e.id))}>Remove</Button></Group></Card>
                ))}
                {emails.length === 0 && <Text c="dimmed">No emails added</Text>}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="phone" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Phones</Title>
                <Button variant="light" onClick={() => setPhoneOpen(true)}>Add phone</Button>
              </Group>
              <Stack>
                {phones.map((p) => (
                  <Card key={p.id} withBorder padding="sm"><Group justify="space-between"><Group gap={8}><Badge variant="light">{p.number}</Badge>{p.ext && <Badge color="gray" variant="light">ext {p.ext}</Badge>}{p.label && <Badge color="gray" variant="light">{p.label}</Badge>}{p.kind && <Badge color="blue" variant="light">{p.kind}</Badge>}</Group><Button size="xs" variant="subtle" color="red" onClick={() => setPhones((arr) => arr.filter((x) => x.id !== p.id))}>Remove</Button></Group></Card>
                ))}
                {phones.length === 0 && <Text c="dimmed">No phones added</Text>}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="address" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Addresses</Title>
                <Button variant="light" onClick={() => setAddressOpen(true)}>Add address</Button>
              </Group>
              <Stack>
                {addresses.map((a) => (
                  <Card key={a.id} withBorder padding="sm"><Group justify="space-between"><div><Group gap={6}>{a.label && <Badge variant="light">{a.label}</Badge>}</Group><Text>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text><Text c="dimmed" size="sm">{[a.city, a.region, a.postal, a.country].filter(Boolean).join(', ')}</Text></div><Button size="xs" variant="subtle" color="red" onClick={() => setAddresses((arr) => arr.filter((x) => x.id !== a.id))}>Remove</Button></Group></Card>
                ))}
                {addresses.length === 0 && <Text c="dimmed">No addresses added</Text>}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="notes" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Notes</Title>
                <Button variant="light" onClick={() => setNoteOpen(true)}>Add note</Button>
              </Group>
              <Stack>
                {notes.map((n) => (
                  <Card key={n.id} withBorder padding="sm"><Group justify="space-between"><div><Text fw={600}>{n.title}</Text><Text size="sm" c="dimmed">{new Date(n.createdAt).toLocaleString()}</Text><Text size="sm" style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{n.body}</Text></div><Button size="xs" variant="subtle" color="red" onClick={() => setNotes((arr) => arr.filter((x) => x.id !== n.id))}>Remove</Button></Group></Card>
                ))}
                {notes.length === 0 && <Text c="dimmed">No notes added</Text>}
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" p="md">
            <Button variant="default" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add vendor</Button>
          </Group>
        </div>
      </form>
      {/* Nested modals */}
      <Modal opened={emailOpen} onClose={() => setEmailOpen(false)} title="Add vendor email" centered size="lg">
        <Stack>
          <TextInput label="Email" value={newEmail.email} onChange={(e) => setNewEmail({ ...newEmail, email: e.currentTarget.value })} />
          <TextInput label="Label" value={newEmail.label || ''} onChange={(e) => setNewEmail({ ...newEmail, label: e.currentTarget.value })} />
          <Select label="Kind" data={[ 'Work', 'Personal' ]} value={newEmail.kind} onChange={(v) => setNewEmail({ ...newEmail, kind: (v as any) || 'Work' })} allowDeselect={false} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={() => { addEmail(); setEmailOpen(false); }}>Add</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={phoneOpen} onClose={() => setPhoneOpen(false)} title="Add vendor phone" centered size="lg">
        <Stack>
          <TextInput label="Number" value={newPhone.number} onChange={(e) => setNewPhone({ ...newPhone, number: e.currentTarget.value })} />
          <TextInput label="Ext" value={newPhone.ext || ''} onChange={(e) => setNewPhone({ ...newPhone, ext: e.currentTarget.value })} />
          <TextInput label="Label" value={newPhone.label || ''} onChange={(e) => setNewPhone({ ...newPhone, label: e.currentTarget.value })} />
          <Select label="Kind" data={[ 'Work', 'Personal' ]} value={newPhone.kind} onChange={(v) => setNewPhone({ ...newPhone, kind: (v as any) || 'Work' })} allowDeselect={false} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPhoneOpen(false)}>Cancel</Button>
            <Button onClick={() => { addPhone(); setPhoneOpen(false); }}>Add</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={addressOpen} onClose={() => setAddressOpen(false)} title="Add vendor address" centered size="lg">
        <Stack>
          <TextInput label="Label" value={newAddress.label || ''} onChange={(e) => setNewAddress({ ...newAddress, label: e.currentTarget.value })} />
          <TextInput label="Line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.currentTarget.value })} required />
          <TextInput label="Line 2" value={newAddress.line2 || ''} onChange={(e) => setNewAddress({ ...newAddress, line2: e.currentTarget.value })} />
          <TextInput label="City" value={newAddress.city || ''} onChange={(e) => setNewAddress({ ...newAddress, city: e.currentTarget.value })} />
          <TextInput label="Region" value={newAddress.region || ''} onChange={(e) => setNewAddress({ ...newAddress, region: e.currentTarget.value })} />
          <TextInput label="Postal" value={newAddress.postal || ''} onChange={(e) => setNewAddress({ ...newAddress, postal: e.currentTarget.value })} />
          <TextInput label="Country" value={newAddress.country || ''} onChange={(e) => setNewAddress({ ...newAddress, country: e.currentTarget.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setAddressOpen(false)}>Cancel</Button>
            <Button onClick={() => { addAddress(); setAddressOpen(false); }}>Add</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={noteOpen} onClose={() => setNoteOpen(false)} title="Add vendor note" centered size="lg">
        <Stack>
          <TextInput label="Markdown" placeholder="Write note in Markdown..." value={newNoteBody} onChange={(e) => setNewNoteBody(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={() => { addNote(); setNoteOpen(false); }}>Add</Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
}
