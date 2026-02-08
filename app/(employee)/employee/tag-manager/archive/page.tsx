"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Group, Stack, Text, Title, Tabs, Menu, ActionIcon, Modal } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useToast } from '@/components/ToastProvider';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import TagRemoveModal from '@/components/tags/TagRemoveModal';
import { restoreTag, removeTag } from '@/services/tags';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query } from 'firebase/firestore';

type TagDoc = { id: string; name: string; description?: string; color?: string; status?: 'active'|'archived'|'removed'; createdAt?: number };

const contrastText = (hex?: string): string => {
  if (!hex || !hex.startsWith('#')) return '#fff';
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255; const g = (bigint >> 8) & 255; const b = bigint & 255;
  const srgb = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.5 ? '#000' : '#fff';
};

export default function TagManagerArchivePage() {
  const router = useRouter();
  const toast = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const usageMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of customers) {
      if (Array.isArray(c.tags)) {
        for (const t of c.tags) map[t] = (map[t] || 0) + 1;
      }
    }
    return map;
  }, [customers]);

  useEffect(() => {
    const q = query(collection(db(), 'crm_customers'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: any[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setCustomers(rows);
    });
    return () => unsub();
  }, []);

  const [target, setTarget] = useState<TagDoc | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openRestore = (row: TagDoc) => { setTarget(row); setConfirmRestore(true); };
  const openRemove = (row: TagDoc) => { setTarget(row); setConfirmRemove(true); };

  const onConfirmRestore = async () => {
    if (!target) return;
    await restoreTag(target.id);
    setConfirmRestore(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Tag restored', message: target.name, color: 'green' });
  };
  const onConfirmRemove = async () => {
    if (!target) return;
    await removeTag(target.id);
    setConfirmRemove(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Tag moved to removed', message: target.name, color: 'orange' });
  };

  const columns: Column<TagDoc>[] = [
    { key: 'name', header: 'Tag', render: (r) => (
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: r.color || undefined, color: r.color ? contrastText(r.color) : undefined }}>
        {r.name || '—'}
      </span>
    )},
    { key: 'description', header: 'Description', render: (r) => (<Text c={r.description ? undefined : 'dimmed'} lineClamp={2}>{r.description || '—'}</Text>) },
    { key: 'usage', header: 'Used by', width: 100, accessor: (r) => usageMap[r.id] || 0 },
    {
      key: 'actions', header: '', width: 1,
      render: (r) => (
        <Group justify="flex-end">
          <Menu withinPortal position="bottom-end" shadow="md" width={180}>
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
              <Menu.Item onClick={() => router.push(`/employee/tag-manager/${r.id}`)}>Edit</Menu.Item>
              <Menu.Item onClick={() => openRestore(r)}>Restore</Menu.Item>
              <Menu.Item color="red" onClick={() => openRemove(r)}>Remove</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    }
  ];

  return (
    <EmployerAdminGate>
      <Stack>
        <Title order={2} mb="sm">Tag Manager</Title>
        <Text c="dimmed" mb="md">Create and manage organization-wide tags used across CRM.</Text>

        <Tabs value="archive">
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/tag-manager">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/tag-manager/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/tag-manager/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <FirestoreDataTable
            collectionPath="crm_tags"
            columns={columns}
            initialSort={{ field: 'name', direction: 'asc' }}
            clientFilter={(r: any) => (r.status ?? 'active') === 'archived'}
            defaultPageSize={25}
            enableSelection={false}
            refreshKey={refreshKey}
          />
        </Card>

        <Modal opened={confirmRestore} onClose={() => setConfirmRestore(false)} title="Restore tag" centered>
          <Stack>
            <Text>Restore this tag back to Active?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmRestore(false)}>Cancel</Button>
              <Button onClick={onConfirmRestore}>Restore</Button>
            </Group>
          </Stack>
        </Modal>

        <TagRemoveModal opened={confirmRemove} onClose={() => setConfirmRemove(false)} tagName={target?.name || ''} onConfirm={onConfirmRemove} />
      </Stack>
    </EmployerAdminGate>
  );
}
