"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';

export default function AdminSettingsPage() {

  return (
    <EmployerAdminGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Admin Settings</Title>
          <Text c="dimmed">Administrative tools and exports. Admins only.</Text>
        </div>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Email subscriptions</Title>
              <Text c="dimmed" size="sm">Exports and waiting list access</Text>
            </div>
            <Button component={Link as any} href="/employee/admin-settings/email-subscriptions" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}
