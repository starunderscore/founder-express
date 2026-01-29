"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useAuthUser, signOut } from '@/lib/firebase/auth';
import { Group, Button, Text } from '@mantine/core';

export function PortalHeader() {
  return (
    <Group
      justify="space-between"
      px="md"
      h={56}
      style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', background: 'var(--mantine-color-body)' }}
    >
      <Link href="/portal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--mantine-color-text)' }}>
        <Image src="/icon/web/manifest-192.png" alt="Founder Express" width={20} height={20} />
        <Text fw={700} c="inherit">Founder Express</Text>
      </Link>
      <div />
    </Group>
  );
}
