"use client";
import { useState, useEffect, useMemo } from 'react';
import { Title, Text, Stack, Card, Group, Badge, Alert, Tabs, Divider } from '@mantine/core';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { allPermissionNames } from '@/components/permissionsSchema';
import { idsToNames } from '@/lib/permissions';

export default function EmployeeRolesPage() {
  const { user } = useAuth();

  const [employee, setEmployee] = useState<any | null>(null);
  const [empLoaded, setEmpLoaded] = useState(false);
  useEffect(() => {
    if (!user?.email) { setEmployee(null); setEmpLoaded(true); return; }
    const q = query(collection(db(), 'employees'), where('email', '==', user.email));
    const unsub = onSnapshot(q, (snap) => {
      let found: any | null = null;
      snap.forEach((d) => { if (!found) found = { id: d.id, ...(d.data() as any) }; });
      setEmployee(found);
      setEmpLoaded(true);
    });
    return () => unsub();
  }, [user?.email]);

  const [roleMap, setRoleMap] = useState<Record<string, { name: string; permissionIds: string[] }>>({});
  useEffect(() => {
    const qRoles = query(collection(db(), 'employee_roles'));
    const unsub = onSnapshot(qRoles, (snap) => {
      const map: Record<string, { name: string; permissionIds: string[] }> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        map[d.id] = { name: data.name || d.id, permissionIds: Array.isArray(data.permissionIds) ? data.permissionIds : [] };
      });
      setRoleMap(map);
    });
    return () => unsub();
  }, []);

  // Compute effective permission names for the current employee (roles + extra)
  const effectivePermissionNames = useMemo(() => {
    if (!employee) return [] as string[];
    const roleIds = Array.isArray(employee.roleIds) ? employee.roleIds : [];
    const extraIds = Array.isArray(employee.permissionIds) ? employee.permissionIds : [];
    const rolePermIds = roleIds.flatMap((rid: string) => roleMap[rid]?.permissionIds || []);
    // unique ids
    const idSet = new Set<string>([...rolePermIds, ...extraIds]);
    return idsToNames(Array.from(idSet));
  }, [employee?.id, roleMap]);

  return (
    <Stack>
      <div>
        <Title order={2} mb={4}>Roles & Permissions</Title>
        <Text c="dimmed">Review your access to troubleshoot permission issues.</Text>
      </div>

      <Tabs value={'roles'}>
        <Tabs.List>
          <Tabs.Tab value="profile"><Link href="/employee/profile">Profile</Link></Tabs.Tab>
          <Tabs.Tab value="roles"><Link href="/employee/profile/roles">Roles</Link></Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Card withBorder>
        {!empLoaded ? null : !employee ? (
          <Alert color="orange">No employee record found.</Alert>
        ) : employee.isAdmin ? (
          <Stack gap={6}>
            <Group gap={8} align="center">
              <Badge size="xs" variant="light" color="indigo">admin</Badge>
              <Text fw={600}>Administrator</Text>
            </Group>
            <Text c="dimmed" size="sm">You have administrator access across the app.</Text>
          </Stack>
        ) : (
          <Stack gap={6}>
            <Text fw={600}>Your roles</Text>
            <Group gap={8} wrap="wrap">
              {(Array.isArray(employee.roleIds) ? employee.roleIds : []).map((rid: string) => (
                <Badge key={rid} variant="light">{roleMap[rid]?.name || rid}</Badge>
              ))}
              {(!Array.isArray(employee.roleIds) || employee.roleIds.length === 0) && <Text c="dimmed">No roles assigned</Text>}
            </Group>
            <Text c="dimmed" size="sm">Additional permissions: {Array.isArray(employee.permissionIds) ? employee.permissionIds.length : 0}</Text>
          </Stack>
        )}
      </Card>

      <Card withBorder>
        <Stack>
          <Text fw={600}>Your effective permissions</Text>
          <PermissionsMatrix
            value={effectivePermissionNames}
            // Disable all interactions for read-only view
            disabledNames={allPermissionNames()}
            onChange={() => {}}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
