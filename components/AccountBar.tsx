"use client";
import { Avatar, Button, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useAuthUser, signOut } from '@/lib/firebase/auth';
import { IconSettings } from '@tabler/icons-react';

export function AccountBar({ accountHref = '/portal/profile' }: { accountHref?: '/portal/profile' | '/employee/profile' } = {}) {
  const user = useAuthUser();
  const router = useRouter();
  const name = user?.displayName || user?.email?.split('@')[0] || 'You';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Group justify="space-between" p="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
      <Group gap="sm" wrap="nowrap">
        <Avatar src={user?.photoURL || undefined} radius="xl" color="indigo">
          {initials}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <Text size="sm" fw={600} lineClamp={1}>{name}</Text>
          <Text size="xs" c="dimmed" lineClamp={1}>{user?.email}</Text>
        </div>
      </Group>
      <Group gap="xs">
        {accountHref === '/employee/profile' && (
          <Tooltip label="User settings">
            <ActionIcon
              variant="default"
              size="sm"
              aria-label="User settings"
              onClick={() => router.push('/employee/user-settings')}
            >
              <IconSettings size={16} />
            </ActionIcon>
          </Tooltip>
        )}
        <Button variant="default" size="xs" onClick={() => router.push(accountHref)}>Account</Button>
        <Button variant="light" size="xs" color="red" onClick={() => signOut()}>Log out</Button>
      </Group>
    </Group>
  );
}
