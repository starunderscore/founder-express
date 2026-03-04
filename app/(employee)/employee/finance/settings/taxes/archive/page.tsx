"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { ActionIcon, Button, Card, Checkbox, Group, Menu, Stack, Tabs, Text, Title, Modal, TextInput, NumberInput, Anchor } from '@mantine/core';
import { IconPercentage } from '@tabler/icons-react';
import LocalDataTable, { type Column } from '@/components/data-table/LocalDataTable';
import { listStripeTaxes, removeStripeTax, restoreStripeTax, updateStripeTax, type StripeTax } from '@/services/stripe/taxes-client';
import { useEffect, useState } from 'react';

export default function FinanceTaxesArchivePage() {
  const router = useRouter();
  const [rows, setRows] = useState<StripeTax[]>([]);
  const refresh = async () => { setRows(await listStripeTaxes('archived')); };
  useEffect(() => { refresh(); }, []);
  const [taxOpen, setTaxOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState<number | string>('');
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [taxCountry, setTaxCountry] = useState('');
  const [taxState, setTaxState] = useState('');
  const [taxDesc, setTaxDesc] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);

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
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/settings/taxes">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/settings/taxes/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/settings/taxes/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          {(() => {
            const columns: Column<any>[] = [
              { key: 'name', header: 'Name', render: (t: any) => (
                <Anchor onClick={() => { setTaxName(t.name); setTaxRate(t.rate); setEditingTaxId(t.id); setTaxInclusive(!!t.inclusive); setTaxCountry(t.country || ''); setTaxState(t.state || ''); setTaxDesc(t.description || ''); setTaxOpen(true); }}>
                  {t.name || '—'}
                </Anchor>
              ) },
              { key: 'rate', header: 'Rate', width: 120, render: (t: any) => `${t.rate}%` },
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
                    <Menu.Item onClick={async () => { await restoreStripeTax(t.id); refresh(); }}>Restore</Menu.Item>
                    <Menu.Item color="red" onClick={async () => { await removeStripeTax(t.id); refresh(); }}>Remove</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) },
            ];
            return <LocalDataTable rows={rows} columns={columns} defaultPageSize={10} enableSelection={false} />;
          })()}
        </Card>

        <Modal opened={taxOpen} onClose={() => { setTaxOpen(false); setEditingTaxId(null); }} title={'Edit tax'} centered>
          <Stack>
            <TextInput label="Tax name" placeholder="VAT" value={taxName} onChange={(e) => setTaxName(e.currentTarget.value)} />
            <NumberInput label="Rate (%)" value={taxRate as any} onChange={setTaxRate as any} min={0} step={0.01} />
            <Group align="center" gap="xs">
              <Checkbox label="Inclusive" checked={taxInclusive} onChange={(e) => setTaxInclusive(e.currentTarget.checked)} />
              <ActionIcon variant="subtle" aria-label="What is inclusive tax?" onClick={() => setInfoOpen(true)}>?</ActionIcon>
            </Group>
            <Group grow>
              <TextInput label="Country (optional)" placeholder="US" value={taxCountry} onChange={(e) => setTaxCountry(e.currentTarget.value)} />
              <TextInput label="State/Region (optional)" placeholder="CA" value={taxState} onChange={(e) => setTaxState(e.currentTarget.value)} />
            </Group>
            <TextInput label="Description (optional)" placeholder="Sales tax" value={taxDesc} onChange={(e) => setTaxDesc(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => { setTaxOpen(false); setEditingTaxId(null); }}>Cancel</Button>
              <Button onClick={async () => {
                const id = editingTaxId as string | undefined;
                const rateNum = Number(taxRate) || 0;
                if (id) await updateStripeTax(id, { name: taxName, rate: rateNum, inclusive: taxInclusive, country: taxCountry || undefined, state: taxState || undefined, description: taxDesc || undefined });
                setTaxOpen(false); setEditingTaxId(null); refresh();
              }}>Save</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={infoOpen} onClose={() => setInfoOpen(false)} title="Inclusive tax" centered>
          <Stack>
            <Text>
              Inclusive tax means the tax is included in the item price you set. For example, if a product is $100 and a 10% tax is inclusive, the $100 already contains the tax portion. Exclusive tax is added on top of the item price at checkout.
            </Text>
            <Text c="dimmed" size="sm">
              Stripe uses tax rate settings to determine whether to add tax on top (exclusive) or treat it as part of the price (inclusive).
            </Text>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
