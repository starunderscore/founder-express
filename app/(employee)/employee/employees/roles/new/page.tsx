"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Group, Stack, Text, TextInput, Title, ActionIcon, Badge, Textarea } from '@mantine/core';
import { PermissionsMatrix, allPermissionNames } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { namesToIds } from '@/lib/permissions';

export default function NewRolePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  // Start with no permissions selected by default

  const onCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    const ids = namesToIds(selectedNames);
    await addDoc(collection(db(), 'employee_roles'), { name: name.trim(), description: description.trim() || undefined, permissionIds: ids, isArchived: false, createdAt: Date.now() });
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
          <Title order={2} mb={4}>New role</Title>
          <Text c="dimmed">Name the role and choose its permissions.</Text>
        </div>
        <Group gap="xs" ml="auto">
          <Button variant="light" onClick={() => router.push('/employee/employees/roles')}>Cancel</Button>
          <Button onClick={onCreate} disabled={!name.trim()}>Create role</Button>
        </Group>
      </Group>

      <Card withBorder>
        <form onSubmit={onCreate}>
          <Stack>
            <TextInput label="Role name" placeholder="e.g. Manager" value={name} onChange={(e) => setName(e.currentTarget.value)} required autoFocus />
            <Textarea label="Description" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} autosize minRows={2} />
            <Group justify="space-between" align="center">
              <Text fw={600}>Permissions</Text>
              <Badge variant="light">({selectedNames.length}) selected</Badge>
            </Group>
            <PermissionsMatrix value={selectedNames} onChange={setSelectedNames} />
            <Group justify="flex-end">
              <Button type="submit" disabled={!name.trim()}>Create role</Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
