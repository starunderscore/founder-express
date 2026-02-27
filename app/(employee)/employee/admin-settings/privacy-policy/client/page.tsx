"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, TextInput, Button, Alert, Modal } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { WebContentEditor } from '@/components/WebContentEditor';
import { listenPrivacyPolicies, updatePrivacyPolicy, restorePrivacyPolicy, deletePrivacyPolicy, type PrivacyPolicy } from '@/services/admin-settings/privacy-policy';
import PolicyDeletePermanentModal from '@/components/privacy/PolicyDeletePermanentModal';

export default function PrivacyPolicyClientEditPage() {
  const router = useRouter();
  const [items, setItems] = useState<PrivacyPolicy[]>([]);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const unsub = listenPrivacyPolicies((rows) => setItems(rows.filter((p) => (p.type || 'client') === 'client')));
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
      await updatePrivacyPolicy(current.id, { title: t, bodyHtml: html || '' });
      router.push('/employee/admin-settings/privacy-policy');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const status: 'active' | 'archived' | 'removed' | 'none' = useMemo(() => {
    if (!current) return 'none';
    if (current.removedAt) return 'removed';
    if (!current.archiveAt) return 'active';
    return 'archived';
  }, [current?.id, current?.archiveAt, current?.removedAt]);

  const backHref = status === 'removed'
    ? '/employee/admin-settings/privacy-policy/removed'
    : status === 'archived'
      ? '/employee/admin-settings/privacy-policy/archive'
      : '/employee/admin-settings/privacy-policy';

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
              <Title order={2} mb={4}>Edit Client Privacy Policy</Title>
              <Text c="dimmed">Terms and conditions for client portal signup.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button onClick={onSave} loading={saving} disabled={!current}>Save</Button>
          </Group>
        </Group>

        {status === 'archived' && (
          <Alert color="gray" variant="light" mb="md" title="Archived">
            <Group justify="space-between" align="center">
              <Text>This policy is archived and not active for users.</Text>
              <Button variant="light" onClick={() => setRestoreOpen(true)}>Restore</Button>
            </Group>
          </Alert>
        )}
        {status === 'removed' && (
          <Alert color="red" variant="light" mb="md" title="Removed">
            <Group justify="space-between" align="center">
              <Text>This policy is removed. You can restore it or permanently delete it.</Text>
              <Group gap="xs">
                <Button variant="light" onClick={() => setRestoreOpen(true)}>Restore</Button>
                <Button color="red" variant="light" onClick={() => setDeleteOpen(true)}>Delete permanently</Button>
              </Group>
            </Group>
          </Alert>
        )}

        {items.length === 0 && (
          <Alert color="orange">No client privacy policy found. Create one first from the list page.</Alert>
        )}
        {error && <Alert color="red">{error}</Alert>}

        <Card withBorder>
          <Stack>
            <Text fw={600}>Title</Text>
            <TextInput
              placeholder="e.g., Client Privacy Policy"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              required
              maxLength={120}
              rightSection={<Text size="xs" c="dimmed">{(title || '').length}/120</Text>}
              rightSectionWidth={56}
            />
          </Stack>
        </Card>

        {/* Lifecycle modals */}
        {null}
        <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} centered>
          <Stack>
            <Text>Restore this policy back to the list?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!current) return;
                await restorePrivacyPolicy(current.id);
                setRestoreOpen(false);
                // Do not redirect; user can choose to activate afterwards
              }}>Restore</Button>
            </Group>
          </Stack>
        </Modal>
        <PolicyDeletePermanentModal
          opened={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          policyTitle={current?.title || ''}
          onConfirm={async () => {
            if (!current) return;
            await deletePrivacyPolicy(current.id);
            setDeleteOpen(false);
            router.push('/employee/admin-settings/privacy-policy');
          }}
        />

        <Card withBorder>
          <Stack>
            <div>
              <Text fw={600}>Policy content</Text>
              <Text c="dimmed" size="sm">Shown to users during signup and when updated.</Text>
              <Text size="xs" c="dimmed">{(html || '').length}/20000</Text>
            </div>
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
