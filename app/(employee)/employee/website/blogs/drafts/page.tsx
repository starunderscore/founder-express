"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Table, TextInput, Textarea, Switch, Badge, ActionIcon, Menu, Modal } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { useWebsiteStore } from '@/state/websiteStore';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function WebsiteBlogsDraftsPage() {
  const router = useRouter();
  const blogs = useWebsiteStore((s) => s.blogs);
  const updateBlog = useWebsiteStore((s) => s.updateBlog);
  const removeBlog = useWebsiteStore((s) => s.removeBlog);
  const setBlogArchived = useWebsiteStore((s) => s.setBlogArchived);

  const activeDrafts = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived && !b.published), [blogs]);
  const total = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived).length, [blogs]);
  const publishedCount = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived && b.published).length, [blogs]);
  const draftsCount = total - publishedCount;

  // Inline editor modal (optional quick edit)
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');

  const openEdit = (id: string) => {
    const b = blogs.find((x) => x.id === id);
    if (!b) return;
    setEditId(id);
    setTitle(b.title);
    setSlug(b.slug);
    setExcerpt(b.excerpt || '');
    setContent(b.content);
    setOpen(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const s = (slug || slugify(cleanTitle)).slice(0, 80);
    updateBlog(editId, { title: cleanTitle, slug: s, excerpt: excerpt.trim() || undefined, content });
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
          <Group gap={8}>
            <Badge variant="light" color="blue">Total: {total}</Badge>
            <Badge variant="light" color="green">Published: {publishedCount}</Badge>
            <Badge variant="light" color="gray">Drafts: {draftsCount}</Badge>
            <Button onClick={() => router.push('/employee/website/blogs/new')}>New post</Button>
          </Group>
        </Group>

        <RouteTabs
          value={'drafts'}
          mb="md"
          tabs={[
            { value: 'all', label: 'Blogs', href: '/employee/website/blogs' },
            { value: 'drafts', label: 'Drafts', href: '/employee/website/blogs/drafts' },
            { value: 'archive', label: 'Archive', href: '/employee/website/blogs/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/website/blogs/removed' },
          ]}
        />

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
              {activeDrafts.map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>
                    <Text fw={600}>{b.title}</Text>
                    {b.excerpt && <Text size="sm" c="dimmed" lineClamp={1}>{b.excerpt}</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">/{b.slug}</Text></Table.Td>
                  <Table.Td>
                    <Switch checked={b.published} onChange={(e) => updateBlog(b.id, { published: e.currentTarget.checked })} />
                  </Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{new Date(b.updatedAt).toLocaleString()}</Text></Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => openEdit(b.id)}>Edit</Menu.Item>
                        <Menu.Item onClick={() => setBlogArchived(b.id, true)}>Archive</Menu.Item>
                        <Menu.Item color="red" onClick={() => removeBlog(b.id)}>Remove</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {activeDrafts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}><Text c="dimmed">No drafts</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Modal opened={open} onClose={() => setOpen(false)} title={'Edit draft'} size="lg" centered>
          <form onSubmit={onSubmit}>
            <Stack>
              <TextInput label="Title" placeholder="Post title" value={title} onChange={(e) => { setTitle(e.currentTarget.value); if (!slug) setSlug(slugify(e.currentTarget.value)); }} required />
              <TextInput label="Slug" description="URL segment" leftSection={<span style={{ color: 'var(--mantine-color-dimmed)' }}>/</span>} value={slug} onChange={(e) => setSlug(slugify(e.currentTarget.value))} />
              <TextInput label="Excerpt" placeholder="Short summary (optional)" value={excerpt} onChange={(e) => setExcerpt(e.currentTarget.value)} />
              <Textarea label="Content" minRows={8} placeholder="Write your post content..." value={content} onChange={(e) => setContent(e.currentTarget.value)} />
              <Group justify="flex-end">
                <Button variant="default" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
