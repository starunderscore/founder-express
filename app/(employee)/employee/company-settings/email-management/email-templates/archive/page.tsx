"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, Button, Menu, ActionIcon, Tabs } from '@mantine/core';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { archiveEmailTemplateDoc, softRemoveEmailTemplateDoc, type EmailTemplate as EmailTemplateItem } from '@/services/company-settings/email-templates';
import { IconMail } from '@tabler/icons-react';

export default function EmailTemplatesArchivePage() {
  const router = useRouter();

  const columns: Column<EmailTemplateItem & { id: string }>[] = [
    { key: 'name', header: 'Name', render: (r) => (r.name || '—') },
    { key: 'subject', header: 'Subject', render: (r) => (<Text c="dimmed" size="sm">{r.subject || '—'}</Text>) },
    {
      key: 'actions', header: '', width: 1,
      render: (r) => (
        <Group justify="flex-end">
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
              <Menu.Item onClick={async () => { await archiveEmailTemplateDoc(r.id, false); }}>Restore</Menu.Item>
              <Menu.Item color="red" onClick={async () => { await softRemoveEmailTemplateDoc(r.id); }}>Remove</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    }
  ];

  return (
    <EmployerAdminGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings/email-management')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group gap="xs" align="center">
            <IconMail size={20} />
            <div>
              <Title order={2} mb={4}>Email templates</Title>
              <Text c="dimmed">Create and manage reusable email templates.</Text>
            </div>
          </Group>
          <Group gap="xs" ml="auto">
            <Button component={Link as any} href="/employee/company-settings/email-management/email-templates/new">New template</Button>
          </Group>
        </Group>

        <Tabs value={'archive'}>
          <Tabs.List>
            <Tabs.Tab value="active"><Link href="/employee/company-settings/email-management/email-templates">Active</Link></Tabs.Tab>
            <Tabs.Tab value="archive"><Link href="/employee/company-settings/email-management/email-templates/archive">Archive</Link></Tabs.Tab>
            <Tabs.Tab value="removed"><Link href="/employee/company-settings/email-management/email-templates/removed">Removed</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <FirestoreDataTable
            collectionPath="ep_company_settings/global/email_templates"
            columns={columns}
            initialSort={{ field: 'createdAt', direction: 'desc' }}
            clientFilter={(r: any) => !!r.archivedAt && !r.deletedAt}
            defaultPageSize={25}
            enableSelection={false}
          />
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}
