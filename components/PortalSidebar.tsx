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
      <NavLink component={Link} href="/portal" label="Libraries" active={isActive('/portal')} />
      <NavLink component={Link} href="/portal/archived" label="Archived Libraries" active={isActive('/portal/archived')} />
      <Divider my={6} />
      <NavLink label="Analytics" disabled active={false} rightSection={<Badge size="xs" variant="light" color="gray">Soon</Badge>} />
      <NavLink component={Link} href="/portal/settings" label="Settings" active={isActive('/portal/settings')} />
      <Divider my={6} />
      <NavLink component={Link} href="/portal/news" label="News" active={isActive('/portal/news')} />
      <NavLink label="Support development" disabled active={false} rightSection={<Badge size="xs" variant="light" color="gray">Soon</Badge>} />
    </Stack>
  );
}
