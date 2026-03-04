"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { listCRM } from '@/services/crm/firestore';
import { Card, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import React, { useEffect, useMemo, useState } from 'react';
import { getStripeOverview } from '@/services/stripe/overview-client';
import { getStripeFinanceGeneral } from '@/services/stripe/finance-general-client';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card withBorder>
      <Text size="sm" c="dimmed">{label}</Text>
      <Title order={3}>{value}</Title>
    </Card>
  );
}


export default function FinanceOverviewPage() {
  const [customersCount, setCustomersCount] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [totals, setTotals] = useState<{ paid: number; unpaid: number; lateCount: number }>({ paid: 0, unpaid: 0, lateCount: 0 });
  const [grace, setGrace] = useState(0);
  useEffect(() => { (async () => { const rows = await listCRM('active'); setCustomersCount(rows.filter((r:any)=>r.type==='customer').length); })(); }, []);
  useEffect(() => { (async () => { const g = await getStripeFinanceGeneral(); setGrace(g.gracePeriodDays || 0); setCurrency(g.currency || 'USD'); })(); }, []);
  useEffect(() => { (async () => { const o = await getStripeOverview(grace); setTotals({ paid: o.totalPaid, unpaid: o.totalUnpaid, lateCount: o.lateCount }); if (o.currency) setCurrency(o.currency); })(); }, [grace]);
  const toMoney = (n: number) => `${currency} ${n.toFixed(2)}`;

  return (
    <EmployerAuthGate>
      <Group gap="xs" align="center" mb="md">
        <IconChartBar size={20} />
        <div>
          <Title order={2} mb={4}>Financial overview</Title>
          <Text c="dimmed">Track revenue and late invoices at a glance.</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="md">
        <StatCard label="Total customers" value={String(customersCount)} />
        <StatCard label="Total paid" value={toMoney(totals.paid)} />
        <StatCard label="Outstanding" value={toMoney(totals.unpaid)} />
        <StatCard label={`Late (>${grace}d)`} value={String(totals.lateCount)} />
      </SimpleGrid>

    </EmployerAuthGate>
  );
}
