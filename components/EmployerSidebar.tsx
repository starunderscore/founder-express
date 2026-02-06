"use client";
import Link from 'next/link';
import { Badge, Divider, NavLink, Stack, Text } from '@mantine/core';
import { useIsAdmin } from './useIsAdmin';
import { usePathname } from 'next/navigation';

export function EmployerSidebar() {
  const pathname = usePathname() || '';
  const { isAdmin } = useIsAdmin();
  const isActive = (href: string) => {
    if (href === '/employee') return pathname === '/employee';
    return pathname.startsWith(href);
  };
  return (
    <Stack gap={4} p="sm">
      <NavLink component={Link} href="/employee" label="Dashboard" active={isActive('/employee')} />
      <Divider my={6} />
      <Text size="xs" c="dimmed" px="xs">Users</Text>
      <NavLink component={Link} href="/employee/customers" label="Customers" active={isActive('/employee/customers')} />
      <NavLink component={Link} href="/employee/email-subscriptions" label="Email subscriptions" active={isActive('/employee/email-subscriptions')} />
      <NavLink component={Link} href="/employee/employees" label="Employees" active={isActive('/employee/employees')} />
      <Divider my={6} />
      <Text size="xs" c="dimmed" px="xs">Content</Text>
      <NavLink component={Link} href="/employee/website" label="Website" active={isActive('/employee/website')} />
      <NavLink component={Link} href="/employee/achievements" label="Achievements" active={isActive('/employee/achievements')} rightSection={<Badge size="xs" variant="light">sample</Badge>} />
      <Divider my={6} />
      <Text size="xs" c="dimmed" px="xs">Financial</Text>
      <NavLink component={Link} href="/employee/finance/overview" label="Overview" active={isActive('/employee/finance/overview')} />
      <NavLink component={Link} href="/employee/finance/invoices" label="Invoices" active={isActive('/employee/finance/invoices')} />
      <NavLink component={Link} href="/employee/finance/reports" label="Financial Reports" active={isActive('/employee/finance/reports')} />
      <NavLink component={Link} href="/employee/finance/settings" label="Finance Settings" active={isActive('/employee/finance/settings')} />
      <Divider my={6} />
      <NavLink component={Link} href="/employee/tag-manager" label="Tag Manager" active={isActive('/employee/tag-manager')} />
      <NavLink component={Link} href="/employee/reports" label="Reports" active={isActive('/employee/reports')} />
      <NavLink component={Link} href="/employee/company-settings" label="Company Settings" active={isActive('/employee/company-settings')} />
      {isAdmin && (
        <NavLink component={Link} href="/employee/admin-settings" label="Admin Settings" active={isActive('/employee/admin-settings')} />
      )}
    </Stack>
  );
}
