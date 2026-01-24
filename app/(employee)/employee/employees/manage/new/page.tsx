"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployerStore } from '@/state/employerStore';
import { Button, Card, Checkbox, Group, MultiSelect, Stack, Text, TextInput, Title, ActionIcon, Badge } from '@mantine/core';
import { PermissionsMatrix, labelFor, RESOURCES } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function NewEmployeePage() {
  const router = useRouter();
  const roles = useEmployerStore((s) => s.roles);
  const permissions = useEmployerStore((s) => s.permissions);
  const addPermission = useEmployerStore((s) => s.addPermission);
  // Firestore-backed creation; store remains the source for roles/permissions labels

  const roleOptions = useMemo(() => roles.map((r) => ({ value: r.id, label: r.name })), [roles]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [extraNames, setExtraNames] = useState<string[]>([]);

  // Compute permission names coming from selected roles
  const rolePermissionNames = useMemo(() => {
    const byId = new Map(permissions.map((p) => [p.id, p.name] as const));
    return Array.from(new Set(roleIds.flatMap((rid) => (roles.find((r) => r.id === rid)?.permissionIds || []).map((pid) => byId.get(pid) || '')))).filter(Boolean) as string[];
  }, [roleIds, roles, permissions]);

  const onCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    // Ensure extra permission names exist in store for label consistency
    const currentByName = new Map(permissions.map((p) => [p.name, p.id] as const));
    extraNames.forEach((nm) => { if (!currentByName.has(nm)) addPermission(nm); });
    const nextByName = new Map(useEmployerStore.getState().permissions.map((p) => [p.name, p.id] as const));
    const directIds = isAdmin ? [] : (extraNames.map((nm) => nextByName.get(nm)).filter(Boolean) as string[]);

    try {
      // Use auto-id docs for employees created by the owner
      await addDoc(collection(db(), 'employees'), {
        name: name.trim(),
        email: email.trim(),
        roleIds: isAdmin ? [] : roleIds,
        permissionIds: directIds,
        isAdmin: !!isAdmin,
        createdAt: serverTimestamp(),
      });
      router.push('/employee/employees/manage');
    } catch (_e) {
      // Silently noop for now or you can surface via a toast
    }
  };

  return (
    <EmployerAdminGate>
    <Stack>
      <Group>
        <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/employees/manage')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
          </svg>
        </ActionIcon>
        <div>
          <Title order={2} mb={4}>Add employee</Title>
          <Text c="dimmed">Create a user, assign roles, and fine-tune permissions.</Text>
        </div>
        <Group gap="xs" ml="auto">
          <Button variant="light" onClick={() => router.push('/employee/employees/manage')}>Cancel</Button>
          <Button onClick={onCreate} disabled={!name.trim() || !email.trim()}>Create employee</Button>
        </Group>
      </Group>

      <Card withBorder>
        <form onSubmit={onCreate}>
          <Stack>
            <Group grow>
              <TextInput label="Name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.currentTarget.value)} required autoFocus />
              <TextInput label="Email" placeholder="jane@company.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            </Group>
            <Checkbox label="Is admin" checked={isAdmin} onChange={(e) => setIsAdmin(e.currentTarget.checked)} description="Admins are managed at the account level; roles/permissions below are disabled." />

            <Stack opacity={isAdmin ? 0.5 : 1}>
              <Text fw={600}>Roles</Text>
              <MultiSelect data={roleOptions} value={roleIds} onChange={setRoleIds} placeholder="Select roles" searchable nothingFoundMessage="No roles" disabled={isAdmin} />

              <Group justify="space-between" align="center" mt="sm">
                <Text fw={600}>Permissions</Text>
                <Badge variant="light">({rolePermissionNames.length + extraNames.length}) selected</Badge>
              </Group>
              <PermissionsMatrix
                value={extraNames}
                onChange={setExtraNames}
                disabledNames={rolePermissionNames}
              />
            </Stack>

            <Group justify="flex-end">
              <Button type="submit" disabled={!name.trim() || !email.trim()}>Create employee</Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
