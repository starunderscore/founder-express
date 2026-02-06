"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Button, Card, Group, Stack, Table, Text, TextInput, Title, NumberInput, MultiSelect, Menu, Modal, Tabs } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InvoiceTemplatesPage() {
  const router = useRouter();
  const settings = useFinanceStore((s) => s.settings);
  const addTemplate = useFinanceStore((s) => s.addTemplate);
  const updateTemplate = useFinanceStore((s) => s.updateTemplate);
  const removeTemplate = useFinanceStore((s) => s.removeTemplate);
  const archiveTemplate = useFinanceStore((s) => s.archiveTemplate);

  const taxOptions = useMemo(() => settings.taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` })), [settings.taxes]);

  const [tplOpen, setTplOpen] = useState(false);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplItems, setTplItems] = useState<{ id: string; description: string; quantity: string; unitPrice: string }[]>([]);
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
            <div>
              <Title order={2}>Invoice Templates</Title>
              <Text c="dimmed">Reusable invoice line items and taxes.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button component={require('next/link').default as any} href="/employee/finance/invoice-templates/new" variant="light">New template</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/invoice-templates">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/invoice-templates/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/invoice-templates/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          <Stack>
            <Text fw={600}>Active templates</Text>
            <Stack>
              {settings.templates.filter((tpl) => !tpl.isArchived && !tpl.deletedAt).map((tpl) => (
                <Card withBorder key={tpl.id}>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text fw={600}>{tpl.name}</Text>
                      <Text size="sm" c="dimmed">Items: {tpl.items.length} · Taxes: {tpl.taxIds.length}</Text>
                    </div>
                    <Group gap={6}>
                      <Button size="xs" variant="light" onClick={() => {
                        setTplName(tpl.name);
                        setTplItems(tpl.items.map((it) => ({ id: `row-${Math.random()}`, description: it.description, quantity: String(it.quantity), unitPrice: String(it.unitPrice) })));
                        setTplTaxIds(tpl.taxIds);
                        setEditingTplId(tpl.id);
                        setTplOpen(true);
                      }}>Edit</Button>
                      <Button size="xs" variant="light" color="orange" onClick={() => archiveTemplate(tpl.id)}>Archive</Button>
                      <Button size="xs" variant="subtle" color="red" onClick={() => removeTemplate(tpl.id)}>Remove</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
              {settings.templates.filter((tpl) => !tpl.isArchived && !tpl.deletedAt).length === 0 && (
                <Card withBorder><Text c="dimmed">No templates</Text></Card>
              )}
            </Stack>
          </Stack>
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
          addTemplate={addTemplate}
          updateTemplate={updateTemplate}
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
  tplItems: { id: string; description: string; quantity: string; unitPrice: string }[];
  setTplItems: (v: { id: string; description: string; quantity: string; unitPrice: string }[]) => void;
  tplTaxIds: string[];
  setTplTaxIds: (v: string[]) => void;
  taxOptions: { value: string; label: string }[];
  addTemplate: (payload: any) => void;
  updateTemplate: (id: string, payload: any) => void;
}) {
  const { opened, onClose, editingTplId, tplName, setTplName, tplItems, setTplItems, tplTaxIds, setTplTaxIds, taxOptions, addTemplate, updateTemplate } = props;

  const addTplRow = () => setTplItems([ ...tplItems, { id: `row-${Date.now()}-${Math.random()}`, description: '', quantity: '1', unitPrice: '0' } ]);
  const removeTplRow = (id: string) => setTplItems(tplItems.filter((r) => r.id !== id));
  const updateTplRow = (id: string, patch: Partial<{ description: string; quantity: string; unitPrice: string }>) => setTplItems(tplItems.map((r) => (r.id === id ? { ...r, ...patch } : r)));

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
            const payload = { name: (tplName || '').trim(), items: tplItems.map((r) => ({ description: r.description, quantity: Number(r.quantity) || 0, unitPrice: Number(r.unitPrice) || 0 })), taxIds: tplTaxIds };
            if (!payload.name) return;
            if (editingTplId) updateTemplate(editingTplId, payload); else addTemplate(payload);
            onClose();
          }}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

