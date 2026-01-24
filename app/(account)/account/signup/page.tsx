"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail, useAuth } from '@/lib/firebase/auth';
import { Title, Text, Stack, TextInput, PasswordInput, Button, Anchor } from '@mantine/core';
import { motion } from 'framer-motion';

export default function SignUpPage() {
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
      await signUpWithEmail(email, password);
      router.replace('/portal');
    } catch (e: any) {
      setError(e?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Title order={2}>Create account</Title>
      <Text c="dimmed" mb="md">Start practicing now</Text>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <TextInput label="Email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput label="Password" placeholder="At least 6 characters" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          {error && <Text c="red" size="sm">{error}</Text>}
          <Button type="submit" loading={loading}>Create account</Button>
        </Stack>
      </form>
      <Text size="sm" mt="md">
        Have an account? <Anchor component={Link} href="/account/signin">Sign in</Anchor>
      </Text>
    </motion.div>
  );
}
