"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Anchor, ActionIcon, Tabs } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import type { Newsletter } from '@/services/email-subscriptions/newsletters';

export default function EmployerEmailNewslettersDraftsPage() {
  const router = useRouter();
  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions/newsletters')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconMail size={20} />
              <div>
                <Title order={2} mb={4}>Newsletter drafts</Title>
                <Text c="dimmed">Edit and manage unsent newsletters.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" component={Link as any} href="/employee/email-subscriptions/newsletters/new">New newsletter</Button>
          </Group>
        </Group>
        <Tabs value={'drafts'} mb="md">
          <Tabs.List>
            <Tabs.Tab value="sent"><Link href="/employee/email-subscriptions/newsletters">Emails sent</Link></Tabs.Tab>
            <Tabs.Tab value="drafts"><Link href="/employee/email-subscriptions/newsletters/drafts">Email drafts</Link></Tabs.Tab>
            <Tabs.Tab value="form"><Link href="/employee/email-subscriptions/newsletters/form">Copy & paste form</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          {(() => {
            const columns: Column<Newsletter>[] = [
              { key: 'subject', header: 'Subject', render: (r) => (
                <Anchor component={Link as any} href={`/employee/email-subscriptions/newsletters/new?edit=${encodeURIComponent(r.id)}`} underline="hover">{r.subject || '(Untitled draft)'}</Anchor>
              ) },
              { key: 'recipients', header: 'Recipients', render: (r) => (r.recipients ?? 0) },
              { key: 'sentAt', header: 'Sent', render: (_r) => '—' },
            ];
            return (
              <FirestoreDataTable
                collectionPath="newsletters"
                columns={columns}
                initialSort={{ field: 'createdAt', direction: 'desc' }}
                clientFilter={(r: any) => r.status === 'Draft'}
                defaultPageSize={25}
                enableSelection={false}
              />
            );
          })()}
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
