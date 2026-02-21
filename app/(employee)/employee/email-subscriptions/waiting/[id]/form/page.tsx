"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Card, Stack, Tabs, Group, Title, Text, Button, Alert } from '@mantine/core';
import { readAdminSettings } from '@/services/admin-settings/system-values/firestore';
import WaitlistHeader from '@/components/waitlists/WaitlistHeader';

export default function WaitingFormPage({ params }: { params: { id: string } }) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await readAdminSettings();
        setWebsiteUrl(s.websiteUrl || '');
        setWebsiteName(s.websiteName || '');
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const validUrl = (u: string) => {
    try { const x = new URL(u); return !!x.protocol && !!x.host; } catch { return false; }
  };
  const DEFAULT_URL = 'https://www.example.com';
  const base = useMemo(() => (websiteUrl && validUrl(websiteUrl)) ? websiteUrl : DEFAULT_URL, [websiteUrl]);
  const needsAttention = useMemo(() => !websiteUrl || !validUrl(websiteUrl) || websiteUrl === DEFAULT_URL, [websiteUrl]);
  const nameForHeading = websiteName || 'Your Website';

  const action = `${base}/api/waiting-list/subscribe`;
  const snippet = `<!-- Waiting list signup form -->\n<h3>${nameForHeading} waiting list</h3>\n<form action="${action}" method="POST">\n  <input type=\"hidden\" name=\"waitlistId\" value=\"${params.id}\" />\n  <label>\n    Email\n    <input type=\"email\" name=\"email\" required />\n  </label>\n  <label>\n    Name (optional)\n    <input type=\"text\" name=\"name\" />\n  </label>\n  <button type=\"submit\">Join waiting list</button>\n</form>`;
  const copySnippet = async () => { try { await navigator.clipboard.writeText(snippet); } catch {} };

  return (
    <EmployerAuthGate>
      <Stack>
        <WaitlistHeader listId={params.id} name={nameForHeading} />

        <Tabs value={'form'}>
          <Tabs.List>
            <Tabs.Tab value="sent"><Link href={`/employee/email-subscriptions/waiting/${params.id}`}>Emails sent</Link></Tabs.Tab>
            <Tabs.Tab value="drafts"><Link href={`/employee/email-subscriptions/waiting/${params.id}/drafts`}>Email drafts</Link></Tabs.Tab>
            <Tabs.Tab value="form"><Link href={`/employee/email-subscriptions/waiting/${params.id}/form`}>Copy & paste form</Link></Tabs.Tab>
            <Tabs.Tab value="settings"><Link href={`/employee/email-subscriptions/waiting/${params.id}/settings`}>List settings</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* System variables preview */}
        <Card withBorder>
          <Stack>
            <Title order={4} m={0}>System variables</Title>
            {loaded && needsAttention && (
              <Alert color="yellow" variant="light" title="Website URL needed" maw={800}>
                <Stack gap={8}>
                  <Text size="sm">This form uses the system value WEBSITE_URL to set the form action. It appears to be missing or still using the default ({DEFAULT_URL}). Update it under System Values, then revisit this page.</Text>
                  <Group justify="flex-end">
                    <Button component={Link as any} href="/employee/admin-settings/system-values" variant="light" size="xs">Open System Values</Button>
                  </Group>
                </Stack>
              </Alert>
            )}
            <Group gap={6}>
              <Text size="sm" c="dimmed">Using WEBSITE_URL:</Text>
              <Text size="sm" fw={600}>{base}</Text>
            </Group>
            <Group gap={6}>
              <Text size="sm" c="dimmed">Using WEBSITE_NAME:</Text>
              <Text size="sm" fw={600}>{nameForHeading}</Text>
            </Group>
          </Stack>
        </Card>

        <Card withBorder>
          <Stack>
            <Title order={4} m={0}>HTML form</Title>
            <Text c="dimmed">Copy and paste this HTML form into your website. Submissions post to this app's API.</Text>
            <Card withBorder>
              <Group justify="flex-end" mb="xs">
                <Button size="xs" variant="light" onClick={copySnippet}>Copy</Button>
              </Group>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{snippet}</pre>
            </Card>
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

