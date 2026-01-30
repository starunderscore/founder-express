"use client";
import { Card, Title, Text, Stack, Group, Anchor, Badge } from '@mantine/core';
import Link from 'next/link';
import { useWebsiteStore } from '@/state/websiteStore';
import { useMemo } from 'react';
import { Newsbar } from '@/components/Newsbar';

export default function PublicBlogsPage() {
  const blogs = useWebsiteStore((s) => s.blogs);
  const published = useMemo(
    () => blogs
      .filter((b) => !b.deletedAt && !b.isArchived && b.published)
      .sort((a, b) => b.updatedAt - a.updatedAt),
    [blogs]
  );

  return (
    <main style={{ padding: '0 1.5rem 3rem 1.5rem' }}>
      <Newsbar />
      <div style={{ maxWidth: 960, margin: '24px auto 0 auto' }}>
        <Title order={2} mb="sm">Blog</Title>
        <Text c="dimmed" mb="md">Latest updates and stories.</Text>

        {published.length === 0 && (
          <Card withBorder>
            <Text c="dimmed">No posts published yet.</Text>
          </Card>
        )}

        <Stack>
          {published.map((b) => (
            <Card key={b.id} withBorder>
              <Stack gap={6}>
                <Group justify="space-between" align="center">
                  <Anchor component={Link as any} href={`/blog/${b.slug}`} underline="hover">
                    <Title order={3} style={{ lineHeight: 1.15 }}>{b.title}</Title>
                  </Anchor>
                  <Badge variant="light" color="gray">{new Date(b.updatedAt).toLocaleDateString()}</Badge>
                </Group>
                {b.excerpt && <Text c="dimmed">{b.excerpt}</Text>}
                {!b.excerpt && b.content && (
                  <Text c="dimmed" lineClamp={2}>{stripHtml(b.content)}</Text>
                )}
                <Anchor component={Link as any} href={`/blog/${b.slug}`} underline="hover">Read more →</Anchor>
              </Stack>
            </Card>
          ))}
        </Stack>
      </div>
    </main>
  );
}

function stripHtml(html: string): string {
  if (!html) return '';
  const div = typeof window !== 'undefined' ? document.createElement('div') : null;
  if (!div) return html;
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}
