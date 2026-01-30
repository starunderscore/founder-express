"use client";
import { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, Title, Text, Stack, Anchor, Group, Badge } from '@mantine/core';
import Link from 'next/link';
import { useWebsiteStore } from '@/state/websiteStore';
import { Newsbar } from '@/components/Newsbar';

export default function PublicBlogPostPage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const blogs = useWebsiteStore((s) => s.blogs);

  const post = useMemo(
    () => blogs.find((b) => !b.deletedAt && !b.isArchived && b.published && b.slug === slug),
    [blogs, slug]
  );

  if (!post) return notFound();

  const isHtmlLike = /<[^>]+>/.test(post.content || '');
  const content = post.content || '';

  return (
    <main style={{ padding: '0 1.5rem 3rem 1.5rem' }}>
      <Newsbar />
      <div style={{ maxWidth: 960, margin: '24px auto 0 auto' }}>
        <Stack>
          <Anchor component={Link as any} href="/blogs" underline="hover">← Back to blog</Anchor>
          <Title order={1} style={{ lineHeight: 1.05 }}>{post.title}</Title>
          <Group gap={8}>
            <Badge variant="light" color="gray">{new Date(post.updatedAt).toLocaleDateString()}</Badge>
          </Group>
          <Card withBorder>
            {isHtmlLike ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
            )}
          </Card>
        </Stack>
      </div>
    </main>
  );
}
