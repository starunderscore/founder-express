"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { type LeadSource, type Note, type Address, type Contact, type Phone, type Email } from '@/state/crmStore';
import { useEmployerStore } from '@/state/employerStore';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Title, Text, Group, Badge, Button, Stack, Divider, Modal, TextInput, Select, TagsInput, Textarea, Radio, Tabs, ActionIcon, Avatar, Menu, CopyButton, Anchor, Table, Switch, Alert } from '@mantine/core';
import Link from 'next/link';
import { useAuthUser } from '@/lib/firebase/auth';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vendor, setVendor] = useState<any | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(ref, (snap) => setVendor(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null));
    return () => unsub();
  }, [params.id]);
  const employees = useEmployerStore((s) => s.employees);
  const toast = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrTab, setAddrTab] = useState<string | null>('general');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactTab, setContactTab] = useState<string | null>('general');
  const [contactPhoneAddOpen, setContactPhoneAddOpen] = useState(false);
  const [contactEmailAddOpen, setContactEmailAddOpen] = useState(false);
  const [contactAddressAddOpen, setContactAddressAddOpen] = useState(false);
  const [contactPhoneEditOpen, setContactPhoneEditOpen] = useState(false);
  const [editContactPhone, setEditContactPhone] = useState<TempPhone>({ id: '', number: '', ext: '', label: '', kind: 'Work' });
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      if (h === '#contacts') setActiveTab('contacts');
    }
  }, []);
  const [deleteVendorOpen, setDeleteVendorOpen] = useState(false);
  const [deleteVendorInput, setDeleteVendorInput] = useState('');
  const [archiveVendorOpen, setArchiveVendorOpen] = useState(false);
  const [archiveVendorInput, setArchiveVendorInput] = useState('');
  const [editActiveTab, setEditActiveTab] = useState<string | null>('overview');
  const [orgEmailOpen, setOrgEmailOpen] = useState(false);
  const [orgPhoneOpen, setOrgPhoneOpen] = useState(false);
  const [orgEmailTab, setOrgEmailTab] = useState<string | null>('general');
  const [orgPhoneTab, setOrgPhoneTab] = useState<string | null>('general');
  const [orgEmailValue, setOrgEmailValue] = useState('');
  const [orgEmailLabel, setOrgEmailLabel] = useState('');
  const [orgPhoneValue, setOrgPhoneValue] = useState('');
  const [orgPhoneLabel, setOrgPhoneLabel] = useState('');
  const [orgPhoneExt, setOrgPhoneExt] = useState('');
  const [noteItemOpen, setNoteItemOpen] = useState(false);
  const [noteItemBody, setNoteItemBody] = useState('');
  const [noteItemKind, setNoteItemKind] = useState<'email' | 'phone' | null>(null);
  const [noteItemId, setNoteItemId] = useState<string | null>(null);

  const [vName, setVName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('no-source');
  const [sourceDetail, setSourceDetail] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  const [noteBody, setNoteBody] = useState('');

  const [addr, setAddr] = useState<Partial<Address>>({});
  const [addrPhone, setAddrPhone] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  type TempEmail = { id: string; email: string; label?: string; kind?: 'Personal' | 'Work' };
  type TempPhone = { id: string; number: string; ext?: string; label?: string; kind?: 'Personal' | 'Work' };
  type TempAddress = { id: string; label?: string; line1: string; line2?: string; city?: string; region?: string; postal?: string; country?: string; isHQ?: boolean };

  const [contactEmails, setContactEmails] = useState<TempEmail[]>([]);
  const [newContactEmail, setNewContactEmail] = useState<TempEmail>({ id: '', email: '', label: '', kind: 'Work' });
  const [contactPhones, setContactPhones] = useState<TempPhone[]>([]);
  const [newContactPhone, setNewContactPhone] = useState<TempPhone>({ id: '', number: '', ext: '', label: '', kind: 'Work' });
  const [contactAddresses, setContactAddresses] = useState<TempAddress[]>([]);
  const [newContactAddress, setNewContactAddress] = useState<TempAddress>({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false });
  const [contactNotes, setContactNotes] = useState<Note[]>([]);
  const [contactNoteAddOpen, setContactNoteAddOpen] = useState(false);
  const [newContactNoteBody, setNewContactNoteBody] = useState('');
  const [contactAddr, setContactAddr] = useState<Partial<Address>>({});
  const [contactQuery, setContactQuery] = useState('');
  const authUser = useAuthUser();
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleteInput, setPermDeleteInput] = useState('');

  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [editNoteBody, setEditNoteBody] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteNoteSnippet, setDeleteNoteSnippet] = useState('');
  const [deleteNoteInput, setDeleteNoteInput] = useState('');

  if (!vendor) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Vendor not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/crm')}>Back to CRM</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  const openEditPrefill = () => {
    setVName(vendor.name || '');
    setEmail(vendor.email || '');
    setCompany(vendor.company || '');
    setPhone(vendor.phone || '');
    setSource(vendor.source);
    setSourceDetail(vendor.sourceDetail || '');
    setTags(vendor.tags || []);
    setOwnerId(vendor.ownerId || null);
    setEditActiveTab('overview');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { name: (vName || vendor.name).trim(), email: email.trim(), company: company.trim() || undefined, phone: phone.trim() || undefined, source, sourceDetail: source === 'Other' ? (sourceDetail.trim() || undefined) : undefined, tags, ownerId: ownerId || undefined } as any);
    setEditOpen(false);
  };

  const saveNote = async () => {
    const body = noteBody.trim();
    if (!body) return;
    const title = deriveTitleFromMarkdown(body);
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      body,
      createdAt: Date.now(),
      createdByName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Unknown',
      createdByEmail: authUser?.email || undefined,
      createdByPhotoURL: authUser?.photoURL || undefined,
    };
    const notes = Array.isArray(vendor.notes) ? [newNote, ...vendor.notes] : [newNote];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { notes } as any);
    setNoteBody('');
    setNoteOpen(false);
  };

  const openEditNote = (id: string) => {
    const note = (vendor.notes || []).find((n) => n.id === id);
    if (!note) return;
    setEditNoteId(id);
    setEditNoteBody(note.body || '');
    setEditNoteOpen(true);
  };

  const saveEditNote = async () => {
    if (!editNoteId) return;
    const body = editNoteBody.trim();
    const title = deriveTitleFromMarkdown(body);
    const notes = (vendor.notes || []).map((n) => (n.id === editNoteId ? { ...n, body, title } : n));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { notes } as any);
    setEditNoteOpen(false);
  };

  const openDeleteNote = (id: string) => {
    const note = (vendor.notes || []).find((n) => n.id === id);
    if (!note) return;
    const snippet = (note.body || '').trim().slice(0, 10);
    setDeleteNoteId(id);
    setDeleteNoteSnippet(snippet);
    setDeleteNoteInput('');
    setDeleteNoteOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!deleteNoteId) return;
    const required = deleteNoteSnippet;
    if (required.length > 0 && deleteNoteInput !== required) return;
    const notes = (vendor.notes || []).filter((n) => n.id !== deleteNoteId);
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { notes } as any);
    setDeleteNoteOpen(false);
  };

  const addOrgEmail = async () => {
    const addr = orgEmailValue.trim();
    if (!addr) return;
    const e: Email = { id: `em-${Date.now()}`, email: addr, label: orgEmailLabel.trim() || undefined, notes: [] };
    const emails = Array.isArray(vendor.emails) ? [e, ...vendor.emails] : [e];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { emails } as any);
    setOrgEmailValue(''); setOrgEmailLabel(''); setOrgEmailOpen(false);
  };

  const addOrgPhone = async () => {
    const num = orgPhoneValue.trim();
    if (!num) return;
    const p: Phone = { id: `ph-${Date.now()}`, number: num, label: orgPhoneLabel.trim() || undefined, ext: orgPhoneExt.trim() || undefined, notes: [] };
    const phones = Array.isArray(vendor.phones) ? [p, ...vendor.phones] : [p];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { phones } as any);
    setOrgPhoneValue(''); setOrgPhoneLabel(''); setOrgPhoneExt(''); setOrgPhoneOpen(false);
  };

  const openAddNoteForItem = (kind: 'email' | 'phone', id: string) => {
    setNoteItemKind(kind);
    setNoteItemId(id);
    setNoteItemBody('');
    setNoteItemOpen(true);
  };

  const saveNoteForItem = async () => {
    const body = noteItemBody.trim();
    if (!body || !noteItemKind || !noteItemId) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      title: deriveTitleFromMarkdown(body),
      body,
      createdAt: Date.now(),
      createdByName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Unknown',
      createdByEmail: authUser?.email || undefined,
      createdByPhotoURL: authUser?.photoURL || undefined,
    };
    if (noteItemKind === 'email') {
      const emails = (vendor.emails || []).map((e) => (e.id === noteItemId ? { ...e, notes: [...(e.notes || []), note] } : e));
      await updateDoc(doc(db(), 'crm_customers', vendor.id), { emails } as any);
    } else {
      const phones = (vendor.phones || []).map((p) => (p.id === noteItemId ? { ...p, notes: [...(p.notes || []), note] } : p));
      await updateDoc(doc(db(), 'crm_customers', vendor.id), { phones } as any);
    }
    setNoteItemOpen(false);
  };

  const saveAddress = async () => {
    if (!addr.line1?.trim()) return;
    const a: Address = {
      id: addr.id || `addr-${Date.now()}`,
      label: addr.label?.trim() || undefined,
      line1: addr.line1!.trim(),
      line2: addr.line2?.trim() || undefined,
      city: addr.city?.trim() || undefined,
      region: addr.region?.trim() || undefined,
      postal: addr.postal?.trim() || undefined,
      country: addr.country?.trim() || undefined,
      isHQ: !!addr.isHQ,
      phones: addrPhone.trim() ? [{ id: `ph-${Date.now()}`, number: addrPhone.trim() }] : [],
    };
    let addresses = Array.isArray(vendor.addresses) ? [...vendor.addresses] : [];
    // If setting HQ, unset others
    if (a.isHQ) addresses = addresses.map((x) => ({ ...x, isHQ: false }));
    addresses = [a, ...addresses];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { addresses } as any);
    setAddr({}); setAddrPhone(''); setAddrOpen(false);
  };

  const setHQ = async (id: string) => {
    const addresses = (vendor.addresses || []).map((x) => ({ ...x, isHQ: x.id === id }));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { addresses } as any);
  };

  const deleteAddress = async (id: string) => {
    const addresses = (vendor.addresses || []).filter((x) => x.id !== id);
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { addresses } as any);
  };

  const addContact = async () => {
    const name = contactName.trim();
    if (!name || !vendor) return;
    const id = `ct-${Date.now()}`;
    const c: Contact = {
      id,
      createdAt: Date.now(),
      name,
      title: contactTitle.trim() || undefined,
      emails: contactEmails.map((e) => ({ id: e.id || `em-${Date.now()}-${Math.random()}`, email: e.email.trim(), label: e.label?.trim() || undefined, kind: e.kind })),
      phones: contactPhones.map((p) => ({ id: p.id || `ph-${Date.now()}-${Math.random()}`, number: p.number.trim(), ext: p.ext?.trim() || undefined, label: p.label?.trim() || undefined, kind: p.kind })),
      addresses: contactAddresses.map((a) => ({ id: a.id || `addr-${Date.now()}-${Math.random()}`, label: a.label?.trim() || undefined, line1: a.line1.trim(), line2: a.line2?.trim() || undefined, city: a.city?.trim() || undefined, region: a.region?.trim() || undefined, postal: a.postal?.trim() || undefined, country: a.country?.trim() || undefined, isHQ: !!a.isHQ })),
      notes: contactNotes,
    };
    const contacts = Array.isArray(vendor.contacts) ? [c, ...vendor.contacts] : [c];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
    setContactName(''); setContactTitle(''); setContactEmails([]); setNewContactEmail({ id: '', email: '', label: '', kind: 'Work' }); setContactPhones([]); setNewContactPhone({ id: '', number: '', ext: '', label: '', kind: 'Work' }); setContactAddresses([]); setNewContactAddress({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false }); setContactNotes([]); setNewContactNoteBody(''); setContactOpen(false);
    router.push(`/employee/crm/vendor/contact/${id}` as any);
  };

  const deleteContact = async (id: string) => {
    const contacts = (vendor.contacts || []).map((x) => (x.id === id ? { ...x, deletedAt: Date.now() } : x));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
  };

  const deriveTitleFromMarkdown = (body: string): string => {
    const text = (body || '').trim();
    if (!text) return 'Note';
    const firstNonEmpty = text.split('\n').find((l) => l.trim().length > 0) || '';
    const cleaned = firstNonEmpty.replace(/^#+\s*/, '').trim();
    return cleaned.slice(0, 60) || 'Note';
  };

  if (!vendor) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Vendor not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/crm')}>Back to CRM</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/crm')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={2}>
              {vendor.name}
            </Title>
            <Badge color="orange" variant="filled">Vendor</Badge>
            {vendor.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
          </Group>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} radius="md">
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="notes" component={Link as any} href={`/employee/crm/vendor/${vendor.id}/notes` as any}>Notes</Tabs.Tab>
          <Tabs.Tab value="contacts" component={Link as any} href={`/employee/crm/vendor/${vendor.id}/contacts` as any}>Contacts</Tabs.Tab>
          <Tabs.Tab value="actions" component={Link as any} href={`/employee/crm/vendor/${vendor.id}/actions` as any}>Actions</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          {vendor?.deletedAt && (
            <Alert color="red" variant="light" mb="md" title="Removed">
              <Group justify="space-between" align="center">
                <Text>This vendor is removed and appears in the Removed tab.</Text>
                <Group gap="xs">
                  <Button variant="light" onClick={async () => { await updateDoc(doc(db(), 'crm_customers', vendor.id), { deletedAt: undefined } as any); toast.show({ title: 'Vendor restored', message: 'Vendor is back in Database.' }); }}>Restore</Button>
                  <Button variant="subtle" color="red" onClick={() => { setPermDeleteInput(''); setPermDeleteOpen(true); }}>Permanently delete</Button>
                </Group>
              </Group>
            </Alert>
          )}
          {vendor.isArchived && (
            <Alert color="gray" variant="light" mb="md" title="Archived">
              <Group justify="space-between" align="center">
                <Text>This vendor is archived and hidden from the Database view.</Text>
                <Button variant="light" onClick={async () => { await updateDoc(doc(db(), 'crm_customers', vendor.id), { isArchived: false } as any); }}>Unarchive</Button>
              </Group>
            </Alert>
          )}
          {vendor.doNotContact && (
            <Alert color="yellow" variant="light" mb="md" title="Do not contact">
              This vendor is marked as Do Not Contact.
            </Alert>
          )}

          <Card id="overview-core" withBorder radius="md" style={{ borderLeft: '4px solid var(--mantine-color-orange-6)', background: 'linear-gradient(90deg, var(--mantine-color-orange-0), transparent 40%)' }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Title order={4}>General</Title>
                <Button variant="light" onClick={openEditPrefill}>Edit</Button>
              </Group>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Name</Text>
                <Text>{vendor.name || '—'}</Text>
              </Stack>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Account owner</Text>
                <Group gap={6}>
                  {vendor.ownerId ? (
                    <Badge variant="light">{employees.find((e) => e.id === vendor.ownerId)?.name || 'Unknown'}</Badge>
                  ) : (
                    <Badge color="gray" variant="light">Unassigned</Badge>
                  )}
                </Group>
              </Stack>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Joined</Text>
                <Text>{new Date(vendor.createdAt).toLocaleDateString()}</Text>
              </Stack>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Source</Text>
                <Group gap={6}>
                  <Badge color="orange" variant="light">{vendor.source}</Badge>
                  {vendor.source === 'Other' && vendor.sourceDetail && (
                    <Text size="sm">({vendor.sourceDetail})</Text>
                  )}
                </Group>
              </Stack>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Tags</Text>
                <Group gap={6} wrap="wrap">
                  {(vendor.tags && vendor.tags.length > 0) ? vendor.tags.map((t) => (<Badge key={t} variant="light">{t}</Badge>)) : <Text>—</Text>}
                </Group>
              </Stack>
            </Stack>
          </Card>

          <Card id="overview-org-emails" withBorder radius="md" mt="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Organization Emails</Title>
              <Button variant="default" onClick={() => { setOrgEmailTab('general'); setOrgEmailOpen(true); }}>Add email</Button>
            </div>
            <div style={{ padding: '12px 16px' }}>
            <Stack>
              {(vendor.emails || []).map((e) => (
                <Card key={e.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group gap={8}>
                        <Badge variant="light">{e.email}</Badge>
                        {e.label && <Badge color="gray" variant="light">{e.label}</Badge>}
                      </Group>
                      {Array.isArray(e.notes) && e.notes.length > 0 && (
                        <Text size="xs" c="dimmed" mt={4}>{e.notes.length} note{e.notes.length === 1 ? '' : 's'}</Text>
                      )}
                    </div>
                    <Group gap="xs">
                      <Button size="xs" variant="subtle" onClick={() => openAddNoteForItem('email', e.id)}>Add note</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
              {(vendor.emails || []).length === 0 && <Text c="dimmed">No emails</Text>}
            </Stack>
            </div>
          </Card>

          <Card id="overview-org-addresses" withBorder radius="md" mt="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Organization Addresses</Title>
              <Button variant="default" onClick={() => { setAddr({}); setAddrPhone(''); setAddrTab('general'); setAddrOpen(true); }}>Add address</Button>
            </div>
            <div style={{ padding: '12px 16px' }}>
            <Stack>
              {(vendor.addresses || []).map((a) => (
                <Card key={a.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group gap="xs">
                        {a.isHQ && <Badge color="orange" variant="filled">HQ</Badge>}
                        {a.label && <Badge variant="light">{a.label}</Badge>}
                      </Group>
                      <Text>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
                      <Text c="dimmed" size="sm">{[a.city, a.region, a.postal, a.country].filter(Boolean).join(', ')}</Text>
                      {(a.phones && a.phones.length > 0) && (
                        <Group gap={6} mt={6}>
                          {a.phones.map((p) => (<Badge key={p.id} variant="light">{p.number}</Badge>))}
                        </Group>
                      )}
                    </div>
                    <Group gap="xs">
                      {!a.isHQ && <Button size="xs" variant="subtle" onClick={() => setHQ(a.id)}>Set as HQ</Button>}
                      <Button size="xs" variant="subtle" color="red" onClick={() => deleteAddress(a.id)}>Delete</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
              {(vendor.addresses || []).length === 0 && <Text c="dimmed">No addresses</Text>}
            </Stack>
            </div>
          </Card>

          <Card id="overview-org-phones" withBorder radius="md" mt="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Organization Phones</Title>
              <Button variant="default" onClick={() => { setOrgPhoneTab('general'); setOrgPhoneOpen(true); }}>Add phone</Button>
            </div>
            <div style={{ padding: '12px 16px' }}>
            <Stack>
              {(vendor.phones || []).map((p) => (
                <Card key={p.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group gap={8}>
                        <Badge variant="light">{p.number}</Badge>
                        {p.label && <Badge color="gray" variant="light">{p.label}</Badge>}
                        {p.ext && <Badge color="gray" variant="light">ext {p.ext}</Badge>}
                      </Group>
                      {Array.isArray(p.notes) && p.notes.length > 0 && (
                        <Text size="xs" c="dimmed" mt={4}>{p.notes.length} note{p.notes.length === 1 ? '' : 's'}</Text>
                      )}
                    </div>
                    <Group gap="xs">
                      <Button size="xs" variant="subtle" onClick={() => openAddNoteForItem('phone', p.id)}>Add note</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
              {(vendor.phones || []).length === 0 && <Text c="dimmed">No phones</Text>}
            </Stack>
            </div>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="notes" pt="md">
          <Card withBorder radius="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Notes</Title>
              <Button variant="default" onClick={() => setNoteOpen(true)}>Add note</Button>
            </div>
            <div style={{ padding: '12px 16px' }}>
            {Array.isArray(vendor.notes) && vendor.notes.length > 0 ? (
              <Stack>
                {vendor.notes.map((n) => (
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
        </Tabs.Panel>

        <Tabs.Panel value="contacts" pt="md">
          <Card withBorder radius="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Contacts</Title>
              <Button variant="default" onClick={() => { setContactTab('general'); setContactOpen(true); }}>Add contact</Button>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <TextInput
                placeholder="Search contacts (name, title, email, phone)"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.currentTarget.value)}
              />
            </div>
            {(() => {
              const q = (contactQuery || '').toLowerCase().trim();
              const contacts = (vendor.contacts || []).filter((c) => {
                if (c.deletedAt) return false;
                if (c.isArchived) return false;
                if (!q) return true;
                const name = (c.name || '').toLowerCase();
                const title = (c.title || '').toLowerCase();
                const emails = (c.emails || []).some((e) => (e.email || '').toLowerCase().includes(q));
                const phones = (c.phones || []).some((p) => (p.number || '').toLowerCase().includes(q));
                return name.includes(q) || title.includes(q) || emails || phones;
              });
              return (
                <Table verticalSpacing="sm" highlightOnHover striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Title</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                  {contacts.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td>
                        <Anchor component={Link as any} href={`/employee/crm/vendor/contact/${c.id}`} underline="hover">
                          {c.name}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>{c.title || '—'}</Table.Td>
                      <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            aria-label="View"
                            component={Link as any}
                            href={`/employee/crm/vendor/contact/${c.id}` as any}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="currentColor"/>
                            </svg>
                          </ActionIcon>
                          <Menu withinPortal position="bottom-end" shadow="md" width={160}>
                            <Menu.Target>
                              <ActionIcon variant="subtle" aria-label="Contact actions">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="5" r="2" fill="currentColor"/>
                                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
                                </svg>
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item component={Link as any} href={`/employee/crm/vendor/contact/${c.id}` as any}>View</Menu.Item>
                              <Menu.Item color="red" onClick={() => deleteContact(c.id)}>Delete</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {contacts.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <Text c="dimmed">No contacts</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  </Table.Tbody>
                </Table>
              );
            })()}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="actions" pt="md">
          <Card withBorder radius="md" mb="md">
            <Stack>
              <Title order={4}>Account controls</Title>
              <Group>
                <Switch
                  checked={!!vendor?.doNotContact}
                  onChange={async (e) => { await updateDoc(doc(db(), 'crm_customers', vendor!.id), { doNotContact: e.currentTarget.checked } as any); }}
                  label="Do not contact"
                />
              </Group>
            </Stack>
          </Card>

          <Title order={4} c="red" mb="xs">Danger zone</Title>

          {vendor?.isArchived ? (
            <Card withBorder radius="md" mb="md">
              <Stack>
                <Title order={5}>Unarchive vendor</Title>
                <Group>
                  <Button variant="light" onClick={async () => { await updateDoc(doc(db(), 'crm_customers', vendor!.id), { isArchived: false } as any); }}>Unarchive vendor</Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Card withBorder radius="md" mb="md">
              <Stack>
                <Title order={5}>Archive vendor</Title>
                <Group>
                  <Button color="orange" variant="light" onClick={() => { setArchiveVendorInput(''); setArchiveVendorOpen(true); }}>Archive vendor</Button>
                </Group>
              </Stack>
            </Card>
          )}

          <Card withBorder radius="md" mb="md">
            <Stack>
              <Title order={5}>Remove vendor</Title>
              <Group>
                <Button color="red" variant="light" onClick={() => { setDeleteVendorInput(''); setDeleteVendorOpen(true); }}>Remove vendor</Button>
              </Group>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Edit details modal */}
      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit vendor"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={editActiveTab} onChange={setEditActiveTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <Group mt="sm" align="end" grow>
                <TextInput label="Name" value={vName} onChange={(e) => setVName(e.currentTarget.value)} required />
              </Group>
              <Group mt="sm" align="end" grow>
                <Select label="Source" data={[ 'no-source','Website','Referral','Paid Ads','Social','Event','Import','Waiting List','Other' ]} value={source} onChange={(v) => setSource((v || 'no-source') as LeadSource)} allowDeselect={false} />
              </Group>
              {source === 'Other' && (
                <TextInput mt="sm" label="Other source" value={sourceDetail} onChange={(e) => setSourceDetail(e.currentTarget.value)} />
              )}
              <Group mt="sm" align="end" grow>
                <TagsInput label="Tags" placeholder="Add tags" value={tags} onChange={setTags} />
              </Group>
              <Group mt="sm" grow>
                <Select
                  label="Account owner"
                  placeholder="Assign owner"
                  data={employees.map((e) => ({ value: e.id, label: e.name }))}
                  value={ownerId}
                  onChange={(v) => setOwnerId(v)}
                  allowDeselect
                  searchable
                  nothingFoundMessage="No employees"
                />
              </Group>
            </Tabs.Panel>
            
          </Tabs>
          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--mantine-color-gray-3)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              width: '100%'
            }}
          >
            <Button onClick={saveEdit}>Save changes</Button>
          </div>
        </div>
      </Modal>

      {/* Remove vendor modal */}
      <Modal opened={deleteVendorOpen} onClose={() => setDeleteVendorOpen(false)} title="Remove vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Move this vendor to Removed. You can permanently delete it from the Removed tab later. Type the vendor name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Vendor name" value={vendor?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={vendor?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={deleteVendorInput} onChange={(e) => setDeleteVendorInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteVendorOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(vendor?.name?.length || 0) > 0 && deleteVendorInput !== (vendor?.name || '')} onClick={async () => {
              if (!vendor) return;
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { deletedAt: Date.now() } as any);
              setDeleteVendorOpen(false);
              toast.show({ title: 'Vendor removed', message: 'Moved to Removed. You can restore or permanently delete it from the Removed tab.' });
            }}>Remove</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete vendor modal */}
      <Modal opened={permDeleteOpen} onClose={() => setPermDeleteOpen(false)} title="Permanently delete vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">This action cannot be undone. Type the exact vendor name to confirm permanent deletion.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Vendor name" value={vendor?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={vendor?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={permDeleteInput} onChange={(e) => setPermDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPermDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(vendor?.name?.length || 0) > 0 && permDeleteInput !== (vendor?.name || '')} onClick={async () => {
              if (!vendor) return;
              await deleteDoc(doc(db(), 'crm_customers', vendor.id));
              setPermDeleteOpen(false);
              toast.show({ title: 'Vendor deleted', message: 'Permanently deleted.' });
              router.push('/employee/crm');
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive vendor modal */}
      <Modal opened={archiveVendorOpen} onClose={() => setArchiveVendorOpen(false)} title="Archive vendor" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Archiving hides this vendor from the Database view. Type the vendor name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Vendor name" value={vendor?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={vendor?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type vendor name" value={archiveVendorInput} onChange={(e) => setArchiveVendorInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setArchiveVendorOpen(false)}>Cancel</Button>
            <Button color="orange" disabled={(vendor?.name?.length || 0) > 0 && archiveVendorInput !== (vendor?.name || '')} onClick={async () => {
              if (!vendor) return;
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { isArchived: true } as any);
              setArchiveVendorOpen(false);
              toast.show({ title: 'Vendor archived', message: 'Moved to Archive.' });
            }}>Archive</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit contact phone (nested) */}
      <Modal
        opened={contactPhoneEditOpen}
        onClose={() => setContactPhoneEditOpen(false)}
        title="Edit contact phone"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
        zIndex={10000}
      >
        <Stack>
          <TextInput label="Number" value={editContactPhone.number} onChange={(e) => { const v = e.currentTarget.value; setEditContactPhone((s) => ({ ...s, number: v })); }} />
          <TextInput label="Ext" placeholder="Optional" value={editContactPhone.ext} onChange={(e) => { const v = e.currentTarget.value; setEditContactPhone((s) => ({ ...s, ext: v })); }} />
          <TextInput label="Label" placeholder="e.g., Mobile, Work" value={editContactPhone.label} onChange={(e) => { const v = e.currentTarget.value; setEditContactPhone((s) => ({ ...s, label: v })); }} />
          <Select label="Type" data={[ 'Work', 'Personal' ]} value={editContactPhone.kind || 'Work'} onChange={(v) => setEditContactPhone((s) => ({ ...s, kind: (v as any) || 'Work' }))} allowDeselect={false} w={220} comboboxProps={{ withinPortal: true, zIndex: 11000 }} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setContactPhoneEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const number = (editContactPhone.number || '').trim();
                if (!number) return;
                setContactPhones((arr) => arr.map((x) => (x.id === editContactPhone.id ? { ...editContactPhone } : x)));
                setContactPhoneEditOpen(false);
              }}
            >Save changes</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add note modal */}
      <Modal opened={noteOpen} onClose={() => setNoteOpen(false)} title="Add note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={10} value={noteBody} onChange={(e) => setNoteBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button onClick={saveNote}>Save note</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit note modal */}
      <Modal opened={editNoteOpen} onClose={() => setEditNoteOpen(false)} title="Edit note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={10} value={editNoteBody} onChange={(e) => setEditNoteBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button onClick={saveEditNote}>Save changes</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete note modal */}
      <Modal opened={deleteNoteOpen} onClose={() => setDeleteNoteOpen(false)} title="Delete note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Text c="dimmed">To confirm deletion, type the first 10 characters of the note.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Snippet" value={deleteNoteSnippet} readOnly style={{ flex: 1 }} />
            <CopyButton value={deleteNoteSnippet}>
              {({ copied, copy }) => (
                <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
              )}
            </CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type snippet" value={deleteNoteInput} onChange={(e) => setDeleteNoteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteNoteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deleteNoteSnippet.length > 0 && deleteNoteInput !== deleteNoteSnippet} onClick={confirmDeleteNote}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add organization email modal */}
      <Modal
        opened={orgEmailOpen}
        onClose={() => setOrgEmailOpen(false)}
        title="Edit vendor"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={orgEmailTab} onChange={setOrgEmailTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="general">Email</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <TextInput label="Email" value={orgEmailValue} onChange={(e) => setOrgEmailValue(e.currentTarget.value)} required />
              <TextInput mt="sm" label="Label" placeholder="e.g., Billing, Support" value={orgEmailLabel} onChange={(e) => setOrgEmailLabel(e.currentTarget.value)} />
            </Tabs.Panel>
          </Tabs>
          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--mantine-color-gray-3)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              width: '100%'
            }}
          >
            <Button onClick={addOrgEmail}>Save email</Button>
          </div>
        </div>
      </Modal>

      {/* Add organization phone modal */}
      <Modal
        opened={orgPhoneOpen}
        onClose={() => setOrgPhoneOpen(false)}
        title="Edit vendor"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={orgPhoneTab} onChange={setOrgPhoneTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="general">Phone</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <TextInput label="Number" value={orgPhoneValue} onChange={(e) => setOrgPhoneValue(e.currentTarget.value)} required />
              <TextInput mt="sm" label="Ext" placeholder="Optional" value={orgPhoneExt} onChange={(e) => setOrgPhoneExt(e.currentTarget.value)} />
              <TextInput mt="sm" label="Label" placeholder="e.g., Main, Support" value={orgPhoneLabel} onChange={(e) => setOrgPhoneLabel(e.currentTarget.value)} />
            </Tabs.Panel>
          </Tabs>
          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--mantine-color-gray-3)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              width: '100%'
            }}
          >
            <Button onClick={addOrgPhone}>Save phone</Button>
          </div>
        </div>
      </Modal>

      {/* Add a note to specific email/phone */}
      <Modal opened={noteItemOpen} onClose={() => setNoteItemOpen(false)} title="Add note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={8} value={noteItemBody} onChange={(e) => setNoteItemBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button onClick={saveNoteForItem}>Save note</Button>
          </Group>
        </Stack>
      </Modal>
      {/* Add address modal */}
      <Modal
        opened={addrOpen}
        onClose={() => setAddrOpen(false)}
        title="Edit vendor"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={addrTab} onChange={setAddrTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="general">Address</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <TextInput label="Label" value={addr.label || ''} onChange={(e) => setAddr((p) => ({ ...p, label: e.currentTarget.value }))} />
              <TextInput mt="sm" label="Line 1" required value={addr.line1 || ''} onChange={(e) => setAddr((p) => ({ ...p, line1: e.currentTarget.value }))} />
              <TextInput mt="sm" label="Line 2" value={addr.line2 || ''} onChange={(e) => setAddr((p) => ({ ...p, line2: e.currentTarget.value }))} />
              <Group mt="sm" grow>
                <TextInput label="City" value={addr.city || ''} onChange={(e) => setAddr((p) => ({ ...p, city: e.currentTarget.value }))} />
                <TextInput label="Region/State" value={addr.region || ''} onChange={(e) => setAddr((p) => ({ ...p, region: e.currentTarget.value }))} />
              </Group>
              <Group mt="sm" grow>
                <TextInput label="Postal" value={addr.postal || ''} onChange={(e) => setAddr((p) => ({ ...p, postal: e.currentTarget.value }))} />
                <TextInput label="Country" value={addr.country || ''} onChange={(e) => setAddr((p) => ({ ...p, country: e.currentTarget.value }))} />
              </Group>
              <Group mt="sm">
            <Radio checked={!!addr.isHQ} onChange={(e) => { const c = e.currentTarget.checked; setAddr((p) => ({ ...p, isHQ: c })); }} label="Headquarters" />
              </Group>
              <TextInput mt="sm" label="Phone (optional)" value={addrPhone} onChange={(e) => setAddrPhone(e.currentTarget.value)} placeholder="Attach a phone to this address" />
            </Tabs.Panel>
          </Tabs>
          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--mantine-color-gray-3)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              width: '100%'
            }}
          >
            <Button onClick={saveAddress}>Save address</Button>
          </div>
        </div>
      </Modal>

      {/* Add contact phone (nested) */}
      <Modal
        opened={contactPhoneAddOpen}
        onClose={() => setContactPhoneAddOpen(false)}
        title="Add contact phone"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
        zIndex={10000}
      >
        <Stack>
          <TextInput label="Number" value={newContactPhone.number} onChange={(e) => { const v = e.currentTarget.value; setNewContactPhone((s) => ({ ...s, number: v })); }} />
          <TextInput label="Ext" placeholder="Optional" value={newContactPhone.ext} onChange={(e) => { const v = e.currentTarget.value; setNewContactPhone((s) => ({ ...s, ext: v })); }} />
          <TextInput label="Label" placeholder="e.g., Mobile, Work" value={newContactPhone.label} onChange={(e) => { const v = e.currentTarget.value; setNewContactPhone((s) => ({ ...s, label: v })); }} />
          <Select label="Type" data={[ 'Work', 'Personal' ]} value={newContactPhone.kind || 'Work'} onChange={(v) => setNewContactPhone((s) => ({ ...s, kind: (v as any) || 'Work' }))} allowDeselect={false} w={220} comboboxProps={{ withinPortal: true, zIndex: 11000 }} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setContactPhoneAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const number = newContactPhone.number.trim();
                if (!number) return;
                setContactPhones((arr) => [{ ...newContactPhone, id: `ph-${Date.now()}` }, ...arr]);
                setNewContactPhone({ id: '', number: '', ext: '', label: '', kind: 'Work' });
                setContactPhoneAddOpen(false);
              }}
            >Save phone</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add contact email (nested) */}
      <Modal
        opened={contactEmailAddOpen}
        onClose={() => setContactEmailAddOpen(false)}
        title="Add contact email"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
        zIndex={10000}
      >
        <Stack>
          <TextInput label="Email" value={newContactEmail.email} onChange={(e) => { const v = e.currentTarget.value; setNewContactEmail((s) => ({ ...s, email: v })); }} />
          <TextInput label="Label" placeholder="e.g., Work, Personal" value={newContactEmail.label} onChange={(e) => { const v = e.currentTarget.value; setNewContactEmail((s) => ({ ...s, label: v })); }} />
          <Select
            label="Type"
            data={[ 'Work', 'Personal' ]}
            value={newContactEmail.kind || 'Work'}
            onChange={(v) => setNewContactEmail((s) => ({ ...s, kind: (v as any) || 'Work' }))}
            allowDeselect={false}
            w={220}
            comboboxProps={{ withinPortal: true, zIndex: 11000 }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setContactEmailAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const email = newContactEmail.email.trim();
                if (!email) return;
                setContactEmails((arr) => [{ ...newContactEmail, id: `em-${Date.now()}` }, ...arr]);
                setNewContactEmail({ id: '', email: '', label: '', kind: 'Work' });
                setContactEmailAddOpen(false);
              }}
            >Save email</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add contact address (nested) */}
      <Modal
        opened={contactAddressAddOpen}
        onClose={() => setContactAddressAddOpen(false)}
        title="Add contact address"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
        zIndex={10000}
      >
        <Stack>
          <TextInput label="Label" value={newContactAddress.label || ''} onChange={(e) => { const v = e.currentTarget.value; setNewContactAddress((p) => ({ ...p, label: v })); }} />
          <TextInput label="Line 1" value={newContactAddress.line1 || ''} onChange={(e) => { const v = e.currentTarget.value; setNewContactAddress((p) => ({ ...p, line1: v })); }} />
          <TextInput label="Line 2" value={newContactAddress.line2 || ''} onChange={(e) => { const v = e.currentTarget.value; setNewContactAddress((p) => ({ ...p, line2: v })); }} />
          <Group grow>
            <TextInput label="City" value={newContactAddress.city || ''} onChange={(e) => { const v = e.currentTarget.value; setNewContactAddress((p) => ({ ...p, city: v })); }} />
            <TextInput label="Region/State" value={newContactAddress.region || ''} onChange={(e) => { const v = e.currentTarget.value; setNewContactAddress((p) => ({ ...p, region: v })); }} />
          </Group>
          <Group grow>
            <TextInput label="Postal" value={newContactAddress.postal || ''} onChange={(e) => { const v = e.currentTarget.value; setNewContactAddress((p) => ({ ...p, postal: v })); }} />
            <TextInput label="Country" value={newContactAddress.country || ''} onChange={(e) => { const v = e.currentTarget.value; setNewContactAddress((p) => ({ ...p, country: v })); }} />
          </Group>
          <Group>
            <Radio checked={!!newContactAddress.isHQ} onChange={(e) => { const c = e.currentTarget.checked; setNewContactAddress((p) => ({ ...p, isHQ: c })); }} label="Main office" />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setContactAddressAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const line1 = (newContactAddress.line1 || '').trim();
                if (!line1) return;
                setContactAddresses((arr) => [{ ...newContactAddress, id: `addr-${Date.now()}` }, ...arr]);
                setNewContactAddress({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false });
                setContactAddressAddOpen(false);
              }}
            >Save address</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add contact note (nested) */}
      <Modal
        opened={contactNoteAddOpen}
        onClose={() => setContactNoteAddOpen(false)}
        title="Add contact note"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
        zIndex={10000}
      >
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={8} value={newContactNoteBody} onChange={(e) => setNewContactNoteBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setContactNoteAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const body = newContactNoteBody.trim();
                if (!body) return;
                const nn: Note = {
                  id: `note-${Date.now()}`,
                  title: deriveTitleFromMarkdown(body),
                  body,
                  createdAt: Date.now(),
                  createdByName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Unknown',
                  createdByEmail: authUser?.email || undefined,
                  createdByPhotoURL: authUser?.photoURL || undefined,
                };
                setContactNotes((arr) => [nn, ...arr]);
                setNewContactNoteBody('');
                setContactNoteAddOpen(false);
              }}
            >Save note</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add contact modal */}
      <Modal
        opened={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Add Vendor Contact"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={contactTab} onChange={setContactTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="general">General</Tabs.Tab>
              <Tabs.Tab value="phone">Phone</Tabs.Tab>
              <Tabs.Tab value="email">Email</Tabs.Tab>
              <Tabs.Tab value="address">Address</Tabs.Tab>
              <Tabs.Tab value="notes">Notes</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <Group align="end" grow>
                <TextInput label="Name" value={contactName} onChange={(e) => setContactName(e.currentTarget.value)} required />
                <TextInput label="Title" value={contactTitle} onChange={(e) => setContactTitle(e.currentTarget.value)} />
              </Group>
            </Tabs.Panel>
            <Tabs.Panel value="phone" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Phone</Title>
                <Button
                  variant="light"
                  onClick={() => {
                    setNewContactPhone({ id: '', number: '', ext: '', label: '', kind: 'Work' });
                    setContactPhoneAddOpen(true);
                  }}
                >
                  Add phone
                </Button>
              </Group>
              <Stack mb="md">
                {contactPhones.map((p) => (
                  <Card key={p.id} withBorder padding="sm">
                    <Group justify="space-between" align="center">
                      <Group gap={8}>
                        <Badge>{p.number}</Badge>
                        {p.ext && <Badge color="gray" variant="light">ext {p.ext}</Badge>}
                        {p.label && <Badge color="gray" variant="light">{p.label}</Badge>}
                        {p.kind && <Badge color="blue" variant="light">{p.kind}</Badge>}
                      </Group>
                      <Menu withinPortal position="bottom-end" shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Phone actions">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="5" r="2" fill="currentColor"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                              <circle cx="12" cy="19" r="2" fill="currentColor"/>
                            </svg>
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => { setEditContactPhone({ ...p }); setContactPhoneEditOpen(true); }}>Edit</Menu.Item>
                          <Menu.Item color="red" onClick={() => setContactPhones((arr) => arr.filter((x) => x.id !== p.id))}>Remove</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Card>
                ))}
                {contactPhones.length === 0 && <Text c="dimmed">no phones added</Text>}
              </Stack>
              {/* Add phone handled in a nested modal */}
            </Tabs.Panel>
            <Tabs.Panel value="email" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Email</Title>
                <Button
                  variant="light"
                  onClick={() => {
                    setNewContactEmail({ id: '', email: '', label: '', kind: 'Work' });
                    setContactEmailAddOpen(true);
                  }}
                >
                  Add email
                </Button>
              </Group>
              <Stack mb="md">
                {contactEmails.map((e) => (
                  <Card key={e.id} withBorder padding="sm">
                    <Group justify="space-between" align="center">
                      <Group gap={8}>
                        <Badge>{e.email}</Badge>
                        {e.label && <Badge color="gray" variant="light">{e.label}</Badge>}
                        {e.kind && <Badge color="blue" variant="light">{e.kind}</Badge>}
                      </Group>
                      <Button size="xs" variant="subtle" color="red" onClick={() => setContactEmails((arr) => arr.filter((x) => x.id !== e.id))}>Remove</Button>
                    </Group>
                  </Card>
                ))}
                {contactEmails.length === 0 && <Text c="dimmed">no emails added</Text>}
              </Stack>
              {/* Add email handled in a nested modal */}
            </Tabs.Panel>
            <Tabs.Panel value="address" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Address</Title>
                <Button
                  variant="light"
                  onClick={() => {
                    setNewContactAddress({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false });
                    setContactAddressAddOpen(true);
                  }}
                >
                  Add address
                </Button>
              </Group>
              <Stack mb="md">
                {contactAddresses.map((a) => (
                  <Card key={a.id} withBorder padding="sm">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Group gap="xs">
                          {a.isHQ && <Badge color="orange" variant="filled">Main office</Badge>}
                          {a.label && <Badge variant="light">{a.label}</Badge>}
                        </Group>
                        <Text>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
                        <Text c="dimmed" size="sm">{[a.city, a.region, a.postal, a.country].filter(Boolean).join(', ')}</Text>
                      </div>
                      <Button size="xs" variant="subtle" color="red" onClick={() => setContactAddresses((arr) => arr.filter((x) => x.id !== a.id))}>Remove</Button>
                    </Group>
                  </Card>
                ))}
                {contactAddresses.length === 0 && <Text c="dimmed">no addresses added</Text>}
              </Stack>
              {/* Add address handled in a nested modal */}
            </Tabs.Panel>
            <Tabs.Panel value="notes" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Notes</Title>
                <Button
                  variant="light"
                  onClick={() => {
                    setNewContactNoteBody('');
                    setContactNoteAddOpen(true);
                  }}
                >
                  Add note
                </Button>
              </Group>
              <Stack mb="md">
                {contactNotes.map((n) => (
                  <Card key={n.id} withBorder padding="sm">
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
                      <Button size="xs" variant="subtle" color="red" onClick={() => setContactNotes((arr) => arr.filter((x) => x.id !== n.id))}>Remove</Button>
                    </Group>
                  </Card>
                ))}
                {contactNotes.length === 0 && <Text c="dimmed">no notes added</Text>}
              </Stack>
            </Tabs.Panel>
          </Tabs>
          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--mantine-color-gray-3)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              width: '100%'
            }}
          >
            <Button onClick={addContact}>Save contact</Button>
          </div>
        </div>
      </Modal>
    </EmployerAuthGate>
  );
}
