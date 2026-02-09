"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, TextInput, Button, Alert } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WebContentEditor } from '@/components/WebContentEditor';
import { createPrivacyPolicy } from '@/services/admin-settings/privacy-policy';
import { useToast } from '@/components/ToastProvider';

export default function PrivacyPolicyNewPage() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
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
      await createPrivacyPolicy({ title: t, type: 'client', bodyHtml: html || '' });
      toast.show({ title: 'Saved', message: 'Privacy policy created.', color: 'green' });
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
              <Title order={2} mb={4}>New Privacy Policy</Title>
              <Text c="dimmed">Terms and conditions for client portal signup.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button onClick={onSave} loading={saving}>Save</Button>
          </Group>
        </Group>

        {error && <Alert color="red">{error}</Alert>}

        <Card withBorder>
          <Stack>
            <Text fw={600}>Title</Text>
            <TextInput
              placeholder="e.g., Client Privacy Policy v1"
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
                <Text c="dimmed" size="sm">Shown to users during signup and when updated.</Text>
              </div>
              <Text size="xs" c="dimmed">{(html || '').length}/20000</Text>
            </Group>
            <WebContentEditor
              placeholder="Write your policy…"
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
