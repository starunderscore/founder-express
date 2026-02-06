"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';

export default function EmployeesIndexPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Employees</Title>
          <Text c="dimmed">Quick navigation to employee sections.</Text>
        </div>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Manage employees</Text>
              <Text c="dimmed" size="sm">Add, edit, and organize employees</Text>
            </div>
            <Button component={Link as any} href="/employee/employees/manage" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Roles</Text>
              <Text c="dimmed" size="sm">Define roles and permissions</Text>
            </div>
            <Button component={Link as any} href="/employee/employees/roles" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
