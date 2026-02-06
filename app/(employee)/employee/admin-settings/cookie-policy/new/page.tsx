"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, ActionIcon, TextInput, Button, Alert } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WebContentEditor } from '@/components/WebContentEditor';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

const DEFAULT_HTML = `
<h2>Summary</h2>
<p>This Cookie Policy explains how we use cookies and similar technologies on our website and client portal.</p>

<h2>Consent</h2>
<p>By using the client portal, you consent to the use of cookies as described in this policy. You can manage or withdraw consent at any time in your browser settings.</p>

<h2>Categories of cookies</h2>
<h3>Strictly necessary</h3>
<p>Required for core functionality (e.g., authentication, session management).</p>
<h3>Preferences</h3>
<p>Remember your choices (e.g., language, theme).</p>
<h3>Analytics</h3>
<p>Help us understand usage to improve the product.</p>
<h3>Marketing</h3>
<p>Used to deliver relevant content and measure campaign performance.</p>

<h2>List of cookies</h2>
<p>Example (customize for your setup):</p>
<ul>
  <li><strong>__session</strong> — Necessary — Session cookie for authentication — Expires on logout</li>
  <li><strong>theme</strong> — Preferences — Stores light/dark theme — 12 months</li>
  <li><strong>_ga</strong> — Analytics — Google Analytics — 24 months</li>
  <li><strong>_fbp</strong> — Marketing — Meta pixel — 3 months</li>
  </ul>

<h2>Managing cookies</h2>
<p>You can control cookies through your browser settings. Disabling certain cookies may affect functionality.</p>
`;

export default function CookiePolicyNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Cookie Policy');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    const t = title.trim();
    if (!t) { setError('Enter a title'); return; }
    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db(), 'cookie_policies'), {
        title: t,
        bodyHtml: html || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any);
      router.push('/employee/admin-settings/cookie-policy');
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
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings/cookie-policy')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2} mb={4}>New Cookie Policy</Title>
              <Text c="dimmed">Define cookie disclosures and consent.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={onSave} loading={saving}>Save</Button>
          </Group>
        </Group>

        {error && <Alert color="red">{error}</Alert>}

        <Card withBorder>
          <Stack>
            <TextInput label="Title" placeholder="e.g., Cookie Policy v1" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
            <WebContentEditor
              placeholder="Write your cookie policy…"
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

