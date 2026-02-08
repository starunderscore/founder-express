"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Group, Stack, Text, Title, Tabs, Menu, ActionIcon, Modal, TextInput, Textarea, ColorInput, Popover, ColorPicker } from '@mantine/core';
import { IconPalette } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { archiveTag, removeTag, createTag } from '@/services/tags';
import { DEFAULT_TAG_COLOR } from '@/services/tags/helpers';
import { useToast } from '@/components/ToastProvider';
import TagRemoveModal from '@/components/tags/TagRemoveModal';
 

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

export default function TagManagerPage() {
  const router = useRouter();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | undefined>(DEFAULT_TAG_COLOR);
  const [desc, setDesc] = useState('');

  // Removed usage metric in free version

  const [target, setTarget] = useState<TagDoc | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openArchive = (row: TagDoc) => { setTarget(row); setConfirmArchive(true); };
  const openRemove = (row: TagDoc) => { setTarget(row); setConfirmRemove(true); };

  const onArchive = async () => {
    if (!target) return;
    await archiveTag(target.id);
    setConfirmArchive(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Tag archived', message: target.name, color: 'green' });
  };
  const onRemove = async () => {
    if (!target) return;
    await removeTag(target.id);
    setConfirmRemove(false); setTarget(null);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Tag moved to removed', message: target.name, color: 'orange' });
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
              <Menu.Item onClick={() => openArchive(r)}>Archive</Menu.Item>
              <Menu.Item color="red" onClick={() => openRemove(r)}>Remove</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    },
  ];

  const onCreate = async () => {
    const nm = name.trim(); if (!nm) return;
    await createTag({ name: nm, color: color?.trim(), description: desc });
    setName(''); setColor(undefined); setDesc(''); setCreateOpen(false);
    setRefreshKey((k) => k + 1);
    toast.show({ title: 'Tag created', message: nm, color: 'green' });
  };

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <div>
            <Title order={2} mb={4}>Tag Manager</Title>
            <Text c="dimmed">Create and manage organization-wide tags used across CRM.</Text>
          </div>
          <Button variant="light" onClick={() => setCreateOpen(true)}>Add tag</Button>
        </Group>

        <Tabs value={'active'}>
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
            clientFilter={(r: any) => (r.status ?? 'active') === 'active'}
            defaultPageSize={25}
            enableSelection={false}
            refreshKey={refreshKey}
          />
        </Card>

        <Modal opened={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive tag" centered>
          <Stack>
            <Text>Archive this tag? It will move to Archive and can be restored later.</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmArchive(false)}>Cancel</Button>
              <Button onClick={onArchive}>Archive</Button>
            </Group>
          </Stack>
        </Modal>

        <TagRemoveModal opened={confirmRemove} onClose={() => setConfirmRemove(false)} tagName={target?.name || ''} onConfirm={onRemove} />

        <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Add tag" closeOnEscape={false} closeOnClickOutside={false} centered>
          <Stack>
            <TextInput
              label="Name"
              withAsterisk
              placeholder="e.g., VIP"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
              maxLength={40}
              rightSection={<Text size="xs" c="dimmed">{(name || '').length}/40</Text>}
              rightSectionWidth={56}
            />
            <ColorInput
              label="Color"
              placeholder="#228be6 or theme color"
              value={color}
              onChange={setColor as any}
              format="hex"
              disallowInput={false}
              withPicker
              withEyeDropper
              rightSectionWidth={36}
              rightSection={
                <Popover position="bottom-end" withArrow shadow="md">
                  <Popover.Target>
                    <ActionIcon variant="subtle" aria-label="Open color picker">
                      <IconPalette size={16} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <ColorPicker format="hex" value={color || '#228be6'} onChange={setColor as any} withPicker size="md" />
                  </Popover.Dropdown>
                </Popover>
              }
            />
            <Textarea
              label="Description"
              placeholder="What this tag means and how to use it"
              minRows={3}
              value={desc}
              onChange={(e) => setDesc(e.currentTarget.value)}
              maxLength={280}
              rightSection={<Text size="xs" c="dimmed">{(desc || '').length}/280</Text>}
              rightSectionWidth={64}
            />
            <Group justify="flex-end">
              <Button onClick={onCreate}>Create</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAdminGate>
  );
}
