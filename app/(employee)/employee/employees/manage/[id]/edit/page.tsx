"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Checkbox, Group, MultiSelect, Stack, Text, TextInput, Title, ActionIcon, Badge, Alert, Modal } from '@mantine/core';
import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateEmployeeDoc } from '@/services/employees';
import { restoreEmployeeDoc, deleteEmployeeDoc } from '@/services/employees/firestore';
import EmployeeDeletePermanentModal from '@/components/employees/EmployeeDeletePermanentModal';
import { namesToIds, idsToNames } from '@/lib/permissions';

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [emp, setEmp] = useState<{ id: string; name: string; email: string; isAdmin?: boolean; roleIds: string[]; permissionIds: string[]; archiveAt?: number | null; removedAt?: number | null } | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; permissionIds: string[]; archiveAt: number | null; removedAt: number | null }>>([]);
  useEffect(() => {
    const qRoles = query(collection(db(), 'ep_employee_roles'));
    const unsub = onSnapshot(qRoles, (snap) => {
      const list: Array<{ id: string; name: string; permissionIds: string[]; archiveAt: number | null; removedAt: number | null }> = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const archiveAt = typeof data?.archiveAt === 'number' ? (data.archiveAt as number) : (data?.isArchived ? (data?.updatedAt || data?.createdAt || Date.now()) : null);
        const removedAt = typeof data?.removedAt === 'number' ? (data.removedAt as number) : (typeof data?.deletedAt === 'number' ? (data.deletedAt as number) : null);
        list.push({
          id: d.id,
          name: data.name || '',
          permissionIds: Array.isArray(data.permissionIds) ? data.permissionIds : [],
          archiveAt: archiveAt ?? null,
          removedAt: removedAt ?? null,
        });
      });
      setRoles(list);
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    const ref = doc(db(), 'ep_employees', params.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setEmp(null); return; }
      const d = snap.data() as any;
      setEmp({ id: snap.id, name: d.name || '', email: d.email || '', isAdmin: !!d.isAdmin, roleIds: Array.isArray(d.roleIds) ? d.roleIds : [], permissionIds: Array.isArray(d.permissionIds) ? d.permissionIds : [], archiveAt: typeof d.archiveAt === 'number' ? d.archiveAt : (d.isArchived ? Date.now() : null), removedAt: typeof d.removedAt === 'number' ? d.removedAt : (typeof d.deletedAt === 'number' ? d.deletedAt : null) });
    });
    return () => unsub();
  }, [params.id]);

  const roleOptions = useMemo(
    () => roles.filter((r) => !r.removedAt && !r.archiveAt).map((r) => ({ value: r.id, label: r.name })),
    [roles]
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!emp) return;
    // derive extraNames from direct permission ids on employee
    setExtraNames(idsToNames(emp.permissionIds || []));
    setName(emp.name || '');
    setEmail(emp.email || '');
    setIsAdmin(!!emp.isAdmin);
    setRoleIds(emp.roleIds || []);
  }, [emp?.id]);

  const rolePermissionNames = useMemo(() => {
    const ids = roleIds.flatMap((rid) => (roles.find((r) => r.id === rid)?.permissionIds || []));
    return Array.from(new Set(idsToNames(ids)));
  }, [roleIds, roles]);

  if (!emp) {
    return (
      <Stack>
        <Title order={3}>Employee not found</Title>
        <Button variant="light" onClick={() => router.push('/employee/employees/manage')}>Back to employees</Button>
      </Stack>
    );
  }

  const onSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const directIds = isAdmin ? [] : namesToIds(extraNames);
    await updateEmployeeDoc(emp.id, {
      name: name.trim(),
      email: email.trim(),
      isAdmin: !!isAdmin,
      roleIds: isAdmin ? [] : roleIds,
      permissionIds: directIds,
    });
    router.push('/employee/employees/manage');
  };

  const returnHref = () => {
    if (emp?.removedAt) return '/employee/employees/manage/removed';
    if (emp?.archiveAt) return '/employee/employees/manage/archive';
    return '/employee/employees/manage';
  };

  return (
    <EmployerAdminGate>
    <Stack>
      <Group>
        <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push(returnHref())}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
          </svg>
        </ActionIcon>
        <div>
          <Title order={2} mb={4}>Edit employee</Title>
          <Text c="dimmed">Update user details, roles, and permissions.</Text>
        </div>
        <Group gap="xs" ml="auto">
          <Button onClick={onSave} disabled={!name.trim() || !email.trim()}>Save changes</Button>
        </Group>
      </Group>

      {emp?.removedAt && (
        <Alert color="red" variant="light" mb="md" title="Removed">
          <Group justify="space-between" align="center">
            <Text>This employee is removed. You can restore or permanently delete.</Text>
            <Group gap="xs">
              <Button variant="light" onClick={() => setRestoreOpen(true)}>Restore</Button>
              <Button color="red" variant="light" onClick={() => setDeleteOpen(true)}>Delete permanently</Button>
            </Group>
          </Group>
        </Alert>
      )}
      {!emp?.removedAt && emp?.archiveAt && (
        <Alert color="gray" variant="light" mb="md" title="Archived">
          <Group justify="space-between" align="center">
            <Text>This employee is archived and hidden from the Active list.</Text>
            <Button variant="light" onClick={() => setUnarchiveOpen(true)}>Unarchive</Button>
          </Group>
        </Alert>
      )}

      <Card withBorder>
        <form onSubmit={onSave}>
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
              <Button type="submit" disabled={!name.trim() || !email.trim()}>Save changes</Button>
            </Group>
          </Stack>
        </form>
      </Card>

      <Modal opened={unarchiveOpen} onClose={() => setUnarchiveOpen(false)} centered>
        <Stack>
          <Text>Unarchive this employee? They will return to Active.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUnarchiveOpen(false)}>Cancel</Button>
            <Button onClick={async () => { if (!emp) return; await restoreEmployeeDoc(emp.id); setUnarchiveOpen(false); router.push('/employee/employees/manage'); }}>Unarchive</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={restoreOpen} onClose={() => setRestoreOpen(false)} centered>
        <Stack>
          <Text>Restore this employee back to Active?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button onClick={async () => { if (!emp) return; await restoreEmployeeDoc(emp.id); setRestoreOpen(false); router.push('/employee/employees/manage'); }}>Restore</Button>
          </Group>
        </Stack>
      </Modal>

      <EmployeeDeletePermanentModal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        employeeName={emp?.name || ''}
        onConfirm={async () => {
          if (!emp) return;
          await deleteEmployeeDoc(emp.id);
          setDeleteOpen(false);
          router.push('/employee/employees/manage');
        }}
      />
    </Stack>
    </EmployerAdminGate>
  );
}
