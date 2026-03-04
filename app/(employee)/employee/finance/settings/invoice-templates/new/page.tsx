"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Button, Card, Group, MultiSelect, Stack, Table, Text, TextInput, Title, NumberInput, Select } from '@mantine/core';
import { IconFileInvoice } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createInvoiceTemplate } from '@/services/finance/invoice-templates';
import { listStripeTaxes, type StripeTax } from '@/services/stripe/taxes-client';
import { listStripeProducts, type StripeProduct } from '@/services/stripe/products-client';

export default function NewInvoiceTemplatePage() {
  const router = useRouter();
  const [taxes, setTaxes] = useState<StripeTax[]>([]);
  useEffect(() => { (async () => { setTaxes(await listStripeTaxes('active')); })(); }, []);

  const taxOptions = useMemo(() => taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` })), [taxes]);

  const [name, setName] = useState('');
  const [items, setItems] = useState<{ id: string; description: string; quantity: string; unitPrice: string; priceId?: string }[]>([]);
  const [taxIds, setTaxIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => setItems((rows) => [...rows, { id: `row-${Date.now()}-${Math.random()}`, description: '', quantity: '1', unitPrice: '0' }]);
  const removeRow = (id: string) => setItems((rows) => rows.filter((r) => r.id !== id));
  const updateRow = (id: string, patch: Partial<{ description: string; quantity: string; unitPrice: string; priceId?: string }>) => setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const [pricePickerOpen, setPricePickerOpen] = useState<{ open: boolean; rowId?: string }>({ open: false });
  const [products, setProducts] = useState<StripeProduct[] | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  useEffect(() => { if (pricePickerOpen.open && !products) (async () => setProducts(await listStripeProducts('active')))(); }, [pricePickerOpen.open, products]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Template name required'); return; }
    if (items.length === 0) { setError('Add at least one item'); return; }
    const payload = { name: name.trim(), items: items.map((r) => ({ description: r.description, quantity: Number(r.quantity) || 0, unitPrice: Number(r.unitPrice) || 0, priceId: r.priceId })), taxIds };
    await createInvoiceTemplate(payload);
    router.push('/employee/finance/settings/invoice-templates');
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
          <Group gap="xs" align="center">
            <IconFileInvoice size={20} />
            <div>
              <Title order={2} mb={4}>New invoice template</Title>
              <Text c="dimmed">Define reusable line items with taxes.</Text>
            </div>
          </Group>
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
                      <Table.Td>
                        <Button size="xs" variant="light" onClick={() => { setSelectedProductId(null); setSelectedPriceId(null); setPricePickerOpen({ open: true, rowId: r.id }); }}>Link Stripe price</Button>
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
              <MultiSelect label="Taxes" data={taxOptions} value={taxIds} onChange={setTaxIds} searchable placeholder="Select taxes to apply" />
              {error && <Text c="red" size="sm">{error}</Text>}
              <Group justify="flex-end">
                <Button variant="default" type="button" onClick={() => router.push('/employee/finance/settings/invoice-templates')}>Cancel</Button>
                <Button type="submit">Create template</Button>
              </Group>
            </Stack>
          </form>
        </Card>

        <Modal opened={pricePickerOpen.open} onClose={() => setPricePickerOpen({ open: false })} title="Link Stripe price" centered>
          <Stack>
            <Select
              label="Product"
              data={(products || []).map((p) => ({ value: p.id, label: p.name }))}
              value={selectedProductId}
              onChange={(v) => { setSelectedProductId(v); setSelectedPriceId(null); }}
              searchable
              placeholder="Select a product"
            />
            <Select
              label="Price"
              data={(products || []).find((p) => p.id === selectedProductId)?.prices.map((pr) => ({ value: pr.id, label: `${pr.currency} ${(pr.unitAmount).toFixed(2)} ${pr.type === 'recurring' ? `· ${pr.recurring?.interval}/${pr.recurring?.intervalCount || 1}` : ''}` })) || []}
              value={selectedPriceId}
              onChange={setSelectedPriceId}
              searchable
              placeholder="Select a price"
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setPricePickerOpen({ open: false })}>Cancel</Button>
              <Button disabled={!selectedProductId || !selectedPriceId} onClick={() => {
                const pr = (products || []).find((p) => p.id === selectedProductId)?.prices.find((x) => x.id === selectedPriceId);
                if (!pr || !pricePickerOpen.rowId) return;
                updateRow(pricePickerOpen.rowId, { priceId: pr.id, unitPrice: String(pr.unitAmount), description: (products || []).find((p) => p.id === selectedProductId)?.name || '' });
                setPricePickerOpen({ open: false });
              }}>Link</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
