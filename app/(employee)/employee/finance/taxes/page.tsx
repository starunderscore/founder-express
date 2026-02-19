"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Button, Card, Checkbox, Group, Modal, NumberInput, Stack, Text, TextInput, Title, Menu, Tabs, Anchor } from '@mantine/core';
import { IconPercentage } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LocalDataTable, { type Column } from '@/components/data-table/LocalDataTable';

export default function FinanceTaxesPage() {
  const router = useRouter();
  const settings = useFinanceStore((s) => s.settings);
  const addTax = useFinanceStore((s) => s.addTax);
  const updateTax = useFinanceStore((s) => s.updateTax);
  const removeTax = useFinanceStore((s) => s.removeTax);
  const archiveTax = useFinanceStore((s) => s.archiveTax);
  const restoreTax = useFinanceStore((s) => s.restoreTax);

  const [taxOpen, setTaxOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState<number | string>('');

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
              <IconPercentage size={20} />
              <div>
                <Title order={2}>Taxes</Title>
                <Text c="dimmed">Manage tax rates and enablement.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button onClick={() => { setTaxName(''); setTaxRate(''); setEditingTaxId(null); setTaxOpen(true); }} variant="light">Add tax</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/taxes">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/taxes/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/taxes/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Tax rates</Text>
          </Group>
          {(() => {
            const columns: Column<any>[] = [
              { key: 'name', header: 'Name', render: (t: any) => (
                <Anchor onClick={() => { setTaxName(t.name); setTaxRate(t.rate); setEditingTaxId(t.id); setTaxOpen(true); }}>
                  {t.name || '—'}
                </Anchor>
              ) },
              { key: 'rate', header: 'Rate', width: 120, render: (t: any) => `${t.rate}%` },
              { key: 'enabled', header: 'Enabled', width: 120, render: (t: any) => (
                <Checkbox checked={t.enabled} onChange={(e) => updateTax(t.id, { enabled: e.currentTarget.checked })} />
              ) },
              { key: 'actions', header: '', width: 1, render: (t: any) => (
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
                    <Menu.Item onClick={() => { setTaxName(t.name); setTaxRate(t.rate); setEditingTaxId(t.id); setTaxOpen(true); }}>Edit</Menu.Item>
                    <Menu.Item onClick={() => archiveTax(t.id)}>Archive</Menu.Item>
                    <Menu.Item color="red" onClick={() => removeTax(t.id)}>Remove</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) },
            ];
            const rows = settings.taxes.filter((t) => !t.isArchived && !t.deletedAt);
            return <LocalDataTable rows={rows} columns={columns} defaultPageSize={10} enableSelection={false} />;
          })()}
        </Card>

        {/* Archived taxes moved to /archive tab */}

        <Modal opened={taxOpen} onClose={() => { setTaxOpen(false); setEditingTaxId(null); }} title={editingTaxId ? 'Edit tax' : 'Add tax'} centered>
          <Stack>
            <TextInput label="Tax name" placeholder="VAT" value={taxName} onChange={(e) => setTaxName(e.currentTarget.value)} />
            <NumberInput label="Rate (%)" value={taxRate as any} onChange={setTaxRate as any} min={0} step={0.01} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => { setTaxOpen(false); setEditingTaxId(null); }}>Cancel</Button>
              <Button onClick={() => {
                const id = editingTaxId as string | undefined;
                const rateNum = Number(taxRate) || 0;
                if (id) updateTax(id, { name: taxName, rate: rateNum }); else addTax({ name: taxName, rate: rateNum });
                setTaxOpen(false); setEditingTaxId(null);
              }}>Save</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
