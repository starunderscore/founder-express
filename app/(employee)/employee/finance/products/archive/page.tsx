"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { ActionIcon, Button, Card, Group, Menu, Stack, Table, Tabs, Text, Title } from '@mantine/core';
import { useFinanceStore } from '@/state/financeStore';

export default function FinanceProductsArchivePage() {
  const router = useRouter();
  const products = useFinanceStore((s) => s.settings.products);
  const restoreProduct = useFinanceStore((s) => s.restoreProduct);
  const removeProduct = useFinanceStore((s) => s.removeProduct);

  const archived = products.filter((p: any) => p.isArchived && !p.deletedAt);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2}>Products</Title>
            <Text c="dimmed">Stripe-like products and prices.</Text>
          </div>
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/products">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/products/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/products/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {archived.map((p: any) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td><Text c="dimmed" size="sm">{p.description || '—'}</Text></Table.Td>
                  <Table.Td style={{ width: 1 }}>
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => restoreProduct(p.id)}>Restore</Menu.Item>
                        <Menu.Item color="red" onClick={() => removeProduct(p.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {archived.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}><Text c="dimmed">No archived products</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

