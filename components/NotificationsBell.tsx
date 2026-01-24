"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActionIcon, Indicator, Tooltip } from '@mantine/core';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export function NotificationsBell() {
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    const q = query(collection(db(), 'notifications'), where('read', '==', false));
    const unsub = onSnapshot(q, (snap) => {
      setUnread(snap.size);
    });
    return () => unsub();
  }, []);

  return (
    <Tooltip label={unread > 0 ? `${unread} unread` : 'Notifications'} withArrow>
      <Indicator disabled={unread === 0} label={unread} size={16} color="red">
        <ActionIcon
          variant="subtle"
          aria-label="Notifications"
          component={Link as any}
          href="/employee/notifications" as={Link as any}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 10-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
          </svg>
        </ActionIcon>
      </Indicator>
    </Tooltip>
  );
}

