"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Group, Text } from '@mantine/core';
import { NotificationsBell } from './NotificationsBell';
import type { ReactNode } from 'react';

export function EmployerHeader({ left }: { left?: ReactNode }) {
  return (
    <Group justify="space-between" px="md" h={56} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-body)' }}>
      <Group gap={12} align="center">
        {left}
        <Link href="/employee" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--mantine-color-text)' }}>
          <Image src="/icon/web/manifest-192.png" alt="Employee Portal" width={20} height={20} />
          <Text fw={700} c="inherit">Employee Portal</Text>
        </Link>
        <NotificationsBell />
      </Group>
      <Group gap={8} align="center"></Group>
    </Group>
  );
}
