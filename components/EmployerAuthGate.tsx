"use client";
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { Center, Loader } from '@mantine/core';

export function EmployerAuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace('/employee/signin');
  }, [user, loading, router]);
  if (loading) return (
    <Center mih={200}>
      <Loader size="sm" />
    </Center>
  );
  if (!user) return null;
  return <>{children}</>;
}
