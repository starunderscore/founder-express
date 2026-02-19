"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { listCRM } from '@/services/crm/firestore';
import { Card, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card withBorder>
      <Text size="sm" c="dimmed">{label}</Text>
      <Title order={3}>{value}</Title>
    </Card>
  );
}


export default function FinanceOverviewPage() {
  const invoices = useFinanceStore((s) => s.invoices);
  const settings = useFinanceStore((s) => s.settings);
  const [customersCount, setCustomersCount] = React.useState(0);
  React.useEffect(() => { (async () => { const rows = await listCRM('active'); setCustomersCount(rows.filter((r:any)=>r.type==='customer').length); })(); }, []);

  const today = new Date();
  const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
  const toMoney = (n: number) => `$${n.toFixed(2)}`;

  const paid = invoices.filter((i) => i.status === 'Paid');
  const unpaid = invoices.filter((i) => i.status === 'Unpaid');
  const late = unpaid.filter((i) => {
    const d = new Date(i.dueDate);
    const grace = new Date(d);
    grace.setDate(grace.getDate() + (settings.gracePeriodDays || 0));
    return grace < today;
  });

  const totalPaid = sum(paid.map((i) => i.amount));
  const totalUnpaid = sum(unpaid.map((i) => i.amount));
  const totalLate = sum(late.map((i) => i.amount));

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
        <StatCard label="Total paid" value={toMoney(totalPaid)} />
        <StatCard label="Outstanding" value={toMoney(totalUnpaid)} />
        <StatCard label={`Late (>${settings.gracePeriodDays}d)`} value={toMoney(totalLate)} />
      </SimpleGrid>

      <Card withBorder>
        <Group gap="lg">
          <Text size="sm">Paid invoices: {paid.length}</Text>
          <Text size="sm">Unpaid invoices: {unpaid.length}</Text>
          <Text size="sm" c={late.length ? 'red' : undefined}>Late invoices: {late.length}</Text>
        </Group>
      </Card>
    </EmployerAuthGate>
  );
}
