"use client";
import { ReactNode, useEffect } from 'react';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { ToastProvider } from './ToastProvider';
import { initPresence } from '@/services/presence';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const cleanup = initPresence();
    return () => cleanup?.();
  }, []);

  // Register a simple service worker for PWA (only in production)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          // Try to refresh to the latest SW quickly
          reg.update?.();
        })
        .catch(() => {});
    }
  }, []);

  return (
    <MantineProvider
      withCssVariables
      defaultColorScheme="auto"
      colorSchemeManager={localStorageColorSchemeManager({ key: 'pattern-color-scheme' })}
      theme={{
        primaryColor: 'indigo',
        defaultRadius: 'md',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
        headings: { fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial' },
      }}
    >
      <ToastProvider>
        {children as any}
      </ToastProvider>
    </MantineProvider>
  );
}
