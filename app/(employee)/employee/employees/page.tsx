"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconUsersGroup, IconUsers, IconShieldCheck } from '@tabler/icons-react';

export default function EmployeesIndexPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Group gap="xs" align="center">
          <IconUsersGroup size={20} />
          <div>
            <Title order={2} mb={4}>Employees</Title>
            <Text c="dimmed">Quick navigation to employee sections.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconUsers size={18} />
              <div>
                <Text fw={600}>Manage employees</Text>
                <Text c="dimmed" size="sm">Add, edit, and organize employees</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/employees/manage" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconShieldCheck size={18} />
              <div>
                <Text fw={600}>Roles</Text>
                <Text c="dimmed" size="sm">Define roles and permissions</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/employees/roles" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
