"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { Card, Title, Text, Group, Button, TextInput, Badge, Table, Modal, Radio, Tabs, SegmentedControl } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';
import { RouteTabs } from '@/components/RouteTabs';

function MergeWorkspacePageInner() {
  const params = useSearchParams();
  const mode = (params.get('mode') as 'customer' | 'vendor') || 'customer';
  const idsParam = params.get('ids') || '';
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

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
  const router = useRouter();
  const toast = useToast();

  const selected = useMemo(() => customers.filter((c) => ids.includes(c.id)), [customers, idsParam]);

  // Browse-and-select UI state (when no ids provided)
  const active = useMemo(() => customers.filter((c) => !c.deletedAt), [customers]);
  const norm = (s?: string) => (s || '').trim().toLowerCase();
  const [pickMergeMode, setPickMergeMode] = useState<'customer' | 'vendor'>(mode || 'customer');
  const [pickQ, setPickQ] = useState('');
  const pickKeyOf = (r: any) => (pickMergeMode === 'customer' ? norm(r.email) : norm(r.name));
  const pickFiltered = useMemo(() => active.filter((c) => {
    if (c.type !== (pickMergeMode === 'customer' ? 'customer' : 'vendor')) return false;
    const s = norm(pickQ);
    if (!s) return true;
    return norm(c.name).includes(s) || norm(c.email).includes(s);
  }), [active, pickMergeMode, pickQ]);
  const [pickSelected, setPickSelected] = useState<string[]>([]);
  const [pickGroupKey, setPickGroupKey] = useState<string | null>(null);
  const togglePickSel = (id: string) => {
    const rec = active.find((x) => x.id === id);
    if (!rec) return;
    const k = pickKeyOf(rec);
    setPickSelected((arr) => {
      const isSelected = arr.includes(id);
      if (isSelected) {
        const next = arr.filter((x) => x !== id);
        if (next.length === 0) setPickGroupKey(null);
        return next;
      }
      if (!k) {
        toast.show({ title: 'Cannot select', message: pickMergeMode === 'customer' ? 'Customer has no email' : 'Vendor has no name' });
        return arr;
      }
      if (pickGroupKey && k !== pickGroupKey) {
        toast.show({ title: 'Mismatched', message: pickMergeMode === 'customer' ? 'Select customers with the same email' : 'Select vendors with the same name' });
        return arr;
      }
      if (!pickGroupKey) setPickGroupKey(k);
      return [id, ...arr];
    });
  };
  const openPickWorkspace = () => {
    if (pickSelected.length < 2) return;
    const url = `/employee/crm/merge?mode=${pickMergeMode}&ids=${pickSelected.join(',')}`;
    router.push(url as any);
  };

  const [rootId, setRootId] = useState<string | null>(selected[0]?.id || null);
  const root = selected.find((x) => x.id === rootId) || null;
  const donors = selected.filter((x) => x.id !== rootId);
  const [patch, setPatch] = useState<any>({});
  // Scalar value picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerField, setPickerField] = useState<'name' | 'email' | 'company' | 'phone' | null>(null);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerValue, setPickerValue] = useState<string>('');
  // Array item selection (form lists)
  const unionById = (arr: any[] = []) => {
    const m = new Map<string, any>();
    for (const it of arr) if (it?.id && !m.has(it.id)) m.set(it.id, it);
    return Array.from(m.values());
  };
  const allNotes = unionById([...(root?.notes || []), ...donors.flatMap((d) => d.notes || [])]);
  const allEmails = unionById([...(root?.emails || []), ...donors.flatMap((d) => d.emails || [])]);
  const allPhones = unionById([...(root?.phones || []), ...donors.flatMap((d) => d.phones || [])]);
  const allAddresses = unionById([...(root?.addresses || []), ...donors.flatMap((d) => d.addresses || [])]);
  const allContacts = unionById([...(root?.contacts || []), ...donors.flatMap((d) => d.contacts || [])]);
  const [selNotes, setSelNotes] = useState<Set<string>>(new Set(allNotes.map((n:any)=>n.id)));
  const [selEmails, setSelEmails] = useState<Set<string>>(new Set(allEmails.map((n:any)=>n.id)));
  const [selPhones, setSelPhones] = useState<Set<string>>(new Set(allPhones.map((n:any)=>n.id)));
  const [selAddresses, setSelAddresses] = useState<Set<string>>(new Set(allAddresses.map((n:any)=>n.id)));
  const [selContacts, setSelContacts] = useState<Set<string>>(new Set(allContacts.map((n:any)=>n.id)));
  const toggleSet = (setter: (s:Set<string>)=>void, curr: Set<string>, id: string) => {
    const next = new Set(curr); if (next.has(id)) next.delete(id); else next.add(id); setter(next);
  };

  const take = (field: string, value: any) => setPatch((p: any) => ({ ...p, [field]: value }));
  const openPicker = (field: 'name' | 'email' | 'company' | 'phone') => {
    const vals = new Set<string>();
    if (root && (root as any)[field]) vals.add(((root as any)[field] || '').toString());
    donors.forEach((d) => { const v = (d as any)[field]; if (v) vals.add(v.toString()); });
    const opts = Array.from(vals).filter(Boolean);
    setPickerField(field);
    setPickerOptions(opts);
    setPickerValue((patch[field] ?? (root as any)?.[field] ?? '') as string);
    setPickerOpen(true);
  };

  const commit = async (modeCommit: 'update-root' | 'create-new') => {
    if (!root || donors.length === 0) return;
    const merged = { ...root, ...patch } as any;
    // arrays: include only selected
    merged.notes = allNotes.filter((n:any)=>selNotes.has(n.id));
    merged.emails = allEmails.filter((n:any)=>selEmails.has(n.id));
    merged.phones = allPhones.filter((n:any)=>selPhones.has(n.id));
    merged.addresses = allAddresses.filter((n:any)=>selAddresses.has(n.id));
    merged.contacts = allContacts.filter((n:any)=>selContacts.has(n.id));
    const tagSet = new Set([...(root.tags || []), ...donors.flatMap((d) => d.tags || [])]);
    merged.tags = Array.from(tagSet);

    if (modeCommit === 'update-root') {
      await updateDoc(doc(db(), 'crm_customers', root.id), merged as any);
      for (const d of donors) await updateDoc(doc(db(), 'crm_customers', d.id), { deletedAt: Date.now() } as any);
      toast.show({ title: 'Merged', message: `Merged ${donors.length} record(s) into ${root.name}.` });
      router.push(`/employee/crm/${root.type}/${root.id}` as any);
    } else {
      const { id: _omit, createdAt: _c, type, ...rest } = merged;
      const ref = await addDoc(collection(db(), 'crm_customers'), { ...rest, type: root.type, createdAt: Date.now() } as any);
      for (const d of [root, ...donors]) await updateDoc(doc(db(), 'crm_customers', d.id), { deletedAt: Date.now() } as any);
      toast.show({ title: 'Merged', message: `Created new merged record; originals moved to Removed.` });
      router.push(`/employee/crm/${root.type}/${ref.id}` as any);
    }
  };

  return selected.length < 2 ? (
    <EmployerAuthGate>
      <Title order={2} mb="sm">CRM</Title>
      <Text c="dimmed" mb="md">New users automatically appear in CRM (Customer Relationship Management).</Text>
      <RouteTabs
        value={"merge"}
        mb="md"
        tabs={[
          { value: 'main', label: 'Database', href: '/employee/crm' },
          { value: 'merge', label: 'Merge', href: '/employee/crm/merge' },
          { value: 'archive', label: 'Archive', href: '/employee/crm/archive' },
          { value: 'removed', label: 'Removed', href: '/employee/crm/removed' },
        ]}
      />
      <Card withBorder padding={0}>
        <div style={{ padding: '12px 16px' }}>
          <Text c="dimmed" size="sm">Select at least two records. For customers, emails must match; for vendors, names must match. Then click Open merge workspace.</Text>
          <Group justify="flex-start" mt="xs">
            <Button variant="light" disabled={pickSelected.length < 2} onClick={openPickWorkspace}>Open merge workspace</Button>
          </Group>
          <br />
          <Group justify="space-between" align="center" mt="xs">
            <TextInput placeholder="Name or email" value={pickQ} onChange={(e) => setPickQ(e.currentTarget.value)} style={{ flex: 1 }} />
            <SegmentedControl
              data={[ { label: 'Customers', value: 'customer' }, { label: 'Vendors', value: 'vendor' } ]}
              value={pickMergeMode}
              onChange={(v) => setPickMergeMode((v as any) || 'customer')}
              color={pickMergeMode === 'customer' ? 'blue' : 'orange'}
              styles={{ root: { background: 'var(--mantine-color-gray-3)' } }}
            />
          </Group>
        </div>
        <div style={{ padding: 0 }}>
          <Table verticalSpacing="sm" highlightOnHover mt="sm">
            <Table.Thead className="crm-thead">
              <Table.Tr>
                <Table.Th></Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th width={120}>Type</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pickFiltered.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td style={{ width: 1 }}>
                    <input type="checkbox" checked={pickSelected.includes(c.id)} onChange={() => togglePickSel(c.id)} disabled={!!pickGroupKey && pickKeyOf(c) !== pickGroupKey} title={(!pickKeyOf(c) ? (pickMergeMode === 'customer' ? 'Missing email' : 'Missing name') : (pickGroupKey && pickKeyOf(c) !== pickGroupKey ? 'Select with matching key' : '')) || ''} />
                  </Table.Td>
                  <Table.Td>{c.name}</Table.Td>
                  <Table.Td><Text size="sm">{c.email || '—'}</Text></Table.Td>
                  <Table.Td><Badge color={c.type === 'vendor' ? 'orange' : 'blue'} variant="light">{c.type === 'vendor' ? 'Vendor' : 'Customer'}</Badge></Table.Td>
                </Table.Tr>
              ))}
              {pickFiltered.length === 0 && (
                <Table.Tr><Table.Td colSpan={4}><Text c="dimmed">No records</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Card>
      <style jsx>{`
        .crm-thead { background: var(--mantine-color-gray-2); }
        [data-mantine-color-scheme="dark"] .crm-thead { background: var(--mantine-color-dark-6); }
        [data-mantine-color-scheme="dark"] .crm-thead th { color: var(--mantine-color-white); }
      `}</style>
    </EmployerAuthGate>
  ) : (
    <EmployerAuthGate>
      <Title order={2} mb="sm">CRM</Title>
      <Text c="dimmed" mb="md">New users automatically appear in CRM (Customer Relationship Management).</Text>
      <RouteTabs
        value={"merge"}
        mb="md"
        tabs={[
          { value: 'main', label: 'Database', href: '/employee/crm' },
          { value: 'merge', label: 'Merge', href: '/employee/crm/merge' },
          { value: 'archive', label: 'Archive', href: '/employee/crm/archive' },
          { value: 'removed', label: 'Removed', href: '/employee/crm/removed' },
        ]}
      />
      <Card withBorder padding={0}>
        <div style={{ padding: '12px 16px' }}>
          <Title order={4} mb={4}>Merge workspace</Title>
          <Text c="dimmed" size="sm">Mode: {mode === 'customer' ? 'Customers (by email)' : 'Vendors (by name)'}</Text>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <Title order={6} mb={6}>Selected</Title>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="crm-thead">
              <Table.Tr>
                <Table.Th>Root</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Type</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {selected.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td style={{ width: 1 }}>
                    <input type="radio" name="root" checked={rootId === c.id} onChange={() => setRootId(c.id)} />
                  </Table.Td>
                  <Table.Td>{c.name}</Table.Td>
                  <Table.Td><Text size="sm">{c.email || '—'}</Text></Table.Td>
                  <Table.Td><Badge color={c.type === 'vendor' ? 'orange' : 'blue'} variant="light">{c.type === 'vendor' ? 'Vendor' : 'Customer'}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Title order={6} mb={6}>Fields</Title>
          <Table withRowBorders={false} verticalSpacing="xs">
            <Table.Thead className="crm-thead">
              <Table.Tr>
                <Table.Th>Key</Table.Th>
                <Table.Th>Root value</Table.Th>
                <Table.Th>Final value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {([
                { key: 'Name', field: 'name' },
                { key: 'Email', field: 'email' },
                { key: 'Company', field: 'company' },
                { key: 'Phone', field: 'phone' },
              ] as any[]).map((row) => (
                <Table.Tr key={row.field}>
                  <Table.Td>{row.key}</Table.Td>
                  <Table.Td><Text size="sm">{(root as any)?.[row.field] || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Button variant="light" onClick={() => openPicker(row.field)}>
                      {((patch as any)[row.field] ?? (root as any)?.[row.field] ?? '') || 'Choose…'}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
        <Card withBorder padding={0} style={{ margin: '12px 16px' }}>
          <div style={{ padding: '12px 16px' }}>
            <Title order={6} mb={8}>Lists</Title>
          </div>
          <div style={{ padding: '0 12px 12px 12px' }}>
            {/* Emails */}
            <div style={{ marginBottom: 12 }}>
              <Group justify="space-between" mb={4}><Text fw={600}>Emails</Text><Group gap={4}><Button size="xs" variant="light" onClick={()=>setSelEmails(new Set(allEmails.map((x:any)=>x.id)))}>All</Button><Button size="xs" variant="light" onClick={()=>setSelEmails(new Set())}>None</Button></Group></Group>
              <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, padding: 8 }}>
                {allEmails.map((e:any)=>(
                  <label key={e.id} style={{ display:'block', marginBottom:6 }}>
                    <input type="checkbox" checked={selEmails.has(e.id)} onChange={()=>toggleSet(setSelEmails, selEmails, e.id)} />{' '}
                    <Text span size="sm">{e.email}</Text>{' '}{e.label && <Badge variant="light">{e.label}</Badge>}
                  </label>
                ))}
                {allEmails.length===0 && <Text c="dimmed" size="sm">No emails</Text>}
              </div>
            </div>
            {/* Phones */}
            <div style={{ marginBottom: 12 }}>
              <Group justify="space-between" mb={4}><Text fw={600}>Phones</Text><Group gap={4}><Button size="xs" variant="light" onClick={()=>setSelPhones(new Set(allPhones.map((x:any)=>x.id)))}>All</Button><Button size="xs" variant="light" onClick={()=>setSelPhones(new Set())}>None</Button></Group></Group>
              <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, padding: 8 }}>
                {allPhones.map((p:any)=>(
                  <label key={p.id} style={{ display:'block', marginBottom:6 }}>
                    <input type="checkbox" checked={selPhones.has(p.id)} onChange={()=>toggleSet(setSelPhones, selPhones, p.id)} />{' '}
                    <Text span size="sm">{p.number}</Text>{p.ext && <Text span size="sm"> ext {p.ext}</Text>}{' '}{p.label && <Badge variant="light">{p.label}</Badge>}
                  </label>
                ))}
                {allPhones.length===0 && <Text c="dimmed" size="sm">No phones</Text>}
              </div>
            </div>
            {/* Addresses */}
            <div style={{ marginBottom: 12 }}>
              <Group justify="space-between" mb={4}><Text fw={600}>Addresses</Text><Group gap={4}><Button size="xs" variant="light" onClick={()=>setSelAddresses(new Set(allAddresses.map((x:any)=>x.id)))}>All</Button><Button size="xs" variant="light" onClick={()=>setSelAddresses(new Set())}>None</Button></Group></Group>
              <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, padding: 8 }}>
                {allAddresses.map((a:any)=>(
                  <label key={a.id} style={{ display:'block', marginBottom:6 }}>
                    <input type="checkbox" checked={selAddresses.has(a.id)} onChange={()=>toggleSet(setSelAddresses, selAddresses, a.id)} />{' '}
                    <Text span size="sm">{a.line1}{a.line2 ? `, ${a.line2}`:''}</Text>
                  </label>
                ))}
                {allAddresses.length===0 && <Text c="dimmed" size="sm">No addresses</Text>}
              </div>
            </div>
            {/* Contacts */}
            <div style={{ marginBottom: 12 }}>
              <Group justify="space-between" mb={4}><Text fw={600}>Contacts</Text><Group gap={4}><Button size="xs" variant="light" onClick={()=>setSelContacts(new Set(allContacts.map((x:any)=>x.id)))}>All</Button><Button size="xs" variant="light" onClick={()=>setSelContacts(new Set())}>None</Button></Group></Group>
              <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, padding: 8 }}>
                {allContacts.map((c:any)=>(
                  <label key={c.id} style={{ display:'block', marginBottom:6 }}>
                    <input type="checkbox" checked={selContacts.has(c.id)} onChange={()=>toggleSet(setSelContacts, selContacts, c.id)} />{' '}
                    <Text span size="sm">{c.name}</Text>{c.title && <Text span size="sm"> — {c.title}</Text>}
                  </label>
                ))}
                {allContacts.length===0 && <Text c="dimmed" size="sm">No contacts</Text>}
              </div>
            </div>
            {/* Notes (last) */}
            <div>
              <Group justify="space-between" mb={4}><Text fw={600}>Notes</Text><Group gap={4}><Button size="xs" variant="light" onClick={()=>setSelNotes(new Set(allNotes.map((x:any)=>x.id)))}>All</Button><Button size="xs" variant="light" onClick={()=>setSelNotes(new Set())}>None</Button></Group></Group>
              <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, padding: 8 }}>
                {allNotes.map((n:any)=>(
                  <label key={n.id} style={{ display:'block', marginBottom:6 }}>
                    <input type="checkbox" checked={selNotes.has(n.id)} onChange={()=>toggleSet(setSelNotes, selNotes, n.id)} />{' '}
                    <Text size="sm" lineClamp={2} style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: '80%' }}>{n.body || n.title || 'Note'}</Text>
                  </label>
                ))}
                {allNotes.length===0 && <Text c="dimmed" size="sm">No notes</Text>}
              </div>
            </div>
          </div>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => router.push('/employee/crm')}>Cancel</Button>
            <Button onClick={() => commit('update-root')}>Merge into root</Button>
            <Button variant="light" onClick={() => commit('create-new')}>Create new merged</Button>
          </Group>
        </Card>
      </Card>

      {/* Value picker modal */}
      <Modal opened={pickerOpen} onClose={() => setPickerOpen(false)} title={`Select value for ${pickerField || ''}`} centered>
        <Group align="flex-start">
          <div style={{ maxHeight: 280, overflow: 'auto', width: '100%' }}>
            {pickerOptions.map((opt) => (
              <label key={opt} style={{ display: 'block', marginBottom: 6 }}>
                <Radio value={opt} checked={pickerValue === opt} onChange={() => setPickerValue(opt)} />{' '}
                <Text span size="sm">{opt || '—'}</Text>
              </label>
            ))}
            {pickerOptions.length === 0 && <Text c="dimmed" size="sm">No values available</Text>}
          </div>
        </Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setPickerOpen(false)}>Cancel</Button>
          <Button onClick={() => { if (pickerField) take(pickerField as any, pickerValue); setPickerOpen(false); }}>Use selected</Button>
        </Group>
      </Modal>
    </EmployerAuthGate>
  );
}

export default function MergeWorkspacePage() {
  return (
    <Suspense fallback={null}>
      <MergeWorkspacePageInner />
    </Suspense>
  );
}
