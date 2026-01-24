"use client";
import type { ReactNode } from 'react';
import { AppShell, ScrollArea, useComputedColorScheme, Burger } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { EmployerHeader } from '@/components/EmployerHeader';
import { EmployerSidebar } from '@/components/EmployerSidebar';
import { AccountBar } from '@/components/AccountBar';
import { useDisclosure } from '@mantine/hooks';

export default function Layout({ children }: { children: React.ReactNode }) {
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const bg = 'var(--mantine-color-body)';
  const [opened, { toggle }] = useDisclosure(false);
  const pathname = usePathname() || '';

  // Render bare content for auth/claim pages (no dashboard chrome)
  if (pathname === '/employee/signin' || pathname === '/employee/first-owner') {
    return <>{children}</>;
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      style={{ background: bg }}
    >
      <AppShell.Header>
        <EmployerHeader
          left={
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
          }
        />
      </AppShell.Header>
      <AppShell.Navbar>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ScrollArea style={{ flex: 1 }}>
            <EmployerSidebar />
          </ScrollArea>
          <AccountBar accountHref="/employee/profile" />
        </div>
      </AppShell.Navbar>
      <AppShell.Main style={{ background: 'transparent' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
