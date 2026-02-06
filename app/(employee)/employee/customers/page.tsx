"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';

export default function CustomersIndexPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Customers</Title>
          <Text c="dimmed">Quick navigation to customer sections.</Text>
        </div>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>CRM</Text>
              <Text c="dimmed" size="sm">Manage leads and customers</Text>
            </div>
            <Button component={Link as any} href="/employee/customers/crm" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Vendors</Text>
              <Text c="dimmed" size="sm">Track and manage vendors</Text>
            </div>
            <Button component={Link as any} href="/employee/customers/vendors" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
