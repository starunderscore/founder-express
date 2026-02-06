"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { ActionIcon, Card, Group, Menu, Stack, Table, Tabs, Text, Title } from '@mantine/core';
import { useFinanceStore } from '@/state/financeStore';

export default function InvoiceTemplatesArchivePage() {
  const router = useRouter();
  const templates = useFinanceStore((s) => s.settings.templates);
  const restoreTemplate = useFinanceStore((s) => s.restoreTemplate);
  const removeTemplate = useFinanceStore((s) => s.removeTemplate);

  const archived = templates.filter((t) => t.isArchived && !t.deletedAt);

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/finance/settings')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>Invoice Templates</Title>
              <Text c="dimmed">Reusable invoice line items and taxes.</Text>
            </div>
          </Group>
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/finance/invoice-templates">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/finance/invoice-templates/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/finance/invoice-templates/removed">Remove</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder mt="sm">
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Items</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {archived.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>{t.name}</Table.Td>
                  <Table.Td>{t.items.length}</Table.Td>
                  <Table.Td style={{ width: 1 }}>
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => restoreTemplate(t.id)}>Restore</Menu.Item>
                        <Menu.Item color="red" onClick={() => removeTemplate(t.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {archived.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}><Text c="dimmed">No archived templates</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

