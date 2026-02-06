"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Badge, Button, Card, Group, Menu, Modal, NumberInput, SegmentedControl, Select, Stack, Table, Text, TextInput, Title, Tabs } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FinanceProductsPage() {
  const router = useRouter();
  const settings = useFinanceStore((s) => s.settings);
  const products = settings.products;
  const addProduct = useFinanceStore((s) => s.addProduct);
  const updateProduct = useFinanceStore((s) => s.updateProduct);
  const removeProduct = useFinanceStore((s) => s.removeProduct);
  const addPriceToProduct = useFinanceStore((s) => s.addPriceToProduct);
  const updatePriceOnProduct = useFinanceStore((s) => s.updatePriceOnProduct);
  const archiveProduct = useFinanceStore((s) => s.archiveProduct);
  const restoreProduct = useFinanceStore((s) => s.restoreProduct);

  const [prodView, setProdView] = useState<'all' | 'one_time' | 'recurring' | 'mixed'>('all');
  const filteredProducts = useMemo(() => {
    const classify = (p: any): 'one_time' | 'recurring' | 'mixed' | 'none' => {
      const hasOne = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'one_time');
      const hasRec = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'recurring');
      if (hasOne && hasRec) return 'mixed';
      if (hasRec) return 'recurring';
      if (hasOne) return 'one_time';
      return 'none';
    };
    const base = products.filter((p: any) => !p.isArchived && !p.deletedAt);
    if (prodView === 'all') return base;
    return base.filter((p) => classify(p) === prodView);
  }, [products, prodView]);

  const [prodOpen, setProdOpen] = useState(false);
  const [prodIdEditing, setProdIdEditing] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  const [priceOpen, setPriceOpen] = useState(false);
  const [priceProdId, setPriceProdId] = useState<string | null>(null);
  const [priceIdEditing, setPriceIdEditing] = useState<string | null>(null);
  const [priceCurrency, setPriceCurrency] = useState(settings.currency);
  const [priceAmount, setPriceAmount] = useState<number | string>('');
  const [priceType, setPriceType] = useState<'one_time' | 'recurring'>('one_time');
  const [priceInterval, setPriceInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [priceIntervalCount, setPriceIntervalCount] = useState<number | string>('1');

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
              <IconPackage size={20} />
              <div>
                <Title order={2}>Products</Title>
                <Text c="dimmed">Stripe-like products and prices.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button component={require('next/link').default as any} href="/employee/finance/products/new" variant="light">New product</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/products">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/products/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/products/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          <Group mb="sm">
            <SegmentedControl
              value={prodView}
              onChange={(v: any) => setProdView(v)}
              data={[
                { label: 'All', value: 'all' },
                { label: 'One-time', value: 'one_time' },
                { label: 'Recurring', value: 'recurring' },
                { label: 'Mixed', value: 'mixed' },
              ]}
            />
          </Group>
          <Card withBorder>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Prices</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredProducts.map((p: any) => {
                  const hasOne = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'one_time');
                  const hasRec = Array.isArray(p.prices) && p.prices.some((pr: any) => pr.type === 'recurring');
                  const kind = hasOne && hasRec ? 'Mixed' : hasRec ? 'Recurring' : hasOne ? 'One-time' : '—';
                  const onePrices = (p.prices || []).filter((pr: any) => pr.type === 'one_time');
                  const recPrices = (p.prices || []).filter((pr: any) => pr.type === 'recurring');
                  const fmtMoney = (pr: any) => `${pr.currency} ${Number(pr.unitAmount).toFixed(2)}`;
                  const fmtRec = (pr: any) => {
                    const n = pr.recurring?.intervalCount || 1;
                    const interval = pr.recurring?.interval || 'month';
                    return `${pr.currency} ${Number(pr.unitAmount).toFixed(2)}/${n > 1 ? `${n} ` : ''}${interval}${n > 1 ? 's' : ''}`;
                  };
                  if (p.deletedAt) return null;
                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.name}</Table.Td>
                      <Table.Td><Badge variant="light" color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Table.Td>
                      <Table.Td>
                        <Text>{kind}</Text>
                      </Table.Td>
                      <Table.Td>
                        {onePrices.length > 0 && (
                          <Text size="sm">One-time: {onePrices.map(fmtMoney).join(', ')}</Text>
                        )}
                        {recPrices.length > 0 && (
                          <Text size="sm">Recurring: {recPrices.map(fmtRec).join(', ')}</Text>
                        )}
                        {onePrices.length === 0 && recPrices.length === 0 && <Text c="dimmed" size="sm">—</Text>}
                      </Table.Td>
                      <Table.Td><Text c="dimmed" size="sm">{p.description || '—'}</Text></Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => { setProdIdEditing(p.id); setProdName(p.name); setProdDesc(p.description || ''); setProdOpen(true); }}>Edit</Menu.Item>
                            <Menu.Item onClick={() => { setPriceProdId(p.id); setPriceIdEditing(null); setPriceCurrency(settings.currency); setPriceAmount(''); setPriceType((p.defaultType || 'one_time') as any); setPriceInterval('month'); setPriceIntervalCount('1'); setPriceOpen(true); }}>Add price</Menu.Item>
                            <Menu.Item color="orange" onClick={() => archiveProduct(p.id)}>Archive</Menu.Item>
                            <Menu.Item color="red" onClick={() => removeProduct(p.id)}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}><Text c="dimmed">No products</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Card>

        <Modal opened={prodOpen} onClose={() => { setProdOpen(false); setProdIdEditing(null); }} title={prodIdEditing ? 'Edit product' : 'New product'} centered>
          <Stack>
            <TextInput label="Name" value={prodName} onChange={(e) => setProdName(e.currentTarget.value)} />
            <TextInput label="Description" value={prodDesc} onChange={(e) => setProdDesc(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => { setProdOpen(false); setProdIdEditing(null); }}>Cancel</Button>
              <Button onClick={() => {
                if (!prodName.trim()) return;
                if (prodIdEditing) updateProduct(prodIdEditing, { name: prodName.trim(), description: prodDesc.trim() || undefined });
                else addProduct({ name: prodName.trim(), description: prodDesc.trim() || undefined });
                setProdOpen(false); setProdIdEditing(null);
              }}>Save</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={priceOpen} onClose={() => { setPriceOpen(false); setPriceProdId(null); setPriceIdEditing(null); }} title={priceIdEditing ? 'Edit price' : 'Add price'} centered>
          <Stack>
            <Group grow>
              <Select label="Type" data={[ { value: 'one_time', label: 'One-time' }, { value: 'recurring', label: 'Recurring' } ]} value={priceType} onChange={(v: any) => setPriceType(v)} />
              <Select label="Currency" data={[ 'USD', 'EUR', 'GBP' ]} value={priceCurrency} onChange={(v) => setPriceCurrency(v || 'USD')} allowDeselect={false} />
              <NumberInput label="Amount" value={priceAmount as any} onChange={setPriceAmount as any} min={0} step={0.01} prefix={priceCurrency + ' '} />
            </Group>
            {priceType === 'recurring' && (
              <Group grow>
                <Select label="Interval" data={[ 'day', 'week', 'month', 'year' ]} value={priceInterval} onChange={(v: any) => setPriceInterval(v)} />
                <NumberInput label="Interval count" value={priceIntervalCount as any} onChange={setPriceIntervalCount as any} min={1} step={1} />
              </Group>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => { setPriceOpen(false); setPriceProdId(null); setPriceIdEditing(null); }}>Cancel</Button>
              <Button onClick={() => {
                if (!priceProdId) return;
                const payload: any = { currency: priceCurrency, unitAmount: Number(priceAmount) || 0, type: priceType as any };
                if (priceType === 'recurring') payload.recurring = { interval: priceInterval, intervalCount: Number(priceIntervalCount) || 1 };
                if (priceIdEditing) updatePriceOnProduct(priceProdId, priceIdEditing, payload); else addPriceToProduct(priceProdId, payload);
                setPriceOpen(false); setPriceProdId(null); setPriceIdEditing(null);
              }}>Save</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
