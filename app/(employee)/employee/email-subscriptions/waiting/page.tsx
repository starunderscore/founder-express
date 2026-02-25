"use client";
import { useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, Badge, Tabs, Anchor, Modal, ActionIcon, Menu } from '@mantine/core';
import { IconClockHour4 } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';

type Waitlist = { id: string; name: string; createdAt: number; archiveAt?: number | null; removedAt?: number | null; entriesCount?: number; draftsCount?: number; sentCount?: number };
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import WaitlistArchiveModal from '@/components/waitlists/WaitlistArchiveModal';
import WaitlistRemoveModal from '@/components/waitlists/WaitlistRemoveModal';

export default function WaitingListsPage() {
  const router = useRouter();
  const [waitlists, setWaitlists] = useState<Waitlist[]>([]);
  const toast = useToast();
  useEffect(() => {
    const qW = query(collection(db(), 'ep_waitlists'));
    const unsub = onSnapshot(qW, (snap) => {
      const rows: Waitlist[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({
          id: d.id,
          name: data.name || '',
          createdAt: Number(data.createdAt || Date.now()),
          archiveAt: typeof data.archiveAt === 'number' ? data.archiveAt : (data?.isArchived ? (data?.updatedAt || data?.createdAt || Date.now()) : null),
          removedAt: typeof data.removedAt === 'number' ? data.removedAt : (typeof data.deletedAt === 'number' ? data.deletedAt : null),
          entriesCount: Number(data.entriesCount || 0),
          draftsCount: Number(data.draftsCount || 0),
          sentCount: Number(data.sentCount || 0),
        });
      });
      setWaitlists(rows);
    });
    return () => unsub();
  }, []);

  const [listName, setListName] = useState('');
  const [wError, setWError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [target, setTarget] = useState<Waitlist | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const onAddWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    const nm = (listName || '').trim();
    if (!nm) { setWError('Waiting list name required'); return; }
    (async () => {
      await addDoc(collection(db(), 'ep_waitlists'), { name: nm, createdAt: Date.now(), entriesCount: 0, draftsCount: 0, sentCount: 0 });
      toast.show({ title: 'Created', message: 'Waiting list created.' });
      setWError(null); setListName(''); setCreateOpen(false);
    })();
  };

  const dateStr = (ts: number) => new Date(ts).toLocaleString();

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
          <Group gap="xs">
            <Button onClick={() => { setCreateOpen(true); setWError(null); }} variant="light">Create waiting list</Button>
          </Group>
        </Group>

        <Tabs value={'active'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/email-subscriptions/waiting">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/email-subscriptions/waiting/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/email-subscriptions/waiting/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <div style={{ paddingTop: 'var(--mantine-spacing-md)' }}>
          <Card withBorder>
            {(() => {
              const columns: Column<Waitlist>[] = [
                {
                  key: 'name', header: 'Name',
                  render: (r) => (
                    <Anchor component={Link as any} href={`/employee/email-subscriptions/waiting/${r.id}`} underline="hover">
                      {r.name || '—'}
                    </Anchor>
                  ),
                },
                {
                  key: 'actions', header: '', width: 1,
                  render: (r) => (
                    <Group justify="flex-end">
                      <Menu withinPortal position="bottom-end" shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="More actions">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="5" cy="12" r="2" fill="currentColor"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor"/>
                              <circle cx="19" cy="12" r="2" fill="currentColor"/>
                            </svg>
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item component={Link as any} href={`/employee/email-subscriptions/waiting/${r.id}`}>View</Menu.Item>
                          <Menu.Item onClick={() => { setTarget(r); setConfirmArchive(true); }}>Archive</Menu.Item>
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
                  clientFilter={(r: any) => !(r.removedAt ?? r.deletedAt) && !(r.archiveAt ?? (r.isArchived ? 1 : null))}
                defaultPageSize={25}
                enableSelection={false}
                refreshKey={refreshKey}
              />
              );
            })()}
          </Card>

          <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Create waiting list" centered>
            <form onSubmit={onAddWaitlist}>
              <Stack>
                <TextInput label="Waiting list name" placeholder="e.g. Fall Launch Waiting List" value={listName} onChange={(e) => setListName(e.currentTarget.value)} required autoFocus />
                {wError && <Text c="red" size="sm">{wError}</Text>}
                <Group justify="flex-end" mt="xs">
                  <Button variant="default" onClick={() => setCreateOpen(false)} type="button">Cancel</Button>
                  <Button type="submit">Create</Button>
                </Group>
              </Stack>
            </form>
          </Modal>

          <WaitlistArchiveModal
            opened={confirmArchive}
            onClose={() => setConfirmArchive(false)}
            listName={target?.name || ''}
            onConfirm={async () => {
              if (!target) return;
              await updateDoc(doc(db(), 'ep_waitlists', target.id), { archiveAt: Date.now(), removedAt: null, isArchived: true });
              setConfirmArchive(false); setTarget(null);
              toast.show({ title: 'Archived', message: target.name });
              setRefreshKey((k) => k + 1);
            }}
          />
          <WaitlistRemoveModal
            opened={confirmRemove}
            onClose={() => setConfirmRemove(false)}
            listName={target?.name || ''}
            onConfirm={async () => {
              if (!target) return;
              await updateDoc(doc(db(), 'ep_waitlists', target.id), { removedAt: Date.now() });
              setConfirmRemove(false); setTarget(null);
              toast.show({ title: 'Removed', message: 'Waiting list moved to Removed.' });
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      </Stack>
    </EmployerAuthGate>
  );
}
