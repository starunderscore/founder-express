"use client";
import { useState, useEffect } from 'react';
import { Title, Text, TextInput, Button, Group, Stack, Alert, Tabs } from '@mantine/core';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth';
import { listenEmployeeForUser, updateEmployee, updateDisplayName } from '@/services/profile';
// layout provides header/sidebar

export default function EmployeeAccountPage() {
  const { user } = useAuth();
  // Load current employee doc by userId
  const [employee, setEmployee] = useState<any | null>(null);
  const [empLoaded, setEmpLoaded] = useState(false);
  useEffect(() => {
    if (!user?.uid) { setEmployee(null); setEmpLoaded(true); return; }
    const unsub = listenEmployeeForUser({ uid: user.uid, email: user.email }, (row) => { setEmployee(row); setEmpLoaded(true); });
    return () => unsub();
  }, [user?.uid]);

  // Roles UI moved to /employee/profile/roles

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [fullName, setFullName] = useState(employee?.name || '');
  const [dob, setDob] = useState(employee?.dateOfBirth || '');

  // Sync form fields when loaded employee record changes
  useEffect(() => {
    setFullName(employee?.name || '');
    setDob(employee?.dateOfBirth || '');
    if (employee?.displayName) setDisplayName(employee.displayName);
  }, [employee?.id, employee?.name, employee?.dateOfBirth]);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSaveProfile = async () => {
    if (!user || !employee) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await updateDisplayName(displayName);
      await updateEmployee(employee.id, { name: fullName, dateOfBirth: dob, displayName });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save');
      setSaveStatus('error');
    }
  };

  // Settings moved to User Settings → Security

  if (!user) return null;

  return (
    <Stack>
      <div>
        <Title order={2} mb={4}>Employee Profile</Title>
        <Text c="dimmed">Manage your personal details.</Text>
      </div>
      {empLoaded && !employee && (
        <Alert color="orange">No employee record found for {user.email}. Ask your admin to add you.</Alert>
      )}
      <Tabs value={'profile'}>
        <Tabs.List>
          <Tabs.Tab value="profile"><Link href="/employee/profile">Profile</Link></Tabs.Tab>
          <Tabs.Tab value="roles"><Link href="/employee/profile/roles">Roles</Link></Tabs.Tab>
        </Tabs.List>
      </Tabs>
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
    </Stack>
  );
}
