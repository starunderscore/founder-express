"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { AdminDisconnectedCard } from '@/components/AdminDisconnectedCard';
import { ActionIcon, Badge, Button, Card, Group, Modal, Radio, Stack, Table, Text, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Provider = { id: 'stripe' | 'paypal'; name: string; configured: boolean; envVar: string };

export default function AdminPaymentProvidersConfigurationPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    fetch('/api/finance/providers')
      .then((r) => r.json())
      .then((j) => setProviders(j.providers || []))
      .catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin-payment-active-provider');
      if (raw) setActive(raw);
    } catch {}
  }, []);

  const saveActive = () => {
    try { if (active) localStorage.setItem('admin-payment-active-provider', active); } catch {}
    alert('Saved (admin scaffold)');
  };

  const anyConfigured = providers.some((p) => p.configured);

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings/third-party-configuration')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>Payment Providers</Title>
              <Text c="dimmed">Stripe and PayPal configuration and selection.</Text>
            </div>
          </Group>
          <Button variant="light" onClick={() => setHelpOpen(true)}>Setup help</Button>
        </Group>

        {/* Top: No configuration detected card */}
        <AdminDisconnectedCard
          title="No payment providers configured"
          subtitle="Add provider credentials as environment variables to enable payments."
        >
          <Text size="sm">Supported env vars include: <code>STRIPE_API_KEY</code>, <code>PAYPAL_CLIENT_ID</code>, <code>PAYPAL_CLIENT_SECRET</code>. Restart the server after updating <code>.env.local</code>.</Text>
        </AdminDisconnectedCard>

        {/* Bottom: Detected providers table */}
        <Card withBorder>
          <Stack>
            <Group justify="space-between" align="center">
              <div>
                <Text fw={600}>Providers</Text>
                <Text c="dimmed" size="sm">Select one active provider. Configured providers are enabled by env vars.</Text>
              </div>
            </Group>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 80 }}>Active</Table.Th>
                  <Table.Th>Provider</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Env var(s)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {providers.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Radio name="active-payment-provider" value={p.id} checked={active === p.id} onChange={() => setActive(p.id)} disabled={!p.configured} aria-label={`Activate ${p.name}`} />
                    </Table.Td>
                    <Table.Td>{p.name}</Table.Td>
                    <Table.Td>
                      <Badge color={p.configured ? 'green' : 'gray'} variant="light">{p.configured ? 'Configured' : 'Not configured'}</Badge>
                    </Table.Td>
                    <Table.Td><code>{p.envVar}</code></Table.Td>
                  </Table.Tr>
                ))}
                {providers.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}><Text c="dimmed">No providers detected.</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
            <Group justify="flex-start" mt="sm">
              <Button onClick={saveActive} disabled={!anyConfigured}>Save selection</Button>
            </Group>
          </Stack>
        </Card>

        <Modal opened={helpOpen} onClose={() => setHelpOpen(false)} title="Payment providers setup help" centered size="xl">
          <Stack gap="sm">
            <Text component="div" size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`Goal: Configure payment providers in Founder Express

Steps:
1) Edit your env file (local):
   - Open .env.local
   - Add the following keys you plan to use:
     STRIPE_API_KEY=YOUR_STRIPE_KEY
     PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
     PAYPAL_CLIENT_SECRET=YOUR_CLIENT_SECRET

2) Restart the dev server so the app can read the new env vars.

3) Verify in app:
   - Go to Admin Settings → Payment Providers
   - Confirm provider shows as Configured
   - Select exactly one active provider

4) Production deploy:
   - Add the same env vars to your hosting provider
   - Redeploy the app to apply changes

Notes:
- Only one provider is active at a time.
- Keep API keys and secrets in environment variables only.
`}</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setHelpOpen(false)}>Close</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAdminGate>
  );
}
