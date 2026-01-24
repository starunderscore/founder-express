"use client";
import { Button, Card, Group, Stack, Text, Title, Center, Loader, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/firebase/auth';

export default function FirstOwnerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

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
    // Require sign‑in to proceed with claim
    if (!user) {
      router.push('/employee/signin');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    try {
      // Attempt to create the owner doc; Firestore rules should allow only if no owner exists.
      await setDoc(doc(db(), 'meta', 'owner'), { ownerUid: user.uid, claimedAt: serverTimestamp() }, { merge: false });
      // Create an employee record for the owner so they appear in the employees table
      const ownerName = name.trim() || user.displayName || 'Owner';
      const ownerEmail = user.email || '';
      await setDoc(doc(db(), 'employees', user.uid), {
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

  return (
    <Stack align="center" mt="xl">
      <Card withBorder style={{ maxWidth: 560, width: '100%' }}>
        <Stack>
          <Title order={2}>Claim ownership</Title>
          <Text c="dimmed">This portal has no owner yet. The first account to claim ownership will manage employee access. You must be signed in to claim.</Text>
          <TextInput label="Your name" placeholder="e.g., Jane Doe" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
          {error && <Text c="red" size="sm">{error}</Text>}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => router.push('/employee/signin')}>Sign in</Button>
            <Button onClick={onClaim} disabled={!name.trim()}>Claim ownership</Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
