"use client";
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/lib/firebase/auth';
import { updateUserProfile, updateUserEmail, updateUserPassword, reauthWithPassword } from '@/lib/firebase/auth';
import { Title, Text, TextInput, Button, Group, Avatar, Stack, Alert, Tabs, Card, SimpleGrid, PasswordInput } from '@mantine/core';
import { useState } from 'react';

type Achievement = { id: string; name: string; icon: string; earnedAt?: number };

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  // Only display name is editable in Profile tab
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  // Placeholder: earned achievements for the client account
  const [earned, _setEarned] = useState<Achievement[]>([]);

  const onSave = async () => {
    if (!user) return;
    setStatus('saving');
    setError(null);
    try {
      await updateUserProfile({ displayName });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to update profile');
      setStatus('error');
    }
  };

  // Settings tab state
  const [currentEmail, setCurrentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailVerifyPw, setEmailVerifyPw] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [pwError, setPwError] = useState<string | null>(null);

  const onSaveEmail = async () => {
    if (!user) return;
    if (!currentEmail || currentEmail !== user.email) { setEmailError('Current email does not match'); setEmailStatus('error'); return; }
    if (!newEmail || newEmail === user.email) { setEmailError('Enter a different new email'); setEmailStatus('error'); return; }
    if (!emailVerifyPw) { setEmailError('Enter your current password to confirm'); setEmailStatus('error'); return; }
    setEmailStatus('saving');
    setEmailError(null);
    try {
      await reauthWithPassword(currentEmail, emailVerifyPw);
      await updateUserEmail(newEmail);
      setEmailStatus('saved');
      setEmailVerifyPw('');
      setTimeout(() => setEmailStatus('idle'), 1500);
    } catch (e: any) {
      setEmailError(e?.message || 'Failed to update email');
      setEmailStatus('error');
    }
  };

  const [currentPw, setCurrentPw] = useState('');

  const onSavePassword = async () => {
    if (!user) return;
    if (!currentPw) { setPwError('Enter your current password'); setPwStatus('error'); return; }
    if (!pw || pw.length < 6) { setPwError('Password must be at least 6 characters'); setPwStatus('error'); return; }
    if (pw !== pw2) { setPwError('Passwords do not match'); setPwStatus('error'); return; }
    setPwStatus('saving');
    setPwError(null);
    try {
      const emailForCred = user.email || currentEmail;
      await reauthWithPassword(emailForCred, currentPw);
      await updateUserPassword(pw);
      setPw(''); setPw2(''); setCurrentPw('');
      setPwStatus('saved');
      setTimeout(() => setPwStatus('idle'), 1500);
    } catch (e: any) {
      setPwError(e?.message || 'Failed to update password');
      setPwStatus('error');
    }
  };

  return (
    <AuthGate>
      <Group mb="md" justify="space-between" align="center">
        <Title order={2}>Account</Title>
      </Group>
      <Tabs defaultValue="profile">
        <Tabs.List>
          <Tabs.Tab value="profile">Profile</Tabs.Tab>
          <Tabs.Tab value="achievements">Achievements</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" pt="md">
          <Stack>
            <Group justify="space-between" align="center">
              <div>
                <Title order={2}>Profile</Title>
                <Text c="dimmed" size="sm">Manage your display name and avatar</Text>
              </div>
              <Avatar src={user?.photoURL || undefined} radius="xl" size={48}>{(displayName || user?.email || 'U')[0]}</Avatar>
            </Group>
            <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} placeholder="Your name" />
            {error && <Alert color="red">{error}</Alert>}
            {status === 'saved' && <Alert color="green">Saved</Alert>}
            <Group>
              <Button onClick={onSave} loading={status === 'saving'}>Save changes</Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="achievements" pt="md">
          <Stack>
            <div>
              <Title order={2} mb={4}>Achievements</Title>
              <Text c="dimmed" size="sm">Your earned badges and milestones</Text>
            </div>

            {earned.length === 0 ? (
              <Card withBorder>
                <Text c="dimmed">No achievements yet.</Text>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                {earned.map((a) => (
                  <Card key={a.id} withBorder>
                    <Group gap="sm">
                      <span style={{ fontSize: 26, lineHeight: 1 }}>{a.icon}</span>
                      <div>
                        <Text fw={600}>{a.name}</Text>
                        {a.earnedAt && (
                          <Text size="xs" c="dimmed">{new Date(a.earnedAt).toLocaleDateString()}</Text>
                        )}
                      </div>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="settings" pt="md">
          <Stack>
            <div>
              <Title order={2} mb={4}>Settings</Title>
              <Text c="dimmed" size="sm">Manage your account email and password</Text>
            </div>
          <Card withBorder>
            <Stack>
              <Text fw={600}>Email</Text>
              <TextInput label="Current email" value={currentEmail} onChange={(e) => setCurrentEmail(e.currentTarget.value)} placeholder="you@current.com" />
              <TextInput label="New email" value={newEmail} onChange={(e) => setNewEmail(e.currentTarget.value)} placeholder="you@new.com" />
              <PasswordInput label="Current password (for verification)" value={emailVerifyPw} onChange={(e) => setEmailVerifyPw(e.currentTarget.value)} placeholder="••••••" />
              {emailError && <Alert color="red">{emailError}</Alert>}
              {emailStatus === 'saved' && <Alert color="green">Email updated</Alert>}
              <Group>
                <Button onClick={onSaveEmail} loading={emailStatus === 'saving'}>Update email</Button>
              </Group>
            </Stack>
          </Card>
          <Card withBorder>
            <Stack>
              <Text fw={600}>Password</Text>
              <PasswordInput label="Current password" value={currentPw} onChange={(e) => setCurrentPw(e.currentTarget.value)} placeholder="••••••" />
              <PasswordInput label="New password" value={pw} onChange={(e) => setPw(e.currentTarget.value)} placeholder="••••••" />
              <PasswordInput label="Confirm new password" value={pw2} onChange={(e) => setPw2(e.currentTarget.value)} placeholder="••••••" />
              {pwError && <Alert color="red">{pwError}</Alert>}
              {pwStatus === 'saved' && <Alert color="green">Password updated</Alert>}
              <Group>
                <Button onClick={onSavePassword} loading={pwStatus === 'saving'}>Update password</Button>
              </Group>
            </Stack>
          </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </AuthGate>
  );
}
