"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Table, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { RouteTabs } from '@/components/RouteTabs';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listenBlogsRemoved, restoreBlog, hardDeleteBlog, type BlogDoc } from '@/lib/firebase/blogs';

export default function WebsiteBlogsRemovedPage() {
  const router = useRouter();
  const [removed, setRemoved] = useState<(BlogDoc & { id: string })[]>([]);
  useEffect(() => {
    const unsub = listenBlogsRemoved(setRemoved);
    return () => unsub();
  }, []);
  const total = removed.length;
  const publishedCount = removed.filter((b) => b.published).length;
  const draftsCount = removed.length - publishedCount;

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
            <Group gap="xs" align="center">
              <IconFileText size={20} />
              <div>
                <Title order={2} mb={4}>Blogs</Title>
                <Text c="dimmed">Create and manage blog posts displayed on your site.</Text>
              </div>
            </Group>
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
