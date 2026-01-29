"use client";
import Link from 'next/link';
import { Badge, Divider, NavLink, Stack } from '@mantine/core';
import { usePathname } from 'next/navigation';

export function PortalSidebar() {
  const pathname = usePathname() || '';
  const isActive = (href: string) => {
    if (href === '/portal') return pathname === '/portal';
    return pathname.startsWith(href);
  };
  return (
    <Stack gap={4} p="sm">
      <NavLink component={Link} href="/portal" label="Home" active={isActive('/portal')} />
    </Stack>
  );
}
