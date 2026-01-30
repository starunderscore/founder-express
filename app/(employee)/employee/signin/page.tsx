"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithGoogle, useAuth } from '@/lib/firebase/auth';
import { Title, Text, Stack, TextInput, PasswordInput, Button, Group, Anchor, Divider, Badge, Paper, Container, useComputedColorScheme } from '@mantine/core';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function EmployerSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const [showOwnerHint, setShowOwnerHint] = useState(false);
  const googleEnabled = !!process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let ownerExists = false;
      try {
        const ownerSnap = await getDoc(doc(db(), 'meta', 'owner'));
        ownerExists = ownerSnap.exists();
      } catch (e) {
        console.warn('[employee/signin] owner check failed', e);
        ownerExists = false; // default to no owner on failure to encourage claim
      }

      let hasEmployees: boolean | null = null;
      try {
        const anyEmployeeSnap = await getDocs(query(collection(db(), 'employees'), limit(1)));
        hasEmployees = anyEmployeeSnap.size > 0;
      } catch (e) {
        console.warn('[employee/signin] employees list check failed (likely rules)', e);
        hasEmployees = null; // unknown due to permission; treat as unknown
      }

      if (cancelled) return;
      console.log('[employee/signin] checks', { ownerExists, hasEmployees, isAuthed: !!user });

      // Show Help when there is no owner. If employees count is unknown due to rules,
      // we still show Help to guide the first-run claim path.
      const hint = !ownerExists && (hasEmployees === false || hasEmployees === null);
      console.log('[employee/signin] showOwnerHint =>', hint);
      setShowOwnerHint(hint);

      // If a user is signed in and an owner exists, go to dashboard
      if (user && ownerExists) {
        console.log('[employee/signin] owner exists and user is signed in; redirecting to /employee');
        router.replace('/employee');
      }
    })();
    return () => { cancelled = true; };
  }, [user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      // Do not redirect immediately; owner hint logic will run and redirect only if owned/has employees.
    } catch (e: any) {
      setError(e?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

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

      <Container size={480} style={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Paper shadow="xl" p="lg" radius="lg" style={{ background: paperBg, border: paperBorder, backdropFilter: scheme === 'dark' ? 'blur(6px)' : undefined }}>
            <Group justify="space-between" mb="xs">
              <Title order={2}>Employee Access</Title>
              <Badge color="indigo" variant="light">Admin</Badge>
            </Group>
            <Text c="dimmed" mb="md">Sign in to manage your organization</Text>
            <form onSubmit={onSubmit}>
              <Stack gap="sm">
                <TextInput label="Work Email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
                <PasswordInput label="Password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
                {error && <Text c="red" size="sm">{error}</Text>}
                <Button type="submit" loading={loading} disabled={loading} color="indigo">Sign in</Button>
              </Stack>
            </form>
            <Group justify="space-between" mt="sm">
              <Anchor component={Link} href="/account/forgot-password">Forgot password?</Anchor>
              <Text size="sm" c="dimmed">
                Personal account? <Anchor component={Link} href="/account/signin">Go to user login</Anchor>
              </Text>
            </Group>
            {googleEnabled && (
              <>
                <Divider my="md" label="or" labelPosition="center" />
                <Button
                  variant="default"
                  fullWidth
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await signInWithGoogle();
                      // Redirect is handled by owner check effect
                    } finally {
                      // Release enable at the very end of the async flow
                      setLoading(false);
                    }
                  }}
                >
                  Continue with Google
                </Button>
              </>
            )}
            {showOwnerHint && (
              <Group justify="flex-end" mt="md">
                <Button component={Link as any} href="/employee/first-owner" variant="subtle" size="xs">Help</Button>
              </Group>
            )}

          </Paper>
        </motion.div>
      </Container>
    </div>
  );
}
