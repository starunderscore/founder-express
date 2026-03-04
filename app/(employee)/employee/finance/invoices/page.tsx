"use client";
import { useState, useMemo, useEffect } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { listCRM } from '@/services/crm/firestore';
import { Button, Card, Group, Select, Table, Text, TextInput, Title, Stack } from '@mantine/core';
import { IconFileInvoice } from '@tabler/icons-react';
import { listenInvoices, updateInvoiceDoc, deleteInvoiceDoc, type Invoice } from '@/services/finance/invoices';

export default function FinanceInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<'USD'|'EUR'|'GBP'>('USD');
  useEffect(() => {
    const unsub = listenInvoices(setInvoices);
    return () => { try { unsub(); } catch {} };
  }, []);
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => { (async () => { const rows = await listCRM('active'); setCustomers(rows.filter((r:any)=>r.type==='customer')); })(); }, []);

  const [customerId, setCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [dueDate, setDueDate] = useState<string>('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  const customerOptions = customers.map((c: any) => ({ value: c.id, label: `${c.name} · ${c.email || ''}` }));

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return invoices.filter((i) => {
      const cust = customers.find((c: any) => c.id === i.customerId);
      const text = `${cust?.name || ''} ${cust?.email || ''}`.toLowerCase();
      const matchesQuery = !q || text.includes(q);
      const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, customers, query, statusFilter]);

  const onAdd = (e: React.FormEvent) => { e.preventDefault(); };

  const today = new Date();

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group gap="xs" align="center">
            <IconFileInvoice size={20} />
            <div>
              <Title order={2} mb={4}>Invoices</Title>
              <Text c="dimmed">Track payments and late bills.</Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button component={require('next/link').default as any} href="/employee/finance/invoices/new" variant="light">Add invoice</Button>
          </Group>
        </Group>

        <Card withBorder>
        <Group mb="sm" grow>
          <TextInput placeholder="Search customer" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
          <Select data={[ 'All', 'Paid', 'Unpaid' ]} value={statusFilter} onChange={(v) => setStatusFilter((v as any) || 'All')} allowDeselect={false} />
        </Group>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Due</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((i) => {
              const cust = customers.find((c: any) => c.id === i.customerId);
              const isLate = i.status === 'Unpaid' && new Date(i.dueDate) < today;
              return (
                <Table.Tr key={i.id}>
                  <Table.Td>{cust ? `${cust.name} · ${cust.email}` : 'Unknown'}</Table.Td>
                  <Table.Td>{i.currency} {i.amount.toFixed(2)}</Table.Td>
                  <Table.Td>{i.dueDate}</Table.Td>
                  <Table.Td>
                    <Group gap={8}>
                      <Select data={[ 'Unpaid', 'Paid' ]} value={i.status} onChange={(v) => v && updateInvoiceDoc(i.id, { status: v as any, paidAt: v === 'Paid' ? Date.now() : undefined })} allowDeselect={false} />
                      {isLate && <Text size="sm" c="red">Late</Text>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      {i.status !== 'Paid' && <Button size="xs" variant="light" onClick={() => updateInvoiceDoc(i.id, { status: 'Paid', paidAt: Date.now() })}>Mark paid</Button>}
                      <Button size="xs" variant="subtle" color="red" onClick={() => deleteInvoiceDoc(i.id)}>Remove</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed">No invoices</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
