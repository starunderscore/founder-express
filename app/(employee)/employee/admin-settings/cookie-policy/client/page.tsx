"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, TextInput, Button, Alert } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { WebContentEditor } from '@/components/WebContentEditor';
import { listenCookiePolicies, updateCookiePolicy, type CookiePolicy as CookiePolicyRow } from '@/services/admin-settings/cookie-policy';
import { useToast } from '@/components/ToastProvider';

type CookiePolicy = CookiePolicyRow;

export default function CookiePolicyClientEditPage() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CookiePolicy[]>([]);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenCookiePolicies((rows) => setItems(rows));
    return () => unsub();
  }, []);

  const current = useMemo(() => {
    if (items.length === 0) return null;
    const selectedId = searchParams.get('id');
    if (selectedId) return items.find((i) => i.id === selectedId) || null;
    return items.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0];
  }, [items, searchParams]);

  useEffect(() => {
    if (!current) return;
    setTitle(current.title || '');
    setHtml(current.bodyHtml || '');
  }, [current?.id]);

  const onSave = async () => {
    if (!current) { setError('No cookie policy found. Create a new one first.'); return; }
    const t = title.trim();
    if (!t) { setError('Enter a title'); return; }
    const rawLen = (html || '').length;
    if (rawLen > 20000) { setError('Policy content too long (max 20,000 characters)'); return; }
    const plain = (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) { setError('Enter policy content'); return; }
    setSaving(true);
    setError(null);
    try {
      await updateCookiePolicy(current.id, { title: t, bodyHtml: html || '' });
      toast.show({ title: 'Saved', message: 'Cookie policy updated.', color: 'green' });
      router.push(backHref);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const status: 'active' | 'archived' | 'removed' | 'none' = useMemo(() => {
    if (!current) return 'none';
    if (current.removedAt) return 'removed';
    if (current.archivedAt) return 'archived';
    return 'active';
  }, [current?.id, current?.archivedAt, current?.removedAt]);

  const backHref = status === 'removed'
    ? '/employee/admin-settings/cookie-policy/removed'
    : status === 'archived'
      ? '/employee/admin-settings/cookie-policy/archive'
      : '/employee/admin-settings/cookie-policy';

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(backHref)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2} mb={4}>Edit Cookie Policy</Title>
              <Text c="dimmed">Define your cookie disclosures and consent.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button onClick={onSave} loading={saving} disabled={!current}>Save</Button>
          </Group>
        </Group>

        {status === 'archived' && (
          <Alert color="yellow">This policy is archived. It is not active for users.</Alert>
        )}
        {status === 'removed' && (
          <Alert color="red">This policy is removed. Restore it from the Removed tab to edit and use it.</Alert>
        )}

        {items.length === 0 && (
          <Alert color="orange">No cookie policy found. Create one first from the list page.</Alert>
        )}
        {error && <Alert color="red">{error}</Alert>}

        <Card withBorder>
          <Stack>
            <Text fw={600}>Title</Text>
            <TextInput
              placeholder="e.g., Cookie Policy"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              required
              maxLength={120}
              rightSection={<Text size="xs" c="dimmed">{(title || '').length}/120</Text>}
              rightSectionWidth={56}
            />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Group justify="space-between" align="flex-end">
              <div>
                <Text fw={600}>Policy content</Text>
                <Text c="dimmed" size="sm">Shown to users for cookie disclosures and consent.</Text>
              </div>
              <Text size="xs" c="dimmed">{(html || '').length}/20000</Text>
            </Group>
            <WebContentEditor
              placeholder="Update your cookie policy…"
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
