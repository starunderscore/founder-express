"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployerStore } from '@/state/employerStore';
import { Button, Card, Group, Stack, Text, TextInput, Title, ActionIcon, Badge, Textarea } from '@mantine/core';
import { PermissionsMatrix, allPermissionNames } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';

export default function NewRolePage() {
  const router = useRouter();
  const permissions = useEmployerStore((s) => s.permissions);
  const addRole = useEmployerStore((s) => s.addRole);
  const addPermission = useEmployerStore((s) => s.addPermission);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  // Start with no permissions selected by default

  const onCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    // Ensure selected permission names exist; create any missing
    const currentByName = new Map(permissions.map((p) => [p.name, p.id] as const));
    selectedNames.forEach((nm) => {
      if (!currentByName.has(nm)) addPermission(nm);
    });
    // Refresh mapping after creating any missing
    const nextByName = new Map(useEmployerStore.getState().permissions.map((p) => [p.name, p.id] as const));
    const ids = selectedNames.map((nm) => nextByName.get(nm)).filter(Boolean) as string[];
    addRole(name.trim(), ids, description.trim() || undefined);
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
