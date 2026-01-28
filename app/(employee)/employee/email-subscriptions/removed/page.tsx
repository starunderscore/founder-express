"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Badge, Tabs, Anchor, Button, Modal } from '@mantine/core';
import Link from 'next/link';
import { RouteTabs } from '@/components/RouteTabs';
import { useState } from 'react';
import { useEffect } from 'react';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function EmailSubscriptionsRemovedPage() {
  const [removed, setRemoved] = useState<Array<{ id: string; name: string; deletedAt: number }>>([]);
  useEffect(() => {
    const qW = query(collection(db(), 'waitlists'));
    const unsub = onSnapshot(qW, (snap) => {
      const arr: Array<{ id: string; name: string; deletedAt: number }> = [];
      snap.forEach((d) => { const data = d.data() as any; if (typeof data.deletedAt === 'number') arr.push({ id: d.id, name: data.name || '', deletedAt: data.deletedAt }); });
      setRemoved(arr);
    });
    return () => unsub();
  }, []);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const openConfirm = (id: string) => { setTargetId(id); setConfirmOpen(true); };
  const doDelete = async () => { if (targetId) await deleteDoc(doc(db(), 'waitlists', targetId)); setConfirmOpen(false); setTargetId(null); };

  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Email subscriptions</Title>
          <Text c="dimmed">Manage waiting lists and newsletter subscribers.</Text>
        </div>

        <RouteTabs
          value={"removed"}
          tabs={[
            { value: 'newsletters', label: 'Newsletters', href: '/employee/email-subscriptions/newsletters' },
            { value: 'waiting', label: 'Waiting Lists', href: '/employee/email-subscriptions/waiting' },
            { value: 'archive', label: 'Archive', href: '/employee/email-subscriptions/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/email-subscriptions/removed' },
          ]}
        />

        <Card withBorder>
          {removed.length > 0 ? (
            <Stack>
              {removed.map((b: any) => (
                <Card key={b.id} withBorder>
                  <Group justify="space-between" align="center">
                    <div>
                      <Anchor component={Link as any} href={`/employee/email-subscriptions/waiting/${b.id}`} underline="hover">
                        <Text fw={600}>{b.name}</Text>
                      </Anchor>
                      <Text size="xs" c="dimmed">Removed {new Date(b.deletedAt).toLocaleString()}</Text>
                    </div>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={async () => { await updateDoc(doc(db(), 'waitlists', b.id), { deletedAt: undefined }); }}>Restore</Button>
                      <Button size="xs" variant="subtle" color="red" onClick={() => openConfirm(b.id)}>Permanently delete</Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed">No removed waiting lists</Text>
          )}
        </Card>

        <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Permanently delete" centered>
          <Stack>
            <Text c="dimmed">This action cannot be undone.</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button color="red" onClick={doDelete}>Delete</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
