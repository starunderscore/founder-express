"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { ActionIcon, Card, Group, Menu, Stack, Table, Tabs, Text, Title } from '@mantine/core';
import { IconPercentage } from '@tabler/icons-react';
import { useFinanceStore } from '@/state/financeStore';

export default function FinanceTaxesRemovedPage() {
  const router = useRouter();
  const taxes = useFinanceStore((s) => s.settings.taxes);
  const updateTax = useFinanceStore((s) => s.updateTax);

  const removed = taxes.filter((t) => !!t.deletedAt);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/settings')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconPercentage size={20} />
              <div>
                <Title order={2}>Taxes</Title>
                <Text c="dimmed">Manage tax rates and enablement.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Tabs value={'removed'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/taxes">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/taxes/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/taxes/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Rate</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {removed.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>{t.name}</Table.Td>
                  <Table.Td>{t.rate}%</Table.Td>
                  <Table.Td style={{ width: 1 }}>
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => updateTax(t.id, { deletedAt: undefined, isArchived: false })}>Restore</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {removed.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}><Text c="dimmed">No removed taxes</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
