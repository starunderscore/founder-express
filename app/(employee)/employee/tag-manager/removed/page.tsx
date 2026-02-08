"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Group, Stack, Tabs, Menu, ActionIcon, Modal, Button } from '@mantine/core';
import { useState } from 'react';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import TagDeletePermanentModal from '@/components/tags/TagDeletePermanentModal';
import { restoreTag, deleteTag } from '@/services/tags';
import { DEFAULT_TAG_COLOR } from '@/services/tags/helpers';
 

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

export default function TagManagerRemovedPage() {
  // Removed usage metric in free version

  const [target, setTarget] = useState<TagDoc | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openRestore = (row: TagDoc) => { setTarget(row); setConfirmRestore(true); };
  const openDelete = (row: TagDoc) => { setTarget(row); setConfirmDelete(true); };

  const onConfirmRestore = async () => {
    if (!target) return;
    await restoreTag(target.id);
    setConfirmRestore(false); setTarget(null);
    setRefreshKey((k) => k + 1);
  };

  const columns: Column<TagDoc>[] = [
    { key: 'name', header: 'Tag', render: (r) => (
      <Link href={`/employee/tag-manager/${r.id}`} style={{ textDecoration: 'none' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: (r.color || DEFAULT_TAG_COLOR), color: contrastText(r.color || DEFAULT_TAG_COLOR) }}>
          {r.name || '—'}
        </span>
      </Link>
    )},
    { key: 'description', header: 'Description', render: (r) => (<Text c={r.description ? undefined : 'dimmed'} lineClamp={2}>{r.description || '—'}</Text>) },
    {
      key: 'actions', header: '', width: 1,
      render: (r) => (
        <Group justify="flex-end">
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
              <Menu.Item component={Link as any} href={`/employee/tag-manager/${r.id}` as any}>Edit</Menu.Item>
              <Menu.Item onClick={() => openRestore(r)}>Restore</Menu.Item>
              <Menu.Item color="red" onClick={() => openDelete(r)}>Delete permanently</Menu.Item>
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

        <Tabs value="removed">
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/tag-manager">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/tag-manager/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/tag-manager/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <FirestoreDataTable
            collectionPath="ep_tags"
            columns={columns}
            initialSort={{ field: 'name', direction: 'asc' }}
            clientFilter={(r: any) => (r.status ?? 'active') === 'removed'}
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

        <TagDeletePermanentModal
          opened={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          tagName={target?.name || ''}
          onConfirm={async () => {
            if (!target) return;
            await deleteTag(target.id);
            setConfirmDelete(false); setTarget(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      </Stack>
    </EmployerAdminGate>
  );
}
