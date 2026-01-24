"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Badge, Button, Card, Checkbox, Group, NumberInput, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type PriceRow = {
  id: string;
  type: 'one_time' | 'recurring';
  currency: string;
  unitAmount: string;
  interval?: 'day' | 'week' | 'month' | 'year';
  intervalCount?: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const addProduct = useFinanceStore((s) => s.addProduct);
  const addPriceToProduct = useFinanceStore((s) => s.addPriceToProduct);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [prices, setPrices] = useState<PriceRow[]>([{
    id: `row-${Date.now()}`,
    type: 'one_time',
    currency: 'USD',
    unitAmount: '0',
  }]);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => setPrices((rows) => [...rows, { id: `row-${Date.now()}-${Math.random()}`, type: 'one_time', currency: 'USD', unitAmount: '0' }]);
  const removeRow = (id: string) => setPrices((rows) => rows.filter((r) => r.id !== id));
  const updateRow = (id: string, patch: Partial<PriceRow>) => setPrices((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Product name is required'); return; }
    const validPrices = prices.filter((p) => Number(p.unitAmount) > 0 && p.currency);
    if (validPrices.length === 0) { setError('Add at least one valid price'); return; }
    const prodId = addProduct({ name: name.trim(), description: description.trim() || undefined, active });
    for (const p of validPrices) {
      const payload: any = { currency: p.currency, unitAmount: Number(p.unitAmount), type: p.type };
      if (p.type === 'recurring') payload.recurring = { interval: p.interval || 'month', intervalCount: Number(p.intervalCount) || 1 };
      addPriceToProduct(prodId, payload);
    }
    router.push('/employee/finance/settings');
  };

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
            <Title order={2} mb={4}>New product</Title>
            <Text c="dimmed">Create a product and prices in a Stripe-like workflow.</Text>
          </div>
        </Group>

        <Card withBorder>
          <form onSubmit={onSubmit}>
            <Stack>
              <Group grow>
                <TextInput label="Name" placeholder="Pro Plan" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
                <TextInput label="Description" placeholder="Monthly subscription for Pro Plan" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
              </Group>
              <Checkbox label="Active" checked={active} onChange={(e) => setActive(e.currentTarget.checked)} />

              <Text fw={600}>Prices</Text>
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Currency</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Interval</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {prices.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>
                        <Select data={[ { value: 'one_time', label: 'One-time' }, { value: 'recurring', label: 'Recurring' } ]} value={r.type} onChange={(v: any) => updateRow(r.id, { type: v })} />
                      </Table.Td>
                      <Table.Td>
                        <Select data={[ 'USD', 'EUR', 'GBP' ]} value={r.currency} onChange={(v) => updateRow(r.id, { currency: v || 'USD' })} allowDeselect={false} />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput value={r.unitAmount as any} onChange={(v: any) => updateRow(r.id, { unitAmount: String(v ?? '0') })} min={0} step={0.01} prefix={(r.currency || 'USD') + ' '} />
                      </Table.Td>
                      <Table.Td>
                        {r.type === 'recurring' ? (
                          <Group>
                            <Select data={[ 'day', 'week', 'month', 'year' ]} value={r.interval || 'month'} onChange={(v: any) => updateRow(r.id, { interval: v })} />
                            <NumberInput value={(r.intervalCount as any) || 1} onChange={(v: any) => updateRow(r.id, { intervalCount: String(v ?? '1') })} min={1} step={1} />
                          </Group>
                        ) : (
                          <Badge variant="light">—</Badge>
                        )}
                      </Table.Td>
                      <Table.Td style={{ width: 1 }}>
                        <Button size="xs" variant="subtle" color="red" onClick={() => removeRow(r.id)}>Remove</Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {prices.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}><Text c="dimmed">No prices yet</Text></Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
              <Button variant="light" onClick={addRow} type="button">Add price</Button>

              {error && <Text c="red" size="sm">{error}</Text>}
              <Group justify="flex-end">
                <Button variant="default" type="button" onClick={() => router.push('/employee/finance/settings')}>Cancel</Button>
                <Button type="submit">Create product</Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
