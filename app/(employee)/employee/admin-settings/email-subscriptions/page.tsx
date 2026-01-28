"use client";
import Link from 'next/link';
import { EmployerAdminGate } from '@/components/EmployerAdminGate';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Title, Text, Card, Stack, Group, Button, Badge, Tabs } from '@mantine/core';

type EmailRow = { id: string; email: string; name?: string; createdAt: number; source?: string };
type Waitlist = { id: string; name: string; entriesCount?: number; draftsCount?: number; sentCount?: number };

export default function AdminEmailSubscriptionsPage() {
  const [emailList, setEmailList] = useState<EmailRow[]>([]);
  const [waitlists, setWaitlists] = useState<Waitlist[]>([]);
  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db(), 'email_list')), (snap) => {
      const rows: EmailRow[] = [];
      snap.forEach((d) => { const x = d.data() as any; rows.push({ id: d.id, email: x.email || '', name: x.name || undefined, createdAt: Number(x.createdAt || Date.now()), source: x.source || undefined }); });
      setEmailList(rows);
    });
    const unsub2 = onSnapshot(query(collection(db(), 'waitlists')), (snap) => {
      const rows: Waitlist[] = [];
      snap.forEach((d) => {
        const x = d.data() as any;
        rows.push({ id: d.id, name: x.name || '', entriesCount: Number(x.entriesCount || 0), draftsCount: Number(x.draftsCount || 0), sentCount: Number(x.sentCount || 0) });
      });
      setWaitlists(rows);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

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
                    <Group justify="space-between" align="center">
                      <div>
                        <Text fw={600}>{w.name}</Text>
                        <Group gap={6} mt={4}>
                          <Badge variant="light" color="indigo">{Number(w.entriesCount || 0)} emails</Badge>
                          <Badge variant="light" color="gray">drafts {Number(w.draftsCount || 0)}</Badge>
                          <Badge variant="light" color="green">sent {Number(w.sentCount || 0)}</Badge>
                        </Group>
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
