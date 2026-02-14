"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Badge, ActionIcon, Menu, Modal, TextInput, CopyButton } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { IconFileText } from '@tabler/icons-react';
import { RouteTabs } from '@/components/RouteTabs';
import { useEffect, useMemo, useState } from 'react';
import { listenBlogsArchived, archiveBlog, softRemoveBlog, type BlogDoc } from '@/lib/firebase/blogs';
import { useRouter } from 'next/navigation';

export default function WebsiteBlogsArchivePage() {
  const router = useRouter();
  const toast = useToast();
  const [archived, setArchived] = useState<(BlogDoc & { id: string })[]>([]);
  const [target, setTarget] = useState<(BlogDoc & { id: string }) | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeInput, setRemoveInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const unsub = listenBlogsArchived(setArchived);
    return () => unsub();
  }, []);
  const total = archived.length;
  const publishedCount = archived.filter((b) => b.published).length;
  const draftsCount = archived.length - publishedCount;

  const openEdit = (row: BlogDoc & { id: string }) => router.push(`/employee/website/blogs/new?edit=${encodeURIComponent(row.id)}`);

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
          value={'archives'}
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
              {
                key: 'actions', header: '', width: 1,
                render: (r) => (
                  <Group justify="flex-end">
                    <Menu shadow="md" width={220}>
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
                        <Menu.Item color="red" onClick={() => { setTarget(r); setRemoveInput(''); setConfirmRemove(true); }}>Remove</Menu.Item>
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
                initialSort={{ field: 'updatedAt', direction: 'desc' }}
                clientFilter={(r: any) => !!r.isArchived}
                defaultPageSize={25}
                enableSelection={false}
                refreshKey={refreshKey}
              />
            );
          })()}
        </Card>
        {/* Inline edit modal removed; use dedicated edit page */}

        <Modal opened={confirmRestore} onClose={() => setConfirmRestore(false)} title="Restore post" centered>
          <Stack>
            <Text>Restore this post back to Active?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmRestore(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await archiveBlog(target.id, false);
                setConfirmRestore(false); setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Post restored', message: target.title, color: 'green' });
              }}>Restore</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={confirmRemove} onClose={() => setConfirmRemove(false)} title="Remove post" centered>
          <Stack>
            <Text>This will move the post to Removed. You can permanently delete it from there.</Text>
            <Text c="dimmed">To confirm, type the full post title.</Text>
            <Group align="end" gap="sm">
              <TextInput label="Post title" value={target?.title || ''} readOnly style={{ flex: 1 }} />
              <CopyButton value={target?.title || ''}>{({ copied, copy }) => (
                <Button variant="light" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
              )}</CopyButton>
            </Group>
            <TextInput label="Type here to confirm" placeholder="Paste or type post title" value={removeInput} onChange={(e) => setRemoveInput(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmRemove(false)}>Cancel</Button>
              <Button color="red" onClick={async () => {
                if (!target) return;
                await softRemoveBlog(target.id);
                setConfirmRemove(false); setTarget(null); setRemoveInput('');
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Post moved to removed', message: target.title, color: 'orange' });
              }} disabled={!target?.title || removeInput !== (target?.title || '')}>Remove</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
