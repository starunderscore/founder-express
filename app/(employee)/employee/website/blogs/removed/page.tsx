"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Table, Badge, ActionIcon, Menu } from '@mantine/core';
import { RouteTabs } from '@/components/RouteTabs';
import { useWebsiteStore } from '@/state/websiteStore';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function WebsiteBlogsRemovedPage() {
  const router = useRouter();
  const blogs = useWebsiteStore((s) => s.blogs);
  const restoreBlog = useWebsiteStore((s) => s.restoreBlog);
  const hardDeleteBlog = useWebsiteStore((s) => s.hardDeleteBlog);

  const removed = useMemo(() => blogs.filter((b) => !!b.deletedAt), [blogs]);
  const total = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived).length, [blogs]);
  const publishedCount = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived && b.published).length, [blogs]);
  const draftsCount = total - publishedCount;

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
          value={'removed'}
          mb="md"
          tabs={[
            { value: 'all', label: 'Blogs', href: '/employee/website/blogs' },
            { value: 'drafts', label: 'Drafts', href: '/employee/website/blogs/drafts' },
            { value: 'archive', label: 'Archive', href: '/employee/website/blogs/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/website/blogs/removed' },
          ]}
        />

        <Card withBorder>
          <div style={{ padding: '12px 16px' }}>
            <Text c="dimmed" size="sm">Restore or permanently delete blog posts.</Text>
          </div>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Slug</Table.Th>
                <Table.Th>Removed</Table.Th>
                <Table.Th style={{ width: 1 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {removed.map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>
                    <Text fw={600}>{b.title}</Text>
                    {b.excerpt && <Text size="sm" c="dimmed" lineClamp={1}>{b.excerpt}</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">/{b.slug}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{b.deletedAt ? new Date(b.deletedAt).toLocaleString() : '—'}</Text></Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => restoreBlog(b.id)}>Restore</Menu.Item>
                        <Menu.Item color="red" onClick={() => hardDeleteBlog(b.id)}>Delete permanently</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {removed.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed">No removed posts</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
