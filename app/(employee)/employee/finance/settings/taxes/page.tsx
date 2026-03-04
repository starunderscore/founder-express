"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { ActionIcon, Button, Card, Checkbox, Group, Modal, NumberInput, Stack, Text, TextInput, Title, Menu, Tabs, Anchor } from '@mantine/core';
import { IconPercentage } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LocalDataTable, { type Column } from '@/components/data-table/LocalDataTable';
import { listStripeTaxes, createStripeTax, updateStripeTax, archiveStripeTax, removeStripeTax, type StripeTax } from '@/services/stripe/taxes-client';

export default function FinanceTaxesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<StripeTax[]>([]);
  const refresh = async () => { setRows(await listStripeTaxes('active')); };
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
          <Group gap="xs">
            <Button onClick={() => { setTaxName(''); setTaxRate(''); setEditingTaxId(null); setTaxOpen(true); }} variant="light">Add tax</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/settings/taxes">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/settings/taxes/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/settings/taxes/removed">Remove</Link></Tabs.Tab>
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
              { key: 'inclusive', header: 'Inclusive', width: 100, render: (t: any) => (<Text size="sm">{t.inclusive ? 'Yes' : 'No'}</Text>) },
              { key: 'location', header: 'Location', width: 140, render: (t: any) => (<Text size="sm">{[t.country, t.state].filter(Boolean).join('-') || '—'}</Text>) },
              { key: 'enabled', header: 'Enabled', width: 120, render: (t: any) => (
                <Checkbox checked={t.enabled} onChange={async (e) => { await updateStripeTax(t.id, { enabled: e.currentTarget.checked }); refresh(); }} />
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
                    <Menu.Item onClick={async () => { await archiveStripeTax(t.id); refresh(); }}>Archive</Menu.Item>
                    <Menu.Item color="red" onClick={async () => { await removeStripeTax(t.id); refresh(); }}>Remove</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) },
            ];
            return <LocalDataTable rows={rows} columns={columns} defaultPageSize={10} enableSelection={false} />;
          })()}
        </Card>

        {/* Archived taxes moved to /archive tab */}

        <Modal opened={taxOpen} onClose={() => { setTaxOpen(false); setEditingTaxId(null); }} title={editingTaxId ? 'Edit tax' : 'Add tax'} centered>
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
                const core = { name: taxName.trim(), rate: rateNum, inclusive: taxInclusive, country: taxCountry.trim() || undefined, state: taxState.trim() || undefined, description: taxDesc.trim() || undefined };
                if (!id) await createStripeTax(core); else await updateStripeTax(id, core);
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
  
// Info modal about inclusive tax
// Rendered at root of component tree above
