"use client";
import { useState, useMemo } from 'react';
import { Title, Text, TextInput, Button, Group, Stack, Alert, Tabs, Card, Badge } from '@mantine/core';
import { useAuth } from '@/lib/firebase/auth';
import { updateUserProfile, updateUserPassword, reauthWithPassword } from '@/lib/firebase/auth';
import { useEmployerStore } from '@/state/employerStore';
// layout provides header/sidebar

export default function EmployeeAccountPage() {
  const { user } = useAuth();
  const employees = useEmployerStore((s) => s.employees);
  const permissions = useEmployerStore((s) => s.permissions);
  const roles = useEmployerStore((s) => s.roles);
  const getEffectivePermissionIds = useEmployerStore((s) => s.getEffectivePermissionIds);
  const updateEmployee = useEmployerStore((s) => s.updateEmployee);

  const employee = useMemo(() => employees.find((e) => e.email === user?.email), [employees, user?.email]);
  const effectivePermIds = useMemo(() => (employee ? getEffectivePermissionIds(employee.id) : []), [employee, getEffectivePermissionIds]);
  const permMap = useMemo(() => Object.fromEntries(permissions.map((p) => [p.id, p.name])), [permissions]);

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [fullName, setFullName] = useState(employee?.name || '');
  const [dob, setDob] = useState(employee?.dateOfBirth || '');
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSaveProfile = async () => {
    if (!user || !employee) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await updateUserProfile({ displayName });
      updateEmployee(employee.id, { name: fullName, dateOfBirth: dob });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save');
      setSaveStatus('error');
    }
  };

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [pwError, setPwError] = useState<string | null>(null);

  const onChangePassword = async () => {
    if (!user) return;
    if (!currentPw) { setPwError('Enter current password'); setPwStatus('error'); return; }
    if (!newPw || newPw.length < 6) { setPwError('Password must be at least 6 characters'); setPwStatus('error'); return; }
    if (newPw !== newPw2) { setPwError('Passwords do not match'); setPwStatus('error'); return; }
    setPwStatus('saving');
    setPwError(null);
    try {
      const email = user.email || '';
      await reauthWithPassword(email, currentPw);
      await updateUserPassword(newPw);
      setCurrentPw(''); setNewPw(''); setNewPw2('');
      setPwStatus('saved');
      setTimeout(() => setPwStatus('idle'), 1500);
    } catch (e: any) {
      setPwError(e?.message || 'Failed to update password');
      setPwStatus('error');
    }
  };

  if (!user) return null;

  return (
    <Stack>
          <Title order={2}>Employee Account</Title>
          {!employee && (
            <Alert color="orange">No employee record found for {user.email}. Ask your admin to add you.</Alert>
          )}
          <Tabs defaultValue="profile">
            <Tabs.List>
              <Tabs.Tab value="profile">Profile</Tabs.Tab>
              <Tabs.Tab value="roles">Roles</Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="profile" pt="md">
              <Stack>
                <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} placeholder="Display name" />
                <TextInput label="Full name" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} placeholder="First Last" />
                <TextInput label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.currentTarget.value)} />
                {saveError && <Alert color="red">{saveError}</Alert>}
                {saveStatus === 'saved' && <Alert color="green">Saved</Alert>}
                <Group>
                  <Button onClick={onSaveProfile} loading={saveStatus === 'saving'} disabled={!employee}>Save changes</Button>
                </Group>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="roles" pt="md">
              <Stack>
                <Card withBorder>
                  {!employee ? (
                    <Text c="dimmed">No employee record found.</Text>
                  ) : employee.isAdmin ? (
                    <Stack gap={6}>
                      <Group gap={8} align="center">
                        <Badge size="xs" variant="light" color="indigo">admin</Badge>
                        <Text fw={600}>Administrator</Text>
                      </Group>
                      <Text c="dimmed" size="sm">Your access is managed by account administrators.</Text>
                    </Stack>
                  ) : (
                    <Stack gap={6}>
                      <Text fw={600}>Your roles</Text>
                      <Group gap={8} wrap="wrap">
                        {employee.roleIds.map((rid) => {
                          const r = roles.find((x) => x.id === rid);
                          return r ? <Badge key={rid} variant="light">{r.name}</Badge> : null;
                        })}
                        {employee.roleIds.length === 0 && <Text c="dimmed">No roles assigned</Text>}
                      </Group>
                      <Text c="dimmed" size="sm">Additional permissions: {employee.permissionIds.length}</Text>
                    </Stack>
                  )}
                </Card>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="settings" pt="md">
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
            </Tabs.Panel>
          </Tabs>
    </Stack>
  );
}
