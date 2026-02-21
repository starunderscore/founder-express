"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Card, Stack, Tabs, Anchor } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import WaitlistHeader from '@/components/waitlists/WaitlistHeader';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';

type DraftEmail = { id: string; subject: string; body: string; updatedAt: number };
type Waitlist = { id: string; name: string };

export default function WaitingDraftsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [list, setList] = useState<Waitlist | null>(null);
  const [countEntries, setCountEntries] = useState<number>(0);
  const [countSent, setCountSent] = useState<number>(0);
  useEffect(() => {
    const ref = doc(db(), 'ep_waitlists', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setList(null); return; }
      const d = snap.data() as any;
      setList({ id: snap.id, name: d.name || '' });
      setCountEntries(Number(d.entriesCount || 0));
      setCountSent(Number(d.sentCount || 0));
    });
    return () => unsub();
  }, [params.id]);

  if (!list) {
    return (
      <EmployerAuthGate>
        <Stack>
          <WaitlistHeader listId={params.id} name={'Waiting list'} />
          <Card withBorder>
            Waiting list not found
          </Card>
        </Stack>
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Stack>
        <WaitlistHeader listId={list.id} name={list.name} />

        <Tabs value={'drafts'}>
          <Tabs.List>
            <Tabs.Tab value="sent"><Link href={`/employee/email-subscriptions/waiting/${list.id}`}>Emails sent</Link></Tabs.Tab>
            <Tabs.Tab value="drafts"><Link href={`/employee/email-subscriptions/waiting/${list.id}/drafts`}>Email drafts</Link></Tabs.Tab>
            <Tabs.Tab value="form"><Link href={`/employee/email-subscriptions/waiting/${list.id}/form`}>Copy & paste form</Link></Tabs.Tab>
            <Tabs.Tab value="settings"><Link href={`/employee/email-subscriptions/waiting/${list.id}/settings`}>List settings</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          {(() => {
            const columns: Column<DraftEmail>[] = [
              { key: 'subject', header: 'Subject', render: (r) => (r.subject || '(Untitled draft)') },
              { key: 'updatedAt', header: 'Updated', render: (r) => new Date(r.updatedAt).toLocaleString() },
              { key: 'actions', header: '', width: 1, render: (_r) => null },
            ];
            return (
              <FirestoreDataTable
                collectionPath={`ep_waitlists/${list.id}/drafts`}
                columns={columns}
                initialSort={{ field: 'updatedAt', direction: 'desc' }}
                defaultPageSize={25}
                enableSelection={false}
              />
            );
          })()}
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
