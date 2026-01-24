"use client";
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

// Placeholder for presence (online/last seen) system.
// Extend to use RTDB/Firestore per your Firebase plan.
export function initPresence() {
  const off = onAuthStateChanged(auth(), () => {
    // Hook to set presence on login/logout if needed
  });
  return () => off();
}

