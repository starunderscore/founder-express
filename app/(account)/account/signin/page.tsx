"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithGoogle, useAuth } from '@/lib/firebase/auth';
import { Title, Text, Stack, TextInput, PasswordInput, Button, Group, Anchor, Divider } from '@mantine/core';
import { motion } from 'framer-motion';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/portal');
  }, [user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/portal');
    } catch (e: any) {
      setError(e?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Title order={2}>Sign in</Title>
      <Text c="dimmed" mb="md">Welcome back</Text>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <TextInput label="Email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput label="Password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          {error && <Text c="red" size="sm">{error}</Text>}
          <Button type="submit" loading={loading} disabled={loading}>Sign in</Button>
        </Stack>
      </form>
      <Group justify="space-between" mt="sm">
        <Anchor component={Link} href="/account/forgot-password">Forgot password?</Anchor>
        <Text size="sm">
          New here? <Anchor component={Link} href="/account/signup">Create an account</Anchor>
        </Text>
      </Group>
      <Divider my="md" label="or" labelPosition="center" />
      <Button
        variant="default"
        fullWidth
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await signInWithGoogle();
            router.replace('/portal');
          } finally {
            // Ensure re-enable happens last after the async flow
            setLoading(false);
          }
        }}
      >
        Continue with Google
      </Button>
    </motion.div>
  );
}
