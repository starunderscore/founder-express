"use client";
import Link from 'next/link';
import { Badge, Divider, NavLink, Stack, Text } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconUsers,
  IconMail,
  IconUsersGroup,
  IconGlobe,
  IconTrophy,
  IconChartBar,
  IconFileInvoice,
  IconReportMoney,
  IconSettings,
  IconCurrencyDollar,
  IconTools,
  IconTags,
  IconReport,
  IconBuilding,
} from '@tabler/icons-react';
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
      <NavLink component={Link} href="/employee" label="Dashboard" active={isActive('/employee')} leftSection={<IconLayoutDashboard size={16} />} />
      <Divider my={6} />
      <Text size="xs" c="dimmed" px="xs">Users</Text>
      <NavLink component={Link} href="/employee/customers" label="Customers" active={isActive('/employee/customers')} leftSection={<IconUsers size={16} />} />
      <NavLink component={Link} href="/employee/email-subscriptions" label="Email subscriptions" active={isActive('/employee/email-subscriptions')} leftSection={<IconMail size={16} />} />
      <NavLink component={Link} href="/employee/employees" label="Employees" active={isActive('/employee/employees')} leftSection={<IconUsersGroup size={16} />} />
      <Divider my={6} />
      <Text size="xs" c="dimmed" px="xs">Content</Text>
      <NavLink component={Link} href="/employee/website" label="Website" active={isActive('/employee/website')} leftSection={<IconGlobe size={16} />} />
      <NavLink component={Link} href="/employee/achievements" label="Achievements" active={isActive('/employee/achievements')} leftSection={<IconTrophy size={16} />} rightSection={<Badge size="xs" variant="light">sample</Badge>} />
      <Divider my={6} />
      <Text size="xs" c="dimmed" px="xs">Financial</Text>
      <NavLink component={Link} href="/employee/finance/overview" label="Overview" active={isActive('/employee/finance/overview')} leftSection={<IconChartBar size={16} />} />
      <NavLink component={Link} href="/employee/finance/invoices" label="Invoices" active={isActive('/employee/finance/invoices')} leftSection={<IconFileInvoice size={16} />} />
      <NavLink component={Link} href="/employee/finance/reports" label="Financial Reports" active={isActive('/employee/finance/reports')} leftSection={<IconReportMoney size={16} />} />
      <NavLink component={Link} href="/employee/finance/settings" label="Finance Settings" active={isActive('/employee/finance/settings')} leftSection={<IconCurrencyDollar size={16} />} />
      <Divider my={6} />
      <NavLink component={Link} href="/employee/tag-manager" label="Tag Manager" active={isActive('/employee/tag-manager')} leftSection={<IconTags size={16} />} />
      <NavLink component={Link} href="/employee/reports" label="Reports" active={isActive('/employee/reports')} leftSection={<IconReport size={16} />} />
      <NavLink component={Link} href="/employee/company-settings" label="Company Settings" active={isActive('/employee/company-settings')} leftSection={<IconBuilding size={16} />} />
      {isAdmin && (
        <NavLink component={Link} href="/employee/admin-settings" label="Admin Settings" active={isActive('/employee/admin-settings')} leftSection={<IconTools size={16} />} />
      )}
    </Stack>
  );
}
