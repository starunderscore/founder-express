"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, TextInput, Button, Alert } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WebContentEditor } from '@/components/WebContentEditor';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function PrivacyPolicyNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    const t = title.trim();
    if (!t) { setError('Enter a title'); return; }
    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db(), 'privacy_policies'), {
        title: t,
        type: 'client',
        bodyHtml: html || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any);
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
            <Button variant="light" onClick={onSave} loading={saving}>Save</Button>
          </Group>
        </Group>

        {error && <Alert color="red">{error}</Alert>}

        <Card withBorder>
          <Stack>
            <TextInput label="Title" placeholder="e.g., Client Privacy Policy v1" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
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

