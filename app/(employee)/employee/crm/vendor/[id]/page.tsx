"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { type LeadSource, type Note, type Address, type Contact, type Phone, type Email } from '@/state/crmStore';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Title, Text, Group, Badge, Button, Stack, Divider, Modal, TextInput, Select, TagsInput, Textarea, Radio, Tabs, ActionIcon, Avatar, Menu, CopyButton, Anchor, Table, Switch, Alert } from '@mantine/core';
import Link from 'next/link';
import { RouteTabs } from '@/components/RouteTabs';
import VendorEditModal from '@/components/crm/vendor/VendorEditModal';
import VendorRemoveModal from '@/components/crm/vendor/VendorRemoveModal';
import VendorDeleteModal from '@/components/crm/vendor/VendorDeleteModal';
import VendorArchiveModal from '@/components/crm/vendor/VendorArchiveModal';
import VendorOrgEmailModal from '@/components/crm/vendor/VendorOrgEmailModal';
import VendorOrgPhoneModal from '@/components/crm/vendor/VendorOrgPhoneModal';
import VendorNoteItemModal from '@/components/crm/vendor/VendorNoteItemModal';
import VendorAddressModal from '@/components/crm/vendor/VendorAddressModal';
import { useAuthUser } from '@/lib/firebase/auth';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc, deleteDoc, collection } from 'firebase/firestore';

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isVendorsSection = typeof window !== 'undefined' && window.location.pathname.startsWith('/employee/customers/vendors');
  const baseVendor = isVendorsSection ? '/employee/customers/vendors' : '/employee/crm/vendor';
  const baseList = isVendorsSection ? '/employee/customers/vendors' : '/employee/crm';
  const [vendor, setVendor] = useState<any | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(ref, (snap) => setVendor(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null));
    return () => unsub();
  }, [params.id]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db(), 'employees'), (snap: any) => {
      const rows: Array<{ id: string; name: string }> = [];
      snap.forEach((d: any) => {
        const data = d.data() as any;
        rows.push({ id: d.id, name: data.name || '' });
      });
      setEmployees(rows);
    });
    return () => unsub();
  }, []);
  const toast = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrTab, setAddrTab] = useState<string | null>('general');
  // Removed contact add/edit modals; contacts live on dedicated pages
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


  const [addr, setAddr] = useState<Partial<Address>>({});
  const [addrPhone, setAddrPhone] = useState('');

  
  const authUser = useAuthUser();
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleteInput, setPermDeleteInput] = useState('');


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

  // vendor Note modals and handlers were removed; notes live on dedicated route

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
      const emails = (vendor.emails || []).map((e: Email) => (e.id === noteItemId ? { ...e, notes: [...(e.notes || []), note] } : e));
      await updateDoc(doc(db(), 'crm_customers', vendor.id), { emails } as any);
    } else {
      const phones = (vendor.phones || []).map((p: Phone) => (p.id === noteItemId ? { ...p, notes: [...(p.notes || []), note] } : p));
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
    if (a.isHQ) addresses = addresses.map((x: Address) => ({ ...x, isHQ: false }));
    addresses = [a, ...addresses];
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { addresses } as any);
    setAddr({}); setAddrPhone(''); setAddrOpen(false);
  };

  const setHQ = async (id: string) => {
    const addresses = (vendor.addresses || []).map((x: Address) => ({ ...x, isHQ: x.id === id }));
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { addresses } as any);
  };

  const deleteAddress = async (id: string) => {
    const addresses = (vendor.addresses || []).filter((x: Address) => x.id !== id);
    await updateDoc(doc(db(), 'crm_customers', vendor.id), { addresses } as any);
  };

  // Contact creation/editing handled on dedicated pages

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
          <Button variant="light" onClick={() => router.push(baseList)}>Back to CRM</Button>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(baseList)}>
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

      <RouteTabs
        value={"overview"}
        tabs={[
          { value: 'overview', label: 'Overview', href: `${baseVendor}/${vendor.id}` },
          { value: 'notes', label: 'Notes', href: `${baseVendor}/${vendor.id}/notes` },
          { value: 'contacts', label: 'Contacts', href: `${baseVendor}/${vendor.id}/contacts` },
          { value: 'actions', label: 'Actions', href: `${baseVendor}/${vendor.id}/actions` },
        ]}
      />

      <div style={{ paddingTop: 'var(--mantine-spacing-md)' }}>
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

          <Card id="overview-core" withBorder radius="md" className="vendor-general-card" style={{ borderLeft: '4px solid var(--mantine-color-orange-6)' }}>
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
                  {(vendor.tags && vendor.tags.length > 0) ? vendor.tags.map((t: string) => (<Badge key={t} variant="light">{t}</Badge>)) : <Text>—</Text>}
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
              {(vendor.emails || []).map((e: Email) => (
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
              {(vendor.addresses || []).map((a: Address) => (
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
                      {a.phones.map((p: any) => (<Badge key={p.id} variant="light">{p.number}</Badge>))}
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
              {(vendor.phones || []).map((p: Phone) => (
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
      </div>

        
        
          
        
          

      {/* Extracted modals */}
      <>
      <VendorEditModal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        vendor={vendor}
        employees={employees}
        onSave={async (patch: { name: string; source: string; sourceDetail?: string; tags: string[]; ownerId?: string | null; }) => {
          if (!vendor) return;
          await updateDoc(doc(db(), 'crm_customers', vendor.id), patch as any);
          toast.show({ title: 'Saved', message: 'Vendor updated.', color: 'green' });
        }}
      />
      <VendorRemoveModal
        opened={deleteVendorOpen}
        onClose={() => setDeleteVendorOpen(false)}
        vendorName={vendor?.name || ''}
        onConfirm={async () => {
          if (!vendor) return;
          await updateDoc(doc(db(), 'crm_customers', vendor.id), { deletedAt: Date.now() } as any);
          setDeleteVendorOpen(false);
          toast.show({ title: 'Vendor removed', message: 'Moved to Removed. You can restore or permanently delete it from the Removed tab.' });
        }}
      />
      <VendorDeleteModal
        opened={permDeleteOpen}
        onClose={() => setPermDeleteOpen(false)}
        vendorName={vendor?.name || ''}
        onDelete={async () => {
          if (!vendor) return;
          await deleteDoc(doc(db(), 'crm_customers', vendor.id));
          setPermDeleteOpen(false);
          toast.show({ title: 'Vendor deleted', message: 'Permanently deleted.' });
          router.push('/employee/crm');
        }}
      />
      </>

      {/* Archive vendor modal */}
      <VendorArchiveModal
        opened={archiveVendorOpen}
        onClose={() => setArchiveVendorOpen(false)}
        vendorName={vendor?.name || ''}
        onArchive={async () => {
          if (!vendor) return;
          await updateDoc(doc(db(), 'crm_customers', vendor.id), { isArchived: true } as any);
          setArchiveVendorOpen(false);
          toast.show({ title: 'Vendor archived', message: 'Moved to Archive.' });
        }}
      />

      

      

      <VendorOrgEmailModal
        opened={orgEmailOpen}
        onClose={() => setOrgEmailOpen(false)}
        onSave={async ({ email, label }) => {
          if (!vendor) return;
          const e: Email = { id: `em-${Date.now()}`, email, label: label || undefined, notes: [] };
          const emails = Array.isArray(vendor.emails) ? [e, ...vendor.emails] : [e];
          await updateDoc(doc(db(), 'crm_customers', vendor.id), { emails } as any);
        }}
      />

      <VendorOrgPhoneModal
        opened={orgPhoneOpen}
        onClose={() => setOrgPhoneOpen(false)}
        onSave={async ({ number, ext, label }) => {
          if (!vendor) return;
          const p: Phone = { id: `ph-${Date.now()}`, number, ext: ext || undefined, label: label || undefined, notes: [] } as any;
          const phones = Array.isArray(vendor.phones) ? [p, ...vendor.phones] : [p];
          await updateDoc(doc(db(), 'crm_customers', vendor.id), { phones } as any);
        }}
      />

      <VendorNoteItemModal
        opened={noteItemOpen}
        onClose={() => setNoteItemOpen(false)}
        onSave={async (body: string) => {
          // reuse existing handler logic
          setNoteItemBody(body);
          await saveNoteForItem();
        }}
      />
      <VendorAddressModal
        opened={addrOpen}
        onClose={() => setAddrOpen(false)}
        onSave={async (data) => {
          if (!vendor) return;
          const a: Address = {
            id: `addr-${Date.now()}`,
            label: data.label?.trim() || undefined,
            line1: data.line1.trim(),
            line2: data.line2?.trim() || undefined,
            city: data.city?.trim() || undefined,
            region: data.region?.trim() || undefined,
            postal: data.postal?.trim() || undefined,
            country: data.country?.trim() || undefined,
            isHQ: !!data.isHQ,
            phones: data.phoneNumber?.trim() ? [{ id: `ph-${Date.now()}`, number: data.phoneNumber.trim() }] : [],
          } as any;
          let addresses = Array.isArray(vendor.addresses) ? [...vendor.addresses] : [];
          if (a.isHQ) addresses = addresses.map((x: Address) => ({ ...x, isHQ: false }));
          addresses = [a, ...addresses];
          await updateDoc(doc(db(), 'crm_customers', vendor.id), { addresses } as any);
        }}
      />

      
      <style jsx>{`
        .vendor-general-card {
          background: linear-gradient(90deg, var(--mantine-color-orange-0), transparent 60%);
        }
        [data-mantine-color-scheme="dark"] .vendor-general-card {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), transparent 60%);
        }
      `}</style>
    </EmployerAuthGate>
  );
}
