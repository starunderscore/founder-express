"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Group, Table, Badge, Anchor, Tabs, Menu, ActionIcon } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { restoreTag as svcRestoreTag, deleteTag as svcDeleteTag } from '@/services/tags';

type TagStatus = 'active' | 'archived' | 'removed';
type TagDef = { id: string; name: string; color?: string; description?: string; status?: TagStatus; createdAt: number };

const contrastText = (hex?: string): string => {
  if (!hex || !hex.startsWith('#')) return '#fff';
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.5 ? '#000' : '#fff';
};

export default function TagManagerRemovedPage() {
  const [tags, setTags] = useState<TagDef[]>([]);
  const removed = tags.filter((t) => (t.status ?? 'active') === 'removed');

  useEffect(() => {
    const q = query(collection(db(), 'crm_tags'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: TagDef[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({
          id: d.id,
          name: data.name || '',
          color: data.color || undefined,
          description: data.description || undefined,
          status: (data.status as TagStatus) || 'active',
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        });
      });
      setTags(rows);
    });
    return () => unsub();
  }, []);

  const restore = async (t: TagDef) => {
    await svcRestoreTag(t.id, { getDb: db });
  };
  const deleteForever = async (id: string) => {
    await svcDeleteTag(id, { getDb: db });
  };

  return (
    <EmployerAuthGate>
      <Title order={2} mb="sm">Tag Manager</Title>
      <Text c="dimmed" mb="md">Create and manage organization-wide tags used across CRM.</Text>

      <Tabs value="removed">
        <Tabs.List>
          <Tabs.Tab value="active"><Link href="/employee/tag-manager">Active</Link></Tabs.Tab>
          <Tabs.Tab value="archive"><Link href="/employee/tag-manager/archive">Archive</Link></Tabs.Tab>
          <Tabs.Tab value="removed"><Link href="/employee/tag-manager/removed">Removed</Link></Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="removed" pt="md">
          <Card withBorder>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tag</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {removed.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td>
                      <Badge
                        variant="filled"
                        styles={{ root: { background: t.color || undefined, color: t.color ? contrastText(t.color) : undefined } }}
                      >
                        {t.name}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={t.description ? undefined : 'dimmed'} style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ width: 80, minWidth: 80, whiteSpace: 'nowrap' }}>
                      <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Menu withinPortal position="bottom-end" shadow="md" width={220}>
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
                            <Menu.Item onClick={() => restore(t)}>Restore</Menu.Item>
                            <Menu.Item color="red" onClick={() => deleteForever(t.id)}>Delete permanently</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {removed.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}><Text c="dimmed">No removed tags</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </EmployerAuthGate>
  );
}
