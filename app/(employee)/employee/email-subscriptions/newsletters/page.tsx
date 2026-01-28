"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Table, Badge, Tabs, Anchor, TextInput, Alert } from '@mantine/core';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Link from 'next/link';
import { RouteTabs } from '@/components/RouteTabs';
import { useAppSettingsStore } from '@/state/appSettingsStore';
import { useToast } from '@/components/ToastProvider';

type Newsletter = { id: string; subject: string; status: 'Draft'|'Scheduled'|'Sent'; recipients: number; sentAt?: number; body?: string };

export default function EmployerEmailNewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const websiteUrl = useAppSettingsStore((s) => s.settings.websiteUrl || '');
  const setWebsiteUrl = useAppSettingsStore((s) => s.setWebsiteUrl);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => { setUrlInput(websiteUrl || ''); }, [websiteUrl]);

  const validUrl = (u: string) => {
    try {
      const x = new URL(u);
      return !!x.protocol && !!x.host;
    } catch { return false; }
  };
  const onSaveUrl = () => {
    const v = urlInput.trim();
    if (!validUrl(v)) { setUrlError('Enter a valid URL, e.g. https://www.example.com'); return; }
    setUrlError(null);
    setWebsiteUrl(v);
    toast.show({ title: 'Saved', message: 'WEBSITE_URL updated.' });
  };
  useEffect(() => {
    const qN = query(collection(db(), 'newsletters'));
    const unsub = onSnapshot(qN, (snap) => {
      const rows: Newsletter[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        rows.push({ id: d.id, subject: data.subject || '', status: (data.status || 'Draft'), recipients: Number(data.recipients || 0), sentAt: typeof data.sentAt === 'number' ? data.sentAt : undefined, body: data.body || '' });
      });
      setNewsletters(rows);
    });
    return () => unsub();
  }, []);

  const dateStr = (ts: number) => new Date(ts).toLocaleString();

  const sent = newsletters.filter((n) => n.status === 'Sent' || n.status === 'Scheduled');
  const drafts = newsletters.filter((n) => n.status === 'Draft');

  const CodeSnippet = () => {
    const base = (websiteUrl && validUrl(websiteUrl))
      ? websiteUrl
      : (typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.example');
    const action = `${base}/api/newsletter/subscribe`;
    const snippet = `<!-- Newsletter signup form -->\n<form action="${action}" method="POST">\n  <label>\n    Email\n    <input type=\"email\" name=\"email\" required />\n  </label>\n  <label>\n    Name (optional)\n    <input type=\"text\" name=\"name\" />\n  </label>\n  <!-- Optional: categorize where this submission came from -->\n  <input type=\"hidden\" name=\"list\" value=\"newsletter\" />\n  <button type=\"submit\">Subscribe</button>\n</form>`;
    const copy = async () => {
      try { await navigator.clipboard.writeText(snippet); } catch {}
    };
    return (
      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Text fw={600}>HTML form</Text>
          <Button size="xs" variant="light" onClick={copy}>Copy</Button>
        </Group>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{snippet}</pre>
      </Card>
    );
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <div>
          <Title order={2} mb={4}>Email subscriptions</Title>
          <Text c="dimmed">Manage waiting lists and newsletter subscribers.</Text>
        </div>

        <RouteTabs
          value={"newsletters"}
          tabs={[
            { value: 'newsletters', label: 'Newsletters', href: '/employee/email-subscriptions/newsletters' },
            { value: 'waiting', label: 'Waiting Lists', href: '/employee/email-subscriptions/waiting' },
            { value: 'archive', label: 'Archive', href: '/employee/email-subscriptions/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/email-subscriptions/removed' },
          ]}
        />

        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Newsletters</Text>
            <Button variant="light" component={Link as any} href="/employee/email-subscriptions/newsletters/new">New newsletter</Button>
          </Group>

          <Tabs defaultValue="sent">
            <Tabs.List>
              <Tabs.Tab value="sent">Emails sent <Badge ml={6} size="xs" variant="light">{sent.length}</Badge></Tabs.Tab>
              <Tabs.Tab value="drafts">Email drafts <Badge ml={6} size="xs" variant="light">{drafts.length}</Badge></Tabs.Tab>
              <Tabs.Tab value="form">Copy & paste form</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="sent" pt="md">
              <Card withBorder>
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Subject</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Recipients</Table.Th>
                      <Table.Th>Sent</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {sent.map((n) => (
                      <Table.Tr key={n.id}>
                        <Table.Td>
                          <Anchor component={Link as any} href={`/employee/email-subscriptions/newsletters/${n.id}`} underline="hover">{n.subject}</Anchor>
                        </Table.Td>
                        <Table.Td><Badge variant="light" color={n.status === 'Sent' ? 'green' : n.status === 'Scheduled' ? 'indigo' : 'gray'}>{n.status}</Badge></Table.Td>
                        <Table.Td>{n.recipients}</Table.Td>
                        <Table.Td>{n.sentAt ? dateStr(n.sentAt) : '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                    {sent.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={4}><Text c="dimmed">No sent newsletters yet</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="drafts" pt="md">
              <Card withBorder>
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Subject</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Recipients</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {drafts.map((n) => (
                      <Table.Tr key={n.id}>
                        <Table.Td>
                          <Anchor component={Link as any} href={`/employee/email-subscriptions/newsletters/${n.id}`} underline="hover">{n.subject || '(Untitled draft)'}</Anchor>
                        </Table.Td>
                        <Table.Td><Badge variant="light" color="gray">{n.status}</Badge></Table.Td>
                        <Table.Td>{n.recipients}</Table.Td>
                      </Table.Tr>
                    ))}
                    {drafts.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">No drafts yet</Text></Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Card>
            </Tabs.Panel>

            

            <Tabs.Panel value="form" pt="md">
              <Card withBorder>
                <Stack>
                  <Text c="dimmed">Copy and paste this HTML form into your website. Submissions post to this app's API and can be wired to Firebase.</Text>
                  {(!websiteUrl || !validUrl(websiteUrl)) && (
                    <Alert color="yellow" title="Set WEBSITE_URL">
                      Update Company settings → Configuration → WEBSITE_URL to replace localhost in the form action.
                    </Alert>
                  )}
                  <Group align="end" gap="sm">
                    <div style={{ flex: 1 }}>
                      <TextInput label="Website URL (WEBSITE_URL)" placeholder="https://www.example.com" value={urlInput} onChange={(e) => setUrlInput(e.currentTarget.value)} error={urlError || undefined} />
                    </div>
                    <Button onClick={onSaveUrl}>Save</Button>
                    <Button variant="light" component={Link as any} href="/employee/company-settings/configuration">Open settings</Button>
                  </Group>
                  {websiteUrl && validUrl(websiteUrl) && <CodeSnippet />}
                </Stack>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
