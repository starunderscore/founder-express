"use client";
import { ReactNode, useMemo } from 'react';
import { Tabs, Paper } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const onIndex = pathname === '/employee/employees';
  const hideTabs = pathname.startsWith('/employee/employees/roles') || pathname.startsWith('/employee/employees/manage');

  const value = useMemo(() => {
    if (pathname.startsWith('/employee/employees/roles')) return 'roles';
    return 'manage';
  }, [pathname]);

  if (onIndex || hideTabs) {
    return (
      <EmployerAuthGate>
        {children}
      </EmployerAuthGate>
    );
  }

  return (
    <EmployerAuthGate>
      <Paper withBorder p={0} mb="md" radius="md">
        <Tabs value={value} onChange={(v) => { if (!v) return; router.push(v === 'roles' ? '/employee/employees/roles' : '/employee/employees/manage'); }}>
          <Tabs.List>
            <Tabs.Tab value="manage">Employee management</Tabs.Tab>
            <Tabs.Tab value="roles">Roles</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </Paper>
      {children}
    </EmployerAuthGate>
  );
}
