"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerAuthGate } from '@/components/EmployerAuthGate';
import { useWebsiteStore } from '@/state/websiteStore';
import { Title, Text, Card, Stack, Group, Button, TextInput, Badge, ActionIcon, Tooltip, Divider, Popover, Modal } from '@mantine/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconList,
  IconListNumbers,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconLink,
  IconClearFormatting,
  IconArrowBackUp,
  IconArrowForwardUp,
} from '@tabler/icons-react';

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

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Write your blog content...' }),
      LinkExt.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    immediatelyRender: false,
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSaveDraft = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setError('Title is required'); return; }
    const s = (slug || slugify(cleanTitle)).slice(0, 80);
    const content = editor?.getHTML() || '';
    addBlog({ title: cleanTitle, slug: s, excerpt: excerpt.trim() || undefined, content, published: false });
    router.push('/employee/website/blogs');
  };

  const onPublish = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setError('Title is required'); return; }
    const s = (slug || slugify(cleanTitle)).slice(0, 80);
    const content = editor?.getHTML() || '';
    addBlog({ title: cleanTitle, slug: s, excerpt: excerpt.trim() || undefined, content, published: true });
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
                <Badge variant="light">Draft until published</Badge>
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

            <Card withBorder>
              <Stack gap={8}>
                <Group justify="space-between" align="center" wrap="wrap">
                  <Group gap={4} wrap="nowrap">
                    <Tooltip label="Bold"><ActionIcon variant={editor?.isActive('bold') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}><IconBold size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Italic"><ActionIcon variant={editor?.isActive('italic') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}><IconItalic size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Underline"><ActionIcon variant={editor?.isActive('underline') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); }}><IconUnderline size={16} /></ActionIcon></Tooltip>
                    <Divider orientation="vertical" />
                    <Tooltip label="Bulleted list"><ActionIcon variant={editor?.isActive('bulletList') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}><IconList size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Numbered list"><ActionIcon variant={editor?.isActive('orderedList') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}><IconListNumbers size={16} /></ActionIcon></Tooltip>
                    <Divider orientation="vertical" />
                    <Tooltip label="Align left"><ActionIcon variant={editor?.isActive({ textAlign: 'left' }) ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('left').run(); }}><IconAlignLeft size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Align center"><ActionIcon variant={editor?.isActive({ textAlign: 'center' }) ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('center').run(); }}><IconAlignCenter size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Align right"><ActionIcon variant={editor?.isActive({ textAlign: 'right' }) ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); editor?.chain().focus().setTextAlign('right').run(); }}><IconAlignRight size={16} /></ActionIcon></Tooltip>
                    <Divider orientation="vertical" />
                    <Popover opened={linkOpen} onChange={setLinkOpen} width={300} position="bottom-start" withArrow>
                      <Popover.Target>
                        <Tooltip label="Insert link"><ActionIcon variant={editor?.isActive('link') ? 'filled' : 'light'} onClick={(e) => { e.preventDefault(); setLinkOpen((o) => !o); }}><IconLink size={16} /></ActionIcon></Tooltip>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <Stack gap={8}>
                          <TextInput placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.currentTarget.value)} />
                          <Group justify="flex-end">
                            <Button size="xs" variant="default" onClick={() => { setLinkOpen(false); setLinkUrl(''); }}>Cancel</Button>
                            <Button size="xs" onClick={() => { if (!editor) return; if (linkUrl) { editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run(); } else { editor.chain().focus().unsetLink().run(); } setLinkOpen(false); setLinkUrl(''); }}>Apply</Button>
                          </Group>
                        </Stack>
                      </Popover.Dropdown>
                    </Popover>
                    <Tooltip label="Clear formatting"><ActionIcon variant="light" color="gray" onClick={(e) => { e.preventDefault(); editor?.chain().focus().unsetAllMarks().clearNodes().run(); }}><IconClearFormatting size={16} /></ActionIcon></Tooltip>
                    <Divider orientation="vertical" />
                    <Tooltip label="Undo"><ActionIcon variant="light" onClick={(e) => { e.preventDefault(); editor?.chain().focus().undo().run(); }}><IconArrowBackUp size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Redo"><ActionIcon variant="light" onClick={(e) => { e.preventDefault(); editor?.chain().focus().redo().run(); }}><IconArrowForwardUp size={16} /></ActionIcon></Tooltip>
                  </Group>
                </Group>
                <div style={{ minHeight: 260, padding: 12, border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
                  <EditorContent editor={editor} />
                </div>
              </Stack>
            </Card>
            <Text size="sm" c="dimmed">Tip: Use headings and lists to structure your post. You can also paste formatted content.</Text>
            {error && <Text c="red" size="sm">{error}</Text>}
          </Stack>
        </Card>

        <Modal opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview post" size="lg" centered>
          <Stack>
            <Text><Text span fw={600}>Title:</Text> {title || '(no title)'}</Text>
            <Text size="sm" c="dimmed">URL: /{slug || slugify(title || 'post')}</Text>
            <Card withBorder>
              <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
            </Card>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setPreviewOpen(false)}>Close</Button>
              <Button onClick={onPublish}>Publish</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </EmployerAuthGate>
  );
}
