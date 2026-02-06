"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useFinanceStore } from '@/state/financeStore';
import { ActionIcon, Badge, Button, Card, Group, Select, Stack, Tabs, Text, TextInput, Title } from '@mantine/core';
import { IconReportMoney } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDisconnectedCard } from '@/components/AdminDisconnectedCard';

export default function AdminFinanceExportsPage() {
  const router = useRouter();
  const invoices = useFinanceStore((s) => s.invoices);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dataset, setDataset] = useState<'invoices'>('invoices');
  const [status, setStatus] = useState<{ hasKey: boolean; suffix: string | null; hasRealm: boolean; realmSuffix: string | null } | null>(null);
  const [exportInfo, setExportInfo] = useState<{ count: number; first?: number; last?: number } | null>(null);

  useEffect(() => {
    fetch('/api/admin/finance/config')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ hasKey: false, suffix: null, hasRealm: false, realmSuffix: null }));
  }, []);

  // Live compute timespan for current filters
  useEffect(() => {
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    const filteredTimes = invoices
      .filter((i) => {
        const d = new Date(i.issuedAt);
        if (s && d < s) return false;
        if (e && d > e) return false;
        return true;
      })
      .map((i) => i.issuedAt);
    if (filteredTimes.length > 0) {
      const firstTs = Math.min(...filteredTimes);
      const lastTs = Math.max(...filteredTimes);
      setExportInfo({ count: filteredTimes.length, first: firstTs, last: lastTs });
    } else {
      setExportInfo({ count: 0 });
    }
  }, [invoices, start, end]);

  const generateCsv = () => {
    const s = start ? new Date(start) : null; const e = end ? new Date(end) : null;
    const rows = invoices.filter((i) => {
      const d = new Date(i.issuedAt);
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    }).map((i) => ({ id: i.id, customerId: i.customerId, amount: i.amount, currency: i.currency, dueDate: i.dueDate, status: i.status, issuedAt: new Date(i.issuedAt).toISOString() }));
    // compute export timespan info for UI
    try {
      const filteredTimes = invoices
        .filter((i) => {
          const d = new Date(i.issuedAt);
          if (s && d < s) return false;
          if (e && d > e) return false;
          return true;
        })
        .map((i) => i.issuedAt);
      if (filteredTimes.length > 0) {
        const firstTs = Math.min(...filteredTimes);
        const lastTs = Math.max(...filteredTimes);
        setExportInfo({ count: filteredTimes.length, first: firstTs, last: lastTs });
      } else {
        setExportInfo({ count: 0 });
      }
    } catch {}
    const header = 'id,customerId,amount,currency,dueDate,status,issuedAt\n';
    const body = rows.map((r) => `${r.id},${r.customerId},${r.amount},${r.currency},${r.dueDate},${r.status},${r.issuedAt}`).join('\n');
    const csv = header + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `export-${dataset}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings/data-operations')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconReportMoney size={20} />
              <div>
                <Title order={2}>Finance Exports</Title>
                <Text c="dimmed">Export finance data and trigger QuickBooks sync.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Tabs
          defaultValue="csv"
          onChange={(v) => {
            if (v === 'quickbooks') router.push('/employee/admin-settings/data-operations/finance/exports/quickbooks');
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="csv">CSV</Tabs.Tab>
            <Tabs.Tab value="quickbooks" onClick={() => router.push('/employee/admin-settings/data-operations/finance/exports/quickbooks')}>QuickBooks</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="csv" pt="md">
            <Card withBorder>
              <Stack>
                <Text fw={600}>Export to CSV</Text>
                {(function datasetChips() {
                  if (invoices.length === 0) return null;
                  const times = invoices.map((i) => i.issuedAt);
                  const first = new Date(Math.min(...times));
                  const last = new Date(Math.max(...times));
                  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
                  const isCurrent = Date.now() - last.getTime() <= twoWeeksMs;
                  const fmt = (d: Date) => d.toLocaleDateString('en-US');
                  return (
                    <Group gap={8}>
                      <Badge variant="light">Records start: {fmt(first)}</Badge>
                      <Badge variant="light" color={isCurrent ? 'green' : undefined}>
                        Records end: {fmt(last)}{isCurrent ? ' · Current' : ''}
                      </Badge>
                    </Group>
                  );
                })()}
                <Group grow>
                  <TextInput type="date" label="Start date" value={start} onChange={(e) => setStart(e.currentTarget.value)} />
                  <TextInput type="date" label="End date" value={end} onChange={(e) => setEnd(e.currentTarget.value)} />
                </Group>
                <Select label="Dataset" data={[ { value: 'invoices', label: 'Invoices' } ]} value={dataset} onChange={(v: any) => setDataset(v || 'invoices')} />
                <Group justify="flex-end">
                  <Button variant="light" onClick={generateCsv}>Generate CSV</Button>
                </Group>
                {exportInfo && exportInfo.count === 0 && (
                  <Text c="dimmed" size="sm">No records in selected timespan.</Text>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>

          {/* QuickBooks tab lives on its own page; selecting it navigates away. */}
        </Tabs>
      </Stack>
    </EmployerAdminGate>
  );
}
