"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, TextInput, Button, Alert, ActionIcon } from '@mantine/core';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { changePassword } from '@/services/user-settings/security';

export default function UserSecurityPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [pwError, setPwError] = useState<string | null>(null);

  const onChangePassword = async () => {
    if (!user) return;
    setPwStatus('saving');
    setPwError(null);
    const res = await changePassword({ email: user.email || '', currentPassword: currentPw, newPassword: newPw, confirmPassword: newPw2 });
    if (res.ok) {
      setCurrentPw(''); setNewPw(''); setNewPw2('');
      setPwStatus('saved');
      setTimeout(() => setPwStatus('idle'), 1500);
    } else {
      setPwError(res.reason);
      setPwStatus('error');
    }
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/user-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Security</Title>
            <Text c="dimmed">Manage password and sign‑in.</Text>
          </div>
        </Group>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Change password</Text>
            <TextInput label="Current password" value={currentPw} onChange={(e) => setCurrentPw(e.currentTarget.value)} type="password" />
            <TextInput label="New password" value={newPw} onChange={(e) => setNewPw(e.currentTarget.value)} type="password" />
            <TextInput label="Confirm new password" value={newPw2} onChange={(e) => setNewPw2(e.currentTarget.value)} type="password" />
            {pwError && <Alert color="red">{pwError}</Alert>}
            {pwStatus === 'saved' && <Alert color="green">Password updated</Alert>}
            <Group>
              <Button onClick={onChangePassword} loading={pwStatus === 'saving'}>Update password</Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
