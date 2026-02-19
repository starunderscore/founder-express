"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { ActionIcon, Card, Group, Menu, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import { useFinanceStore } from '@/state/financeStore';
import LocalDataTable, { type Column } from '@/components/data-table/LocalDataTable';

export default function FinanceProductsRemovedPage() {
  const router = useRouter();
  const products = useFinanceStore((s) => s.settings.products);
  const updateProduct = useFinanceStore((s) => s.updateProduct);

  const removed = products.filter((p: any) => !!p.deletedAt);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group gap="xs" align="center">
            <IconPackage size={20} />
            <div>
              <Title order={2}>Products</Title>
              <Text c="dimmed">Stripe-like products and prices.</Text>
            </div>
          </Group>
        </Group>

        <Tabs value={'removed'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/products">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/products/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/products/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          {(() => {
            const columns: Column<any>[] = [
              { key: 'name', header: 'Name', render: (p: any) => p.name || '—' },
              { key: 'description', header: 'Description', render: (p: any) => (<Text size="sm" c="dimmed">{p.description || '—'}</Text>) },
              { key: 'actions', header: '', width: 1, render: (p: any) => (
                <Menu shadow="md" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => updateProduct(p.id, { deletedAt: undefined, isArchived: false })}>Restore</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) },
            ];
            const rows = removed;
            return <LocalDataTable rows={rows} columns={columns} defaultPageSize={10} enableSelection={false} />;
          })()}
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
