"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Badge, Button, Card, Checkbox, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { IconReportMoney } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminDisconnectedCard } from '@/components/AdminDisconnectedCard';

export default function AdminFinanceConfigurationPage() {
  const router = useRouter();
  const settings = useFinanceStore((s) => s.settings);
  const setQuickBooksEnabled = useFinanceStore((s) => (s as any).setQuickBooksEnabled || (() => {}));
  const [status, setStatus] = useState<{ hasKey: boolean; suffix: string | null; hasRealm: boolean; realmSuffix: string | null } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/finance/config')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ hasKey: false, suffix: null, hasRealm: false, realmSuffix: null }));
  }, []);

  // Default exports policy ON when env keys are detected
  useEffect(() => {
    const connected = !!status?.hasKey && !!status?.hasRealm;
    const enabled = !!(settings as any)?.quickbooks?.enabled;
    if (connected && !enabled) {
      setQuickBooksEnabled(true);
    }
  }, [status?.hasKey, status?.hasRealm]);

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
            <Group gap="xs" align="center">
              <IconReportMoney size={20} />
              <div>
                <Title order={2}>Finance API</Title>
                <Text c="dimmed">QuickBooks and related finance integrations.</Text>
              </div>
            </Group>
          </Group>
          <Button variant="light" onClick={() => setHelpOpen(true)}>Setup help</Button>
        </Group>

        {/* Disconnected state card (always shown during scaffold) */}
        <AdminDisconnectedCard
          title="QuickBooks disconnected"
          subtitle="Add environment variables to connect QuickBooks."
          badges={[
            { label: status?.hasKey ? `Key detected${status?.suffix ? ` …${status.suffix}` : ''}` : 'Key not detected', color: status?.hasKey ? 'green' : 'gray' },
            { label: status?.hasRealm ? `Realm detected${status?.realmSuffix ? ` …${status?.realmSuffix}` : ''}` : 'Realm not detected', color: status?.hasRealm ? 'green' : 'gray' },
          ]}
        >
          <Text size="sm">Environment variables required: <code>QB_API_KEY</code>, <code>QB_REALM_ID</code>. Restart server after editing <code>.env.local</code>.</Text>
        </AdminDisconnectedCard>

        {/* Business content card (mirrors Email Providers style) */}
        <Card withBorder>
          <Stack>
            <Group justify="space-between" align="center">
              <div>
                <Text fw={600}>QuickBooks</Text>
                <Text c="dimmed" size="sm">Enable exports when configuration is present.</Text>
              </div>
            </Group>
            <Stack gap={8}>
              <Checkbox label="Enable QuickBooks exports" checked={(settings as any).quickbooks?.enabled ?? false} onChange={(e) => setQuickBooksEnabled(e.currentTarget.checked)} style={{ marginBottom: 6 }} />
              <Group justify="flex-start">
                <Button variant="filled" onClick={() => alert('Saved (admin scaffold)')}>Save</Button>
              </Group>
            </Stack>
          </Stack>
        </Card>

        <Modal opened={helpOpen} onClose={() => setHelpOpen(false)} title="QuickBooks setup help" centered size="xl">
          <Stack gap="sm">
            <Text component="div" size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`Goal: Configure QuickBooks for exports in Founder Express

Steps:
1) Edit your env file (local):
   - Open .env.local
   - Add the following lines (replace YOUR_KEY and YOUR_REALM):
     QB_API_KEY=YOUR_KEY
     QB_REALM_ID=YOUR_REALM

2) Restart the dev server so the app can read the new env vars.

3) Verify in app:
   - Go to Admin Settings → Finance API
   - Confirm you see “Key detected …1234” and “Realm detected …5678”
   - Toggle “Enable QuickBooks exports” ON

4) Production deploy:
   - Add the same env vars (QB_API_KEY, QB_REALM_ID) to your hosting provider
   - Redeploy the app to apply changes

Notes:
- Never store API keys in the database; use environment variables only.
- If using OAuth later, keep client secrets in env too.
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
