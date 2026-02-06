"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useRouter } from 'next/navigation';
import { Title, Text, Card, Stack, Group, Button, Tabs, ActionIcon } from '@mantine/core';
import { useEffect } from 'react';
import Link from 'next/link';
import { ensureDefaultSystemEmails } from '@/lib/firebase/emailSettings';

export default function SystemEmailsPage() {
  const router = useRouter();
  useEffect(() => { ensureDefaultSystemEmails().catch(() => {}); }, []);

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
            <Title order={2} mb={4}>System emails</Title>
            <Text c="dimmed">Edit built‑in emails used by authentication.</Text>
          </div>
        </Group>

        <Tabs value="system-emails">
          <Tabs.List>
            <Tabs.Tab value="variables"><Link href="/employee/company-settings/email">Email variables</Link></Tabs.Tab>
            <Tabs.Tab value="templates"><Link href="/employee/company-settings/email/templates">Email templates</Link></Tabs.Tab>
            <Tabs.Tab value="system-emails"><Link href="/employee/company-settings/email/system-emails">System emails</Link></Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="system-emails" pt="md">
            <Card withBorder>
              <Stack>
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={600}>Password reset</Text>
                    <Text size="sm" c="dimmed">Sent when a user requests to reset their password.</Text>
                  </div>
                  <Button variant="light" component={Link as any} href="/employee/company-settings/email/system-emails/password-reset">Edit system email</Button>
                </Group>
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={600}>Verify email</Text>
                    <Text size="sm" c="dimmed">Sent to confirm a user’s email address.</Text>
                  </div>
                  <Button variant="light" component={Link as any} href="/employee/company-settings/email/system-emails/verify-email">Edit system email</Button>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </EmployerAuthGate>
  );
}
