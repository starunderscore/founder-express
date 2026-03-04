"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { listCRM } from '@/services/crm/firestore';
import { ActionIcon, Button, Card, Group, Select, Stack, Text, TextInput, Title, Table, MultiSelect, NumberInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { createInvoice } from '@/services/finance/invoices';
import { listenTaxes, type Tax } from '@/services/finance/taxes';
import { listenInvoiceTemplates, type InvoiceTemplate } from '@/services/finance/invoice-templates';

export default function FinanceNewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => { (async () => { const rows = await listCRM('active'); setCustomers(rows.filter((r:any)=>r.type==='customer')); })(); }, []);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  useEffect(() => {
    const u1 = listenTaxes('active', setTaxes);
    const u2 = listenInvoiceTemplates('active', setTemplates);
    return () => { try { u1(); } catch {} try { u2(); } catch {} };
  }, []);

  const customerOptions = useMemo(() => customers.map((c:any) => ({ value: c.id, label: `${c.name} · ${c.email || ''}` })), [customers]);

  const [customerId, setCustomerId] = useState<string | null>(null);
  useEffect(() => { if (!customerId && customers.length) setCustomerId(customers[0].id); }, [customers]);
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ id: string; description: string; quantity: string; unitPrice: string; priceId?: string }[]>([]);
  const [taxIds, setTaxIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const taxOptions = taxes.filter((t) => t.enabled).map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }));
  const templateOptions = templates.map((t) => ({ value: t.id, label: t.name }));

  const addRow = () => setItems((rows) => [...rows, { id: `row-${Date.now()}-${Math.random()}`, description: '', quantity: '1', unitPrice: '0' }]);
  const removeRow = (id: string) => setItems((rows) => rows.filter((r) => r.id !== id));
  const updateRow = (id: string, patch: Partial<{ description: string; quantity: string; unitPrice: string; priceId?: string }>) => setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const subtotal = items.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0);
  const taxesAmount = taxIds
    .map((id) => taxes.find((t) => t.id === id))
    .filter(Boolean)
    .reduce((acc, t: any) => acc + (t.enabled ? (t.rate / 100) * subtotal : 0), 0);
  const total = Math.round((subtotal + taxesAmount) * 100) / 100;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { setError('Select a customer'); return; }
    if (items.length === 0) { setError('Add at least one item'); return; }
    if (!dueDate) { setError('Select a due date'); return; }
    await createInvoice({
      customerId,
      amount: total,
      currency,
      dueDate,
      items: items.map((r) => ({ id: r.id, description: r.description, quantity: Number(r.quantity) || 0, unitPrice: Number(r.unitPrice) || 0, priceId: (r as any).priceId })),
      taxIds,
      subtotal,
      taxTotal: taxesAmount,
    });
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
                  const t = templates.find((x) => x.id === v);
                  if (t) {
                    setItems(t.items.map((it) => ({ id: `row-${Math.random()}`, description: it.description, quantity: String(it.quantity), unitPrice: String(it.unitPrice), priceId: (it as any).priceId })));
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
              </Group>
              <Group justify="flex-end">
                <Stack gap={2}>
                  <Group justify="space-between" w={280}>
                    <Text c="dimmed">Subtotal</Text>
                    <Text>{currency} {subtotal.toFixed(2)}</Text>
                  </Group>
                  <Group justify="space-between" w={280}>
                    <Text c="dimmed">Taxes</Text>
                    <Text>{currency} {taxesAmount.toFixed(2)}</Text>
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
