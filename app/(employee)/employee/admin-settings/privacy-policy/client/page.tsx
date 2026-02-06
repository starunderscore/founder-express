"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, TextInput, Button, Alert } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { WebContentEditor } from '@/components/WebContentEditor';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type Policy = { id: string; title: string; type: 'client' | string; bodyHtml?: string; createdAt?: number; updatedAt?: number; deletedAt?: number };

export default function PrivacyPolicyClientEditPage() {
  const router = useRouter();
  const [items, setItems] = useState<Policy[]>([]);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db(), 'privacy_policies'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Policy[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({ id: d.id, title: data.title || '(Untitled)', type: data.type || 'client', bodyHtml: data.bodyHtml || '', createdAt: data.createdAt, updatedAt: data.updatedAt, deletedAt: data.deletedAt });
      });
      setItems(rows.filter((p) => !p.deletedAt && (p.type || 'client') === 'client'));
    });
    return () => unsub();
  }, []);

  const current = useMemo(() => {
    if (items.length === 0) return null;
    return items.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0];
  }, [items]);

  useEffect(() => {
    if (!current) return;
    setTitle(current.title || '');
    setHtml(current.bodyHtml || '');
  }, [current?.id]);

  const onSave = async () => {
    if (!current) { setError('No client policy found. Create a new one first.'); return; }
    const t = title.trim();
    if (!t) { setError('Enter a title'); return; }
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db(), 'privacy_policies', current.id), { title: t, bodyHtml: html || '', updatedAt: Date.now() } as any);
      router.push('/employee/admin-settings/privacy-policy');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings/privacy-policy')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2} mb={4}>Edit Client Privacy Policy</Title>
              <Text c="dimmed">Terms and conditions for client portal signup.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={onSave} loading={saving} disabled={!current}>Save</Button>
          </Group>
        </Group>

        {items.length === 0 && (
          <Alert color="orange">No client privacy policy found. Create one first from the list page.</Alert>
        )}
        {error && <Alert color="red">{error}</Alert>}

        <Card withBorder>
          <Stack>
            <TextInput label="Title" placeholder="e.g., Client Privacy Policy" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
            <WebContentEditor
              placeholder="Update your policy…"
              initialHTML={html}
              onChangeHTML={setHtml}
              defaultShowLabels={true}
              minRows={16}
            />
          </Stack>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}

