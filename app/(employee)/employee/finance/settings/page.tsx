"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button } from '@mantine/core';
import { IconCurrencyDollar, IconAdjustments, IconPackage, IconPercentage, IconFileInvoice } from '@tabler/icons-react';

export default function FinanceSettingsPage() {
  return (
    <EmployerAuthGate>
      <Stack>
        <Group gap="xs" align="center">
          <IconCurrencyDollar size={20} />
          <div>
            <Title order={2} mb={4}>Financial Settings</Title>
            <Text c="dimmed">Quick navigation to finance sections.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconAdjustments size={18} />
              <div>
                <Text fw={600}>General</Text>
                <Text c="dimmed" size="sm">Currency, grace period, and tax defaults</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/finance/general" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconPackage size={18} />
              <div>
                <Text fw={600}>Products</Text>
                <Text c="dimmed" size="sm">Stripe-like products and prices</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/finance/products" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconPercentage size={18} />
              <div>
                <Text fw={600}>Taxes</Text>
                <Text c="dimmed" size="sm">Manage tax rates and enablement</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/finance/taxes" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconFileInvoice size={18} />
              <div>
                <Text fw={600}>Invoice templates</Text>
                <Text c="dimmed" size="sm">Reusable line items and taxes</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/finance/invoice-templates" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
