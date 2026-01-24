"use client";
import Link from 'next/link';
import { Button, Card, Group, Stack, Text, Title, Table, Menu, ActionIcon } from '@mantine/core';
import { useEmployerStore } from '@/state/employerStore';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';

export default function EmployerRolesPage() {
  const roles = useEmployerStore((s) => s.roles);
  const removeRole = useEmployerStore((s) => s.removeRole);

  return (
    <EmployerAdminGate>
    <Stack>
      <Group justify="space-between" align="end">
        <div>
          <Title order={2} mb={4}>Roles</Title>
          <Text c="dimmed">Bundle permissions into reusable roles.</Text>
        </div>
        <Button component={Link as any} href="/employee/employees/roles/new">Add role</Button>
      </Group>

      <Card withBorder>
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Permissions</Table.Th>
              <Table.Th style={{ width: 1 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
              {roles.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Link href={`/employee/employees/roles/${r.id}/edit`} style={{ textDecoration: 'none' }}>
                    {r.name}
                  </Link>
                </Table.Td>
                <Table.Td><Text c="dimmed" lineClamp={2}>{r.description || '—'}</Text></Table.Td>
                <Table.Td>{r.permissionIds.length}</Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item component={Link as any} href={`/employee/employees/roles/${r.id}/edit`}>Edit</Menu.Item>
                        <Menu.Item color="red" onClick={() => removeRole(r.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {roles.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}><Text c="dimmed">No roles yet. Create a role above.</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
    </EmployerAdminGate>
  );
}
