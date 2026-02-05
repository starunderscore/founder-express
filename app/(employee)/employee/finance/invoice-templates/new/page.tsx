"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Button, Card, Group, MultiSelect, Stack, Table, Text, TextInput, Title, NumberInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function NewInvoiceTemplatePage() {
  const router = useRouter();
  const addTemplate = useFinanceStore((s) => s.addTemplate);
  const taxes = useFinanceStore((s) => s.settings.taxes);
  const products = useFinanceStore((s) => s.settings.products);

  const taxOptions = useMemo(() => taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` })), [taxes]);

  const [name, setName] = useState('');
  const [items, setItems] = useState<{ id: string; description: string; quantity: string; unitPrice: string }[]>([]);
  const [taxIds, setTaxIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => setItems((rows) => [...rows, { id: `row-${Date.now()}-${Math.random()}`, description: '', quantity: '1', unitPrice: '0' }]);
  const removeRow = (id: string) => setItems((rows) => rows.filter((r) => r.id !== id));
  const updateRow = (id: string, patch: Partial<{ description: string; quantity: string; unitPrice: string }>) => setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Template name required'); return; }
    if (items.length === 0) { setError('Add at least one item'); return; }
    const payload = { name: name.trim(), items: items.map((r) => ({ description: r.description, quantity: Number(r.quantity) || 0, unitPrice: Number(r.unitPrice) || 0 })), taxIds };
    addTemplate(payload);
    router.push('/employee/finance/invoice-templates');
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
            <Title order={2} mb={4}>New invoice template</Title>
            <Text c="dimmed">Define reusable line items with taxes.</Text>
          </div>
        </Group>

        <Card withBorder>
          <form onSubmit={onSubmit}>
            <Stack>
              <TextInput label="Template name" placeholder="Consulting invoice" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
              <Text fw={600}>Items</Text>
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Description</Table.Th>
                    <Table.Th style={{ width: 120 }}>Qty</Table.Th>
                    <Table.Th style={{ width: 160 }}>Unit price</Table.Th>
                    <Table.Th style={{ width: 1 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td><TextInput value={r.description} onChange={(e) => updateRow(r.id, { description: e.currentTarget.value })} placeholder="Description" /></Table.Td>
                      <Table.Td>
                        <NumberInput value={r.quantity as any} onChange={(v: any) => updateRow(r.id, { quantity: String(v ?? '1') })} min={1} step={1} />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput value={r.unitPrice as any} onChange={(v: any) => updateRow(r.id, { unitPrice: String(v ?? '0') })} min={0} step={0.01} />
                      </Table.Td>
                      <Table.Td><Button size="xs" variant="subtle" color="red" onClick={() => removeRow(r.id)}>Remove</Button></Table.Td>
                    </Table.Tr>
                  ))}
                  {items.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={4}><Text c="dimmed">No items yet</Text></Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
              <Group>
                <Button variant="light" onClick={addRow} type="button">Add item</Button>
                <Button variant="light" onClick={() => {
                  const name = prompt('Product name to add (matches first)');
                  if (!name) return;
                  const prod = products.find((p) => (p.name || '').toLowerCase().includes(name.toLowerCase()));
                  if (!prod || !prod.prices.length) return alert('No matching product/price');
                  const pr = prod.prices[0];
                  setItems((rows) => [...rows, { id: `row-${Date.now()}`, description: prod.name, quantity: '1', unitPrice: String(pr.unitAmount) }]);
                }} type="button">Add from product (quick)</Button>
              </Group>
              <MultiSelect label="Taxes" data={taxOptions} value={taxIds} onChange={setTaxIds} searchable placeholder="Select taxes to apply" />
              {error && <Text c="red" size="sm">{error}</Text>}
              <Group justify="flex-end">
                <Button variant="default" type="button" onClick={() => router.push('/employee/finance/invoice-templates')}>Cancel</Button>
                <Button type="submit">Create template</Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
