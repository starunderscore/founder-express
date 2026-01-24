"use client";
import type { ReactNode } from 'react';
import { AppShell, ScrollArea } from '@mantine/core';
import { PortalHeader } from '@/components/PortalHeader';
import { PortalSidebar } from '@/components/PortalSidebar';
import { AccountBar } from '@/components/AccountBar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <PortalHeader />
      </AppShell.Header>
      <AppShell.Navbar>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ScrollArea style={{ flex: 1 }}>
            <PortalSidebar />
          </ScrollArea>
          <AccountBar />
        </div>
      </AppShell.Navbar>
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
