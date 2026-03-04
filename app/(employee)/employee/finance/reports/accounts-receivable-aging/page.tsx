"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Card, Group, Stack, Table, Text, Title, Select } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStripeFinanceGeneral } from '@/services/stripe/finance-general-client';
import { getAccountsReceivableAging, type AgingBucket } from '@/services/stripe/receivables-client';

export default function AccountsReceivableAgingReportPage() {
  const router = useRouter();
  const defaultCurrency = useFinanceStore((s) => s.settings.currency);

  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [buckets, setBuckets] = useState<AgingBucket[]>([]);
  const totalAmt = buckets.reduce((acc, b) => acc + b.amount, 0);
  const totalCount = buckets.reduce((acc, b) => acc + b.count, 0);
  const [selectedBucket, setSelectedBucket] = useState<string>('0–30 days');

  useEffect(() => { (async () => { try { const g = await getStripeFinanceGeneral(); if (g?.currency) setCurrency(g.currency); } catch {} })(); }, []);
  useEffect(() => { (async () => { try { const res = await getAccountsReceivableAging(currency?.toUpperCase()); setBuckets(res.buckets); if (res.buckets.length) setSelectedBucket((b) => res.buckets.some(x => x.name === b) ? b : res.buckets[0].name); } catch { setBuckets([]); } })(); }, [currency]);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/reports')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>A/R aging</Title>
            <Text c="dimmed">Outstanding unpaid invoices grouped by days past due.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Aging buckets</Text>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Bucket</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Count</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {buckets.map((b) => (
                  <Table.Tr key={b.name}>
                    <Table.Td>{b.name}</Table.Td>
                    <Table.Td>{currency} {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Td>
                    <Table.Td>{b.count}</Table.Td>
                  </Table.Tr>
                ))}
                {buckets.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}><Text c="dimmed">No outstanding invoices</Text></Table.Td>
                  </Table.Tr>
                )}
                {buckets.length > 0 && (
                  <Table.Tr>
                    <Table.Td><Text fw={600}>Total</Text></Table.Td>
                    <Table.Td><Text fw={600}>{currency} {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Table.Td>
                    <Table.Td><Text fw={600}>{totalCount}</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>

        {/* Toolbar controlling the detail view */}
        <Card withBorder>
          <Group justify="flex-start" align="center" gap={12}>
            <Text size="sm" c="dimmed">Bucket</Text>
            <Select
              value={selectedBucket}
              onChange={(v: any) => setSelectedBucket(v)}
              data={buckets.map((b) => ({ value: b.name, label: b.name }))}
              allowDeselect={false}
              w={220}
            />
          </Group>
        </Card>

        {/* Single detail card driven by toolbar */}
        <Card withBorder>
          <Stack>
            {(() => {
              const b = buckets.find((x) => x.name === selectedBucket) || buckets[0];
              if (!b) return <Text c="dimmed">No data</Text>;
              return (
                <>
                  <Group justify="space-between" align="center">
                    <div>
                      <Text fw={600}>Invoices — {b.name}</Text>
                      <Text size="sm" c="dimmed">{currency} {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · {b.count} invoice{b.count === 1 ? '' : 's'}</Text>
                    </div>
                  </Group>
                  <Table verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Invoice</Table.Th>
                        <Table.Th>Customer</Table.Th>
                        <Table.Th>Due date</Table.Th>
                        <Table.Th>Days past due</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {b.items.map((it: any) => (
                        <Table.Tr key={it.id}>
                          <Table.Td>{it.id}</Table.Td>
                          <Table.Td>{it.customerId || '—'}</Table.Td>
                          <Table.Td>{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '—'}</Table.Td>
                          <Table.Td>{it.daysPastDue}</Table.Td>
                          <Table.Td>{currency} {Number(it.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Td>
                          <Table.Td>{it.status || '—'}</Table.Td>
                        </Table.Tr>
                      ))}
                      {b.items.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={6}><Text c="dimmed">No invoices in this bucket</Text></Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </>
              );
            })()}
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
