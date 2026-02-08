"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { Title, Text, Card, Stack, Group, Button, ActionIcon } from '@mantine/core';
import { IconSettings, IconKey, IconMail } from '@tabler/icons-react';

export default function CompanySystemEmailsPage() {
  const router = useRouter();
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
            <IconSettings size={20} />
            <div>
              <Title order={2} mb={4}>System emails</Title>
              <Text c="dimmed">Customize password reset and verify email messages.</Text>
            </div>
          </Group>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconKey size={18} />
              <div>
                <Text fw={600}>Password reset</Text>
                <Text c="dimmed" size="sm">Edit the email sent for password resets.</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/company-settings/email-management/system-emails/password-reset" variant="light">Edit</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconMail size={18} />
              <div>
                <Text fw={600}>Verify email</Text>
                <Text c="dimmed" size="sm">Edit the email sent to verify addresses.</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/company-settings/email-management/system-emails/verify-email" variant="light">Edit</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}
