"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployerStore } from '@/state/employerStore';
import { Button, Card, Group, Stack, Text, TextInput, Title, ActionIcon, Badge, Textarea } from '@mantine/core';
import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';

export default function EditRolePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const role = useEmployerStore((s) => s.roles.find((r) => r.id === params.id));
  const permissions = useEmployerStore((s) => s.permissions);
  const addPermission = useEmployerStore((s) => s.addPermission);
  const renameRole = useEmployerStore((s) => s.renameRole);
  const updateRolePermissions = useEmployerStore((s) => s.updateRolePermissions);
  const updateRoleDescription = useEmployerStore((s) => s.updateRoleDescription);

  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  useEffect(() => {
    if (!role) return;
    const byId = new Map(permissions.map((p) => [p.id, p.name] as const));
    const names = (role.permissionIds || []).map((id) => byId.get(id)).filter(Boolean) as string[];
    setSelectedNames(names);
  }, [role?.id, permissions]);

  if (!role) {
    return (
      <Stack>
        <Title order={3}>Role not found</Title>
        <Button variant="light" onClick={() => router.push('/employee/employees/roles')}>Back to roles</Button>
      </Stack>
    );
  }

  const onSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nm = name.trim();
    if (!nm) return;
    const currentByName = new Map(permissions.map((p) => [p.name, p.id] as const));
    selectedNames.forEach((n) => { if (!currentByName.has(n)) addPermission(n); });
    const nextByName = new Map(useEmployerStore.getState().permissions.map((p) => [p.name, p.id] as const));
    const ids = selectedNames.map((n) => nextByName.get(n)).filter(Boolean) as string[];
    renameRole(role.id, nm);
    updateRoleDescription(role.id, description.trim() || undefined);
    updateRolePermissions(role.id, ids);
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
