"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Anchor, TextInput, Alert, ActionIcon, Tabs, Badge } from '@mantine/core';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { IconMail } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { listenNewsletters, type Newsletter as NewsletterRow } from '@/services/email-subscriptions/newsletters';
import Link from 'next/link';
// RouteTabs removed per new design
import { readAdminSettings, updateBuiltinSystemValue } from '@/services/admin-settings/system-values/firestore';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';

type Newsletter = NewsletterRow;

export default function EmployerEmailNewslettersPage() {
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [websiteUrl, setWebsiteUrlState] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const toast = useToast();
  useEffect(() => { (async () => { try { const s = await readAdminSettings(); setWebsiteUrlState(s.websiteUrl || ''); setUrlInput(s.websiteUrl || ''); } catch {} })(); }, []);

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
    try {
      await updateBuiltinSystemValue('WEBSITE_URL', v);
      setWebsiteUrlState(v);
      toast.show({ title: 'Saved', message: 'WEBSITE_URL updated.' });
    } catch (e: any) {
      toast.show({ title: 'Save failed', message: String(e?.message || e || 'Unknown error'), color: 'red' });
    }
  };
  useEffect(() => {
    const off = listenNewsletters((rows) => setNewsletters(rows));
    return () => off();
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
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
          <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
            </svg>
          </ActionIcon>
          <Group gap="xs" align="center">
            <IconMail size={20} />
            <div>
              <Title order={2} mb={4}>Newsletters</Title>
              <Text c="dimmed">Manage newsletters and subscribers.</Text>
            </div>
          </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" component={Link as any} href="/employee/email-subscriptions/newsletters/new">New newsletter</Button>
          </Group>
        </Group>

        <Tabs value={'sent'} mb="md">
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
                <Anchor component={Link as any} href={`/employee/email-subscriptions/newsletters/${r.id}`} underline="hover">{r.subject || '(Untitled)'}</Anchor>
              ) },
              { key: 'recipients', header: 'Recipients', render: (r) => (r.recipients ?? 0) },
              { key: 'sentAt', header: 'Sent', render: (r) => (r.sentAt ? new Date(r.sentAt).toLocaleString() : '—') },
            ];
            return (
              <FirestoreDataTable
                collectionPath="newsletters"
                columns={columns}
                initialSort={{ field: 'sentAt', direction: 'desc' }}
                clientFilter={(r: any) => r.status !== 'Draft'}
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
