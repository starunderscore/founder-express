"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail, useAuth } from '@/lib/firebase/auth';
import { Title, Text, Stack, TextInput, PasswordInput, Button, Anchor, Modal, Checkbox } from '@mantine/core';
import { getActiveClientPolicy, getPrivacyPolicyEnabled, ensureDefaultPrivacyPolicy } from '@/services/admin-settings/privacy-policy';
import { motion } from 'framer-motion';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ppEnabled, setPpEnabled] = useState<boolean>(false);
  const [policy, setPolicy] = useState<{ id: string; title: string; bodyHtml?: string } | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/portal');
  }, [user, router]);

  useEffect(() => {
    (async () => {
      try {
        try { await ensureDefaultPrivacyPolicy(); } catch {}
        const enabled = await getPrivacyPolicyEnabled();
        setPpEnabled(enabled);
        if (enabled) {
          const p = await getActiveClientPolicy();
          setPolicy(p as any);
        }
      } catch {}
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (ppEnabled && !accepted) {
        setError('You must accept the Privacy Policy to continue');
        return;
      }
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
      {/* Header moved to Account layout */}
      <Title order={2}>Create account</Title>
      <Text c="dimmed" mb="md">Start practicing now</Text>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <TextInput label="Email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput label="Password" placeholder="At least 6 characters" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          <Checkbox
            checked={accepted}
            onChange={(e) => setAccepted(e.currentTarget.checked)}
            label={<span>I agree to the <Anchor component={Link} href="#" onClick={(ev) => { ev.preventDefault(); setPolicyOpen(true); }}>Privacy Policy</Anchor></span>}
          />
          {error && <Text c="red" size="sm">{error}</Text>}
          <Button type="submit" loading={loading}>Create account</Button>
        </Stack>
      </form>
      <Text size="sm" mt="md">
        Have an account? <Anchor component={Link} href="/account/signin">Sign in</Anchor>
      </Text>
      <Modal opened={policyOpen} onClose={() => setPolicyOpen(false)} title={policy?.title || 'Privacy Policy'} centered size="xl">
        <div dangerouslySetInnerHTML={{ __html: policy?.bodyHtml || '<p>No policy found.</p>' }} />
      </Modal>
    </motion.div>
  );
}
