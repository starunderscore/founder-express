"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Badge, ActionIcon, Menu, Modal, TextInput, CopyButton } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { IconFileText } from '@tabler/icons-react';
import { RouteTabs } from '@/components/RouteTabs';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listenBlogsRemoved, restoreBlog, hardDeleteBlog, type BlogDoc } from '@/lib/firebase/blogs';

export default function WebsiteBlogsRemovedPage() {
  const router = useRouter();
  const toast = useToast();
  const [removed, setRemoved] = useState<(BlogDoc & { id: string })[]>([]);
  const [target, setTarget] = useState<(BlogDoc & { id: string }) | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
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
          {/* Removed counts chips and New post button per request */}
        </Group>

        <RouteTabs
          value={'removed'}
          mb="md"
          tabs={[
            { value: 'active', label: 'Active', href: '/employee/website/blogs' },
            { value: 'drafts', label: 'Drafts', href: '/employee/website/blogs/drafts' },
            { value: 'archives', label: 'Archives', href: '/employee/website/blogs/archive' },
            { value: 'removed', label: 'Removed', href: '/employee/website/blogs/removed' },
          ]}
        />

        <Card withBorder>
          {(() => {
            type Row = import('@/lib/firebase/blogs').BlogDoc & { id: string };
            const columns: Column<Row>[] = [
              { key: 'title', header: 'Title', render: (r) => (
                <Link href={`/employee/website/blogs/new?edit=${encodeURIComponent((r as any).id)}`} style={{ textDecoration: 'none' }}>
                  {r.title || '—'}
                </Link>
              ) },
              { key: 'slug', header: 'Slug', render: (r) => (<Text size="sm">/{r.slug}</Text>) },
              { key: 'deletedAt', header: 'Removed', render: (r) => (<Text size="sm" c="dimmed">{r.deletedAt ? new Date(r.deletedAt).toLocaleString() : '—'}</Text>) },
              {
                key: 'actions', header: '', width: 1,
                render: (r) => (
                  <Group justify="flex-end">
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="More actions">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="5" cy="12" r="2" fill="currentColor"/>
                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            <circle cx="19" cy="12" r="2" fill="currentColor"/>
                          </svg>
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => { setTarget(r); setConfirmRestore(true); }}>Restore</Menu.Item>
                        <Menu.Item color="red" onClick={() => { setTarget(r); setDeleteInput(''); setConfirmDelete(true); }}>Delete permanently</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                )
              }
            ];
            return (
              <FirestoreDataTable
                collectionPath="blogs"
                columns={columns}
                initialSort={{ field: 'deletedAt', direction: 'desc' }}
                clientFilter={(r: any) => !!r.deletedAt}
                defaultPageSize={25}
                enableSelection={false}
                refreshKey={refreshKey}
              />
            );
          })()}
        </Card>

        <Modal opened={confirmRestore} onClose={() => setConfirmRestore(false)} title="Restore post" centered>
          <Stack>
            <Text>Restore this post back to Active?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmRestore(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await restoreBlog(target.id);
                setConfirmRestore(false); setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Post restored', message: target.title, color: 'green' });
              }}>Restore</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={confirmDelete} onClose={() => setConfirmDelete(false)} title="Permanently delete post" centered>
          <Stack>
            <Text color="red">This action permanently deletes the post and cannot be undone.</Text>
            <Text c="dimmed">To confirm, type the full post title.</Text>
            <Group align="end" gap="sm">
              <TextInput label="Post title" value={target?.title || ''} readOnly style={{ flex: 1 }} />
              <CopyButton value={target?.title || ''}>{({ copied, copy }) => (
                <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
              )}</CopyButton>
            </Group>
            <TextInput label="Type here to confirm" placeholder="Paste or type post title" value={deleteInput} onChange={(e) => setDeleteInput(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button color="red" onClick={async () => {
                if (!target) return;
                await hardDeleteBlog(target.id);
                setConfirmDelete(false); setTarget(null); setDeleteInput('');
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Post deleted', message: target.title, color: 'red' });
              }} disabled={!target?.title || deleteInput !== (target?.title || '')}>Delete permanently</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
