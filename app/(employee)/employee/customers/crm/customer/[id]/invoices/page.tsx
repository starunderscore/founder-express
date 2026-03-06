"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Title, Text, Group, Table, Anchor, Center, Loader, Badge, Button, Modal, TextInput } from '@mantine/core';
import CustomerHeader from '@/components/crm/CustomerHeader';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';

type Row = {
  id: string;
  number: string | null;
  status: string | null;
  currency: string | null;
  total: number | null;
  created: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
};

export default function CustomerInvoicesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null | undefined>(undefined);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignId, setAssignId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db(), 'crm_customers', params.id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setCustomer(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null);
        setLoadingCustomer(false);
      },
      () => {
        setCustomer(null);
        setLoadingCustomer(false);
      }
    );
    return () => unsub();
  }, [params.id]);

  const loadInvoices = async () => {
    try {
      const res = await fetch(`/api/crm/customers/${encodeURIComponent(params.id)}/invoices`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load invoices');
      const json = await res.json();
      setStripeCustomerId(json.stripeCustomerId ?? null);
      setRows(json.invoices || []);
    } catch {
      setStripeCustomerId(null);
      setRows([]);
    }
  };

  useEffect(() => { loadInvoices(); }, [params.id]);

  const assignStripeCustomer = async () => {
    setAssignError(null);
    setAssignSaving(true);
    try {
      const id = assignId.trim();
      if (!id) { setAssignError('Enter a Stripe customer ID'); setAssignSaving(false); return; }
      const res = await fetch(`/api/crm/customers/${encodeURIComponent(params.id)}/invoices/assign-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeCustomerId: id }),
      });
      const json = await res.json();
      if (!res.ok) { setAssignError(json?.error || 'Failed to assign'); setAssignSaving(false); return; }
      setStripeCustomerId(json.stripeCustomerId);
      setAssignOpen(false);
      setAssignId('');
      await loadInvoices();
    } catch (e: any) {
      setAssignError(e?.message || 'Failed to assign');
    } finally {
      setAssignSaving(false);
    }
  };

  const isLoading = loadingCustomer || rows === null || stripeCustomerId === undefined;

  return (
    <>
      {customer && (
        <CustomerHeader customer={customer} current="invoices" />
      )}
      {isLoading ? (
        <Center mih={180}><Loader size="sm" /></Center>
      ) : (
        <>
        <Card withBorder p="md">
          <Group justify="space-between" mb="sm">
            <Title order={3} m={0}>Invoices</Title>
            {stripeCustomerId ? (
              <Text c="dimmed" size="sm">Stripe customer: {stripeCustomerId}</Text>
            ) : (
              <Group gap="xs">
                <Badge color="gray" variant="light">No Stripe customer found</Badge>
                <Button size="xs" variant="light" onClick={() => setAssignOpen(true)}>Assign</Button>
              </Group>
            )}
          </Group>
          {(!rows || rows.length === 0) ? (
            <Text c="dimmed">No invoices found.</Text>
          ) : (
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Invoice</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="right">Amount</Table.Th>
                  <Table.Th>Links</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.created ? new Date(r.created).toLocaleDateString() : '—'}</Table.Td>
                    <Table.Td>{r.number || r.id}</Table.Td>
                    <Table.Td>{r.status || '—'}</Table.Td>
                    <Table.Td ta="right">{r.currency || ''} {typeof r.total === 'number' ? r.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</Table.Td>
                    <Table.Td>
                      {r.hosted_invoice_url && <Anchor href={r.hosted_invoice_url} target="_blank" rel="noreferrer">View</Anchor>}
                      {r.hosted_invoice_url && r.invoice_pdf && ' · '}
                      {r.invoice_pdf && <Anchor href={r.invoice_pdf} target="_blank" rel="noreferrer">PDF</Anchor>}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
        <Modal opened={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Stripe Customer" centered>
          <Text size="sm" c="dimmed" mb="sm">Enter a Stripe customer ID (e.g., cus_...). We will validate it in Stripe and save it on this CRM record.</Text>
          <TextInput label="Stripe customer ID" placeholder="cus_..." value={assignId} onChange={(e) => setAssignId(e.currentTarget.value)} autoFocus />
          {assignError && <Text c="red" size="sm" mt="xs">{assignError}</Text>}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={assignStripeCustomer} loading={assignSaving}>Save</Button>
          </Group>
        </Modal>
        </>
      )}
    </>
  );
}
