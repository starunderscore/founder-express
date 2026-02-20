"use client";
import { Button, Card, Group, Stack, Text, Title, Center, Loader, TextInput, PasswordInput, Container, useComputedColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth, signUpWithEmail, updateUserProfile } from '@/lib/firebase/auth';

export default function FirstOwnerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const [loading, setLoading] = useState(true);
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Check if owner already exists
        const ownerSnap = await getDoc(doc(db(), 'meta', 'owner'));
        if (!cancelled) {
          const ownerAlready = ownerSnap.exists();
          setOwnerExists(ownerAlready);
          setLoading(false);
          if (ownerAlready) router.replace('/employee/signin');
        }
      } catch (_e) {
        if (!cancelled) {
          // If we cannot verify, be safe and send back to sign‑in
          setOwnerExists(true);
          setLoading(false);
          router.replace('/employee/signin');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const onClaim = async () => {
    setError(null);
    try {
      // If not signed in, create an account on the fly
      let uid = user?.uid;
      if (!uid) {
        if (!email.trim() || !password.trim()) {
          setError('Enter email and password to create your account');
          return;
        }
        const cred = await signUpWithEmail(email.trim(), password);
        uid = cred.user.uid;
        if (name.trim()) {
          await updateUserProfile({ displayName: name.trim() });
        }
      }
      if (!uid) {
        setError('Failed to establish session');
        return;
      }
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }

      // Attempt to create the owner doc; Firestore rules should allow only if no owner exists.
      await setDoc(doc(db(), 'meta', 'owner'), { ownerUid: uid, claimedAt: serverTimestamp() }, { merge: false });
      // Create an employee record for the owner so they appear in the employees table
      const ownerName = name.trim() || user?.displayName || 'Owner';
      const ownerEmail = (email.trim() || user?.email || '');
      await setDoc(doc(db(), 'ep_employees', uid), {
        name: ownerName,
        email: ownerEmail,
        roleIds: [],
        permissionIds: [],
        isAdmin: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
      router.push('/employee/employees/manage');
    } catch (e: any) {
      // Permission denied likely means owner already exists (or rules blocked)
      setError(e?.message || 'Failed to claim ownership');
    }
  };

  if (loading) return (
    <Center mih={240}>
      <Loader size="sm" />
    </Center>
  );

  if (ownerExists) return null;

  const paperBg = scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'var(--mantine-color-body)';
  const paperBorder = scheme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--mantine-color-gray-3)';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingTop: 32, background: 'var(--mantine-color-body)' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: scheme === 'dark'
            ? 'radial-gradient(800px 300px at 10% -20%, rgba(59,130,246,0.25), transparent 60%), radial-gradient(600px 240px at 110% 110%, rgba(99,102,241,0.18), transparent 60%)'
            : 'radial-gradient(800px 300px at 10% -20%, rgba(59,130,246,0.08), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Container size={560} style={{ position: 'relative', zIndex: 1 }}>
        <Card shadow="xl" p="lg" radius="lg" withBorder style={{ background: paperBg, border: paperBorder, backdropFilter: scheme === 'dark' ? 'blur(6px)' : undefined }}>
          <Stack>
            <Title order={2}>Claim ownership</Title>
            <Text c="dimmed">This portal has no owner yet. Create your account and claim ownership. We will also add you to Employees with admin privileges.</Text>
            <TextInput label="Your name" placeholder="e.g., Jane Doe" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
            {!user && (
              <>
                <TextInput label="Email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
                <PasswordInput label="Password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
              </>
            )}
            {error && <Text c="red" size="sm">{error}</Text>}
            <Group justify="flex-end">
              <Button onClick={onClaim} disabled={!name.trim()}>{user ? 'Claim ownership' : 'Create account & claim'}</Button>
            </Group>
          </Stack>
        </Card>
      </Container>
    </div>
  );
}
