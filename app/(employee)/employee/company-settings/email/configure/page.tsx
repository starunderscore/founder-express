"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { useAppSettingsStore } from '@/state/appSettingsStore';
import { Title, Text, Card, Stack, Group, Button, Tabs, Badge, Menu, ActionIcon, Select, TextInput, PasswordInput, Modal } from '@mantine/core';
import { useState } from 'react';

export default function EmailConfigurePage() {
  const router = useRouter();
  const settings = useAppSettingsStore((s) => s.settings.email);
  const addIntegration = useAppSettingsStore((s) => s.addEmailIntegration);
  const updateIntegration = useAppSettingsStore((s) => s.updateEmailIntegration);
  const removeIntegration = useAppSettingsStore((s) => s.removeEmailIntegration);

  const [iOpen, setIOpen] = useState(false);
  const [provider, setProvider] = useState<'sendgrid' | 'mailgun' | 'postmark' | 'resend' | ''>('');
  const [ilabel, setILabel] = useState('');
  const [iapikey, setIApiKey] = useState('');

  const onAddIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !iapikey.trim()) return;
    addIntegration({ provider, apiKey: iapikey.trim(), label: ilabel.trim() || undefined });
    setProvider(''); setILabel(''); setIApiKey(''); setIOpen(false);
  };

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
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Third‑party email providers</Text>
              <Button onClick={() => setIOpen(true)}>Add integration</Button>
            </Group>
            <Stack>
              {(settings.integrations || []).map((i) => (
                <Card withBorder key={i.id}>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Group gap={8}>
                        <Text fw={600} tt="capitalize">{i.provider}</Text>
                        {i.enabled ? <Badge variant="light" color="green">Enabled</Badge> : <Badge variant="light" color="gray">Disabled</Badge>}
                      </Group>
                      {i.label && <Text size="sm" c="dimmed">{i.label}</Text>}
                      <Text size="sm" c="dimmed">Key: {i.apiKey ? '••••' + i.apiKey.slice(-4) : '—'}</Text>
                    </div>
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
                        <Menu.Item onClick={() => updateIntegration(i.id, { enabled: !i.enabled })}>{i.enabled ? 'Disable' : 'Enable'}</Menu.Item>
                        <Menu.Item onClick={() => updateIntegration(i.id, { label: prompt('Label', i.label || '') || i.label })}>Rename</Menu.Item>
                        <Menu.Item color="red" onClick={() => removeIntegration(i.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Card>
              ))}
              {(settings.integrations || []).length === 0 && (
                <Card withBorder><Text c="dimmed">No integrations yet</Text></Card>
              )}
            </Stack>

            <Modal opened={iOpen} onClose={() => setIOpen(false)} title="Add email integration" centered>
              <form onSubmit={onAddIntegration}>
                <Stack>
                  <Select
                    label="Provider"
                    placeholder="Pick one"
                    data={[
                      { value: 'sendgrid', label: 'SendGrid (popular, free tier)' },
                      { value: 'mailgun', label: 'Mailgun' },
                      { value: 'postmark', label: 'Postmark' },
                      { value: 'resend', label: 'Resend (developer-friendly)' },
                    ]}
                    value={provider}
                    onChange={(v: any) => setProvider(v)}
                    required
                  />
                  <TextInput label="Label (optional)" placeholder="e.g. Marketing" value={ilabel} onChange={(e) => setILabel(e.currentTarget.value)} />
                  <PasswordInput label="API key" placeholder="Paste provider API key" value={iapikey} onChange={(e) => setIApiKey(e.currentTarget.value)} required />
                  <Group justify="flex-end">
                    <Button variant="default" onClick={() => setIOpen(false)} type="button">Cancel</Button>
                    <Button type="submit">Add</Button>
                  </Group>
                </Stack>
              </form>
            </Modal>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAuthGate>
  );
}
