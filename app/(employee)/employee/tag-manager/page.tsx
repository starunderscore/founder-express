"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Group, TextInput, Textarea, Button, Table, Badge, Modal, Stack, ColorInput, Anchor, Tabs, Menu, ActionIcon } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';

type TagStatus = 'active' | 'archived' | 'removed';
type TagDef = { id: string; name: string; color?: string; description?: string; status?: TagStatus; createdAt: number };

export default function TagManagerPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [tags, setTags] = useState<TagDef[]>([]);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [desc, setDesc] = useState('');
  // helper to choose readable text color on a background
  const contrastText = (hex?: string): string => {
    if (!hex || !hex.startsWith('#')) return '#fff';
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    // relative luminance
    const srgb = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    return L > 0.5 ? '#000' : '#fff';
  };
  const [createOpen, setCreateOpen] = useState(false);

  const usageMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of customers) {
      if (Array.isArray(c.tags)) {
        for (const t of c.tags) {
          map[t] = (map[t] || 0) + 1;
        }
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

  const onCreate = async () => {
    const nm = name.trim();
    if (!nm) return;
    await addDoc(collection(db(), 'crm_tags'), {
      name: nm,
      color: color?.trim() || undefined,
      description: desc.trim() || undefined,
      status: 'active',
      createdAt: Date.now(),
    });
    setName(''); setColor(undefined); setDesc('');
  };

  // editing is handled on the detail page

  // helpers to change status
  const archiveTag = async (t: TagDef) => {
    await updateDoc(doc(db(), 'crm_tags', t.id), { status: 'archived' } as any);
  };
  const removeTag = async (t: TagDef) => {
    await updateDoc(doc(db(), 'crm_tags', t.id), { status: 'removed' } as any);
  };

  const activeTags = tags.filter((t) => (t.status ?? 'active') === 'active');

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <div>
            <Title order={2} mb={4}>Tag Manager</Title>
            <Text c="dimmed">Create and manage organization-wide tags used across CRM.</Text>
          </div>
          <Group gap="xs">
            <Button variant="light" onClick={() => setCreateOpen(true)}>Add tag</Button>
          </Group>
        </Group>

        <Tabs value="active">
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/tag-manager">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/tag-manager/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/tag-manager/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="active" pt="md">
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
                  {activeTags.map((t) => (
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
                            <Menu.Item component={Link as any} href={`/employee/tag-manager/${t.id}` as any}>Edit</Menu.Item>
                            <Menu.Item onClick={() => archiveTag(t)}>Archive</Menu.Item>
                            <Menu.Item color="red" onClick={() => removeTag(t)}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {activeTags.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}><Text c="dimmed">No active tags</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
      </Stack>

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Add tag" closeOnEscape={false} closeOnClickOutside={false} centered>
        <Stack>
          <TextInput label="Name" placeholder="e.g., VIP" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
          <ColorInput label="Color" placeholder="#228be6 or theme color" value={color} onChange={setColor as any} format="hex" disallowInput={false} withPicker />
          <Textarea label="Description" placeholder="What this tag means and how to use it" minRows={3} value={desc} onChange={(e) => setDesc(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button onClick={() => { onCreate(); setCreateOpen(false); }}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </EmployerAuthGate>
  );
}
