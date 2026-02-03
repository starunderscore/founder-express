"use client";
import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, Title, Text, Stack, Anchor, Group, Badge } from '@mantine/core';
import Link from 'next/link';
import { listenBlogBySlug, type BlogDoc } from '@/lib/firebase/blogs';

export default function PublicBlogPostPage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [post, setPost] = useState<(BlogDoc & { id: string }) | null>(null);
  useEffect(() => {
    if (!slug) return;
    const unsub = listenBlogBySlug(slug, setPost);
    return () => unsub();
  }, [slug]);

  if (!post) return notFound();

  const isHtmlLike = /<[^>]+>/.test(post.content || '');
  const content = post.content || '';

  return (
    <main style={{ padding: '0 1.5rem 3rem 1.5rem' }}>
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
