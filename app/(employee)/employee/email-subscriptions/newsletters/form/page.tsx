"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, ActionIcon, Tabs } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EmployerEmailNewslettersFormPage() {
  const router = useRouter();

  const CodeSnippet = () => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.example';
    const action = `${base}/api/newsletter/subscribe`;
    const snippet = `<!-- Newsletter signup form -->\n<form action="${action}" method="POST">\n  <label>\n    Email\n    <input type=\"email\" name=\"email\" required />\n  </label>\n  <label>\n    Name (optional)\n    <input type=\"text\" name=\"name\" />\n  </label>\n  <!-- Optional: categorize where this submission came from -->\n  <input type=\"hidden\" name=\"list\" value=\"newsletter\" />\n  <button type=\"submit\">Subscribe</button>\n</form>`;
    const copy = async () => { try { await navigator.clipboard.writeText(snippet); } catch {} };
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
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/email-subscriptions/newsletters')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <Group gap="xs" align="center">
              <IconMail size={20} />
              <div>
                <Title order={2} mb={4}>Copy & paste form</Title>
                <Text c="dimmed">Embed this HTML newsletter signup form on your website.</Text>
              </div>
            </Group>
          </Group>
          <Group gap="xs">
            <Button variant="light" component={Link as any} href="/employee/email-subscriptions/newsletters/new">New newsletter</Button>
          </Group>
        </Group>

        <Tabs value={'form'} mb="md">
          <Tabs.List>
            <Tabs.Tab value="sent"><Link href="/employee/email-subscriptions/newsletters">Emails sent</Link></Tabs.Tab>
            <Tabs.Tab value="drafts"><Link href="/employee/email-subscriptions/newsletters/drafts">Email drafts</Link></Tabs.Tab>
            <Tabs.Tab value="form"><Link href="/employee/email-subscriptions/newsletters/form">Copy & paste form</Link></Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Card withBorder>
          <Stack>
            <Text c="dimmed">Copy and paste this HTML form into your website. Submissions post to this app's API.</Text>
            <CodeSnippet />
          </Stack>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
