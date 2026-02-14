"use client";
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { Title, Text, Card, Stack, Group, Button, Badge, ActionIcon, Menu, Modal, TextInput, CopyButton } from '@mantine/core';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import FirestoreDataTable, { type Column } from '@/components/data-table/FirestoreDataTable';
import { IconFileText } from '@tabler/icons-react';
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
  const toast = useToast();
  const blogs = useWebsiteStore((s) => s.blogs);
  const updateBlog = useWebsiteStore((s) => s.updateBlog);
  const removeBlog = useWebsiteStore((s) => s.removeBlog);
  const setBlogArchived = useWebsiteStore((s) => s.setBlogArchived);

  const activeDrafts = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived && !b.published), [blogs]);
  const total = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived).length, [blogs]);
  const publishedCount = useMemo(() => blogs.filter((b) => !b.deletedAt && !b.isArchived && b.published).length, [blogs]);
  const draftsCount = total - publishedCount;

  const openEdit = (id: string) => router.push(`/employee/website/blogs/new?edit=${encodeURIComponent(id)}`);
  const [target, setTarget] = useState<({ id: string } & import('@/lib/firebase/blogs').BlogDoc) | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeInput, setRemoveInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
          value={'drafts'}
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
                <Link href={`/employee/website/blogs/new?edit=${encodeURIComponent(r.id)}`} style={{ textDecoration: 'none' }}>
                  {r.title || '—'}
                </Link>
              ) },
              { key: 'slug', header: 'Slug', render: (r) => (<Text size="sm">/{r.slug}</Text>) },
              { key: 'published', header: 'Published', render: (r) => (
                <Badge variant="light" color={r.published ? 'green' : 'gray'}>{r.published ? 'Yes' : 'No'}</Badge>
              ) },
              {
                key: 'actions', header: '', width: 1,
                render: (r) => (
                  <Group justify="flex-end">
                    <Menu shadow="md" width={160}>
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
                        <Menu.Item onClick={() => openEdit(r.id)}>Edit</Menu.Item>
                        <Menu.Item onClick={() => { setTarget(r as any); setConfirmPublish(true); }}>Publish</Menu.Item>
                        <Menu.Item onClick={() => { setTarget(r as any); setConfirmArchive(true); }}>Archive</Menu.Item>
                        <Menu.Item color="red" onClick={() => { setTarget(r as any); setRemoveInput(''); setConfirmRemove(true); }}>Remove</Menu.Item>
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
                clientFilter={(r: any) => !r.deletedAt && !r.isArchived && !r.published}
                defaultPageSize={25}
                enableSelection={false}
                refreshKey={refreshKey}
              />
            );
          })()}
        </Card>

        {/* Publish confirm modal */}
        <Modal opened={confirmPublish} onClose={() => setConfirmPublish(false)} title="Publish draft" centered>
          <Stack>
            <Text>Publish this draft so it becomes publicly visible?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmPublish(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await import('@/lib/firebase/blogs').then(m => m.updateBlog(target.id, { published: true }));
                setConfirmPublish(false); setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Post published', message: target.title, color: 'green' });
              }}>Publish</Button>
            </Group>
          </Stack>
        </Modal>

        {/* Archive modal (reuse pattern from Active) */}
        <Modal opened={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive post" centered>
          <Stack>
            <Text>Archive this post? It will move to Archives and can be restored later.</Text>
            <Text c="dimmed">Post: {target?.title || '—'}</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirmArchive(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!target) return;
                await import('@/lib/firebase/blogs').then(m => m.archiveBlog(target.id, true));
                setConfirmArchive(false); setTarget(null);
                setRefreshKey((k) => k + 1);
                toast.show({ title: 'Post archived', message: target.title, color: 'green' });
              }}>Archive</Button>
            </Group>
          </Stack>
        </Modal>

        {/* Remove modal (type-to-confirm) */}
        <Modal opened={confirmRemove} onClose={() => setConfirmRemove(false)} title="Remove post" centered>
          <Stack>
            <Text>This will move the post to Removed. You can restore it later or permanently delete from there.</Text>
            <Text c="dimmed">To confirm removal, type the full post title.</Text>
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
                await import('@/lib/firebase/blogs').then(m => m.softRemoveBlog(target.id));
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
