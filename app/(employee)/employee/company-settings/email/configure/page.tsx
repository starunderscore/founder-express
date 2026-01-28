"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { useAppSettingsStore } from '@/state/appSettingsStore';
import { Title, Text, Card, Stack, Group, Button, Tabs, ActionIcon, Select, Modal, Table, Checkbox } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function EmailConfigurePage() {
  const router = useRouter();
  const settings = useAppSettingsStore((s) => s.settings.email);

  const [iOpen, setIOpen] = useState(false);
  const [provider, setProvider] = useState<'sendgrid' | 'resend' | ''>('');
  const [available, setAvailable] = useState<Array<{ id: 'sendgrid' | 'resend'; name: string; configured: boolean; envVar: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/email/providers');
        const json = await res.json();
        if (!cancelled) setAvailable(json.providers || []);
      } catch {
        if (!cancelled) setAvailable([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Ensure Auth email templates exist (Password Reset, Verify Email)
  const AUTH_TEMPLATES: Array<{ id: string; name: string; subject: string; body: string }> = [
    {
      id: 'auth-password-reset',
      name: 'Password Reset',
      subject: 'Reset your password for {{COMPANY_NAME}}',
      body: '<p>Hi {{USERNAME}},</p><p>Click the link below to reset your password:</p><p><a href="{{ACTION_URL}}" target="_blank" rel="noopener">Reset password</a></p><p>If you did not request this, you can ignore this email.</p><p>— {{COMPANY_NAME}}</p>',
    },
    {
      id: 'auth-email-verification',
      name: 'Verify Email',
      subject: 'Verify your email for {{COMPANY_NAME}}',
      body: '<p>Hi {{USERNAME}},</p><p>Please confirm your email address by clicking the link below:</p><p><a href="{{ACTION_URL}}" target="_blank" rel="noopener">Verify email</a></p><p>Thanks!<br/>— {{COMPANY_NAME}}</p>',
    },
  ];

  async function ensureAuthTemplates() {
    for (const t of AUTH_TEMPLATES) {
      const ref = doc(db(), 'admin_settings/global/email_templates', t.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const now = Date.now();
        await setDoc(ref, { name: t.name, subject: t.subject, body: t.body, createdAt: now, updatedAt: now });
      }
    }
  }

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Email management</Title>
            <Text c="dimmed">Manage email and configure the API adapter.</Text>
          </div>
        </Group>

        <Tabs value="configure">
          <Tabs.List>
            <Tabs.Tab value="variables"><Link href="/employee/company-settings/email">Email variables</Link></Tabs.Tab>
            <Tabs.Tab value="templates"><Link href="/employee/company-settings/email/templates">Email templates</Link></Tabs.Tab>
            <Tabs.Tab value="configure"><Link href="/employee/company-settings/email/configure">Configure</Link></Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="configure" pt="md">
            <Text fw={600} mb={6}>System emails</Text>
            <Card withBorder mb="xl">
              <Stack>
                {AUTH_TEMPLATES.map((t) => (
                  <Group key={t.id} justify="space-between">
                    <div>
                      <Text fw={600}>{t.name}</Text>
                      <Text size="sm" c="dimmed">Template ID: {t.id}</Text>
                    </div>
                    <Group gap="xs">
                      <Button variant="light" component={Link as any} href={`/employee/company-settings/email/templates/new?edit=${t.id}` as any}>Edit template</Button>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Card>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Third‑party email providers</Text>
              <Button onClick={() => setIOpen(true)}>Add integration</Button>
            </Group>
            <Card withBorder>
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 80 }}>Configured</Table.Th>
                    <Table.Th>Provider</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {available.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>
                        <Checkbox checked={p.configured} readOnly aria-label={`${p.name} configured`} />
                      </Table.Td>
                      <Table.Td>{p.name}</Table.Td>
                      <Table.Td>
                        <Text c={p.configured ? undefined : 'dimmed'} size="sm">{p.configured ? 'Configured' : 'Not configured'}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>

            <Modal opened={iOpen} onClose={() => setIOpen(false)} title="Add email integration" centered>
              <Stack>
                <Select
                  label="Provider"
                  placeholder="Pick one"
                  data={[
                    { value: 'sendgrid', label: 'SendGrid' },
                    { value: 'resend', label: 'Resend' },
                  ]}
                  value={provider}
                  onChange={(v: any) => setProvider(v)}
                />
                {provider && (
                  <Card withBorder>
                    <Stack gap={6}>
                      <Text fw={600}>How to enable {provider === 'sendgrid' ? 'SendGrid' : 'Resend'}</Text>
                      <Text size="sm">Update your server environment with the required API key variable:</Text>
                      <Stack gap={2}>
                        {provider === 'sendgrid' && (
                          <>
                            <Text size="sm">- Set env var: SENDGRID_API_KEY</Text>
                            <Text size="sm">- Restart the server after updating env vars.</Text>
                          </>
                        )}
                        {provider === 'resend' && (
                          <>
                            <Text size="sm">- Set env var: RESEND_API_KEY</Text>
                            <Text size="sm">- Restart the server after updating env vars.</Text>
                          </>
                        )}
                      </Stack>
                      <Text size="sm">Once set, the provider will show as configured in this table.</Text>
                      <Text size="sm">See docs: <a href="/docs/technical/email-providers.md" target="_blank" rel="noreferrer">Email provider setup</a></Text>
                    </Stack>
                  </Card>
                )}
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setIOpen(false)} type="button">Close</Button>
                </Group>
              </Stack>
            </Modal>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAuthGate>
  );
}
