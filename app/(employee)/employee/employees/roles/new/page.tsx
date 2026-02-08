"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Group, Stack, Text, TextInput, Title, ActionIcon, Badge, Textarea } from '@mantine/core';
import { PermissionsMatrix, allPermissionNames } from '@/components/PermissionsMatrix';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { createRole } from '@/services/roles';
import { useToast } from '@/components/ToastProvider';
import { namesToIds } from '@/lib/permissions';

export default function NewRolePage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  // Start with no permissions selected by default

  const onCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    const ids = namesToIds(selectedNames);
    await createRole({ name: name.trim(), description: description, permissionIds: ids });
    toast.show({ title: 'Role created', message: name.trim(), color: 'green' });
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
          <Button onClick={onCreate} disabled={!name.trim()}>Create role</Button>
        </Group>
      </Group>

      <Card withBorder>
        <form onSubmit={onCreate}>
          <Stack>
            <TextInput
              label="Role name"
              withAsterisk
              placeholder="e.g. Manager"
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
              <Button type="submit" disabled={!name.trim()}>Create role</Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
