"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { useCRMStore } from '@/state/crmStore';
import { ActionIcon, Button, Card, Group, Select, Stack, Text, TextInput, Title, Table, MultiSelect, NumberInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function FinanceNewInvoicePage() {
  const router = useRouter();
  const customers = useCRMStore((s) => s.customers);
  const addInvoice = useFinanceStore((s) => s.addInvoice);
  const financeSettings = useFinanceStore((s) => s.settings);

  const customerOptions = useMemo(() => customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.email}` })), [customers]);

  const [customerId, setCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [currency, setCurrency] = useState(financeSettings.currency);
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ id: string; description: string; quantity: string; unitPrice: string }[]>([]);
  const [taxIds, setTaxIds] = useState<string[]>(financeSettings.enforceTax ? financeSettings.taxes.filter((t) => t.enabled).map((t) => t.id) : []);
  const [templateId, setTemplateId] = useState<string | null>(financeSettings.templates[0]?.id || null);

  const taxOptions = financeSettings.taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }));
  const templateOptions = financeSettings.templates.map((t) => ({ value: t.id, label: t.name }));

  const addRow = () => setItems((rows) => [...rows, { id: `row-${Date.now()}-${Math.random()}`, description: '', quantity: '1', unitPrice: '0' }]);
  const removeRow = (id: string) => setItems((rows) => rows.filter((r) => r.id !== id));
  const updateRow = (id: string, patch: Partial<{ description: string; quantity: string; unitPrice: string }>) => setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const subtotal = items.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0);
  const taxes = taxIds
    .map((id) => financeSettings.taxes.find((t) => t.id === id))
    .filter(Boolean)
    .reduce((acc, t: any) => acc + (t.enabled ? (t.rate / 100) * subtotal : 0), 0);
  const total = Math.round((subtotal + taxes) * 100) / 100;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { setError('Select a customer'); return; }
    if (items.length === 0) { setError('Add at least one item'); return; }
    if (!dueDate) { setError('Select a due date'); return; }
    addInvoice({ customerId, amount: total, currency, dueDate, items: items.map((r) => ({ id: r.id, description: r.description, quantity: Number(r.quantity) || 0, unitPrice: Number(r.unitPrice) || 0 })), taxIds });
    router.push('/employee/finance/invoices');
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/invoices')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>New invoice</Title>
            <Text c="dimmed">Create an invoice for a customer.</Text>
          </div>
        </Group>

        <Card withBorder>
          <form onSubmit={onSubmit}>
            <Stack>
              <Group grow align="end">
                <Select label="Customer" data={customerOptions} value={customerId} onChange={setCustomerId} searchable placeholder="Select customer" nothingFoundMessage="No customers" />
              </Group>
              <Group grow align="end">
                <Select label="Currency" data={[ 'USD', 'EUR', 'GBP' ]} value={currency} onChange={(v) => setCurrency(v || 'USD')} allowDeselect={false} />
                <TextInput label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.currentTarget.value)} />
              </Group>
              <Group grow>
                <Select label="Template" placeholder="Select template" data={templateOptions} value={templateId} onChange={(v) => {
                  setTemplateId(v);
                  const t = financeSettings.templates.find((x) => x.id === v);
                  if (t) {
                    setItems(t.items.map((it) => ({ id: `row-${Math.random()}`, description: it.description, quantity: String(it.quantity), unitPrice: String(it.unitPrice) })));
                    setTaxIds(t.taxIds);
                  }
                }} />
                <MultiSelect label="Taxes" data={taxOptions} value={taxIds} onChange={setTaxIds} searchable />
              </Group>
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
                        <NumberInput value={r.unitPrice as any} onChange={(v: any) => updateRow(r.id, { unitPrice: String(v ?? '0') })} min={0} step={0.01} prefix={currency + ' '} />
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
                  const all = financeSettings.products || [];
                  const prod = all.find((p) => (p.name || '').toLowerCase().includes(name.toLowerCase()));
                  if (!prod || !prod.prices.length) return alert('No matching product/price');
                  const pr = prod.prices[0];
                  setItems((rows) => [...rows, { id: `row-${Date.now()}`, description: prod.name, quantity: '1', unitPrice: String(pr.unitAmount) }]);
                }} type="button">Add from product (quick)</Button>
              </Group>
              <Group justify="flex-end">
                <Stack gap={2}>
                  <Group justify="space-between" w={280}>
                    <Text c="dimmed">Subtotal</Text>
                    <Text>{currency} {subtotal.toFixed(2)}</Text>
                  </Group>
                  <Group justify="space-between" w={280}>
                    <Text c="dimmed">Taxes</Text>
                    <Text>{currency} {taxes.toFixed(2)}</Text>
                  </Group>
                  <Group justify="space-between" w={280}>
                    <Text fw={600}>Total</Text>
                    <Text fw={600}>{currency} {total.toFixed(2)}</Text>
                  </Group>
                </Stack>
              </Group>
              {error && <Text c="red" size="sm">{error}</Text>}
              <Group justify="flex-end">
                <Button variant="default" type="button" onClick={() => router.push('/employee/finance/invoices')}>Cancel</Button>
                <Button type="submit">Add invoice</Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
