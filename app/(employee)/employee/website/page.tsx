"use client";
import Link from 'next/link';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Group, Stack, Badge, Button } from '@mantine/core';
import { useWebsiteStore } from '@/state/websiteStore';

export default function EmployerWebsitePage() {
  const newsbar = useWebsiteStore((s) => s.newsbar);

  return (
    <EmployerAuthGate>
      <Title order={2} mb="sm">Website</Title>
      <Text c="dimmed" mb="md">Configure key website modules.</Text>

      <Stack>
        <Card withBorder padding="md">
          <Group justify="space-between" align="center">
            <div>
              <Group gap={8} align="center">
                <Title order={4} style={{ lineHeight: 1 }}>News Bar</Title>
                <Badge variant="light" color={newsbar.enabled ? 'green' : 'gray'}>{newsbar.enabled ? 'On' : 'Off'}</Badge>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>
                {newsbar.headline ? `“${newsbar.headline}”` : 'Set a headline and link shown in your site header.'}
              </Text>
            </div>
            <Button component={Link} href="/employee/website/newsbar" variant="light">Configure</Button>
          </Group>
        </Card>

        <Card withBorder padding="md">
          <Group justify="space-between" align="center">
            <div>
              <Title order={4} style={{ lineHeight: 1 }}>Blogs</Title>
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
