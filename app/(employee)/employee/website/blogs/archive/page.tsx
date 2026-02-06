"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Table, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { RouteTabs } from '@/components/RouteTabs';
import { useEffect, useMemo, useState } from 'react';
import { listenBlogsArchived, archiveBlog, softRemoveBlog, type BlogDoc } from '@/lib/firebase/blogs';
import { useRouter } from 'next/navigation';

export default function WebsiteBlogsArchivePage() {
  const router = useRouter();
  const [archived, setArchived] = useState<(BlogDoc & { id: string })[]>([]);
  useEffect(() => {
    const unsub = listenBlogsArchived(setArchived);
    return () => unsub();
  }, []);
  const total = archived.length;
  const publishedCount = archived.filter((b) => b.published).length;
  const draftsCount = archived.length - publishedCount;

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
          value={'archive'}
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
            <Text c="dimmed" size="sm">Restore archived posts back to Blogs.</Text>
          </div>
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Slug</Table.Th>
                <Table.Th>Updated</Table.Th>
                <Table.Th style={{ width: 1 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {archived.map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>
                    <Text fw={600}>{b.title}</Text>
                    {b.excerpt && <Text size="sm" c="dimmed" lineClamp={1}>{b.excerpt}</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">/{b.slug}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{new Date(b.updatedAt).toLocaleString()}</Text></Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={220}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">⋮</ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => archiveBlog(b.id, false)}>Restore to Blogs</Menu.Item>
                        <Menu.Item color="red" onClick={() => softRemoveBlog(b.id)}>Move to Removed</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {archived.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed">No archived posts</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </EmployerAuthGate>
  );
}
