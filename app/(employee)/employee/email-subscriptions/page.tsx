"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconMail, IconClockHour4 } from '@tabler/icons-react';

export default function EmployerEmailSubscriptionsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Group gap="xs" align="center">
          <IconMail size={20} />
          <div>
            <Title order={2} mb={4}>Email Subscriptions</Title>
            <Text c="dimmed">Quick navigation to email sections.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconMail size={18} />
              <div>
                <Text fw={600}>Newsletters</Text>
                <Text c="dimmed" size="sm">Create and manage newsletter emails</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/email-subscriptions/newsletters" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconClockHour4 size={18} />
              <div>
                <Text fw={600}>Waiting Lists</Text>
                <Text c="dimmed" size="sm">Collect interested emails and send updates</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/email-subscriptions/waiting" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
