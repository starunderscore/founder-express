"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useState, useMemo, useEffect } from 'react';
import { Title, Text, Card, TextInput, Group, Button, Select, Table, Badge, Textarea, MultiSelect, TagsInput, Modal, Tabs, Anchor, ActionIcon, Menu, Avatar, Stack, Alert, CopyButton, SegmentedControl } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type LeadSource, type Note } from '@/services/crm/types';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
// Employees list from Firestore (no Zustand persistence)
import { useAuthUser } from '@/lib/firebase/auth';
import { RouteTabs } from '@/components/RouteTabs';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { archiveCRMRecord, removeCRMRecord } from '@/services/crm';

const SOURCE_OPTIONS: LeadSource[] = ['no-source', 'Website', 'Referral', 'Paid Ads', 'Social', 'Event', 'Import', 'Waiting List', 'Other'];

export default function EmployerCRMPage() {
  const router = useRouter();
  const toast = useToast();
  // FirestoreDataTable handles loading/pagination of the list

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('no-source');
  const [sourceDetail, setSourceDetail] = useState(''); // for 'Other'
  const [openNotes, setOpenNotes] = useState<{ id: string; body: string; createdAt: number }[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  // removed source filter select
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [term, setTerm] = useState('');
  // Top-level list tabs are now navigational links; main page always shows Database
  // Vendors removed from this view; only customers are shown
  const authUser = useAuthUser();
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  useEffect(() => {
    const unsub = onSnapshot(collection(db(), 'employees'), (snap) => {
      const rows: Array<{ id: string; name: string }> = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({ id: d.id, name: data.name || '' });
      });
      setEmployees(rows);
    });
    return () => unsub();
  }, []);
  // Removed/Archive panes moved to dedicated pages; vendor add UI removed from Customers CRM
  // Confirmations for destructive actions
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [targetRecord, setTargetRecord] = useState<any | null>(null);

  // Table columns for new data-table
  const columns: Column<any>[] = useMemo(() => ([
    {
      key: 'name', header: 'Name',
      render: (c: any) => (
        <Anchor component={Link as any} href={`/employee/customers/crm/customer/${c.id}` as any} underline="hover">
          {c.name || '—'}
        </Anchor>
      )
    },
    {
      key: 'email', header: 'Email',
      render: (c: any) => (<Text size="sm">{c.email || '—'}</Text>)
    },
    {
      key: 'actions', header: '', width: 1,
      render: (c: any) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Menu withinPortal position="bottom-end" shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" aria-label="More actions">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="5" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="19" cy="12" r="2" fill="currentColor"/>
                </svg>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link as any} href={`/employee/customers/crm/customer/${c.id}` as any}>View</Menu.Item>
              <Menu.Item onClick={() => { setTargetRecord(c); setConfirmArchiveOpen(true); }}>Archive</Menu.Item>
              <Menu.Item color="red" onClick={() => { setTargetRecord(c); setConfirmRemoveOpen(true); }}>Move to removed</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    },
  ]), []);

  // Remove undefined values before Firestore writes
  const prune = (val: any): any => {
    if (Array.isArray(val)) return val.map((v) => prune(v));
    if (val && typeof val === 'object') {
      const out: any = {};
      Object.entries(val).forEach(([k, v]) => {
        const pv = prune(v);
        if (pv !== undefined) out[k] = pv;
      });
      return out;
    }
    return val === undefined ? undefined : val;
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const notesFromTabs: Note[] = openNotes.map((n) => ({
      id: n.id,
      title: deriveTitleFromMarkdown(n.body),
      body: n.body,
      createdAt: n.createdAt,
      createdByName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Unknown',
      createdByEmail: authUser?.email || undefined,
      createdByPhotoURL: authUser?.photoURL || undefined,
    }));
    const ref = await addDoc(collection(db(), 'crm_customers'), prune({
      name: name.trim(),
      email: email.trim(),
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      source,
      sourceDetail: source === 'Other' ? (sourceDetail.trim() || undefined) : undefined,
      notes: notesFromTabs,
      tags,
      type: 'customer',
      createdAt: Date.now(),
      isArchived: false,
      isBlocked: false,
      doNotContact: false,
    }));
    setName(''); setEmail(''); setCompany(''); setPhone(''); setSource('no-source'); setSourceDetail(''); setOpenNotes([]); setActiveNoteId(null); setTags([]);
    setCustomerModalOpen(false);
    router.push(`/employee/customers/crm/customer/${ref.id}` as any);
  };

  // Vendor create flow removed from this page

  // badges removed; using simple horizontal tabs without status labels

  const addNewNoteTab = () => {
    const id = `note-${Date.now()}`;
    const createdAt = Date.now();
    setOpenNotes((prev) => [{ id, body: '', createdAt }, ...prev]);
    setActiveNoteId(id);
  };

  const closeNoteTab = (id: string) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Close this note? Unsaved content will be lost.');
    if (!ok) return;
    setOpenNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNoteId((curr) => (curr === id ? (openNotes.find((n) => n.id !== id)?.id ?? null) : curr));
  };

  const updateNoteBody = (id: string, body: string) => {
    setOpenNotes((prev) => prev.map((n) => (n.id === id ? { ...n, body } : n)));
  };

  const deriveTitleFromMarkdown = (body: string): string => {
    const text = (body || '').trim();
    if (!text) return 'Note';
    const firstNonEmpty = text.split('\n').find((l) => l.trim().length > 0) || '';
    const cleaned = firstNonEmpty.replace(/^#+\s*/, '').trim();
    return cleaned.slice(0, 60) || 'Note';
  };

  return (
    <EmployerAuthGate>
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/customers')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>CRM</Title>
            <Text c="dimmed">New users automatically appear in CRM (Customer Relationship Management).</Text>
          </div>
        </Group>
        <Group gap="xs">
          <Button variant="light" onClick={() => { setActiveTab('general'); setCustomerModalOpen(true); }}>Add customer</Button>
        </Group>
      </Group>

      {/* Top-level tabs now navigate to dedicated pages */}
      <RouteTabs
        value={"main"}
        mb="md"
        tabs={[
          { value: 'main', label: 'Database', href: '/employee/customers/crm' },
          { value: 'merge', label: 'Merge', href: '/employee/customers/crm/merge' },
          { value: 'archive', label: 'Archive', href: '/employee/customers/crm/archive' },
          { value: 'removed', label: 'Removed', href: '/employee/customers/crm/removed' },
        ]}
      />

      {null}
      {false && (<>

      <Modal
        opened={false}
        onClose={() => {}}
        title="Add vendor"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <form onSubmit={(e) => { e.preventDefault(); onAddVendor(); }}>
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
                <Select label="Source" data={SOURCE_OPTIONS} value={source} onChange={(v) => setSource((v || 'no-source') as LeadSource)} allowDeselect={false} />
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
                  data={employees.map((e) => ({ value: e.id, label: e.name }))}
                  value={ownerId}
                  onChange={(v) => setOwnerId(v)}
                  allowDeselect
                  searchable
                  nothingFoundMessage="No employees"
                />
              </Group>
            </Tabs.Panel>

            <Tabs.Panel value="email" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Email</Title>
                <Button variant="light" onClick={() => { setNewVEmail({ id: '', email: '', label: '', kind: 'Work' }); setVEmailAddOpen(true); }}>Add email</Button>
              </Group>
              <Stack mb="md">
                {vEmails.map((e) => (
                  <Card key={e.id} withBorder padding="sm">
                    <Group justify="space-between" align="center">
                      <Group gap={8}>
                        <Badge variant="light">{e.email}</Badge>
                        {e.label && <Badge color="gray" variant="light">{e.label}</Badge>}
                        {e.kind && <Badge color="blue" variant="light">{e.kind}</Badge>}
                      </Group>
                      <Button size="xs" variant="subtle" color="red" onClick={() => setVEmails((arr) => arr.filter((x) => x.id !== e.id))}>Remove</Button>
                    </Group>
                  </Card>
                ))}
                {vEmails.length === 0 && <Text c="dimmed">no emails added</Text>}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="phone" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Phone</Title>
                <Button variant="light" onClick={() => { setNewVPhone({ id: '', number: '', ext: '', label: '', kind: 'Work' }); setVPhoneAddOpen(true); }}>Add phone</Button>
              </Group>
              <Stack mb="md">
                {vPhones.map((p) => (
                  <Card key={p.id} withBorder padding="sm">
                    <Group justify="space-between" align="center">
                      <Group gap={8}>
                        <Badge variant="light">{p.number}</Badge>
                        {p.ext && <Badge color="gray" variant="light">ext {p.ext}</Badge>}
                        {p.label && <Badge color="gray" variant="light">{p.label}</Badge>}
                        {p.kind && <Badge color="blue" variant="light">{p.kind}</Badge>}
                      </Group>
                      <Button size="xs" variant="subtle" color="red" onClick={() => setVPhones((arr) => arr.filter((x) => x.id !== p.id))}>Remove</Button>
                    </Group>
                  </Card>
                ))}
                {vPhones.length === 0 && <Text c="dimmed">no phones added</Text>}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="address" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Address</Title>
                <Button variant="light" onClick={() => { setNewVAddress({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false }); setVAddressAddOpen(true); }}>Add address</Button>
              </Group>
              <Stack mb="md">
                {vAddresses.map((a) => (
                  <Card key={a.id} withBorder padding="sm">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Group gap="xs">
                          {a.isHQ && <Badge color="orange" variant="filled">HQ</Badge>}
                          {a.label && <Badge variant="light">{a.label}</Badge>}
                        </Group>
                        <Text>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
                        <Text c="dimmed" size="sm">{[a.city, a.region, a.postal, a.country].filter(Boolean).join(', ')}</Text>
                      </div>
                      <Button size="xs" variant="subtle" color="red" onClick={() => setVAddresses((arr) => arr.filter((x) => x.id !== a.id))}>Remove</Button>
                    </Group>
                  </Card>
                ))}
                {vAddresses.length === 0 && <Text c="dimmed">no addresses added</Text>}
              </Stack>
            </Tabs.Panel>

            

            <Tabs.Panel value="notes" style={{ padding: '12px 16px 16px 16px', width: '100%' }}>
              <Group justify="space-between" mb="xs">
                <Title order={5} m={0}>Notes</Title>
                <Button variant="light" onClick={() => { setNewVNoteBody(''); setVNoteAddOpen(true); }}>Add note</Button>
              </Group>
              {vNotes.length > 0 ? (
                <Stack>
                  {vNotes.map((n) => (
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
                        <Button size="xs" variant="subtle" color="red" onClick={() => setVNotes((arr) => arr.filter((x) => x.id !== n.id))}>Remove</Button>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed">no notes added</Text>
              )}
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
            <Button type="submit">Add vendor</Button>
          </div>
          </div>
        </form>
      </Modal>

      {/* Add vendor: nested modals for email/phone/address/note */}
      <Modal
        opened={vEmailAddOpen}
        onClose={() => setVEmailAddOpen(false)}
        title="Add vendor email"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
      >
        <Stack>
          <TextInput label="Email" value={newVEmail.email} onChange={(e) => setNewVEmail((s) => ({ ...s, email: e.currentTarget.value }))} />
          <TextInput label="Label" placeholder="e.g., Billing, Support" value={newVEmail.label || ''} onChange={(e) => setNewVEmail((s) => ({ ...s, label: e.currentTarget.value }))} />
          <Select mt="sm" label="Type" data={[ 'Work', 'Personal' ]} value={newVEmail.kind || 'Work'} onChange={(v) => setNewVEmail((s) => ({ ...s, kind: (v as any) || 'Work' }))} allowDeselect={false} w={220} comboboxProps={{ withinPortal: true, zIndex: 11000 }} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVEmailAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { const email = (newVEmail.email || '').trim(); if (!email) return; setVEmails((arr) => [{ ...newVEmail, id: `em-${Date.now()}` }, ...arr]); setNewVEmail({ id: '', email: '', label: '', kind: 'Work' }); setVEmailAddOpen(false); }}>Save email</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={vPhoneAddOpen}
        onClose={() => setVPhoneAddOpen(false)}
        title="Add vendor phone"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
      >
        <Stack>
          <TextInput label="Number" value={newVPhone.number} onChange={(e) => setNewVPhone((s) => ({ ...s, number: e.currentTarget.value }))} />
          <TextInput label="Ext" placeholder="Optional" value={newVPhone.ext || ''} onChange={(e) => setNewVPhone((s) => ({ ...s, ext: e.currentTarget.value }))} />
          <Select mt="sm" label="Type" data={[ 'Work', 'Personal' ]} value={newVPhone.kind || 'Work'} onChange={(v) => setNewVPhone((s) => ({ ...s, kind: (v as any) || 'Work' }))} allowDeselect={false} w={220} comboboxProps={{ withinPortal: true, zIndex: 11000 }} />
          <TextInput label="Label" placeholder="e.g., Main, Support" value={newVPhone.label || ''} onChange={(e) => setNewVPhone((s) => ({ ...s, label: e.currentTarget.value }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVPhoneAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { const number = (newVPhone.number || '').trim(); if (!number) return; setVPhones((arr) => [{ ...newVPhone, id: `ph-${Date.now()}` }, ...arr]); setNewVPhone({ id: '', number: '', ext: '', label: '', kind: 'Work' }); setVPhoneAddOpen(false); }}>Save phone</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={vAddressAddOpen}
        onClose={() => setVAddressAddOpen(false)}
        title="Add vendor address"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
      >
        <Stack>
          <TextInput label="Label" value={newVAddress.label || ''} onChange={(e) => setNewVAddress((s) => ({ ...s, label: e.currentTarget.value }))} />
          <TextInput label="Line 1" value={newVAddress.line1 || ''} onChange={(e) => setNewVAddress((s) => ({ ...s, line1: e.currentTarget.value }))} />
          <TextInput label="Line 2" value={newVAddress.line2 || ''} onChange={(e) => setNewVAddress((s) => ({ ...s, line2: e.currentTarget.value }))} />
          <Group grow>
            <TextInput label="City" value={newVAddress.city || ''} onChange={(e) => setNewVAddress((s) => ({ ...s, city: e.currentTarget.value }))} />
            <TextInput label="Region/State" value={newVAddress.region || ''} onChange={(e) => setNewVAddress((s) => ({ ...s, region: e.currentTarget.value }))} />
          </Group>
          <Group grow>
            <TextInput label="Postal" value={newVAddress.postal || ''} onChange={(e) => setNewVAddress((s) => ({ ...s, postal: e.currentTarget.value }))} />
            <TextInput label="Country" value={newVAddress.country || ''} onChange={(e) => setNewVAddress((s) => ({ ...s, country: e.currentTarget.value }))} />
          </Group>
          <Group>
            <Radio checked={!!newVAddress.isHQ} onChange={(e) => setNewVAddress((s) => ({ ...s, isHQ: e.currentTarget.checked }))} label="Headquarters" />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVAddressAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { const line1 = (newVAddress.line1 || '').trim(); if (!line1) return; setVAddresses((arr) => [{ ...newVAddress, id: `addr-${Date.now()}` }, ...arr]); setNewVAddress({ id: '', label: '', line1: '', line2: '', city: '', region: '', postal: '', country: '', isHQ: false }); setVAddressAddOpen(false); }}>Save address</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={vNoteAddOpen}
        onClose={() => setVNoteAddOpen(false)}
        title="Add vendor note"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
      >
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={8} value={newVNoteBody} onChange={(e) => setNewVNoteBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVNoteAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { const body = (newVNoteBody || '').trim(); if (!body) return; const nn: Note = { id: `note-${Date.now()}`, title: deriveTitleFromMarkdown(body), body, createdAt: Date.now(), createdByName: authUser?.displayName || authUser?.email?.split('@')[0] || 'Unknown', createdByEmail: authUser?.email || undefined, createdByPhotoURL: authUser?.photoURL || undefined }; setVNotes((arr) => [nn, ...arr]); setNewVNoteBody(''); setVNoteAddOpen(false); }}>Save note</Button>
          </Group>
        </Stack>
      </Modal>
      </>)}

      <Modal
        opened={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Add customer"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <form onSubmit={onAdd}>
          <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={activeTab} onChange={setActiveTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="general">General</Tabs.Tab>
              <Tabs.Tab value="source">Source</Tabs.Tab>
              <Tabs.Tab value="tags">Tags</Tabs.Tab>
              <Tabs.Tab value="notes">Notes</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="general" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <Group align="end" grow>
                <TextInput label="Name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
                <TextInput label="Email" placeholder="jane@company.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
              </Group>
              <Group mt="sm" align="end" grow>
                <TextInput label="Company" placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.currentTarget.value)} />
                <TextInput label="Phone" placeholder="(555) 555-1234" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
              </Group>
            </Tabs.Panel>

            <Tabs.Panel value="source" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <Group align="end" grow>
                <Select label="Source" data={SOURCE_OPTIONS} value={source} onChange={(v) => setSource((v || 'no-source') as LeadSource)} allowDeselect={false} />
              </Group>
              {source === 'Other' && (
                <TextInput mt="sm" label="Other source" placeholder="Describe source" value={sourceDetail} onChange={(e) => setSourceDetail(e.currentTarget.value)} />
              )}
            </Tabs.Panel>

            <Tabs.Panel value="tags" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <TagsInput label="Tags" placeholder="Add tags" value={tags} onChange={setTags} />
            </Tabs.Panel>

            <Tabs.Panel value="notes" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 8, marginBottom: 8, position: 'sticky', top: 0, background: 'var(--mantine-color-body)', width: '100%' }}>
                <Button variant="light" size="xs" onClick={addNewNoteTab} type="button">New note</Button>
                <Tabs.List style={{ flex: 1, width: '100%', overflowX: 'auto' }}>
                  {openNotes.map((n) => (
                    <Tabs.Tab key={n.id} value={n.id} onClick={() => setActiveNoteId(n.id)}>
                      <span>Note</span>
                      <Button size="compact-xs" variant="subtle" color="red" style={{ marginLeft: 8 }} onClick={(e) => { e.stopPropagation(); closeNoteTab(n.id); }}>✕</Button>
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </div>
              <div style={{ width: '100%' }}>
                {openNotes.map((n) => (
                  <div key={n.id} style={{ display: activeNoteId === n.id ? 'block' : 'none' }}>
                    <Textarea
                      label="Markdown"
                      placeholder="Write note in Markdown..."
                      minRows={16}
                      value={n.body}
                      onChange={(e) => updateNoteBody(n.id, e.currentTarget.value)}
                      styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', minHeight: '40vh' } }}
                    />
                  </div>
                ))}
                {openNotes.length === 0 && (
                  <Text size="sm" c="dimmed">No open notes — click New note to start</Text>
                )}
              </div>
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
            <Button type="submit">Add customer</Button>
          </div>
          </div>
        </form>
      </Modal>

      <Card withBorder>
        <div style={{ padding: '12px 0' }}>
          <TextInput
            placeholder="Search name or email"
            value={term}
            onChange={(e) => setTerm(e.currentTarget.value)}
            style={{ width: '100%' }}
          />
        </div>
        <FirestoreDataTable
          collectionPath="crm_customers"
          columns={columns}
          initialSort={{ field: 'name', direction: 'asc' }}
          clientFilter={(r: any) => {
            const q = (term || '').toLowerCase();
            const t = r?.type === 'vendor' ? 'vendor' : 'customer';
            const matches = !q || (String(r.name || '').toLowerCase().includes(q) || String(r.email || '').toLowerCase().includes(q));
            return t === 'customer' && !r.isArchived && !r.deletedAt && matches;
          }}
          defaultPageSize={25}
          enableSelection={false}
        />
      </Card>

      <style jsx>{`
        .crm-type-filter {
          background: var(--mantine-color-gray-3);
          border-radius: var(--mantine-radius-default);
        }
        [data-mantine-color-scheme="dark"] .crm-type-filter {
          background: var(--mantine-color-dark-6);
        }
        .crm-thead { background: var(--mantine-color-gray-2); }
        [data-mantine-color-scheme="dark"] .crm-thead { background: var(--mantine-color-dark-6); }
        [data-mantine-color-scheme="dark"] .crm-thead th { color: var(--mantine-color-white); }
      `}</style>

      {/* Confirm archive modal */}
      <Modal opened={confirmArchiveOpen} onClose={() => setConfirmArchiveOpen(false)} title="Archive record" centered>
        <Stack>
          <Text c="dimmed">Archive removes the record from the Database view and moves it to Archive. You can restore it later.</Text>
          <TextInput label="Name" value={targetRecord?.name || ''} readOnly />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmArchiveOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!targetRecord) return;
              await archiveCRMRecord(targetRecord.id);
              setConfirmArchiveOpen(false);
              setTargetRecord(null);
              toast.show({ title: 'Archived', message: 'Moved to Archive.' });
            }}>Archive</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm remove modal */}
      <Modal opened={confirmRemoveOpen} onClose={() => setConfirmRemoveOpen(false)} title="Move to removed" centered>
        <Stack>
          <Text c="dimmed">This moves the record to Removed. You can restore it later or permanently delete from the Removed page.</Text>
          <TextInput label="Name" value={targetRecord?.name || ''} readOnly />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmRemoveOpen(false)}>Cancel</Button>
            <Button color="red" onClick={async () => {
              if (!targetRecord) return;
              await removeCRMRecord(targetRecord.id);
              setConfirmRemoveOpen(false);
              setTargetRecord(null);
              toast.show({ title: 'Removed', message: 'Moved to Removed.' });
            }}>Move to removed</Button>
          </Group>
        </Stack>
      </Modal>
      
    </EmployerAuthGate>
  );
}
 
