"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import Link from 'next/link';

export default function UserSettingsIndexPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>User Settings</Title>
          <Text c="dimmed">Personal preferences for your account.</Text>
        </div>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Appearance</Title>
              <Text c="dimmed" size="sm">Theme and color scheme.</Text>
            </div>
            <Button component={Link as any} href="/employee/user-settings/appearance" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

