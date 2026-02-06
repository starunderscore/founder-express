"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconUsers, IconBuilding } from '@tabler/icons-react';

export default function CustomersIndexPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Group gap="xs" align="center">
          <IconUsers size={20} />
          <div>
            <Title order={2} mb={4}>Customers</Title>
            <Text c="dimmed">Quick navigation to customer sections.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconUsers size={18} />
              <div>
                <Text fw={600}>CRM</Text>
                <Text c="dimmed" size="sm">Manage leads and customers</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/customers/crm" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconBuilding size={18} />
              <div>
                <Text fw={600}>Vendors</Text>
                <Text c="dimmed" size="sm">Track and manage vendors</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/customers/vendors" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
