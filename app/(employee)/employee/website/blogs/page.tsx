"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Table, Modal, TextInput, Textarea, Switch, ActionIcon, Menu } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listenBlogsActive, createBlog, updateBlog as fbUpdateBlog, archiveBlog, softRemoveBlog, type BlogDoc } from '@/lib/firebase/blogs';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function WebsiteBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<(BlogDoc & { id: string })[]>([]);
  useEffect(() => {
    const unsub = listenBlogsActive(setBlogs);
    return () => unsub();
  }, []);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);

  const activeBlogs = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived), [blogs]);
  const total = activeBlogs.length;
  const publishedCount = useMemo(() => activeBlogs.filter((b) => b.published).length, [activeBlogs]);
  const draftsCount = total - publishedCount;

  const openCreate = () => {
    setMode('create');
    setEditId('');
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setPublished(false);
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const b = blogs.find((x) => x.id === id);
    if (!b) return;
    setMode('edit');
    setEditId(id);
    setTitle(b.title);
    setSlug(b.slug);
    setExcerpt(b.excerpt || '');
    setContent(b.content);
    setPublished(b.published);
    setOpen(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const s = (slug || slugify(cleanTitle)).slice(0, 80);
    if (mode === 'create') {
      createBlog({ title: cleanTitle, slug: s, excerpt: excerpt.trim() || undefined, content, published });
    } else {
      fbUpdateBlog(editId, { title: cleanTitle, slug: s, excerpt: excerpt.trim() || undefined, content, published });
    }
    setOpen(false);
  };

  return (
    <EmployerAuthGate>
      <Stack>
        <Group justify="space-between" align="center">
          <Group>
            <ActionIcon variant="subtle" size="lg" aria-label="Back" onClick={() => router.push('/employee/website')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
              </svg>
            </ActionIcon>
            <div>
              <Title order={2} mb={4}>Blogs</Title>
              <Text c="dimmed">Create and manage blog posts displayed on your site.</Text>
            </div>
          </Group>
        </Group>

        <RouteTabs
          value={'all'}
          mb="md"
          tabs={[
            { value: 'all', label: 'Blogs', href: '/employee/website/blogs' },
            { value: 'drafts', label: 'Drafts', href: '/employee/website/blogs/drafts' },
            { value: 'archive', label: 'Archive', href: '/employee/website/blogs/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/website/blogs/removed' },
          ]}
        />

        <Group justify="flex-end" mb="sm">
          <Button onClick={() => router.push('/employee/website/blogs/new')}>New post</Button>
        </Group>

        <Card withBorder>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Slug</Table.Th>
                <Table.Th>Published</Table.Th>
                <Table.Th>Updated</Table.Th>
                <Table.Th style={{ width: 1 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {activeBlogs.map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>
                    <Text fw={600}>{b.title}</Text>
                    {b.excerpt && <Text size="sm" c="dimmed" lineClamp={1}>{b.excerpt}</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">/{b.slug}</Text></Table.Td>
                  <Table.Td>
                    <Switch checked={b.published} onChange={(e) => fbUpdateBlog(b.id, { published: e.currentTarget.checked })} />
                  </Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{new Date(b.updatedAt).toLocaleString()}</Text></Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => openEdit(b.id)}>Edit</Menu.Item>
                        <Menu.Item onClick={() => archiveBlog(b.id, true)}>Archive</Menu.Item>
                        <Menu.Item color="red" onClick={() => softRemoveBlog(b.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {activeBlogs.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}><Text c="dimmed">No posts yet</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Modal opened={open} onClose={() => setOpen(false)} title={mode === 'create' ? 'New post' : 'Edit post'} size="lg" centered>
          <form onSubmit={onSubmit}>
            <Stack>
              <TextInput label="Title" placeholder="Post title" value={title} onChange={(e) => { setTitle(e.currentTarget.value); if (!slug) setSlug(slugify(e.currentTarget.value)); }} required />
              <TextInput label="Slug" description="URL segment" leftSection={<span style={{ color: 'var(--mantine-color-dimmed)' }}>/</span>} value={slug} onChange={(e) => setSlug(slugify(e.currentTarget.value))} />
              <TextInput label="Excerpt" placeholder="Short summary (optional)" value={excerpt} onChange={(e) => setExcerpt(e.currentTarget.value)} />
              <Textarea label="Content" minRows={8} placeholder="Write your post content..." value={content} onChange={(e) => setContent(e.currentTarget.value)} />
              <Group justify="space-between" align="center">
                <Switch label="Published" checked={published} onChange={(e) => setPublished(e.currentTarget.checked)} />
                <Group>
                  <Button variant="default" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">{mode === 'create' ? 'Create' : 'Save'}</Button>
                </Group>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
