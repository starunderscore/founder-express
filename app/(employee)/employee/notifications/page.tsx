"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Badge, ActionIcon, Menu, Button } from '@mantine/core';
import { listenNotifications, markRead } from '@/services/notifications';
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
    const unsub = listenNotifications((list) => setRows(list));
    return () => unsub();
  }, []);

  const unreadCount = useMemo(() => rows.filter((r) => !r.read).length, [rows]);

  const toggleRead = async (id: string, read: boolean) => {
    await markRead(id, read);
  };

  // no dummy data or global mark-all actions; notifications are natural

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Notifications</Title>
            <Text c="dimmed" size="sm">{unreadCount} unread</Text>
          </div>
          <div />
        </Group>

        <Stack gap="sm">
          {rows.map((n) => (
            <Card key={n.id} withBorder style={n.read ? undefined : { background: 'var(--mantine-color-blue-0)' }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" style={{ width: '100%' }}>
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={8} align="center">
                    {!n.read && <Badge color="blue" variant="light" size="xs">New</Badge>}
                    <Text fw={600} style={{ wordBreak: 'break-word' }}>{n.title}</Text>
                  </Group>
                  {n.body && <Text c="dimmed" size="sm" style={{ wordBreak: 'break-word' }}>{n.body}</Text>}
                  <Text size="sm" c="dimmed" style={{ marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</Text>
                </Stack>
                <Group gap={6} align="flex-start">
                  {n.link && (
                    <Button component={Link as any} href={n.link as any} variant="subtle" size="xs">Open</Button>
                  )}
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
              </Group>
            </Card>
          ))}
          {rows.length === 0 && (
            <Card withBorder>
              <Text c="dimmed">No notifications yet</Text>
            </Card>
          )}
        </Stack>
      </Stack>
    </EmployerAuthGate>
  );
}
