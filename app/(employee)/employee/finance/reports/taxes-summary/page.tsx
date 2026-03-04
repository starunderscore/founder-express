"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Card, Group, Select, Stack, Table, Text, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { getStripeFinanceGeneral } from '@/services/stripe/finance-general-client';
import { getTaxesSummary, type TaxRow } from '@/services/stripe/taxes-summary-client';

type RangeKey = '6m' | '12m' | 'ytd' | 'all';

export default function TaxesSummaryReportPage() {
  const router = useRouter();
  const defaultCurrency = useFinanceStore((s) => s.settings.currency);
  const [range, setRange] = useState<RangeKey>('12m');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [rows, setRows] = useState<TaxRow[]>([]);

  useEffect(() => { (async () => { try { const g = await getStripeFinanceGeneral(); if (g?.currency) setCurrency(g.currency); } catch {} })(); }, []);
  useEffect(() => { (async () => { try { const res = await getTaxesSummary(range, currency?.toUpperCase()); setRows(res.rows); } catch { setRows([]); } })(); }, [range, currency]);

  const data = useMemo(() => rows.slice(0, 10).map((r) => ({ name: r.name, value: r.value })), [rows]);
  const table = rows;
  const total = useMemo(() => table.reduce((acc, r) => acc + r.value, 0), [table]);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/reports')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2} mb={4}>Taxes summary</Title>
              <Text c="dimmed">Collected taxes by rate and period.</Text>
            </div>
          </Group>
        </Group>

        {/* Toolbar */}
        <Card withBorder>
          <Group justify="flex-start" align="center" gap={12}>
            <Text size="sm" c="dimmed">Period</Text>
            <Select
              value={range}
              onChange={(v: any) => setRange(v)}
              data={[
                { value: '6m', label: 'Last 6 months' },
                { value: '12m', label: 'Last 12 months' },
                { value: 'ytd', label: 'Year to date' },
                { value: 'all', label: 'All time' },
              ]}
              allowDeselect={false}
              w={220}
            />
          </Group>
        </Card>

        {/* Chart */}
        <Card withBorder>
          <Stack>
            <Text fw={600}>Collected by tax</Text>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} height={60} textAnchor="end" />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => [`${currency} ${Number(v).toFixed(2)}`, 'Collected']} />
                  <Bar dataKey="value" fill="#82c91e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Stack>
        </Card>

        {/* Table */}
        <Card withBorder>
          <Stack>
            <Group justify="space-between" align="center">
              <Text fw={600}>Summary</Text>
              <Text fw={600}>{currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </Group>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tax</Table.Th>
                  <Table.Th>Collected</Table.Th>
                  <Table.Th>Invoices</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {table.map((r) => (
                  <Table.Tr key={r.name}>
                    <Table.Td>{r.name}</Table.Td>
                    <Table.Td>{currency} {r.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Td>
                    <Table.Td>{r.count}</Table.Td>
                  </Table.Tr>
                ))}
                {table.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}><Text c="dimmed">No data</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

// Local helpers not needed; API handles range and tax aggregation
