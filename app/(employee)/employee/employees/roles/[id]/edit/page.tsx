"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Group, Stack, Text, TextInput, Title, ActionIcon, Badge, Textarea } from '@mantine/core';
import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { idsToNames, namesToIds } from '@/lib/permissions';

export default function EditRolePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [role, setRole] = useState<{ id: string; name: string; description?: string; permissionIds: string[] } | null>(null);
  useEffect(() => {
    const ref = doc(db(), 'employee_roles', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setRole(null); return; }
      const d = snap.data() as any;
      setRole({ id: snap.id, name: d.name || '', description: d.description || undefined, permissionIds: Array.isArray(d.permissionIds) ? d.permissionIds : [] });
    });
    return () => unsub();
  }, [params.id]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  useEffect(() => {
    if (!role) return;
    setName(role.name || '');
    setDescription(role.description || '');
    setSelectedNames(idsToNames(role.permissionIds || []));
  }, [role?.id]);

  if (!role) {
    return (
      <Stack>
        <Title order={3}>Role not found</Title>
        <Button variant="light" onClick={() => router.push('/employee/employees/roles')}>Back to roles</Button>
      </Stack>
    );
  }

  const onSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nm = name.trim();
    if (!nm) return;
    const ids = namesToIds(selectedNames);
    await updateDoc(doc(db(), 'employee_roles', role.id), { name: nm, description: description.trim() || undefined, permissionIds: ids });
    router.push('/employee/employees/roles');
  };

  return (
    <EmployerAdminGate>
    <Stack>
      <Group>
        <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/employees/roles')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
          </svg>
        </ActionIcon>
        <div>
          <Title order={2} mb={4}>Edit role</Title>
          <Text c="dimmed">Rename, describe, and adjust permissions.</Text>
        </div>
        <Group gap="xs" ml="auto">
          <Button variant="light" onClick={() => router.push('/employee/employees/roles')}>Cancel</Button>
          <Button onClick={onSave} disabled={!name.trim()}>Save changes</Button>
        </Group>
      </Group>

      <Card withBorder>
        <form onSubmit={onSave}>
          <Stack>
            <TextInput label="Role name" placeholder="Role name" value={name} onChange={(e) => setName(e.currentTarget.value)} required autoFocus />
            <Textarea label="Description" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} autosize minRows={2} />
            <Group justify="space-between" align="center">
              <Text fw={600}>Permissions</Text>
              <Badge variant="light">({selectedNames.length}) selected</Badge>
            </Group>
            <PermissionsMatrix value={selectedNames} onChange={setSelectedNames} />
            <Group justify="flex-end">
              <Button type="submit" disabled={!name.trim()}>Save changes</Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
