"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Group, TextInput, Textarea, Button, ColorInput, Badge, Table, ActionIcon } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, updateDoc, query } from 'firebase/firestore';

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

export default function TagDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [tag, setTag] = useState<TagDef | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    const ref = doc(db(), 'crm_tags', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setTag(null); return; }
      const data = snap.data() as any;
      const t: TagDef = {
        id: snap.id,
        name: data.name || '',
        color: data.color || undefined,
        description: data.description || undefined,
        status: (data.status as TagStatus) || 'active',
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      };
      setTag(t);
      setName(t.name);
      setColor(t.color);
      setDescription(t.description || '');
    });
    return () => unsub();
  }, [params.id]);

  useEffect(() => {
    const q = query(collection(db(), 'crm_customers'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: any[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setCustomers(rows);
    });
    return () => unsub();
  }, []);

  const usage = useMemo(() => {
    if (!tag) return [] as { id: string; name: string; type: 'vendor' | 'customer' }[];
    const list: { id: string; name: string; type: 'vendor' | 'customer' }[] = [];
    for (const c of customers) {
      if (Array.isArray(c.tags) && c.tags.includes(tag.name)) {
        list.push({ id: c.id, name: c.name, type: c.type });
      }
    }
    return list;
  }, [customers, tag]);

  if (!tag) {
    return (
      <EmployerAuthGate>
        <Group>
          <Button variant="light" component={Link} href="/employee/tag-manager">Back</Button>
          <Text>Tag not found</Text>
        </Group>
      </EmployerAuthGate>
    );
  }

  const save = async () => {
    await updateDoc(doc(db(), 'crm_tags', tag.id), { name: name.trim(), color: color?.trim() || undefined, description: description.trim() || undefined } as any);
    router.push('/employee/tag-manager');
  };

  return (
    <EmployerAuthGate>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/tag-manager')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Title order={2}>Edit Tag</Title>
        </Group>
      </Group>

      <Card withBorder mb="md">
        <Group align="end" grow>
          <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
          <ColorInput label="Color" value={color} onChange={setColor as any} format="hex" disallowInput={false} withPicker />
          <Badge variant="filled" styles={{ root: { background: color || undefined, color: color ? contrastText(color) : undefined } }}>Preview</Badge>
        </Group>
        <Textarea label="Description" placeholder="What this tag means and how to use it" minRows={3} mt="sm" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
        <Group justify="flex-end" mt="sm">
          <Button onClick={save}>Save</Button>
        </Group>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">Used By</Title>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {usage.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>
                  <Button variant="subtle" component={Link as any} href={`/employee/crm/${u.type}/${u.id}` as any}>{u.name}</Button>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={u.type === 'vendor' ? 'orange' : 'blue'}>{u.type}</Badge>
                </Table.Td>
              </Table.Tr>
            ))}
            {usage.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={2}><Text c="dimmed">Not used yet</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </EmployerAuthGate>
  );
}
