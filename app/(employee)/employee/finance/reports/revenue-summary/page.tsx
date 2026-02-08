"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Card, Group, Stack, Table, Text, Title, Select } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

type RangeKey = '30d' | '6m' | '12m' | 'ytd' | 'all';

export default function RevenueSummaryReportPage() {
  const router = useRouter();
  const invoices = useFinanceStore((s) => s.invoices);
  const defaultCurrency = useFinanceStore((s) => s.settings.currency);
  const [range, setRange] = useState<RangeKey>('12m');

  // Derive buckets based on selected range
  const { data, label, usedDummy, rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    let built: any;
    if (range === '30d') built = buildDaily(now, 30, invoices, defaultCurrency);
    else if (range === '6m') built = buildMonthly(now, 6, invoices, defaultCurrency);
    else if (range === '12m') built = buildMonthly(now, 12, invoices, defaultCurrency);
    else if (range === 'ytd') built = buildYTD(now, invoices, defaultCurrency);
    else built = buildAllMonthly(now, invoices, defaultCurrency);
    const hasReal = invoices && invoices.length > 0 && (built.data as Array<{ value: number }>).some((d: { value: number }) => d.value > 0);
    if (hasReal) return { ...built, usedDummy: false } as any;
    const dummy = buildDummy(range, now);
    return { data: dummy.data, label: dummy.label, usedDummy: true, rangeStart: dummy.rangeStart, rangeEnd: dummy.rangeEnd } as any;
  }, [range, invoices, defaultCurrency]);

  const total = useMemo(() => (data as Array<{ value: number }>).reduce((acc: number, d) => acc + d.value, 0), [data]);
  const periods = data.length;
  const avg = periods > 0 ? total / periods : 0;
  const latest = periods > 0 ? data[periods - 1]?.value || 0 : 0;
  const prev = periods > 1 ? data[periods - 2]?.value || 0 : 0;
  const changePct = prev > 0 ? ((latest - prev) / prev) * 100 : null;
  const paidCount = useMemo(() => {
    if (usedDummy || !rangeStart || !rangeEnd) return null as number | null;
    return countPaid(invoices, rangeStart, rangeEnd, defaultCurrency);
  }, [usedDummy, rangeStart, rangeEnd, invoices, defaultCurrency]);

  // Month-to-date summary (top card)
  const now = new Date();
  const monthLabel = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const mtdEnd = now.getTime();
  const mtdTotal = usedDummy ? latest : sumPaid(invoices, mtdStart, mtdEnd, defaultCurrency);
  const mtdCount = usedDummy ? null : countPaid(invoices, mtdStart, mtdEnd, defaultCurrency);

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
              <Title order={2} mb={4}>Revenue summary</Title>
              <Text c="dimmed">Paid revenue in {defaultCurrency} — {label}</Text>
            </div>
          </Group>
        </Group>

        {/* Month-to-date */}
        <Card withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Month to date</Text>
              <Text c="dimmed" size="sm">{monthLabel} · Paid revenue in {defaultCurrency}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Total</Text>
              <Text fw={600} ta="right">{defaultCurrency} {mtdTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </div>
          </Group>
        </Card>

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

        {/* Revenue by period (bars) */}
        <Card withBorder>
          <Stack>
            <Text fw={600}>Revenue by period</Text>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => [`${defaultCurrency} ${Number(v).toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="value" fill="#82c91e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Stack>
        </Card>

        {/* KPI table */}
        <Card withBorder>
          <Stack>
            <Text fw={600}>Summary</Text>
            <Table verticalSpacing="xs">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td><Text c="dimmed">Total</Text></Table.Td>
                  <Table.Td><Text fw={600}>{defaultCurrency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Text c="dimmed">Average per period</Text></Table.Td>
                  <Table.Td><Text fw={600}>{defaultCurrency} {avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Text c="dimmed">Latest period</Text></Table.Td>
                  <Table.Td><Text fw={600}>{defaultCurrency} {latest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Text c="dimmed">Change vs prior</Text></Table.Td>
                  <Table.Td><Text fw={600}>{changePct === null ? '—' : `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`}</Text></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Text c="dimmed">Paid invoices</Text></Table.Td>
                  <Table.Td><Text fw={600}>{paidCount === null ? '—' : paidCount}</Text></Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

function buildDaily(now: Date, days: number, invoices: any[], currency: string) {
  const buckets: { key: string; label: string; start: number; end: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 24 * 60 * 60 * 1000 - 1;
    buckets.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(), start, end });
  }
  const data = buckets.map((b) => ({ label: b.label, value: sumPaid(invoices, b.start, b.end, currency) }));
  return { data, label: `last ${days} days`, rangeStart: buckets[0]?.start, rangeEnd: buckets[buckets.length - 1]?.end } as const;
}

function buildMonthly(now: Date, months: number, invoices: any[], currency: string) {
  const buckets: { label: string; start: number; end: number }[] = [];
  const base = new Date(now.getFullYear(), now.getMonth() + 1, 1); // first of next month
  for (let i = months; i >= 1; i--) {
    const startD = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const endD = new Date(base.getFullYear(), base.getMonth() - i + 1, 0, 23, 59, 59, 999);
    buckets.push({ label: startD.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), start: startD.getTime(), end: endD.getTime() });
  }
  const data = buckets.map((b) => ({ label: b.label, value: sumPaid(invoices, b.start, b.end, currency) }));
  return { data, label: `last ${months} months`, rangeStart: buckets[0]?.start, rangeEnd: buckets[buckets.length - 1]?.end } as const;
}

function buildYTD(now: Date, invoices: any[], currency: string) {
  const y = now.getFullYear();
  const startD = new Date(y, 0, 1, 0, 0, 0, 0);
  const built: any = buildMonthly(now, now.getMonth() + 1, invoices, currency);
  return { data: built.data, label: `year to date (${y})`, rangeStart: startD.getTime(), rangeEnd: built.rangeEnd } as const;
}

function buildAllMonthly(now: Date, invoices: any[], currency: string) {
  const paid = invoices.filter((i) => i.status === 'Paid' && i.currency === currency);
  if (paid.length === 0) return buildMonthly(now, 12, invoices, currency);
  const firstTs = Math.min(
    ...paid.map((i) => (typeof i.paidAt === 'number' ? i.paidAt : i.issuedAt))
  );
  const first = new Date(firstTs);
  const startMonth = new Date(first.getFullYear(), first.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const months = (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1;
  const buckets: { label: string; start: number; end: number }[] = [];
  for (let i = 0; i < months; i++) {
    const mStart = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0, 23, 59, 59, 999);
    buckets.push({ label: mStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), start: mStart.getTime(), end: mEnd.getTime() });
  }
  const data = buckets.map((b) => ({ label: b.label, value: sumPaid(invoices, b.start, b.end, currency) }));
  return { data, label: 'all time', rangeStart: buckets[0]?.start, rangeEnd: buckets[buckets.length - 1]?.end } as const;
}

function sumPaid(invoices: any[], start: number, end: number, currency: string) {
  return invoices
    .filter((i) => i.currency === currency)
    .filter((i) => i.status === 'Paid')
    .filter((i) => {
      const ts = typeof i.paidAt === 'number' ? i.paidAt : i.issuedAt;
      return ts >= start && ts <= end;
    })
    .reduce((acc, i) => acc + Number(i.amount || 0), 0);
}

function countPaid(invoices: any[], start: number, end: number, currency: string) {
  return invoices
    .filter((i) => i.currency === currency)
    .filter((i) => i.status === 'Paid')
    .filter((i) => {
      const ts = typeof i.paidAt === 'number' ? i.paidAt : i.issuedAt;
      return ts >= start && ts <= end;
    }).length;
}

function buildDummy(range: RangeKey, now: Date) {
  if (range === '30d') {
    const base = buildDaily(now, 30, [], 'USD');
    const points = base.data.map((d, idx) => ({ label: d.label, value: 200 + Math.sin(idx / 3) * 80 + (idx % 5) * 20 }));
    return { data: points, label: 'last 30 days (sample)', rangeStart: base.rangeStart, rangeEnd: base.rangeEnd } as const;
  }
  const months = range === '6m' ? 6 : range === '12m' ? 12 : (now.getMonth() + 1);
  const built = buildMonthly(now, months, [], 'USD');
  const points = built.data.map((d, idx) => ({ label: d.label, value: 4000 + (idx + 1) * 250 + ((idx % 3) * 300) }));
  return { data: points, label: (range === 'ytd' ? `year to date (${now.getFullYear()})` : `last ${months} months (sample)`), rangeStart: built.rangeStart, rangeEnd: built.rangeEnd } as const;
}
