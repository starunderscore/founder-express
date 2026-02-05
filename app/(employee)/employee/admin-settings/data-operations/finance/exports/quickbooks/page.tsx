"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { AdminDisconnectedCard } from '@/components/AdminDisconnectedCard';
import { ActionIcon, Button, Card, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminFinanceQuickBooksExportPage() {
  const router = useRouter();
  const [status, setStatus] = useState<{ hasKey: boolean; suffix: string | null; hasRealm: boolean; realmSuffix: string | null } | null>(null);
  const [lastClicked, setLastClicked] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/finance/config')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ hasKey: false, suffix: null, hasRealm: false, realmSuffix: null }));
  }, []);

  // Load last export time from localStorage (scaffold)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin-qb-export-last-click');
      if (raw) setLastClicked(Number(raw) || null);
    } catch {}
  }, []);

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings/data-operations')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>Finance Exports</Title>
              <Text c="dimmed">Export finance data and trigger QuickBooks sync.</Text>
            </div>
          </Group>
        </Group>

        <Tabs
          defaultValue="quickbooks"
          onChange={(v) => {
            if (v === 'csv') router.push('/employee/admin-settings/data-operations/finance/exports');
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="csv" onClick={() => router.push('/employee/admin-settings/data-operations/finance/exports')}>CSV</Tabs.Tab>
            <Tabs.Tab value="quickbooks">QuickBooks</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="quickbooks" pt="md">
            <AdminDisconnectedCard
              title="QuickBooks disconnected"
              subtitle="Set up QuickBooks configuration to enable exports."
              actionLabel="Open configuration"
              actionHref="/employee/admin-settings/finance/configuration"
            />

            {/* Connected state card (preview; business/workflow vibe) */}
            <Card withBorder mt="md">
              <Stack>
                <Group justify="space-between" align="center">
                  <div>
                    <Title order={3} style={{ marginBottom: 2 }}>QuickBooks export</Title>
                    <Text c="dimmed" size="sm">Connected. Exports push eligible invoices to QuickBooks.</Text>
                  </div>
                </Group>
                {/* No API key chips here; this is a workflow area, not configuration. */}
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">Last clicked: {lastClicked ? new Date(lastClicked).toLocaleString() : 'Never'}</Text>
                  <Button onClick={() => { try { const now = Date.now(); localStorage.setItem('admin-qb-export-last-click', String(now)); setLastClicked(now); } catch {}; alert('QuickBooks export initiated (admin scaffold)'); }}>Export to QuickBooks</Button>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAdminGate>
  );
}
