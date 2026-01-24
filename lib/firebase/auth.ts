"use client";
import { useEffect, useState } from 'react';
import { auth } from './client';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, type User } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { user, loading } as const;
}

export function useAuthUser() {
  const { user } = useAuth();
  return user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth(), provider);
}

export async function signOut() {
  await fbSignOut(auth());
}

export async function signUpWithEmail(email: string, password: string) {
  return await createUserWithEmailAndPassword(auth(), email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth(), email, password);
}

export async function sendPasswordReset(email: string) {
  return await sendPasswordResetEmail(auth(), email);
}

export async function updateUserProfile(data: { displayName?: string; photoURL?: string }) {
  const a = auth();
  if (!a.currentUser) throw new Error('Not authenticated');
  await updateProfile(a.currentUser, data);
}

export async function updateUserEmail(email: string) {
  const a = auth();
  if (!a.currentUser) throw new Error('Not authenticated');
  await updateEmail(a.currentUser, email);
}

export async function updateUserPassword(newPassword: string) {
  const a = auth();
  if (!a.currentUser) throw new Error('Not authenticated');
  await updatePassword(a.currentUser, newPassword);
}

export async function reauthWithPassword(email: string, password: string) {
  const a = auth();
  if (!a.currentUser) throw new Error('Not authenticated');
  const cred = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(a.currentUser, cred);
}
