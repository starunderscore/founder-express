"use client";
import { useEffect } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

export default function LegacyEnvironmentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/employee/company-settings/configuration' as Route);
  }, [router]);
  return null;
}
