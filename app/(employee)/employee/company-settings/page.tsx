"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconBuilding, IconMail } from '@tabler/icons-react';
import Link from 'next/link';
import { useAppSettingsStore } from '@/state/appSettingsStore';

export default function AppSettingsPage() {
  const websiteUrl = useAppSettingsStore((s) => s.settings.websiteUrl);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group gap="xs" align="center">
          <IconBuilding size={20} />
          <div>
            <Title order={2} mb={4}>Company Settings</Title>
            <Text c="dimmed">Configure your app preferences and integrations.</Text>
          </div>
        </Group>

        {/* Appearance moved to AccountBar gear button */}

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconMail size={18} />
              <div>
                <Title order={4}>Email management</Title>
                <Text c="dimmed" size="sm">Manage waitlists/newsletters and configure the API adapter.</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/company-settings/email-management" variant="light">Open</Button>
          </Group>
        </Card>

        {/* Configuration card intentionally removed to centralize under Admin Settings */}
      </Stack>
    </EmployerAuthGate>
  );
}
