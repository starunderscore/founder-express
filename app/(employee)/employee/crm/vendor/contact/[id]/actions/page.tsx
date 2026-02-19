"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Title, Text, Card, Stack, Group, Button, Alert, Switch, Center, Loader } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import VendorContactHeader from '@/components/crm/VendorContactHeader';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query } from 'firebase/firestore';
import type { Contact } from '@/services/crm/types';
import { setVendorContactDoNotContact, unarchiveVendorContact } from '@/services/crm/vendor-contacts';

export default function VendorContactActionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isVendorsSection = typeof window !== 'undefined' && window.location.pathname.startsWith('/employee/customers/vendors');
  const baseVendor = isVendorsSection ? '/employee/customers/vendors' : '/employee/crm/vendor';
  const baseContact = isVendorsSection ? '/employee/customers/vendors/contact' : '/employee/crm/vendor/contact';
  const toast = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db(), 'crm_customers'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: any[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setCustomers(rows);
    });
    return () => unsub();
  }, []);

  const { vendor, contact } = useMemo(() => {
    for (const v of customers) {
      if (v.type !== 'vendor') continue;
      const c = (v.contacts || []).find((x: Contact) => x.id === params.id);
      if (c) return { vendor: v, contact: c };
    }
    return { vendor: null as any, contact: null as any };
  }, [customers, params.id]);

  // Removed archive/remove dialogs and state

  if (!vendor || !contact) {
    return (
      <EmployerAuthGate>
        <Center mih={240}><Loader size="sm" /></Center>
      </EmployerAuthGate>
    );
  }

  const getDb = () => db();

  return (
    <EmployerAuthGate>
      <VendorContactHeader
        vendorId={vendor.id}
        vendorName={vendor.name}
        contact={contact}
        current="actions"
        baseContact={baseContact}
        backHref={`${baseVendor}/${vendor.id}/contacts`}
      />

      {contact.isArchived && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This contact is archived and hidden from active workflows.</Text>
            <Button variant="light" onClick={async () => { await unarchiveVendorContact(vendor.id, contact.id, { getDb }); }}>Unarchive</Button>
          </Group>
        </Alert>
      )}

      <Card withBorder radius="md" mb="md">
        <Stack>
          <Title order={4}>Contact controls</Title>
          <Group>
            <Switch checked={!!contact.doNotContact} onChange={async (e) => { await setVendorContactDoNotContact(vendor.id, contact.id, e.currentTarget.checked, { getDb }); }} label="Do not contact" />
          </Group>
        </Stack>
      </Card>

      {/* Danger zone cards (Archive/Remove) removed per request */}
    </EmployerAuthGate>
  );
}
import { RouteTabs } from '@/components/RouteTabs';
