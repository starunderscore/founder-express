"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loading) return; // wait for auth
      if (!user) {
        if (!cancelled) { setIsAdmin(false); setChecking(false); }
        return;
      }
      try {
        // Owner shortcut
        const ownerSnap = await getDoc(doc(db(), 'meta', 'owner'));
        const isOwner = ownerSnap.exists() && ownerSnap.data()?.ownerUid === user.uid;
        if (isOwner) {
          if (!cancelled) { setIsAdmin(true); setChecking(false); }
          return;
        }
        // Employee admin flag
        const empSnap = await getDoc(doc(db(), 'ep_employees', user.uid));
        const admin = empSnap.exists() && !!empSnap.data()?.isAdmin;
        if (!cancelled) { setIsAdmin(admin); setChecking(false); }
      } catch {
        if (!cancelled) { setIsAdmin(false); setChecking(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading]);

  return { isAdmin, loading: checking } as const;
}
