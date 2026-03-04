"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Anchor, Button, Card, Group, Stack, Table, Text, TextInput, Title, NumberInput, MultiSelect, Menu, Modal, Tabs } from '@mantine/core';
import { IconFileInvoice } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listenInvoiceTemplates, createInvoiceTemplate, updateInvoiceTemplateDoc, archiveInvoiceTemplateDoc, removeInvoiceTemplateDoc, type InvoiceTemplate } from '@/services/finance/invoice-templates';
import { listStripeTaxes, type StripeTax } from '@/services/stripe/taxes-client';
import { listStripeProducts, type StripeProduct } from '@/services/stripe/products-client';

export default function InvoiceTemplatesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InvoiceTemplate[]>([]);
  useEffect(() => {
    const unsub = listenInvoiceTemplates('active', setRows);
    return () => { try { unsub(); } catch {} };
  }, []);
  const [taxes, setTaxes] = useState<StripeTax[]>([]);
  useEffect(() => { (async () => { setTaxes(await listStripeTaxes('active')); })(); }, []);
  const taxOptions = useMemo(() => taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` })), [taxes]);

  const [tplOpen, setTplOpen] = useState(false);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplItems, setTplItems] = useState<{ id: string; description: string; quantity: string; unitPrice: string; priceId?: string }[]>([]);
  const [tplTaxIds, setTplTaxIds] = useState<string[]>([]);

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
              <IconFileInvoice size={20} />
              <div>
                <Title order={2}>Invoice Templates</Title>
                <Text c="dimmed">Reusable invoice line items and taxes.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button component={require('next/link').default as any} href="/employee/finance/settings/invoice-templates/new" variant="light">New template</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/settings/invoice-templates">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/settings/invoice-templates/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/settings/invoice-templates/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          {(() => {
            const columns: import('@/components/data-table/LocalDataTable').Column<any>[] = [
              { key: 'name', header: 'Name', render: (tpl: any) => (
                <Anchor onClick={() => { setTplName(tpl.name); setTplItems(tpl.items.map((it: any) => ({ id: `row-${Math.random()}`, description: it.description, quantity: String(it.quantity), unitPrice: String(it.unitPrice), priceId: it.priceId }))); setTplTaxIds(tpl.taxIds); setEditingTplId(tpl.id); setTplOpen(true); }}>
                  {tpl.name || '—'}
                </Anchor>
              ) },
              { key: 'items', header: 'Items', width: 120, render: (tpl: any) => <Text size="sm">{tpl.items.length}</Text> },
              { key: 'taxes', header: 'Taxes', width: 120, render: (tpl: any) => <Text size="sm">{tpl.taxIds.length}</Text> },
              { key: 'actions', header: '', width: 1, render: (tpl: any) => (
                <Menu withinPortal position="bottom-end" shadow="md" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" aria-label="Actions">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="5" cy="12" r="2" fill="currentColor"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        <circle cx="19" cy="12" r="2" fill="currentColor"/>
                      </svg>
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => { setTplName(tpl.name); setTplItems(tpl.items.map((it: any) => ({ id: `row-${Math.random()}`, description: it.description, quantity: String(it.quantity), unitPrice: String(it.unitPrice), priceId: it.priceId }))); setTplTaxIds(tpl.taxIds); setEditingTplId(tpl.id); setTplOpen(true); }}>Edit</Menu.Item>
                    <Menu.Item onClick={() => archiveInvoiceTemplateDoc(tpl.id)}>Archive</Menu.Item>
                    <Menu.Item color="red" onClick={() => removeInvoiceTemplateDoc(tpl.id)}>Remove</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) },
            ];
            const LocalDataTable = require('@/components/data-table/LocalDataTable').default as typeof import('@/components/data-table/LocalDataTable').default;
            return <LocalDataTable rows={rows} columns={columns} defaultPageSize={10} enableSelection={false} />;
          })()}
        </Card>

        <ModalEditTemplate
          opened={tplOpen}
          onClose={() => { setTplOpen(false); setEditingTplId(null); }}
          editingTplId={editingTplId}
          tplName={tplName}
          setTplName={setTplName}
          tplItems={tplItems}
          setTplItems={setTplItems as any}
          tplTaxIds={tplTaxIds}
          setTplTaxIds={setTplTaxIds}
          taxOptions={taxOptions}
          addTemplate={(p: any) => { createInvoiceTemplate(p); }}
          updateTemplate={(id: string, p: any) => { updateInvoiceTemplateDoc(id, p); }}
        />
      </Stack>
    </EmployerAuthGate>
  );
}

function ModalEditTemplate(props: {
  opened: boolean;
  onClose: () => void;
  editingTplId: string | null;
  tplName: string;
  setTplName: (v: string) => void;
  tplItems: { id: string; description: string; quantity: string; unitPrice: string; priceId?: string }[];
  setTplItems: (v: { id: string; description: string; quantity: string; unitPrice: string; priceId?: string }[]) => void;
  tplTaxIds: string[];
  setTplTaxIds: (v: string[]) => void;
  taxOptions: { value: string; label: string }[];
  addTemplate: (payload: any) => void;
  updateTemplate: (id: string, payload: any) => void;
}) {
  const { opened, onClose, editingTplId, tplName, setTplName, tplItems, setTplItems, tplTaxIds, setTplTaxIds, taxOptions, addTemplate, updateTemplate } = props;

  const addTplRow = () => setTplItems([ ...tplItems, { id: `row-${Date.now()}-${Math.random()}`, description: '', quantity: '1', unitPrice: '0' } ]);
  const removeTplRow = (id: string) => setTplItems(tplItems.filter((r) => r.id !== id));
  const updateTplRow = (id: string, patch: Partial<{ description: string; quantity: string; unitPrice: string; priceId?: string }>) => setTplItems(tplItems.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const [pricePickerOpen, setPricePickerOpen] = useState<{ open: boolean; rowId?: string }>({ open: false });
  const [products, setProducts] = useState<StripeProduct[] | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  useEffect(() => { if (pricePickerOpen.open && !products) (async () => setProducts(await listStripeProducts('active')))(); }, [pricePickerOpen.open, products]);

  return (
    <Modal opened={opened} onClose={onClose} title={editingTplId ? 'Edit template' : 'New template'} size="lg" centered>
      <Stack>
        <TextInput label="Template name" placeholder="Consulting invoice" value={tplName} onChange={(e) => setTplName(e.currentTarget.value)} />
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
            {tplItems.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td><TextInput value={r.description} onChange={(e) => updateTplRow(r.id, { description: e.currentTarget.value })} placeholder="Description" /></Table.Td>
                <Table.Td>
                  <NumberInput value={r.quantity as any} onChange={(v: any) => updateTplRow(r.id, { quantity: String(v ?? '1') })} min={1} step={1} />
                </Table.Td>
                <Table.Td>
                  <NumberInput value={r.unitPrice as any} onChange={(v: any) => updateTplRow(r.id, { unitPrice: String(v ?? '0') })} min={0} step={0.01} />
                </Table.Td>
                <Table.Td>
                  <Button size="xs" variant="light" onClick={() => { setSelectedProductId(null); setSelectedPriceId(null); setPricePickerOpen({ open: true, rowId: r.id }); }}>Link Stripe price</Button>
                </Table.Td>
                <Table.Td><Button size="xs" variant="subtle" color="red" onClick={() => removeTplRow(r.id)}>Remove</Button></Table.Td>
              </Table.Tr>
            ))}
            {tplItems.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}><Text c="dimmed">No items yet</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        <Group>
          <Button variant="light" onClick={addTplRow}>Add item</Button>
        </Group>
        <MultiSelect label="Taxes" data={taxOptions} value={tplTaxIds} onChange={setTplTaxIds} searchable placeholder="Select taxes to apply" />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            const payload = { name: (tplName || '').trim(), items: tplItems.map((r) => ({ description: r.description, quantity: Number(r.quantity) || 0, unitPrice: Number(r.unitPrice) || 0, priceId: r.priceId })), taxIds: tplTaxIds };
            if (!payload.name) return;
            if (editingTplId) updateTemplate(editingTplId, payload); else addTemplate(payload);
            onClose();
          }}>Save</Button>
        </Group>

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
                updateTplRow(pricePickerOpen.rowId, { priceId: pr.id, unitPrice: String(pr.unitAmount), description: (products || []).find((p) => p.id === selectedProductId)?.name || '' });
                setPricePickerOpen({ open: false });
              }}>Link</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Modal>
  );
}
