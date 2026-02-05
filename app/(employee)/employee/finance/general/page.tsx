"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { Button, Card, Checkbox, Group, NumberInput, Select, Stack, Text, TextInput, Title, ActionIcon } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function FinanceGeneralPage() {
  const router = useRouter();
  const settings = useFinanceStore((s) => s.settings);
  const setCurrency = useFinanceStore((s) => s.setCurrency);
  const setGracePeriodDays = useFinanceStore((s) => s.setGracePeriodDays);
  const setEnforceTax = useFinanceStore((s) => (s as any).setEnforceTax || (() => {}));
  const setQuickBooksEnabled = useFinanceStore((s) => (s as any).setQuickBooksEnabled || (() => {}));
  const setQuickBooksCompanyId = useFinanceStore((s) => (s as any).setQuickBooksCompanyId || (() => {}));

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/settings')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>General</Title>
              <Text c="dimmed">Financial configurations and third parties.</Text>
            </div>
          </Group>
        </Group>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Financial configurations</Text>
            <Group grow>
              <Select
                label="Default currency"
                data={[ 'USD', 'EUR', 'GBP' ]}
                value={settings.currency}
                onChange={(v) => setCurrency(v || settings.currency)}
                allowDeselect={false}
              />
            </Group>
            <NumberInput
              label="Grace period (days)"
              description="Days after the due date before an invoice is considered late."
              value={settings.gracePeriodDays}
              onChange={(v) => setGracePeriodDays(Number(v) || 0)}
              min={0}
              step={1}
            />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Tax compliance</Text>
            <Checkbox
              label="Auto-apply enabled taxes to new invoices"
              description="Applies all enabled taxes by default; you can remove them per invoice."
              checked={settings.enforceTax}
              onChange={(e) => setEnforceTax(e.currentTarget.checked)}
            />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Third parties</Text>
            <Text size="sm" c="dimmed">QuickBooks connection (for exports)</Text>
            <TextInput label="QuickBooks Company ID (Realm ID)" placeholder="e.g., 123145678901234" value={(settings as any).quickbooks?.companyId || ''} onChange={(e) => setQuickBooksCompanyId(e.currentTarget.value)} />
            <Checkbox label="Enable QuickBooks exports" checked={(settings as any).quickbooks?.enabled ?? false} onChange={(e) => setQuickBooksEnabled(e.currentTarget.checked)} />
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

