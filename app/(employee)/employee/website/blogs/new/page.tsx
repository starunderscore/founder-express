"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useWebsiteStore } from '@/state/websiteStore';
import { Title, Text, Card, Stack, Group, Button, TextInput, ActionIcon, Modal } from '@mantine/core';
import { useAppSettingsStore } from '@/state/appSettingsStore';
import { WebContentEditor } from '@/components/WebContentEditor';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const addBlog = useWebsiteStore((s) => s.addBlog);
  const websiteUrl = useAppSettingsStore((s) => s.settings.websiteUrl || '');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [html, setHtml] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSaveDraft = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setError('Title is required'); return; }
    const s = (slug || slugify(cleanTitle)).slice(0, 80);
    addBlog({ title: cleanTitle, slug: s, excerpt: excerpt.trim() || undefined, content: html, published: false });
    router.push('/employee/website/blogs');
  };

  const onPublish = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setError('Title is required'); return; }
    const s = (slug || slugify(cleanTitle)).slice(0, 80);
    addBlog({ title: cleanTitle, slug: s, excerpt: excerpt.trim() || undefined, content: html, published: true });
    router.push('/employee/website/blogs');
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/website/blogs')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2}>New blog post</Title>
              <Group gap={8} mt={4}>
                <Text c="dimmed">Write and publish a blog post</Text>
              </Group>
            </div>
          </Group>
          <Group gap="xs">
            <Button variant="light" onClick={onSaveDraft}>Save draft</Button>
            <Button variant="light" onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button onClick={onPublish}>Publish</Button>
          </Group>
        </Group>

        <Card withBorder>
          <Stack>
            <TextInput label="Title" placeholder="Post title" value={title} onChange={(e) => { setTitle(e.currentTarget.value); if (!slug) setSlug(slugify(e.currentTarget.value)); }} required autoFocus />
            <TextInput label="Slug" description="URL segment" leftSection={<span style={{ color: 'var(--mantine-color-dimmed)' }}>/</span>} value={slug} onChange={(e) => setSlug(slugify(e.currentTarget.value))} />
            <TextInput label="Excerpt" placeholder="Short summary (optional)" value={excerpt} onChange={(e) => setExcerpt(e.currentTarget.value)} />

            <Stack gap={2}>
              <Text fw={500} size="sm">Post content</Text>
              <Card padding={0}>
                <WebContentEditor placeholder="Write your blog content…" onChangeHTML={setHtml} />
              </Card>
            </Stack>
            <Text size="sm" c="dimmed">Tip: Use headings and lists to structure your post. You can also paste formatted content.</Text>
            {error && <Text c="red" size="sm">{error}</Text>}
          </Stack>
        </Card>

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Website preview" size="90%" centered>
          <Stack gap={0}>
            {/* Fake browser chrome */}
            <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
              <div style={{
                border: '1px solid var(--mantine-color-gray-3)',
                background: 'var(--mantine-color-gray-0)',
                borderRadius: 0,
                padding: '8px 12px',
              }}>
                <Group gap={8} align="center">
                  {/* Left filler (simulated nav buttons/tab) */}
                  <Group gap={6} align="center" style={{ width: 64 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-gray-3)', display: 'inline-block' }} />
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-gray-3)', display: 'inline-block' }} />
                  </Group>
                  <div style={{ flex: 1, background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8, padding: '6px 10px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
                    {(function() {
                      let base = 'https://yourwebsite.com';
                      try { const u = new URL(websiteUrl); base = u.origin; } catch {}
                      const path = `/blog/${slug || slugify(title || 'post')}`;
                      return `${base}${path}`;
                    })()}
                  </div>
                  {/* Right side window controls */}
                  <Group gap={6} align="center" justify="flex-end" style={{ width: 64 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: '#ff5f56', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: '#ffbd2e', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: '#27c93f', display: 'inline-block' }} />
                  </Group>
                </Group>
              </div>
            </div>

            {/* Window frame (sides + bottom outline) wrapping the site preview */}
            <div style={{ maxWidth: 1000, margin: '0 auto', borderLeft: '1px solid var(--mantine-color-gray-3)', borderRight: '1px solid var(--mantine-color-gray-3)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
              {/* Fake site topbar */}
              <div style={{ width: '100%', background: 'var(--mantine-color-gray-0)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text fw={700}>Your Site</Text>
                  <Group gap={12}>
                    <Text c="dimmed" size="sm">Home</Text>
                    <Text c="dimmed" size="sm">Blog</Text>
                    <Text c="dimmed" size="sm">Contact</Text>
                  </Group>
                </div>
              </div>

              {/* Page content */}
              <div style={{ padding: 0 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                  <Title order={1} style={{ lineHeight: 1.05, paddingTop: 8, paddingLeft: 12 }}>{title || '(no title)'}</Title>
                  <Card withBorder mt="sm" style={{ borderRadius: 0 }}>
                    <div dangerouslySetInnerHTML={{ __html: html || '<em>No content</em>' }} />
                  </Card>
                </div>
              </div>
            </div>
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setPreviewOpen(false)}>Close</Button>
              <Button onClick={onPublish}>Publish</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
