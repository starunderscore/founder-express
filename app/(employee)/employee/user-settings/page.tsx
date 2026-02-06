"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Divider } from '@mantine/core';
import Link from 'next/link';

export default function UserSettingsIndexPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>User Settings</Title>
          <Text c="dimmed">Personal preferences for your account.</Text>
        </div>
        <Divider />

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Appearance</Text>
              <Text c="dimmed" size="sm">Theme and color scheme</Text>
            </div>
            <Button component={Link as any} href="/employee/user-settings/appearance" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Security</Text>
              <Text c="dimmed" size="sm">Password and sign‑in</Text>
            </div>
            <Button component={Link as any} href="/employee/user-settings/security" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
