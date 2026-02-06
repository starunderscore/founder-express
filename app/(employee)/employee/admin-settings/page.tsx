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

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Data Operations</Text>
              <Text c="dimmed" size="sm">Exports and related tools</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/data-operations" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>System values</Text>
              <Text c="dimmed" size="sm">Branding and app values</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/system-values" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Third‑party Configuration</Text>
              <Text c="dimmed" size="sm">APIs and external services</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/third-party-configuration" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Privacy Policy</Text>
              <Text c="dimmed" size="sm">Customer and employee privacy policies</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/privacy-policy" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Cookie Policy</Text>
              <Text c="dimmed" size="sm">Cookie disclosures and consent</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/cookie-policy" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}
