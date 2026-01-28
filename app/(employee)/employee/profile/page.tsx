"use client";
import { useState, useMemo, useEffect } from 'react';
import { Title, Text, TextInput, Button, Group, Stack, Alert, Tabs, Card, Badge } from '@mantine/core';
import { useAuth } from '@/lib/firebase/auth';
import { updateUserProfile, updateUserPassword, reauthWithPassword } from '@/lib/firebase/auth';
import { collection, onSnapshot, query, updateDoc, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
// layout provides header/sidebar

export default function EmployeeAccountPage() {
  const { user } = useAuth();
  // Load current employee doc from Firestore by matching email
  const [employee, setEmployee] = useState<any | null>(null);
  useEffect(() => {
    if (!user?.email) { setEmployee(null); return; }
    const q = query(collection(db(), 'employees'), where('email', '==', user.email));
    const unsub = onSnapshot(q, (snap) => {
      let found: any | null = null;
      snap.forEach((d) => { if (!found) found = { id: d.id, ...(d.data() as any) }; });
      setEmployee(found);
    });
    return () => unsub();
  }, [user?.email]);

  // Roles/permissions labels may still come from local store; replace later if/when migrated
  const [roleNames, setRoleNames] = useState<Record<string, string>>({});
  const [permNames, setPermNames] = useState<Record<string, string>>({});
  useEffect(() => {
    // Load role names for display
    const qRoles = query(collection(db(), 'employee_roles'));
    const unsub = onSnapshot(qRoles, (snap) => {
      const map: Record<string, string> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        map[d.id] = data.name || d.id;
      });
      setRoleNames(map);
    });
    return () => unsub();
  }, []);
  const effectivePermIds: string[] = useMemo(() => Array.isArray(employee?.permissionIds) ? employee!.permissionIds : [], [employee?.permissionIds]);
  const permMap = permNames; // placeholder mapping if/when migrated

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
      try {
        await updateDoc(doc(db(), 'employees', employee.id), { name: fullName, dateOfBirth: dob });
      } catch (e) {
        // Surface failure; keep user profile update even if employee doc fails
        throw e;
      }
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
                        {(Array.isArray(employee.roleIds) ? employee.roleIds : []).map((rid: string) => (
                          <Badge key={rid} variant="light">{roleNames[rid] || rid}</Badge>
                        ))}
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
