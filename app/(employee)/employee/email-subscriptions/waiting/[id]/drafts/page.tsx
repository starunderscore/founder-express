"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Card, Stack, Anchor } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import WaitlistHeaderBar from '@/components/waitlists/WaitlistHeaderBar';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';

type DraftEmail = { id: string; subject: string; body: string; updatedAt: number };
type Waitlist = { id: string; name: string; archiveAt: number | null; removedAt: number | null };

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
      const archiveAt = typeof d.archiveAt === 'number' ? d.archiveAt : (d?.isArchived ? (d?.updatedAt || d?.createdAt || Date.now()) : null);
      const removedAt = typeof d.removedAt === 'number' ? d.removedAt : (typeof d.deletedAt === 'number' ? d.deletedAt : null);
      setList({ id: snap.id, name: d.name || '', archiveAt: archiveAt ?? null, removedAt: removedAt ?? null });
      setCountEntries(Number(d.entriesCount || 0));
      setCountSent(Number(d.sentCount || 0));
    });
    return () => unsub();
  }, [params.id]);

  if (!list) {
    return (
      <EmployerAuthGate>
        <Stack>
          <WaitlistHeaderBar listId={params.id} name={'Waiting list'} current="drafts" />
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
        <WaitlistHeaderBar listId={list.id} name={list.name} current="drafts" archiveAt={list.archiveAt} removedAt={list.removedAt} />

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
