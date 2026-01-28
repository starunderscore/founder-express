"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { type Note, type Contact, type Phone, type Email, type Address } from '@/state/crmStore';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Title, Text, Group, Badge, Button, Stack, Tabs, ActionIcon, Avatar, Textarea, Modal, Anchor, TextInput, Table, Select, Radio, Menu, CopyButton, Switch, Divider, Alert, Center, Loader } from '@mantine/core';
import Link from 'next/link';
import { useAuthUser } from '@/lib/firebase/auth';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, updateDoc, query } from 'firebase/firestore';

export default function VendorContactDetailPage({ params }: { params: { id: string } }) {
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
  const authUser = useAuthUser();
  const toast = useToast();

  const { vendor, contact } = useMemo(() => {
    for (const v of customers) {
      if (v.type !== 'vendor') continue;
      const c = (v.contacts || []).find((x: Contact) => x.id === params.id);
      if (c) return { vendor: v, contact: c };
    }
    return { vendor: null as any, contact: null as any };
  }, [customers, params.id]);

  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [cName, setCName] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editActiveTab, setEditActiveTab] = useState<string | null>('overview');
  const [editPhonesOpen, setEditPhonesOpen] = useState(false);
  const [editEmailsOpen, setEditEmailsOpen] = useState(false);
  const [editAddressesOpen, setEditAddressesOpen] = useState(false);
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [cPhoneNumber, setCPhoneNumber] = useState('');
  const [cPhoneExt, setCPhoneExt] = useState('');
  const [cPhoneLabel, setCPhoneLabel] = useState('');
  const [cPhoneKind, setCPhoneKind] = useState<'Work' | 'Personal'>('Work');
  const [cEmailValue, setCEmailValue] = useState('');
  const [cEmailLabel, setCEmailLabel] = useState('');
  const [cEmailKind, setCEmailKind] = useState<'Work' | 'Personal'>('Work');
  const [cAddr, setCAddr] = useState<{ label?: string; line1?: string; line2?: string; city?: string; region?: string; postal?: string; country?: string; isHQ?: boolean }>({});
  const [deletePhoneOpen, setDeletePhoneOpen] = useState(false);
  const [deletePhoneId, setDeletePhoneId] = useState<string | null>(null);
  const [deletePhoneSnippet, setDeletePhoneSnippet] = useState('');
  const [deletePhoneInput, setDeletePhoneInput] = useState('');
  const [deleteEmailOpen, setDeleteEmailOpen] = useState(false);
  const [deleteEmailId, setDeleteEmailId] = useState<string | null>(null);
  const [deleteEmailSnippet, setDeleteEmailSnippet] = useState('');
  const [deleteEmailInput, setDeleteEmailInput] = useState('');
  const [deleteAddressOpen, setDeleteAddressOpen] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [deleteAddressSnippet, setDeleteAddressSnippet] = useState('');
  const [deleteAddressInput, setDeleteAddressInput] = useState('');
  // contact actions
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [deleteContactSnippet, setDeleteContactSnippet] = useState('');
  const [deleteContactInput, setDeleteContactInput] = useState('');
  const [archiveContactOpen, setArchiveContactOpen] = useState(false);
  const [archiveContactInput, setArchiveContactInput] = useState('');
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleteInput, setPermDeleteInput] = useState('');

  useEffect(() => {
    if (contact) {
      setCName(contact.name || '');
      setCTitle(contact.title || '');
    }
  }, [contact?.id]);

  if (!vendor || !contact) {
    return (
      <EmployerAuthGate>
        <Center mih={240}><Loader size="sm" /></Center>
      </EmployerAuthGate>
    );
  }

  const addNote = async () => {
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
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
    setNoteBody('');
    setNoteOpen(false);
  };

  const saveOverview = async () => {
    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, name: cName.trim() || c.name, title: cTitle.trim() || undefined } : c));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
  };

  const deriveTitleFromMarkdown = (body: string): string => {
    const text = (body || '').trim();
    if (!text) return 'Note';
    const firstNonEmpty = text.split('\n').find((l) => l.trim().length > 0) || '';
    const cleaned = firstNonEmpty.replace(/^#+\s*/, '').trim();
    return cleaned.slice(0, 60) || 'Note';
  };

  const saveContactPhone = async () => {
    const number = cPhoneNumber.trim();
    if (!number) return;
    let phones = (contact.phones || []);
    if (editingPhoneId) {
      phones = phones.map((p: Phone) => (p.id === editingPhoneId ? { ...p, number, ext: cPhoneExt.trim() || undefined, label: cPhoneLabel.trim() || undefined, kind: cPhoneKind } : p));
    } else {
      phones = [{ id: `ph-${Date.now()}`, number, ext: cPhoneExt.trim() || undefined, label: cPhoneLabel.trim() || undefined, kind: cPhoneKind }, ...phones];
    }
    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, phones } : c));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
    setCPhoneNumber(''); setCPhoneExt(''); setCPhoneLabel(''); setCPhoneKind('Work'); setEditingPhoneId(null); setEditPhonesOpen(false);
  };

  const saveContactEmail = async () => {
    const email = cEmailValue.trim();
    if (!email) return;
    let emails = (contact.emails || []);
    if (editingEmailId) {
      emails = emails.map((e: Email) => (e.id === editingEmailId ? { ...e, email, label: cEmailLabel.trim() || undefined, kind: cEmailKind } : e));
    } else {
      emails = [{ id: `em-${Date.now()}`, email, label: cEmailLabel.trim() || undefined, kind: cEmailKind }, ...emails];
    }
    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, emails } : c));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
    setCEmailValue(''); setCEmailLabel(''); setCEmailKind('Work'); setEditingEmailId(null); setEditEmailsOpen(false);
  };

  const saveContactAddress = async () => {
    const line1 = (cAddr.line1 || '').trim();
    if (!line1) return;
    let addresses = (contact.addresses || []);
    if (editingAddressId) {
      addresses = addresses.map((a: Address) => (a.id === editingAddressId ? { ...a, label: cAddr.label?.trim() || undefined, line1, line2: cAddr.line2?.trim() || undefined, city: cAddr.city?.trim() || undefined, region: cAddr.region?.trim() || undefined, postal: cAddr.postal?.trim() || undefined, country: cAddr.country?.trim() || undefined, isHQ: !!cAddr.isHQ } : a));
    } else {
      const a = { id: `addr-${Date.now()}`, label: cAddr.label?.trim() || undefined, line1, line2: cAddr.line2?.trim() || undefined, city: cAddr.city?.trim() || undefined, region: cAddr.region?.trim() || undefined, postal: cAddr.postal?.trim() || undefined, country: cAddr.country?.trim() || undefined, isHQ: !!cAddr.isHQ };
      addresses = [a, ...addresses];
    }
    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, addresses } : c));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
    setCAddr({}); setEditingAddressId(null); setEditAddressesOpen(false);
  };

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(`/employee/crm/vendor/${vendor.id}/contacts`)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group>
            <Title order={4}>
              {vendor.name}
            </Title>
            <Badge color="orange" variant="filled">Vendor</Badge>
          </Group>
        </Group>
      </Group>

      <Group justify="space-between" mb="md" align="flex-end">
        <div>
          <Group gap="xs" align="center">
            <Title order={2} style={{ lineHeight: 1 }}>{contact.name}</Title>
            <Badge color="grape" variant="filled">Contact</Badge>
            {contact.doNotContact && <Badge color="yellow" variant="filled">Do Not Contact</Badge>}
          </Group>
          {contact.title && (
            <Text size="sm" c="dimmed" style={{ marginTop: 4 }}>{contact.title}</Text>
          )}
        </div>
        <Group gap="xs">
          {(contact.emails?.length || 0) > 0 && <Badge variant="light">{contact.emails!.length} email{contact.emails!.length === 1 ? '' : 's'}</Badge>}
          {(contact.phones?.length || 0) > 0 && <Badge variant="light">{contact.phones!.length} phone{contact.phones!.length === 1 ? '' : 's'}</Badge>}
          {(contact.addresses?.length || 0) > 0 && <Badge variant="light">{contact.addresses!.length} address{contact.addresses!.length === 1 ? '' : 'es'}</Badge>}
        </Group>
      </Group>

      <RouteTabs
        value={"overview"}
        tabs={[
          { value: 'overview', label: 'Overview', href: `/employee/crm/vendor/contact/${contact.id}` },
          { value: 'notes', label: 'Notes', href: `/employee/crm/vendor/contact/${contact.id}/notes` },
          { value: 'actions', label: 'Actions', href: `/employee/crm/vendor/contact/${contact.id}/actions` },
        ]}
      />

      <div style={{ paddingTop: 'var(--mantine-spacing-md)' }}>
          {contact.deletedAt && (
            <Alert color="red" variant="light" mb="md" title="Removed">
              <Group justify="space-between" align="center">
                <Text>This contact is removed and appears in the Removed tab.</Text>
                <Group gap="xs">
                  <Button variant="light" onClick={async () => {
                    const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, deletedAt: undefined } : c));
                    await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
                    toast.show({ title: 'Contact restored', message: 'Contact is back in Database.' });
                  }}>Restore</Button>
                  <Button variant="subtle" color="red" onClick={() => { setPermDeleteInput(''); setPermDeleteOpen(true); }}>Permanently delete</Button>
                </Group>
              </Group>
            </Alert>
          )}
          {contact.doNotContact && (
            <Alert color="yellow" variant="light" mb="md" title="Do not contact">
              This contact is marked as Do Not Contact.
            </Alert>
          )}
          {contact.isArchived && (
            <Alert color="gray" variant="light" mb="md" title="Archived">
              <Group justify="space-between" align="center">
                <Text>This contact is archived and hidden from active workflows.</Text>
                <Button variant="light" onClick={async () => { const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, isArchived: false } : c)); await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any); }}>Unarchive</Button>
              </Group>
            </Alert>
          )}
          <Card withBorder radius="md" mb="md" style={{ borderLeft: '4px solid var(--mantine-color-grape-6)', background: 'linear-gradient(90deg, var(--mantine-color-grape-0), transparent 40%)' }}>
            <Stack gap={4}>
              <Group justify="space-between">
                <Title order={4}>General</Title>
                <Button variant="light" onClick={() => setEditOpen(true)}>Edit</Button>
              </Group>
              <Stack gap={10}>
                <Stack gap={2}>
                  <Text c="dimmed" size="xs">Name</Text>
                  <Text size="sm">{contact.name || '—'}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text c="dimmed" size="xs">Title</Text>
                  <Text size="sm">{contact.title || '—'}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text c="dimmed" size="xs">Joined</Text>
                  <Text size="sm">{contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '—'}</Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>

          <Card withBorder radius="md" mb="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Phones</Title>
              <Button variant="default" onClick={() => { setEditActiveTab('phone'); setEditPhonesOpen(true); }}>Edit</Button>
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
                {(contact.phones || []).map((p: Phone) => (
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
                          <Menu.Item onClick={() => { setCPhoneNumber(p.number); setCPhoneExt(p.ext || ''); setCPhoneLabel(p.label || ''); setCPhoneKind((p.kind as any) || 'Work'); setEditingPhoneId(p.id); setEditActiveTab('phone'); setEditPhonesOpen(true); }}>Edit</Menu.Item>
                          <Menu.Item color="red" onClick={() => { setDeletePhoneId(p.id); setDeletePhoneSnippet(p.number); setDeletePhoneInput(''); setDeletePhoneOpen(true); }}>Delete</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {(contact.phones || []).length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text c="dimmed">No phones</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>

          <Card withBorder radius="md" mb="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Emails</Title>
              <Button variant="default" onClick={() => { setEditActiveTab('email'); setEditEmailsOpen(true); }}>Edit</Button>
            </div>
            <Table verticalSpacing="sm" highlightOnHover striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Label</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(contact.emails || []).map((e: Email) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>{e.email}</Table.Td>
                    <Table.Td>{e.label || '—'}</Table.Td>
                    <Table.Td>{e.kind || '—'}</Table.Td>
                    <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                      <Menu withinPortal position="bottom-end" shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Email actions">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="5" r="2" fill="currentColor"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                              <circle cx="12" cy="19" r="2" fill="currentColor"/>
                            </svg>
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => { setCEmailValue(e.email); setCEmailLabel(e.label || ''); setCEmailKind((e.kind as any) || 'Work'); setEditingEmailId(e.id); setEditActiveTab('email'); setEditEmailsOpen(true); }}>Edit</Menu.Item>
                          <Menu.Item color="red" onClick={() => { setDeleteEmailId(e.id); setDeleteEmailSnippet(e.email); setDeleteEmailInput(''); setDeleteEmailOpen(true); }}>Delete</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {(contact.emails || []).length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text c="dimmed">No emails</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>

          <Card withBorder radius="md" padding={0}>
            <div style={{ padding: '12px 16px', background: 'var(--mantine-color-dark-6)', color: 'var(--mantine-color-white)', borderBottom: '1px solid var(--mantine-color-dark-7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title order={4} m={0} style={{ color: 'inherit' }}>Addresses</Title>
              <Button variant="default" onClick={() => { setEditActiveTab('address'); setEditAddressesOpen(true); }}>Edit</Button>
            </div>
            <Table verticalSpacing="sm" highlightOnHover striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Address</Table.Th>
                  <Table.Th>Label</Table.Th>
                  <Table.Th>Main office</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(contact.addresses || []).map((a: Address) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Text>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
                      <Text size="sm" c="dimmed">{[a.city, a.region, a.postal, a.country].filter(Boolean).join(', ')}</Text>
                    </Table.Td>
                    <Table.Td>{a.label || '—'}</Table.Td>
                    <Table.Td>{a.isHQ ? <Badge color="orange" variant="light">Yes</Badge> : '—'}</Table.Td>
                    <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                      <Menu withinPortal position="bottom-end" shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Address actions">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="5" r="2" fill="currentColor"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                              <circle cx="12" cy="19" r="2" fill="currentColor"/>
                            </svg>
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => { setCAddr({ label: a.label, line1: a.line1, line2: a.line2, city: a.city, region: a.region, postal: a.postal, country: a.country, isHQ: a.isHQ }); setEditingAddressId(a.id); setEditActiveTab('address'); setEditAddressesOpen(true); }}>Edit</Menu.Item>
                          <Menu.Item color="red" onClick={() => { const snippet = (a.line1 || '').slice(0, 10); setDeleteAddressId(a.id); setDeleteAddressSnippet(snippet); setDeleteAddressInput(''); setDeleteAddressOpen(true); }}>Delete</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {(contact.addresses || []).length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text c="dimmed">No addresses</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
      </div>

        

        


      <Modal opened={noteOpen} onClose={() => setNoteOpen(false)} title="Add note" closeOnClickOutside={false} closeOnEscape={false} centered size="lg">
        <Stack>
          <Textarea label="Markdown" placeholder="Write note in Markdown..." minRows={8} value={noteBody} onChange={(e) => setNoteBody(e.currentTarget.value)} styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }} />
          <Group justify="flex-end">
            <Button onClick={addNote}>Save note</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permanently delete contact modal */}
      <Modal opened={permDeleteOpen} onClose={() => setPermDeleteOpen(false)} title="Permanently delete contact" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">This action cannot be undone. Type the exact contact name to confirm permanent deletion.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Contact name" value={contact?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={contact?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type contact name" value={permDeleteInput} onChange={(e) => setPermDeleteInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPermDeleteOpen(false)}>Cancel</Button>
            <Button color="red" disabled={(contact?.name?.length || 0) > 0 && permDeleteInput !== (contact?.name || '')} onClick={async () => {
              if (!vendor || !contact) return;
              const contacts = (vendor.contacts || []).filter((c: Contact) => c.id !== contact.id);
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
              setPermDeleteOpen(false);
              toast.show({ title: 'Contact deleted', message: 'Permanently deleted.' });
              router.push(`/employee/crm/vendor/${vendor.id}`);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Remove contact modal */}
      <Modal opened={deleteContactOpen} onClose={() => setDeleteContactOpen(false)} title="Remove contact" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Move this contact to Removed. You can permanently delete it from the Removed tab later. Type the identifier to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Identifier" value={deleteContactSnippet} readOnly style={{ flex: 1 }} />
            <CopyButton value={deleteContactSnippet}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type" value={deleteContactInput} onChange={(e) => setDeleteContactInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteContactOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deleteContactSnippet.length > 0 && deleteContactInput !== deleteContactSnippet} onClick={async () => {
              if (!vendor || !contact) return;
              const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, deletedAt: Date.now() } : c));
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
              setDeleteContactOpen(false);
              toast.show({ title: 'Contact removed', message: 'Moved to Removed. You can restore or permanently delete it from the Removed tab.' });
              router.push(`/employee/crm/vendor/${vendor.id}`);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Archive contact modal */}
      <Modal opened={archiveContactOpen} onClose={() => setArchiveContactOpen(false)} title="Archive contact" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">Archiving hides this contact from active workflows. Type the contact name to confirm.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Contact name" value={contact?.name || ''} readOnly style={{ flex: 1 }} />
            <CopyButton value={contact?.name || ''}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type contact name" value={archiveContactInput} onChange={(e) => setArchiveContactInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setArchiveContactOpen(false)}>Cancel</Button>
            <Button color="orange" disabled={(contact?.name?.length || 0) > 0 && archiveContactInput !== (contact?.name || '')} onClick={async () => {
              if (!vendor || !contact) return;
              const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, isArchived: true } : c));
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
              setArchiveContactOpen(false);
              toast.show({ title: 'Contact archived', message: 'Moved to Archive.' });
            }}>Archive</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete phone modal */}
      <Modal opened={deletePhoneOpen} onClose={() => setDeletePhoneOpen(false)} title="Delete phone" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">To confirm deletion, type the full phone number.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Snippet" value={deletePhoneSnippet} readOnly style={{ flex: 1 }} />
            <CopyButton value={deletePhoneSnippet}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type snippet" value={deletePhoneInput} onChange={(e) => setDeletePhoneInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeletePhoneOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deletePhoneSnippet.length > 0 && deletePhoneInput !== deletePhoneSnippet} onClick={async () => {
              if (!deletePhoneId) return;
              const phones = (contact.phones || []).filter((p: Phone) => p.id !== deletePhoneId);
              const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, phones } : c));
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
              setDeletePhoneOpen(false);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete email modal */}
      <Modal opened={deleteEmailOpen} onClose={() => setDeleteEmailOpen(false)} title="Delete email" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">To confirm deletion, type the full email address.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Snippet" value={deleteEmailSnippet} readOnly style={{ flex: 1 }} />
            <CopyButton value={deleteEmailSnippet}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type snippet" value={deleteEmailInput} onChange={(e) => setDeleteEmailInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteEmailOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deleteEmailSnippet.length > 0 && deleteEmailInput !== deleteEmailSnippet} onClick={async () => {
              if (!deleteEmailId) return;
              const emails = (contact.emails || []).filter((em: Email) => em.id !== deleteEmailId);
              const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, emails } : c));
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
              setDeleteEmailOpen(false);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete address modal */}
      <Modal opened={deleteAddressOpen} onClose={() => setDeleteAddressOpen(false)} title="Delete address" closeOnClickOutside={false} closeOnEscape={false} centered size="md">
        <Stack>
          <Text c="dimmed">To confirm deletion, type the first 10 characters of line 1.</Text>
          <Group align="end" gap="sm">
            <TextInput label="Snippet" value={deleteAddressSnippet} readOnly style={{ flex: 1 }} />
            <CopyButton value={deleteAddressSnippet}>{({ copied, copy }) => (<Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>)}</CopyButton>
          </Group>
          <TextInput label="Type here to confirm" placeholder="Paste or type snippet" value={deleteAddressInput} onChange={(e) => setDeleteAddressInput(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteAddressOpen(false)}>Cancel</Button>
            <Button color="red" disabled={deleteAddressSnippet.length > 0 && deleteAddressInput !== deleteAddressSnippet} onClick={async () => {
              if (!deleteAddressId) return;
              const addresses = (contact.addresses || []).filter((ad: Address) => ad.id !== deleteAddressId);
              const contacts = (vendor.contacts || []).map((c: Contact) => (c.id === contact.id ? { ...c, addresses } : c));
              await updateDoc(doc(db(), 'crm_customers', vendor.id), { contacts } as any);
              setDeleteAddressOpen(false);
            }}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      </div>

      {/* Edit overview modal */}
      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Vendor Contact"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={editActiveTab} onChange={setEditActiveTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <Group align="end" grow>
                <TextInput label="Name" value={cName} onChange={(e) => setCName(e.currentTarget.value)} required />
                <TextInput label="Title" value={cTitle} onChange={(e) => setCTitle(e.currentTarget.value)} />
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
            <Button onClick={() => { saveOverview(); setEditOpen(false); }}>Save changes</Button>
          </div>
        </div>
      </Modal>

      {/* Edit phones modal */}
      <Modal
        opened={editPhonesOpen}
        onClose={() => setEditPhonesOpen(false)}
        title="Edit contact phone"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={editActiveTab} onChange={setEditActiveTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="phone">Phone</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="phone" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <TextInput label="Number" value={cPhoneNumber} onChange={(e) => setCPhoneNumber(e.currentTarget.value)} required />
              <TextInput mt="sm" label="Ext" placeholder="Optional" value={cPhoneExt} onChange={(e) => setCPhoneExt(e.currentTarget.value)} />
              <Select mt="sm" label="Type" data={[ 'Work', 'Personal' ]} value={cPhoneKind} onChange={(v) => setCPhoneKind(((v as any) || 'Work') as any)} allowDeselect={false} w={220} comboboxProps={{ withinPortal: true, zIndex: 11000 }} />
              <TextInput mt="sm" label="Label" placeholder="e.g., Mobile, Work" value={cPhoneLabel} onChange={(e) => setCPhoneLabel(e.currentTarget.value)} />
            </Tabs.Panel>
          </Tabs>
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button onClick={saveContactPhone}>Save phone</Button>
          </div>
        </div>
      </Modal>

      {/* Edit emails modal */}
      <Modal
        opened={editEmailsOpen}
        onClose={() => setEditEmailsOpen(false)}
        title="Edit contact email"
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        size="80%"
        padding={0}
        styles={{ header: { padding: '12px 16px' }, title: { margin: 0, fontWeight: 600 }, body: { padding: 0 } }}
      >
        <div style={{ minHeight: '45vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Tabs value={editActiveTab} onChange={setEditActiveTab} radius="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Tabs.List style={{ width: '100%' }}>
              <Tabs.Tab value="email">Email</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="email" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <TextInput label="Email" value={cEmailValue} onChange={(e) => setCEmailValue(e.currentTarget.value)} required />
              <TextInput mt="sm" label="Label" placeholder="e.g., Work, Personal" value={cEmailLabel} onChange={(e) => setCEmailLabel(e.currentTarget.value)} />
              <Select mt="sm" label="Type" data={[ 'Work', 'Personal' ]} value={cEmailKind} onChange={(v) => setCEmailKind(((v as any) || 'Work') as any)} allowDeselect={false} w={220} comboboxProps={{ withinPortal: true, zIndex: 11000 }} />
            </Tabs.Panel>
          </Tabs>
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button onClick={saveContactEmail}>Save email</Button>
          </div>
        </div>
      </Modal>

      {/* Edit addresses modal */}
      <Modal
        opened={editAddressesOpen}
        onClose={() => setEditAddressesOpen(false)}
        title="Edit contact address"
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
              <Tabs.Tab value="address">Address</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="address" style={{ padding: '12px 16px 0 16px', width: '100%' }}>
              <TextInput label="Label" value={cAddr.label || ''} onChange={(e) => { const v = e.currentTarget.value; setCAddr((p) => ({ ...p, label: v })); }} />
              <TextInput mt="sm" label="Line 1" required value={cAddr.line1 || ''} onChange={(e) => { const v = e.currentTarget.value; setCAddr((p) => ({ ...p, line1: v })); }} />
              <TextInput mt="sm" label="Line 2" value={cAddr.line2 || ''} onChange={(e) => { const v = e.currentTarget.value; setCAddr((p) => ({ ...p, line2: v })); }} />
              <Group mt="sm" grow>
                <TextInput label="City" value={cAddr.city || ''} onChange={(e) => { const v = e.currentTarget.value; setCAddr((p) => ({ ...p, city: v })); }} />
                <TextInput label="Region/State" value={cAddr.region || ''} onChange={(e) => { const v = e.currentTarget.value; setCAddr((p) => ({ ...p, region: v })); }} />
              </Group>
              <Group mt="sm" grow>
                <TextInput label="Postal" value={cAddr.postal || ''} onChange={(e) => { const v = e.currentTarget.value; setCAddr((p) => ({ ...p, postal: v })); }} />
                <TextInput label="Country" value={cAddr.country || ''} onChange={(e) => { const v = e.currentTarget.value; setCAddr((p) => ({ ...p, country: v })); }} />
              </Group>
              <Group mt="sm">
                <Radio checked={!!cAddr.isHQ} onChange={(e) => { const c = e.currentTarget.checked; setCAddr((p) => ({ ...p, isHQ: c })); }} label="Main office" />
              </Group>
            </Tabs.Panel>
          </Tabs>
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--mantine-color-gray-3)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <Button onClick={saveContactAddress}>Save address</Button>
          </div>
        </div>
      </Modal>
    </EmployerAuthGate>
  );
}
