"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Button, Card, Checkbox, Group, Modal, NumberInput, Stack, Table, Text, TextInput, Title, Menu, Tabs } from '@mantine/core';
import { IconPercentage } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Rate</Table.Th>
                <Table.Th>Enabled</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {settings.taxes.filter((t) => !t.isArchived && !t.deletedAt).map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>{t.name}</Table.Td>
                  <Table.Td>{t.rate}%</Table.Td>
                  <Table.Td>
                    <Checkbox checked={t.enabled} onChange={(e) => updateTax(t.id, { enabled: e.currentTarget.checked })} />
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap={6}>
                      <Button size="xs" variant="light" onClick={() => { setTaxName(t.name); setTaxRate(t.rate); setEditingTaxId(t.id); setTaxOpen(true); }}>Edit</Button>
                      <Button size="xs" variant="light" color="orange" onClick={() => archiveTax(t.id)}>Archive</Button>
                      <Button size="xs" variant="subtle" color="red" onClick={() => removeTax(t.id)}>Remove</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {settings.taxes.filter((t) => !t.isArchived && !t.deletedAt).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed">No tax rates</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
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
