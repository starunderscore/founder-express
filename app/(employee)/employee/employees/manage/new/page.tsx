"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Checkbox, Group, MultiSelect, Stack, Text, TextInput, Title, ActionIcon, Badge } from '@mantine/core';
import { PermissionsMatrix, labelFor, RESOURCES } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { createEmployee } from '@/services/employees';
import { namesToIds, idsToNames } from '@/lib/permissions';

export default function NewEmployeePage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    const qRoles = query(collection(db(), 'ep_employee_roles'));
    const unsub = onSnapshot(qRoles, (snap) => {
      const list: Array<{ id: string; name: string }> = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        if (!data.deletedAt && !data.isArchived) list.push({ id: d.id, name: data.name || '' });
      });
      setRoles(list);
    });
    return () => unsub();
  }, []);

  const roleOptions = useMemo(() => roles.map((r) => ({ value: r.id, label: r.name })), [roles]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [extraNames, setExtraNames] = useState<string[]>([]);

  // Compute permission names coming from selected roles — requires loading role docs in this component
  const [rolePermIdsById, setRolePermIdsById] = useState<Record<string, string[]>>({});
  useEffect(() => {
    // Build a map of roleId -> permissionIds from current roles subscription
    // Extend roles subscription to also capture permissionIds
    const qRoles = query(collection(db(), 'ep_employee_roles'));
    const unsub = onSnapshot(qRoles, (snap) => {
      const map: Record<string, string[]> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        if (!data.deletedAt && !data.isArchived) map[d.id] = Array.isArray(data.permissionIds) ? data.permissionIds : [];
      });
      setRolePermIdsById(map);
    });
    return () => unsub();
  }, []);
  const rolePermissionNames = useMemo(() => {
    const ids = roleIds.flatMap((rid) => rolePermIdsById[rid] || []);
    return Array.from(new Set(idsToNames(ids)));
  }, [roleIds, rolePermIdsById]);

  const onCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const directIds = isAdmin ? [] : namesToIds(extraNames);

    await createEmployee({ name: name.trim(), email: email.trim(), roleIds: isAdmin ? [] : roleIds, permissionIds: directIds, isAdmin: !!isAdmin });
    router.push('/employee/employees/manage');
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
