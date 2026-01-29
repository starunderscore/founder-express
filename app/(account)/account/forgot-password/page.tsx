"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sendPasswordReset, useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Title, Text, Stack, TextInput, Button, Anchor, Alert, Group, Badge, ActionIcon } from '@mantine/core';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/portal');
  }, [user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset email');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header moved to Account layout */}
      <Title order={2}>Reset password</Title>
      {!sent ? (
        <>
          <Text c="dimmed" mb="md">We’ll send you a reset link.</Text>
          <form onSubmit={onSubmit}>
            <Stack gap="sm">
              <TextInput label="Email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
              {error && <Text c="red" size="sm">{error}</Text>}
              <Button type="submit">Send reset link</Button>
            </Stack>
          </form>
          <Text size="sm" mt="md">Remembered it? <Anchor component={Link} href="/account/signin">Sign in</Anchor></Text>
        </>
      ) : (
        <>
          <Alert color="green" mt="md">Check your email for the reset link.</Alert>
          <Text size="sm" mt="md">Return to <Anchor component={Link} href="/account/signin">Sign in</Anchor></Text>
        </>
      )}
    </motion.div>
  );
}
