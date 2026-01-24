"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useSubscriptionsStore } from '@/state/subscriptionsStore';
import { Title, Text, Card, Stack, Group, Button, Badge, Tabs } from '@mantine/core';

export default function AdminEmailSubscriptionsPage() {
  const emailList = useSubscriptionsStore((s) => s.emailList);
  const waitlists = useSubscriptionsStore((s) => s.waitlists);

  const downloadCsv = () => {
    const headers = ['email', 'name', 'createdAt', 'source'];
    const rows = emailList.map((e) => [e.email, e.name || '', new Date(e.createdAt).toISOString(), e.source || '']);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEmails = async () => {
    try { await navigator.clipboard.writeText(emailList.map((e) => e.email).join('\n')); } catch {}
  };

  return (
    <EmployerAdminGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Email subscriptions</Title>
          <Text c="dimmed">Admin exports and quick navigation.</Text>
        </div>

        <Card withBorder>
          <Tabs defaultValue="newsletters">
            <Tabs.List>
              <Tabs.Tab value="newsletters">Newsletters</Tabs.Tab>
              <Tabs.Tab value="waiting">Waiting Lists</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="newsletters" pt="md">
              <Group justify="space-between" mb="xs">
                <Text c="dimmed">Master email list <Badge ml={6} size="xs" variant="light">{emailList.length}</Badge></Text>
                <Group gap="xs">
                  <Button variant="light" onClick={copyEmails}>Copy emails</Button>
                  <Button onClick={downloadCsv}>Download CSV</Button>
                </Group>
              </Group>
              <Text size="sm" c="dimmed">Exports the entire newsletter email list.</Text>
            </Tabs.Panel>

            <Tabs.Panel value="waiting" pt="md">
              <Stack>
                {waitlists.map((w) => (
                  <Card key={w.id} withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text fw={600}>{w.name}</Text>
                        <Text size="xs" c="dimmed">{w.entries.length} emails</Text>
                      </div>
                      <Button size="xs" component={Link as any} href={`/employee/email-subscriptions/waiting/${w.id}`}>Open</Button>
                    </Group>
                  </Card>
                ))}
                {waitlists.length === 0 && (
                  <Card withBorder>
                    <Text c="dimmed">No waiting lists yet</Text>
                  </Card>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </EmployerAdminGate>
  );
}

