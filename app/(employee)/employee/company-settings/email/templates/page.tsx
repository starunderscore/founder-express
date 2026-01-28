"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { Title, Text, Card, Stack, Group, Button, Tabs, Menu, ActionIcon, Table } from '@mantine/core';
import { useEffect, useState } from 'react';
import { listenEmailTemplates, removeEmailTemplate, archiveEmailTemplate, softRemoveEmailTemplate, type EmailTemplateItem } from '@/lib/firebase/emailSettings';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  useEffect(() => {
    const off = listenEmailTemplates(setTemplates);
    return () => off();
  }, []);


  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <div>
            <Title order={2} mb={4}>Email management</Title>
            <Text c="dimmed">Manage email and configure the API adapter.</Text>
          </div>
        </Group>

        <Tabs value="templates">
          <Tabs.List>
            <Tabs.Tab value="variables"><Link href="/employee/company-settings/email">Email variables</Link></Tabs.Tab>
            <Tabs.Tab value="templates"><Link href="/employee/company-settings/email/templates">Email templates</Link></Tabs.Tab>
            <Tabs.Tab value="configure"><Link href="/employee/company-settings/email/configure">Configure</Link></Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="templates" pt="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Email templates</Text>
              <Button component={Link as any} href="/employee/company-settings/email/templates/new">New template</Button>
            </Group>
            <Tabs value={'active'}>
              <Tabs.List>
                <Tabs.Tab value="active"><Link href="/employee/company-settings/email/templates">Active</Link></Tabs.Tab>
                <Tabs.Tab value="archive"><Link href="/employee/company-settings/email/templates/archive">Archive</Link></Tabs.Tab>
                <Tabs.Tab value="removed"><Link href="/employee/company-settings/email/templates/removed">Removed</Link></Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <Card withBorder mt="sm">
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Subject</Table.Th>
                    <Table.Th style={{ width: 1 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {templates
                    .filter((t) => !t.archivedAt && !t.deletedAt)
                    .filter((t) => t.id !== 'auth-password-reset' && t.id !== 'auth-email-verification')
                    .map((t) => {
                      const reserved = ['password reset', 'verify email'];
                      const displayName = reserved.includes((t.name || '').toLowerCase())
                        ? (t.name || '').split('').reverse().join('')
                        : t.name;
                      return (
                    <Table.Tr key={t.id}>
                      <Table.Td>{displayName}</Table.Td>
                      <Table.Td><Text c="dimmed" size="sm">{t.subject || '—'}</Text></Table.Td>
                      <Table.Td>
                        <Menu withinPortal position="bottom-end" shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="More actions">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="5" cy="12" r="2" fill="currentColor"/>
                                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                                <circle cx="19" cy="12" r="2" fill="currentColor"/>
                              </svg>
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item onClick={() => router.push(`/employee/company-settings/email/templates/new?edit=${encodeURIComponent(t.id)}`)}>Edit</Menu.Item>
                            <Menu.Item onClick={async () => { await archiveEmailTemplate(t.id, true); }}>Archive</Menu.Item>
                            <Menu.Item color="red" onClick={async () => { await softRemoveEmailTemplate(t.id); }}>Remove</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                    );
                  })}
                  {templates
                    .filter((t) => !t.archivedAt && !t.deletedAt)
                    .filter((t) => t.id !== 'auth-password-reset' && t.id !== 'auth-email-verification')
                    .length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={3}><Text c="dimmed">No templates</Text></Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAuthGate>
  );
}
