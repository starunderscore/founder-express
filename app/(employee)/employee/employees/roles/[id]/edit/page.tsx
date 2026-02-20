"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Group, Stack, Text, TextInput, Title, ActionIcon, Badge, Textarea, Center, Loader, Alert } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import type { Route } from 'next';
import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateRole } from '@/services/roles';
import { idsToNames, namesToIds } from '@/lib/permissions';

export default function EditRolePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState<{ id: string; name: string; description?: string; permissionIds: string[]; archiveAt?: number | null; removedAt?: number | null } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  useEffect(() => {
    const ref = doc(db(), 'ep_employee_roles', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setRole(null); setLoadingDoc(false); return; }
      const d = snap.data() as any;
      setRole({ id: snap.id, name: d.name || '', description: d.description || undefined, permissionIds: Array.isArray(d.permissionIds) ? d.permissionIds : [], archiveAt: (typeof d.archiveAt === 'number' ? d.archiveAt : (d.isArchived ? (d.updatedAt || d.createdAt || Date.now()) : null)), removedAt: (typeof d.removedAt === 'number' ? d.removedAt : (typeof d.deletedAt === 'number' ? d.deletedAt : null)) });
      setLoadingDoc(false);
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

  if (loadingDoc) {
    return (
      <Center mih={200}>
        <Loader size="sm" />
      </Center>
    );
  }

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
    await updateRole(role.id, { name: nm, permissionIds: ids, description });
    const href = (role?.removedAt
      ? '/employee/employees/roles/removed'
      : role?.archiveAt
        ? '/employee/employees/roles/archive'
        : '/employee/employees/roles') as Route;
    toast.show({ title: 'Role saved', message: nm, color: 'green' });
    router.push(href);
  };

  return (
    <EmployerAdminGate>
    <Stack>
      <Group>
        <ActionIcon
          variant="subtle"
          size="lg"
          aria-label="Back"
          onClick={() => {
            if (role?.removedAt) router.push('/employee/employees/roles/removed');
            else if (role?.archiveAt) router.push('/employee/employees/roles/archive');
            else router.push('/employee/employees/roles');
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
          </svg>
        </ActionIcon>
        <div>
          <Title order={2} mb={4}>Edit role</Title>
          <Text c="dimmed">Rename, describe, and adjust permissions.</Text>
        </div>
        <Group gap="xs" ml="auto">
          <Button onClick={onSave} disabled={!name.trim()}>Save changes</Button>
        </Group>
      </Group>

      {role.removedAt && (
        <Alert color="red" variant="light" mb="md" title="Removed">
          This role is removed and appears in the Removed tab.
        </Alert>
      )}
      {!role.removedAt && role.archiveAt && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          This role is archived and hidden from the Active list.
        </Alert>
      )}

      <Card withBorder>
        <form onSubmit={onSave}>
          <Stack>
            <TextInput
              label="Role name"
              withAsterisk
              placeholder="Role name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              required
              autoFocus
              maxLength={40}
              rightSection={<Text size="xs" c="dimmed">{(name || '').length}/40</Text>}
              rightSectionWidth={56}
            />
            <Textarea
              label="Description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              autosize
              minRows={2}
              maxLength={280}
              rightSection={<Text size="xs" c="dimmed">{(description || '').length}/280</Text>}
              rightSectionWidth={64}
            />
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
