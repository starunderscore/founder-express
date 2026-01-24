"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Anchor } from '@mantine/core';

export default function ReportsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Reports</Title>
          <Text c="dimmed">Explore analytics across users, tags, email, and employees.</Text>
        </div>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>User reports</Title>
              <Text c="dimmed" size="sm">Signups, churn, and activity over time.</Text>
            </div>
            <Button component={Link as any} href="/employee/reports/users" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Tag activity</Title>
              <Text c="dimmed" size="sm">Tagged entities and their recent activity.</Text>
            </div>
            <Button component={Link as any} href="/employee/reports/tags" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Email reports</Title>
              <Text c="dimmed" size="sm">Newsletters and waiting list email performance.</Text>
            </div>
            <Button component={Link as any} href="/employee/reports/emails" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Employee reports</Title>
              <Text c="dimmed" size="sm">Join/leave events and workforce trends.</Text>
            </div>
            <Button component={Link as any} href="/employee/reports/employees" variant="light">Open</Button>
          </Group>
        </Card>

        {/* Finance reports moved to Finance section */}

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Achievements reports</Title>
              <Text c="dimmed" size="sm">Placeholder only — dummy data (disabled).</Text>
              <Anchor component={Link as any} href="/employee/reports/achievements" underline="always">View dummy report</Anchor>
            </div>
            <Button variant="light" disabled>Disabled</Button>
          </Group>
        </Card>

        
      </Stack>
    </EmployerAuthGate>
  );
}
