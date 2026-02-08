"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { type LeadSource, type Note, type Phone } from '@/state/crmStore';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RouteTabs } from '@/components/RouteTabs';
import { Card, Title, Text, Group, Badge, Button, Stack, Select, Modal, Tabs, TextInput, Avatar, ActionIcon, Menu, CopyButton, Table, Textarea, Switch, Alert, Divider, MultiSelect, Center, Loader } from '@mantine/core';
import { useAuthUser, sendPasswordReset } from '@/lib/firebase/auth';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc, deleteDoc, collection } from 'firebase/firestore';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
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
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setCustomer(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null);
        setLoading(false);
      },
      () => {
        setCustomer(null);
        setLoading(false);
      }
    );
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
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  // General edit modal state
  const [editGeneralOpen, setEditGeneralOpen] = useState(false);
  const [gName, setGName] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gSource, setGSource] = useState<LeadSource>('no-source');
  const [gSourceDetail, setGSourceDetail] = useState('');
  const [gTags, setGTags] = useState<string[]>([]);
  const [gOwnerId, setGOwnerId] = useState<string | null>(null);
  const SOURCE_OPTIONS: LeadSource[] = ['no-source','Website','Referral','Paid Ads','Social','Event','Import','Waiting List','Other'];
  const [tagOptions, setTagOptions] = useState<{ value: string; label: string }[]>([]);

  // Load tag options from Tag Manager (Firestore)
  useEffect(() => {
    const unsub = onSnapshot(collection(db(), 'ep_crm_tags'), (snap) => {
      const rows: { value: string; label: string; createdAt: number }[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const name = (data.name || '').toString();
        if (!name) return;
        rows.push({ value: name, label: name, createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0 });
      });
      rows.sort((a, b) => (b.createdAt - a.createdAt) || a.label.localeCompare(b.label));
      setTagOptions(rows.map(({ value, label }) => ({ value, label })));
    });
    return () => unsub();
  }, []);
  // Actions/delete state
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [deleteCustomerInput, setDeleteCustomerInput] = useState('');
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleteInput, setPermDeleteInput] = useState('');
  const [archiveCustomerOpen, setArchiveCustomerOpen] = useState(false);
  const [archiveCustomerInput, setArchiveCustomerInput] = useState('');

  const openEditNote = (id: string) => {
    const note = (customer?.notes || []).find((n: Note) => n.id === id);
    if (!note) return;
    setEditNoteId(id);
    setEditNoteBody(note.body || '');
    setEditNoteOpen(true);
  };

  // prune undefined from nested structures
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

  const saveEditNote = async () => {
    if (!customer || !editNoteId) return;
    const body = editNoteBody.trim();
    const title = deriveTitleFromMarkdown(body);
    const notes = (customer.notes || []).map((n: Note) => (n.id === editNoteId ? { ...n, body, title } : n));
    await updateDoc(doc(db(), 'crm_customers', customer.id), { notes: prune(notes) });
    setEditNoteOpen(false);
  };
  const openDeleteNote = (id: string) => {
    if (!customer) return;
    const note = (customer.notes || []).find((n: Note) => n.id === id);
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
    const notes = (customer.notes || []).filter((n: Note) => n.id !== deleteNoteId);
    await updateDoc(doc(db(), 'crm_customers', customer.id), { notes: prune(notes) });
    setDeleteNoteOpen(false);
  };

  // Phones (many) and Email (single) management
  const [editPhonesOpen, setEditPhonesOpen] = useState(false);
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneExt, setPhoneExt] = useState('');
  const [phoneLabel, setPhoneLabel] = useState('');
  const [phoneKind, setPhoneKind] = useState<'Work' | 'Personal'>('Work');
  const [deletePhoneOpen, setDeletePhoneOpen] = useState(false);
  const [deletePhoneId, setDeletePhoneId] = useState<string | null>(null);
  const [deletePhoneSnippet, setDeletePhoneSnippet] = useState('');
  const [deletePhoneInput, setDeletePhoneInput] = useState('');
  // removed standalone email edit modal state

  const savePhone = async () => {
    if (!customer) return;
    const num = phoneNumber.trim();
    if (!num) return;
    let phones = (customer.phones || []);
    if (editingPhoneId) {
      phones = phones.map((p: Phone) => (p.id === editingPhoneId ? { ...p, number: num, ext: phoneExt.trim() || undefined, label: phoneLabel.trim() || undefined, kind: phoneKind } : p));
    } else {
      phones = [{ id: `ph-${Date.now()}`, number: num, ext: phoneExt.trim() || undefined, label: phoneLabel.trim() || undefined, kind: phoneKind }, ...phones];
    }
    await updateDoc(doc(db(), 'crm_customers', customer.id), { phones: prune(phones) });
    setPhoneNumber(''); setPhoneExt(''); setPhoneLabel(''); setPhoneKind('Work'); setEditingPhoneId(null); setEditPhonesOpen(false);
  };

  // removed standalone email save handler

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

  // removed legacy edit customer modal state

  // removed legacy edit customer modal handlers

  if (loading) {
    return (
      <EmployerAuthGate>
        <Center mih={200}>
          <Loader size="sm" />
        </Center>
      </EmployerAuthGate>
    );
  }

  if (!customer) {
    return (
      <EmployerAuthGate>
        <Stack>
          <Title order={3}>Customer not found</Title>
          <Button variant="light" onClick={() => router.push('/employee/customers/crm')}>Back to CRM</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/customers/crm')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={2}>
              {customer.name}
            </Title>
            <Badge color="blue" variant="filled">Customer</Badge>
            {customer.isBlocked && <Badge color="red" variant="filled">Blocked</Badge>}
            {customer.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
            {customer.isArchived && <Badge color="gray" variant="light">Archived</Badge>}
          </Group>
        </Group>
      </Group>


      <RouteTabs
        value={"overview"}
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/customers/crm/customer/${customer.id}` },
          { value: 'notes', label: 'Notes', href: `/employee/customers/crm/customer/${customer.id}/notes` },
          { value: 'actions', label: 'Actions', href: `/employee/customers/crm/customer/${customer.id}/actions` },
        ]}
      />

      <div style={{ paddingTop: 'var(--mantine-spacing-md)' }}>
      {customer?.deletedAt && (
        <Alert color="red" variant="light" mb="md" title="Removed">
          <Group justify="space-between" align="center">
            <Text>This customer is removed and appears in the Removed tab.</Text>
            <Group gap="xs">
              <Button variant="light" onClick={async () => { await updateDoc(doc(db(), 'crm_customers', customer.id), { deletedAt: null }); toast.show({ title: 'Customer restored', message: 'Customer is back in Database.' }); }}>Restore</Button>
              <Button variant="subtle" color="red" onClick={() => { setPermDeleteInput(''); setPermDeleteOpen(true); }}>Permanently delete</Button>
            </Group>
          </Group>
        </Alert>
      )}
      {customer?.isArchived && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This customer is archived and hidden from the Database view.</Text>
            <Button variant="light" onClick={async () => { await updateDoc(doc(db(), 'crm_customers', customer.id), { isArchived: false }); toast.show({ title: 'Customer restored', message: 'Unarchived back to Database.' }); }}>Unarchive</Button>
          </Group>
        </Alert>
      )}
      {customer.isBlocked && (
        <Alert color="red" variant="light" mb="md" title="Blocked">
          This customer is blocked and cannot access their account.
        </Alert>
      )}
      <Card withBorder radius="md" className="customer-general-card" style={{ borderLeft: '4px solid var(--mantine-color-blue-6)' }} mb="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={4}>General</Title>
            <Button
              variant="default"
              onClick={() => {
                if (!customer) return;
                setGName(customer.name || '');
                setGEmail(customer.email || '');
                setGSource((customer.source as LeadSource) || 'no-source');
                setGSourceDetail(customer.source === 'Other' ? (customer.sourceDetail || '') : '');
                setGTags(Array.isArray(customer.tags) ? customer.tags : []);
                setGOwnerId(typeof customer.ownerId === 'string' ? customer.ownerId : null);
                setEditGeneralOpen(true);
              }}
            >
              Edit
            </Button>
          </Group>
          <Stack gap={6}>
            <Text c="dimmed" size="sm">Name</Text>
            <Text>{customer.name || '—'}</Text>
          </Stack>
          <Stack gap={6}>
            <Text c="dimmed" size="sm">Email</Text>
            <Text>{customer.email || '—'}</Text>
          </Stack>
          <Stack gap={6}>
            <Text c="dimmed" size="sm">Source</Text>
            <Group gap={6}>
              <Badge color="blue" variant="light">{customer.source}</Badge>
              {customer.source === 'Other' && customer.sourceDetail && (
                <Text size="sm">({customer.sourceDetail})</Text>
              )}
            </Group>
          </Stack>
          <Stack gap={6}>
            <Text c="dimmed" size="sm">Tags</Text>
            <Group gap={6} wrap="wrap">
              {(customer.tags && customer.tags.length > 0) ? customer.tags.map((t: string) => (<Badge key={t} variant="light">{t}</Badge>)) : <Text>—</Text>}
            </Group>
          </Stack>
          <Stack gap={6}>
            <Text c="dimmed" size="sm">Account owner</Text>
            <Group gap={6}>
              {customer.ownerId ? (
                <Badge variant="light">{employees.find((e) => e.id === customer.ownerId)?.name || 'Unknown'}</Badge>
              ) : (
                <Badge color="gray" variant="light">Unassigned</Badge>
              )}
            </Group>
          </Stack>
          <Stack gap={6}>
            <Text c="dimmed" size="sm">Joined</Text>
            <Text>{new Date(customer.createdAt).toLocaleDateString()}</Text>
          </Stack>
        </Stack>
      </Card>

      {/* Email card removed; email shown in General */}

      {/* Phones (many) */}
      <Card withBorder radius="md" padding={0} mb="md">
        <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title order={4} m={0} style={{ color: 'inherit' }}>Phones</Title>
          <Button variant="default" onClick={() => { setEditingPhoneId(null); setPhoneNumber(''); setPhoneExt(''); setPhoneLabel(''); setPhoneKind('Work'); setEditPhonesOpen(true); }}>Edit</Button>
        </div>
        <Table verticalSpacing="sm" highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Number</Table.Th>
              <Table.Th>Ext</Table.Th>
              <Table.Th>Label</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
      <Table.Tbody>
        {(customer.phones || []).map((p: Phone) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.number}</Table.Td>
                <Table.Td>{p.ext || '—'}</Table.Td>
                <Table.Td>{p.label || '—'}</Table.Td>
                <Table.Td>{p.kind || '—'}</Table.Td>
                <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
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
                      <Menu.Item onClick={() => { setEditingPhoneId(p.id); setPhoneNumber(p.number); setPhoneExt(p.ext || ''); setPhoneLabel(p.label || ''); setPhoneKind((p.kind as any) || 'Work'); setEditPhonesOpen(true); }}>Edit</Menu.Item>
                      <Menu.Item color="red" onClick={() => { setDeletePhoneId(p.id); setDeletePhoneSnippet(p.number); setDeletePhoneInput(''); setDeletePhoneOpen(true); }}>Delete</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
            {(customer.phones || []).length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed">No phones</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
      </Table>
    </Card>

      </div>

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
            <Button onClick={addNote}>Save note</Button>
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

      {/* Remove customer modal */}
      <Modal opened={deleteCustomerOpen} onClose={() => setDeleteCustomerOpen(false)} title="Remove customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Move this customer to Removed. You can permanently delete it from the Removed tab later. Type the customer email to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Email" value={customer.email} readOnly style={{ flex: 1 }} />
            <CopyButton value={customer.email}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type email" value={deleteCustomerInput} onChange={(e) => setDeleteCustomerInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteCustomerOpen(false)}>Cancel</Button>
            <Button color="red" disabled={customer.email.length > 0 && deleteCustomerInput !== customer.email} onClick={async () => {
              await updateDoc(doc(db(), 'crm_customers', customer.id), { deletedAt: Date.now() });
              setDeleteCustomerOpen(false);
              toast.show({ title: 'Customer removed', message: 'Moved to Removed. You can restore or permanently delete it from the Removed tab.', color: 'green' });
            }}>Remove</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive customer modal */}
      <Modal opened={archiveCustomerOpen} onClose={() => setArchiveCustomerOpen(false)} title="Archive customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Archiving hides this customer from the Database view. Type the customer name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Customer name" value={customer.name} readOnly style={{ flex: 1 }} />
            <CopyButton value={customer.name}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type customer name" value={archiveCustomerInput} onChange={(e) => setArchiveCustomerInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setArchiveCustomerOpen(false)}>Cancel</Button>
            <Button color="orange" disabled={customer.name.length > 0 && archiveCustomerInput !== customer.name} onClick={async () => {
              await updateDoc(doc(db(), 'crm_customers', customer.id), { isArchived: true });
              setArchiveCustomerOpen(false);
              toast.show({ title: 'Customer archived', message: 'Moved to Archive.' });
            }}>Archive</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete customer modal */}
      <Modal opened={permDeleteOpen} onClose={() => setPermDeleteOpen(false)} title="Permanently delete customer" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">This action cannot be undone. Type the exact customer name to confirm permanent deletion.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Customer name" value={customer.name} readOnly style={{ flex: 1 }} />
            <CopyButton value={customer.name}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type customer name" value={permDeleteInput} onChange={(e) => setPermDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPermDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={customer.name.length > 0 && permDeleteInput !== customer.name} onClick={async () => {
              await deleteDoc(doc(db(), 'crm_customers', customer.id));
              setPermDeleteOpen(false);
              toast.show({ title: 'Customer deleted', message: 'Permanently deleted.' });
              router.push('/employee/customers/crm');
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* removed legacy edit customer modal */}

      {/* Phones modals */}
      {/* Edit general info modal */}
      <Modal opened={editGeneralOpen} onClose={() => setEditGeneralOpen(false)} title="Edit customer" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Group grow>
            <TextInput label="Name" value={gName} onChange={(e) => setGName(e.currentTarget.value)} required />
            <TextInput label="Email" value={gEmail} onChange={(e) => setGEmail(e.currentTarget.value)} required />
          </Group>
          <Group grow>
            <Select label="Source" data={SOURCE_OPTIONS} value={gSource} onChange={(v) => setGSource(((v as any) || 'no-source') as any)} allowDeselect={false} />
            {gSource === 'Other' && (
              <TextInput label="Source detail" placeholder="Describe source" value={gSourceDetail} onChange={(e) => setGSourceDetail(e.currentTarget.value)} />
            )}
          </Group>
          <MultiSelect
            label="Tags"
            placeholder="Search and select tags"
            searchable
            data={tagOptions}
            value={gTags}
            onChange={setGTags}
            comboboxProps={{ withinPortal: true }}
          />
          <Select
            label="Account owner"
            placeholder="Unassigned"
            data={employees.map((e) => ({ value: e.id, label: e.name }))}
            value={gOwnerId}
            onChange={(v) => setGOwnerId((v as string) || null)}
            clearable
            comboboxProps={{ withinPortal: true }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setEditGeneralOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!customer) return;
              const patch: any = {
                name: gName.trim(),
                email: gEmail.trim(),
                source: gSource,
                sourceDetail: gSource === 'Other' ? (gSourceDetail.trim() || undefined) : undefined,
                tags: gTags,
                ownerId: gOwnerId || undefined,
              };
              await updateDoc(doc(db(), 'crm_customers', customer.id), prune(patch));
              setEditGeneralOpen(false);
              toast.show({ title: 'Saved', message: 'Customer updated.', color: 'green' });
            }}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Phones modals */}
      <Modal
        opened={editPhonesOpen}
        onClose={() => setEditPhonesOpen(false)}
        title="Edit customer phone"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="md"
      >
        <Stack>
          <TextInput label="Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.currentTarget.value)} />
          <TextInput label="Ext" placeholder="Optional" value={phoneExt} onChange={(e) => setPhoneExt(e.currentTarget.value)} />
          <Select mt="sm" label="Type" data={[ 'Work', 'Personal' ]} value={phoneKind} onChange={(v) => setPhoneKind(((v as any) || 'Work') as any)} allowDeselect={false} w={220} comboboxProps={{ withinPortal: true, zIndex: 11000 }} />
          <TextInput label="Label" placeholder="e.g., Mobile, Work" value={phoneLabel} onChange={(e) => setPhoneLabel(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setEditPhonesOpen(false)}>Cancel</Button>
            <Button onClick={savePhone}>Save phone</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Standalone email edit modal removed */}

      {/* Delete phone modal */}
      <Modal opened={deletePhoneOpen} onClose={() => setDeletePhoneOpen(false)} title="Delete phone" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">To confirm deletion, type the full phone number.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Snippet" value={deletePhoneSnippet} readOnly style={{ flex: 1 }} />
            <CopyButton value={deletePhoneSnippet}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type number" value={deletePhoneInput} onChange={(e) => setDeletePhoneInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeletePhoneOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deletePhoneSnippet.length > 0 && deletePhoneInput !== deletePhoneSnippet} onClick={async () => {
              if (!customer || !deletePhoneId) return;
              const phones = (customer.phones || []).filter((p: Phone) => p.id !== deletePhoneId);
              await updateDoc(doc(db(), 'crm_customers', customer.id), { phones: prune(phones) });
              setDeletePhoneOpen(false);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
      <style jsx>{`
        .customer-general-card {
          background: linear-gradient(90deg, var(--mantine-color-blue-0), transparent 60%);
        }
        [data-mantine-color-scheme="dark"] .customer-general-card {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), transparent 60%);
        }
      `}</style>
    </EmployerAuthGate>
  );
}

// Helper to derive a title from first markdown line
const deriveTitleFromMarkdown = (body: string): string => {
  const text = (body || '').trim();
  if (!text) return 'Note';
  const firstNonEmpty = text.split('\n').find((l) => l.trim().length > 0) || '';
  const cleaned = firstNonEmpty.replace(/^#+\s*/, '').trim();
  return cleaned.slice(0, 60) || 'Note';
};
