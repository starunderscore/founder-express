"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, Button, Divider } from '@mantine/core';

export default function AdminSettingsPage() {

  return (
    <EmployerAdminGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Admin Settings</Title>
          <Text c="dimmed">Administrative tools, data operations, and integrations. Admins only.</Text>
        </div>
        <Divider />

        <div style={{ marginTop: 'var(--mantine-spacing-sm)' }}>
          <Title order={4}>Data Operations</Title>
          <Text c="dimmed" size="sm">Exports and related tools</Text>
        </div>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Email subscriptions exports</Text>
              <Text c="dimmed" size="sm">Export lists and manage waiting lists</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/email-subscriptions" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Finance exports</Text>
              <Text c="dimmed" size="sm">Export finance data and QuickBooks sync</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/finance/exports" variant="light">Open</Button>
          </Group>
        </Card>

        <div style={{ marginTop: 'var(--mantine-spacing-xl)' }}>
          <Title order={4}>Third‑party Configuration</Title>
          <Text c="dimmed" size="sm">APIs and external services</Text>
        </div>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Finance API</Text>
              <Text c="dimmed" size="sm">Configure QuickBooks connection</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/finance/configuration" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Email Providers</Text>
              <Text c="dimmed" size="sm">Third‑party email integrations (admin)</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/email/configuration" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Payment Providers</Text>
              <Text c="dimmed" size="sm">Stripe and PayPal integrations</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/finance/providers" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}
