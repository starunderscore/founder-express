"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconPlugConnected, IconReportMoney, IconMail, IconCreditCard } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function AdminThirdPartyConfigurationPage() {
  const router = useRouter();
  return (
    <EmployerAdminGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group gap="xs" align="center">
            <IconPlugConnected size={20} />
            <div>
              <Title order={2} mb={4}>Third‑party Configuration</Title>
              <Text c="dimmed">APIs and external services.</Text>
            </div>
          </Group>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconReportMoney size={18} />
              <div>
                <Text fw={600}>Finance API</Text>
                <Text c="dimmed" size="sm">Configure QuickBooks connection</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/admin-settings/third-party-configuration/finance/configuration" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconMail size={18} />
              <div>
                <Text fw={600}>Email Providers</Text>
                <Text c="dimmed" size="sm">Third‑party email integrations</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/admin-settings/third-party-configuration/email/configuration" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconCreditCard size={18} />
              <div>
                <Text fw={600}>Payment Providers</Text>
                <Text c="dimmed" size="sm">Stripe and PayPal integrations</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/admin-settings/third-party-configuration/finance/providers" variant="light">Open</Button>
          </Group>
        </Card>

        {null}
      </Stack>
    </EmployerAdminGate>
  );
}
