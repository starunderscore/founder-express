"use client";
import { ReactNode, useMemo } from 'react';
import { Tabs, Paper } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();

  const value = useMemo(() => {
    if (pathname.startsWith('/employee/employees/removed')) return 'removed';
    if (pathname.startsWith('/employee/employees/archive')) return 'archive';
    if (pathname.startsWith('/employee/employees/roles')) return 'roles';
    return 'manage';
  }, [pathname]);

  return (
    <EmployerAuthGate>
      <Paper withBorder p={0} mb="md" radius="md">
        <Tabs
          value={value}
          onChange={(v) => {
            if (!v) return;
            const route = v === 'roles'
              ? '/employee/employees/roles'
              : v === 'archive'
                ? '/employee/employees/archive'
                : v === 'removed'
                  ? '/employee/employees/removed'
                  : '/employee/employees/manage';
            router.push(route);
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="manage">Employee management</Tabs.Tab>
            <Tabs.Tab value="roles">Roles</Tabs.Tab>
            <Tabs.Tab value="archive">Archive</Tabs.Tab>
            <Tabs.Tab value="removed">Removed</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </Paper>
      {children}
    </EmployerAuthGate>
  );
}
