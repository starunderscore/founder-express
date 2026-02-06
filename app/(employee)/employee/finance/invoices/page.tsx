"use client";
import { useState, useMemo } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useFinanceStore } from '@/state/financeStore';
import { useCRMStore } from '@/state/crmStore';
import { Button, Card, Group, Select, Table, Text, TextInput, Title, Stack } from '@mantine/core';

export default function FinanceInvoicesPage() {
  const invoices = useFinanceStore((s) => s.invoices);
  const financeSettings = useFinanceStore((s) => s.settings);
  const addInvoice = useFinanceStore((s) => s.addInvoice);
  const updateInvoice = useFinanceStore((s) => s.updateInvoice);
  const removeInvoice = useFinanceStore((s) => s.removeInvoice);
  const markPaid = useFinanceStore((s) => s.markPaid);
  const customers = useCRMStore((s) => s.customers);

  const [customerId, setCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(financeSettings.currency);
  const [dueDate, setDueDate] = useState<string>('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');

  const customerOptions = customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.email}` }));

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return invoices.filter((i) => {
      const cust = customers.find((c) => c.id === i.customerId);
      const text = `${cust?.name || ''} ${cust?.email || ''}`.toLowerCase();
      const matchesQuery = !q || text.includes(q);
      const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, customers, query, statusFilter]);

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!customerId || !isFinite(amt) || amt <= 0 || !dueDate) return;
    addInvoice({ customerId, amount: amt, currency, dueDate });
    setAmount(''); setDueDate('');
  };

  const today = new Date();

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <div>
            <Title order={2} mb={4}>Invoices</Title>
            <Text c="dimmed">Track payments and late bills.</Text>
          </div>
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
              const cust = customers.find((c) => c.id === i.customerId);
              const isLate = i.status === 'Unpaid' && new Date(i.dueDate) < today;
              return (
                <Table.Tr key={i.id}>
                  <Table.Td>{cust ? `${cust.name} · ${cust.email}` : 'Unknown'}</Table.Td>
                  <Table.Td>{i.currency} {i.amount.toFixed(2)}</Table.Td>
                  <Table.Td>{i.dueDate}</Table.Td>
                  <Table.Td>
                    <Group gap={8}>
                      <Select
                        data={[ 'Unpaid', 'Paid' ]}
                        value={i.status}
                        onChange={(v) => v && updateInvoice(i.id, { status: v as any, paidAt: v === 'Paid' ? Date.now() : undefined })}
                        allowDeselect={false}
                      />
                      {isLate && <Text size="sm" c="red">Late</Text>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      {i.status !== 'Paid' && <Button size="xs" variant="light" onClick={() => markPaid(i.id)}>Mark paid</Button>}
                      <Button size="xs" variant="subtle" color="red" onClick={() => removeInvoice(i.id)}>Remove</Button>
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
