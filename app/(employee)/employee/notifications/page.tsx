"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Table, Badge, ActionIcon, Menu } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, where, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt: number;
};

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const q = query(collection(db(), 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: NotificationItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          title: data.title || 'Notification',
          body: data.body || undefined,
          link: data.link || undefined,
          read: !!data.read,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        });
      });
      setRows(list);
    });
    return () => unsub();
  }, []);

  const unreadCount = useMemo(() => rows.filter((r) => !r.read).length, [rows]);

  const markAllRead = async () => {
    const unread = rows.filter((r) => !r.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db());
    unread.forEach((r) => batch.update(doc(db(), 'notifications', r.id), { read: true } as any));
    await batch.commit();
  };

  const toggleRead = async (id: string, read: boolean) => {
    await updateDoc(doc(db(), 'notifications', id), { read } as any);
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Notifications</Title>
            <Text c="dimmed" size="sm">{unreadCount} unread</Text>
          </div>
          <Group>
            <Button variant="default" disabled={unreadCount === 0} onClick={markAllRead}>Mark all read</Button>
          </Group>
        </Group>

        <Card withBorder>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>When</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((n) => (
                <Table.Tr key={n.id}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Group gap={8}>
                        {!n.read && <Badge color="blue" variant="light" size="xs">New</Badge>}
                        <Text fw={600}>{n.title}</Text>
                      </Group>
                      {n.body && <Text c="dimmed" size="sm">{n.body}</Text>}
                      {n.link && (
                        <Button component={Link as any} href={n.link as any} variant="subtle" size="xs" style={{ alignSelf: 'flex-start' }}>Open</Button>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{new Date(n.createdAt).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td style={{ width: 80, minWidth: 80, whiteSpace: 'nowrap' }}>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Menu withinPortal position="bottom-end" shadow="md" width={180}>
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
                          {n.read ? (
                            <Menu.Item onClick={() => toggleRead(n.id, false)}>Mark as unread</Menu.Item>
                          ) : (
                            <Menu.Item onClick={() => toggleRead(n.id, true)}>Mark as read</Menu.Item>
                          )}
                          {n.link && <Menu.Item component={Link as any} href={n.link as any}>Open link</Menu.Item>}
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}><Text c="dimmed">You have no notifications</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

