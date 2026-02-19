"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Group, Stack, Badge, Button } from '@mantine/core';
import { IconGlobe, IconBell, IconFileText } from '@tabler/icons-react';
import { listenNewsbar } from '@/services/website/newsbar';
import { useEffect, useState } from 'react';

export default function EmployerWebsitePage() {
  const [enabled, setEnabled] = useState(false);
  const [primaryHtml, setPrimaryHtml] = useState('');
  useEffect(() => {
    const unsub = listenNewsbar((doc) => {
      setEnabled(!!doc?.enabled);
      setPrimaryHtml(doc?.primaryHtml || '');
    });
    return () => unsub();
  }, []);
  const preview = enabled ? stripHtml(primaryHtml || '') : '';

  return (
    <EmployerAuthGate>
      <Group gap="xs" align="center" mb="md">
        <IconGlobe size={20} />
        <div>
          <Title order={2} mb={4}>Website</Title>
          <Text c="dimmed">Configure key website modules.</Text>
        </div>
      </Group>

      <Stack>
        <Card withBorder padding="md">
          <Group justify="space-between" align="center">
            <div>
              <Group gap={8} align="center">
                <IconBell size={18} />
                <Title order={4} style={{ lineHeight: 1 }}>News Bar</Title>
                <Badge variant="light" color={enabled ? 'green' : 'gray'}>{enabled ? 'On' : 'Off'}</Badge>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>
                {preview ? `“${preview}”` : 'Configure a primary and secondary line shown at the top of your site.'}
              </Text>
            </div>
            <Button component={Link} href="/employee/website/newsbar" variant="light">Configure</Button>
          </Group>
        </Card>

        <Card withBorder padding="md">
          <Group justify="space-between" align="center">
            <div>
              <Group gap={8} align="center">
                <IconFileText size={18} />
                <Title order={4} style={{ lineHeight: 1 }}>Blogs</Title>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>
                Create and manage blog posts displayed on your website.
              </Text>
            </div>
            <Button component={Link} href="/employee/website/blogs" variant="light">Open</Button>
          </Group>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}

function stripHtml(html: string): string {
  if (!html) return '';
  const div = typeof window !== 'undefined' ? document.createElement('div') : null;
  if (!div) return html;
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}
