"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, ActionIcon } from '@mantine/core';
import { IconMail, IconForms, IconSettings } from '@tabler/icons-react';

export default function CompanyEmailManagementPage() {
  const router = useRouter();
  return (
    <EmployerAuthGate>
      <Stack>
        <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/company-settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group gap="xs" align="center">
            <IconMail size={20} />
            <div>
              <Title order={2} mb={4}>Email Management</Title>
              <Text c="dimmed">Manage variables, templates, and system emails.</Text>
            </div>
          </Group>
        </Group>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconForms size={18} />
              <div>
                <Text fw={600}>Email variables</Text>
                <Text c="dimmed" size="sm">Define variables (e.g., COMPANY_NAME) used in emails.</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/company-settings/email-management/email-variables" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconMail size={18} />
              <div>
                <Text fw={600}>Email templates</Text>
                <Text c="dimmed" size="sm">Create and manage reusable email templates.</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/company-settings/email-management/email-templates" variant="light">Open</Button>
          </Group>
        </Card>

        <Card withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <IconSettings size={18} />
              <div>
                <Text fw={600}>System emails</Text>
                <Text c="dimmed" size="sm">Customize password reset and verify email messages.</Text>
              </div>
            </Group>
            <Button component={Link as any} href="/employee/company-settings/email-management/system-emails" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
