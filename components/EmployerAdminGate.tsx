"use client";
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Center, Loader, Text } from '@mantine/core';
import { useAuth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export function EmployerAdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loading) return;
      if (!user) {
        if (!cancelled) setAllowed(false);
        return;
      }
      try {
        // Check owner
        const ownerSnap = await getDoc(doc(db(), 'meta', 'owner'));
        const isOwner = ownerSnap.exists() && ownerSnap.data()?.ownerUid === user.uid;
        if (isOwner) {
          if (!cancelled) setAllowed(true);
          return;
        }
        // Check employee doc for isAdmin
        const empSnap = await getDoc(doc(db(), 'ep_employees', user.uid));
        const isAdmin = empSnap.exists() && !!empSnap.data()?.isAdmin;
        if (!cancelled) setAllowed(isAdmin);
      } catch (_e) {
        if (!cancelled) setAllowed(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading]);

  if (loading || allowed === null) {
    return (
      <Center mih={200}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (!allowed) {
    return (
      <Center mih={200}>
        <Text c="dimmed">You don’t have access to this section.</Text>
      </Center>
    );
  }

  return <>{children}</>;
}
