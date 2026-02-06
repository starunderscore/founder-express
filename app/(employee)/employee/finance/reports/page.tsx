"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconReportMoney } from '@tabler/icons-react';

export default function FinanceReportsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Group gap="xs" align="center">
          <IconReportMoney size={20} />
          <div>
            <Title order={2} mb={4}>Financial reports</Title>
            <Text c="dimmed">Essential snapshots to understand financial performance.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Revenue summary</Text>
              <Text c="dimmed" size="sm">Total revenue by period with trend</Text>
            </div>
            <Button component={Link as any} href="/employee/finance/reports/revenue-summary" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>A/R aging</Text>
              <Text c="dimmed" size="sm">Outstanding invoices grouped by aging buckets</Text>
            </div>
            <Button component={Link as any} href="/employee/finance/reports/accounts-receivable-aging" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Product performance</Text>
              <Text c="dimmed" size="sm">Revenue by product and pricing model</Text>
            </div>
            <Button component={Link as any} href="/employee/finance/reports/product-performance" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Taxes summary</Text>
              <Text c="dimmed" size="sm">Collected taxes by rate and period</Text>
            </div>
            <Button component={Link as any} href="/employee/finance/reports/taxes-summary" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
