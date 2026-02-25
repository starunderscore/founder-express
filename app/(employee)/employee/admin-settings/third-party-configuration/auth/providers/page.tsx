"use client";
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { ActionIcon, Badge, Button, Card, Group, Stack, Table, Text, Title } from '@mantine/core';
import { IconShieldLock } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Provider = { id: string; name: string; status: 'enabled' | 'disabled' | 'unknown' };

export default function AdminAuthProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((j) => setProviders(j.providers || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <EmployerAdminGate>
      <Stack>
        <Group justify="space-between" align="center">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/admin-settings/third-party-configuration')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconShieldLock size={20} />
              <div>
                <Title order={2}>Authentication</Title>
                <Text c="dimmed">Google, Microsoft, and other providers</Text>
              </div>
            </Group>
          </Group>
          <Button variant="light" onClick={load} loading={loading}>Refresh</Button>
        </Group>

        <Card withBorder>
          <Stack>
            <Text fw={600}>Provider status</Text>
            <Text c="dimmed" size="sm">
              Auto-detected from your Firebase project configuration. No new environment variables are required.
            </Text>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Provider</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Provider ID</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {providers.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>{p.name}</Table.Td>
                    <Table.Td>
                      {p.status === 'enabled' && <Badge color="green" variant="light">Enabled</Badge>}
                      {p.status === 'disabled' && <Badge color="gray" variant="light">Disabled</Badge>}
                      {p.status === 'unknown' && <Badge color="yellow" variant="light">Unknown</Badge>}
                    </Table.Td>
                    <Table.Td><code>{p.id}</code></Table.Td>
                  </Table.Tr>
                ))}
                {providers.length === 0 && !loading && (
                  <Table.Tr>
                    <Table.Td colSpan={3}><Text c="dimmed">No providers to display.</Text></Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}
