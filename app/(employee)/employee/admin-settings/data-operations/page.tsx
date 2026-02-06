"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconDatabaseExport, IconMail, IconReportMoney } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function AdminDataOperationsPage() {
  const router = useRouter();
  return (
    <EmployerAdminGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group gap="xs" align="center">
            <IconDatabaseExport size={20} />
            <div>
              <Title order={2} mb={4}>Data Operations</Title>
              <Text c="dimmed">Exports and related tools.</Text>
            </div>
          </Group>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconMail size={18} />
              <div>
                <Text fw={600}>Email subscriptions exports</Text>
                <Text c="dimmed" size="sm">Export lists and manage waiting lists</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/admin-settings/data-operations/email-subscriptions" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconReportMoney size={18} />
              <div>
                <Text fw={600}>Finance exports</Text>
                <Text c="dimmed" size="sm">Export finance data and QuickBooks sync</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/admin-settings/data-operations/finance/exports" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}
