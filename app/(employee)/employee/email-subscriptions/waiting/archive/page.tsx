"use client";
import { useEffect, useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Tabs, Anchor, Button, ActionIcon, Menu } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';
import Link from 'next/link';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import WaitlistRestoreModal from '@/components/waitlists/WaitlistRestoreModal';
import WaitlistRemoveModal from '@/components/waitlists/WaitlistRemoveModal';

type Waitlist = { id: string; name: string; deletedAt?: number; isArchived?: boolean };

export default function WaitingListsArchivePage() {
  const router = useRouter();
  const [archived, setArchived] = useState<Waitlist[]>([]);
  const [target, setTarget] = useState<Waitlist | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const qW = query(collection(db(), 'ep_waitlists'));
    const unsub = onSnapshot(qW, (snap) => {
      const arr: Waitlist[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (!!data.isArchived && typeof data.deletedAt !== 'number') arr.push({ id: d.id, name: data.name || '' });
      });
      setArchived(arr);
    });
    return () => unsub();
  }, []);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconClockHour4 size={20} />
              <div>
                <Title order={2} mb={4}>Waiting Lists</Title>
                <Text c="dimmed">Manage waiting lists and subscribers.</Text>
              </div>
            </Group>
          </Group>
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/email-subscriptions/waiting">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/email-subscriptions/waiting/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/email-subscriptions/waiting/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          {(() => {
            const columns: Column<Waitlist>[] = [
              {
                key: 'name', header: 'Name',
                render: (r) => (
                  <Anchor component={Link as any} href={`/employee/email-subscriptions/waiting/${r.id}`} underline="hover">{r.name || '—'}</Anchor>
                ),
              },
              {
                key: 'actions', header: '', width: 1,
                render: (r) => (
                  <Group justify="flex-end">
                    <Menu withinPortal position="bottom-end" shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="More actions">⋯</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item component={Link as any} href={`/employee/email-subscriptions/waiting/${r.id}`}>View</Menu.Item>
                        <Menu.Item onClick={() => { setTarget(r); setConfirmRestore(true); }}>Restore</Menu.Item>
                        <Menu.Item color="red" onClick={() => { setTarget(r); setConfirmRemove(true); }}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                ),
              },
            ];
            return (
              <FirestoreDataTable
                collectionPath="ep_waitlists"
                columns={columns}
                initialSort={{ field: 'createdAt', direction: 'desc' }}
                clientFilter={(r: any) => !!r.isArchived && !r.deletedAt}
                defaultPageSize={25}
                enableSelection={false}
                refreshKey={refreshKey}
              />
            );
          })()}
        </Card>

        <WaitlistRestoreModal
          opened={confirmRestore}
          onClose={() => setConfirmRestore(false)}
          listName={target?.name || ''}
          onConfirm={async () => {
            if (!target) return;
            await updateDoc(doc(db(), 'ep_waitlists', target.id), { isArchived: false });
            setConfirmRestore(false); setTarget(null);
            setRefreshKey((k) => k + 1);
          }}
        />
        <WaitlistRemoveModal
          opened={confirmRemove}
          onClose={() => setConfirmRemove(false)}
          listName={target?.name || ''}
          onConfirm={async () => {
            if (!target) return;
            await updateDoc(doc(db(), 'ep_waitlists', target.id), { deletedAt: Date.now() });
            setConfirmRemove(false); setTarget(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      </Stack>
    </EmployerAuthGate>
  );
}
