"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyEnvironmentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/employee/company-settings/configuration');
  }, [router]);
  return null;
}
