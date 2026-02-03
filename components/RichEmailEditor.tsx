"use client";
import { useState, useMemo, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Button, Group, Divider, Switch, Tooltip, Select, ActionIcon, Modal, TextInput, Stack, Text } from '@mantine/core';
import { IconBold, IconItalic, IconUnderline, IconList, IconListNumbers, IconAlignLeft, IconAlignCenter, IconAlignRight, IconLink, IconClearFormatting, IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { listenEmailVars, type EmailVar } from '@/lib/firebase/emailSettings';

type Props = {
  placeholder?: string;
  initialHTML?: string;
  onChangeHTML?: (html: string) => void;
  defaultShowLabels?: boolean;
};

export function RichEmailEditor({ placeholder = 'Write your message…', initialHTML = '', onChangeHTML, defaultShowLabels = true }: Props) {
  const [showLabels, setShowLabels] = useState<boolean>(defaultShowLabels);
  const [vars, setVars] = useState<EmailVar[]>([]);
  const [selectedVar, setSelectedVar] = useState<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [unlinkConfirmValue, setUnlinkConfirmValue] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder, emptyNodeClass: 'is-editor-empty' }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noreferrer' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: initialHTML,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'newsletter-editor' },
      handleClick: (_view, _pos, event) => {
        const e = event as any;
        const target = (e?.target as HTMLElement) || null;
        if (target && target.closest('a')) {
          // Always prevent navigation; allow caret placement only
          e?.preventDefault?.();
          return false;
        }
        return false;
      },
      handleDOMEvents: {
        mousedown: (_view: any, event: any) => {
          const target = (event?.target as HTMLElement) || null;
          if (target && target.closest('a')) {
            event?.preventDefault?.();
            return false;
          }
          return false;
        },
      },
    },
    onUpdate({ editor }) {
      onChangeHTML?.(editor.getHTML());
    },
  });

  // Update editor content when initialHTML changes (e.g., editing an existing template)
  useEffect(() => {
    if (!editor) return;
    if (typeof initialHTML === 'string' && editor.getHTML() !== initialHTML) {
      editor.commands.setContent(initialHTML, { emitUpdate: false } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialHTML]);

  useEffect(() => {
    const off = listenEmailVars(setVars);
    return () => off();
  }, []);

  // Re-render on selection/transaction so toolbar active states update
  useEffect(() => {
    if (!editor) return;
    const onSel = () => setRenderTick((t) => t + 1);
    editor.on('selectionUpdate', onSel);
    editor.on('transaction', onSel);
    return () => {
      editor.off('selectionUpdate', onSel);
      editor.off('transaction', onSel);
    };
  }, [editor]);

  const blockValue = useMemo(() => {
    if (!editor) return 'paragraph';
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    return 'paragraph';
  }, [editor, editor?.state]);

  const setBlock = (val: string | null) => {
    if (!editor) return;
    const v = val || 'paragraph';
    const chain = editor.chain().focus();
    if (v === 'paragraph') chain.setParagraph().run();
    else if (v === 'h1') chain.toggleHeading({ level: 1 }).run();
    else if (v === 'h2') chain.toggleHeading({ level: 2 }).run();
    else if (v === 'h3') chain.toggleHeading({ level: 3 }).run();
  };

  const openLinkModal = () => {
    if (!editor) return;
    try { editor.chain().focus().extendMarkRange('link').run(); } catch {}
    const attrs = editor.getAttributes('link');
    setLinkUrl((attrs?.href as string) || '');
    setLinkModalOpen(true);
  };

  const applyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkModalOpen(false);
  };

  const doUnlink = () => {
    if (!editor) return;
    if (unlinkConfirmValue !== (linkUrl || '')) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setUnlinkConfirmOpen(false);
    setLinkModalOpen(false);
  };

  return (
    <>
      <Group gap={6} wrap="wrap">
        <Select
          size="xs"
          data={[
            { value: 'paragraph', label: 'Paragraph' },
            { value: 'h1', label: 'Header 1' },
            { value: 'h2', label: 'Header 2' },
            { value: 'h3', label: 'Header 3' },
          ]}
          value={blockValue}
          onChange={setBlock}
          aria-label="Text format"
        />
        <Select
          size="xs"
          placeholder="Insert variable"
          value={selectedVar}
          onChange={(val) => {
            if (!val) return;
            setSelectedVar(null);
            const token = `{{${val}}}`;
            editor?.chain().focus().insertContent(token).run();
          }}
          data={[
            { group: 'Built-in', items: [{ value: 'USERNAME', label: 'USERNAME' }] },
            { group: 'Email variables', items: vars.map((v) => ({ value: v.key, label: v.key })) },
          ] as any}
          aria-label="Insert variable"
          comboboxProps={{ withinPortal: true } as any}
        />
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive('bold') ? 'filled' : 'light'} leftSection={<IconBold size={14} />} onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</Button>
        ) : (
          <Tooltip label="Bold"><ActionIcon size="sm" variant={editor?.isActive('bold') ? 'filled' : 'light'} onClick={() => editor?.chain().focus().toggleBold().run()}><IconBold size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive('italic') ? 'filled' : 'light'} leftSection={<IconItalic size={14} />} onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</Button>
        ) : (
          <Tooltip label="Italic"><ActionIcon size="sm" variant={editor?.isActive('italic') ? 'filled' : 'light'} onClick={() => editor?.chain().focus().toggleItalic().run()}><IconItalic size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive('underline') ? 'filled' : 'light'} leftSection={<IconUnderline size={14} />} onClick={() => editor?.chain().focus().toggleUnderline().run()}>Underline</Button>
        ) : (
          <Tooltip label="Underline"><ActionIcon size="sm" variant={editor?.isActive('underline') ? 'filled' : 'light'} onClick={() => editor?.chain().focus().toggleUnderline().run()}><IconUnderline size={14} /></ActionIcon></Tooltip>
        )}
        <Divider orientation="vertical" />
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive('bulletList') ? 'filled' : 'light'} leftSection={<IconList size={14} />} onClick={() => editor?.chain().focus().toggleBulletList().run()}>Bulleted list</Button>
        ) : (
          <Tooltip label="Bulleted list"><ActionIcon size="sm" variant={editor?.isActive('bulletList') ? 'filled' : 'light'} onClick={() => editor?.chain().focus().toggleBulletList().run()}><IconList size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive('orderedList') ? 'filled' : 'light'} leftSection={<IconListNumbers size={14} />} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>Numbered list</Button>
        ) : (
          <Tooltip label="Numbered list"><ActionIcon size="sm" variant={editor?.isActive('orderedList') ? 'filled' : 'light'} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><IconListNumbers size={14} /></ActionIcon></Tooltip>
        )}
        <Divider orientation="vertical" />
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive({ textAlign: 'left' }) ? 'filled' : 'light'} leftSection={<IconAlignLeft size={14} />} onClick={() => editor?.chain().focus().setTextAlign('left').run()}>Align left</Button>
        ) : (
          <Tooltip label="Align left"><ActionIcon size="sm" variant={editor?.isActive({ textAlign: 'left' }) ? 'filled' : 'light'} onClick={() => editor?.chain().focus().setTextAlign('left').run()}><IconAlignLeft size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive({ textAlign: 'center' }) ? 'filled' : 'light'} leftSection={<IconAlignCenter size={14} />} onClick={() => editor?.chain().focus().setTextAlign('center').run()}>Align center</Button>
        ) : (
          <Tooltip label="Align center"><ActionIcon size="sm" variant={editor?.isActive({ textAlign: 'center' }) ? 'filled' : 'light'} onClick={() => editor?.chain().focus().setTextAlign('center').run()}><IconAlignCenter size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive({ textAlign: 'right' }) ? 'filled' : 'light'} leftSection={<IconAlignRight size={14} />} onClick={() => editor?.chain().focus().setTextAlign('right').run()}>Align right</Button>
        ) : (
          <Tooltip label="Align right"><ActionIcon size="sm" variant={editor?.isActive({ textAlign: 'right' }) ? 'filled' : 'light'} onClick={() => editor?.chain().focus().setTextAlign('right').run()}><IconAlignRight size={14} /></ActionIcon></Tooltip>
        )}
        <Divider orientation="vertical" />
        {showLabels ? (
          <Button size="xs" variant={editor?.isActive('link') ? 'filled' : 'light'} leftSection={<IconLink size={14} />} onClick={openLinkModal}>
            Link
          </Button>
        ) : (
          <Tooltip label="Link"><ActionIcon size="sm" variant={editor?.isActive('link') ? 'filled' : 'light'} onClick={openLinkModal}><IconLink size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant="light" color="red" leftSection={<IconClearFormatting size={14} />} onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
            Clear formatting
          </Button>
        ) : (
          <Tooltip label="Clear formatting"><ActionIcon size="sm" variant="light" color="red" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}><IconClearFormatting size={14} /></ActionIcon></Tooltip>
        )}
        <Divider orientation="vertical" />
        {showLabels ? (
          <Button size="xs" variant="light" leftSection={<IconArrowBackUp size={14} />} onClick={() => editor?.chain().focus().undo().run()} disabled={!editor || !editor.can().chain().focus().undo().run()}>
            Undo
          </Button>
        ) : (
          <Tooltip label="Undo"><ActionIcon size="sm" variant="light" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor || !editor.can().chain().focus().undo().run()}><IconArrowBackUp size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant="light" leftSection={<IconArrowForwardUp size={14} />} onClick={() => editor?.chain().focus().redo().run()} disabled={!editor || !editor.can().chain().focus().redo().run()}>
            Redo
          </Button>
        ) : (
          <Tooltip label="Redo"><ActionIcon size="sm" variant="light" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor || !editor.can().chain().focus().redo().run()}><IconArrowForwardUp size={14} /></ActionIcon></Tooltip>
        )}
        <Switch size="xs" checked={showLabels} onChange={(e) => setShowLabels(e.currentTarget.checked)} label="Labels" style={{ marginLeft: 'auto' }} />
      </Group>

      <EditorContent editor={editor} />

      <Modal opened={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Edit link" centered>
        <Stack gap="sm">
          <Group align="end" gap="sm" wrap="nowrap">
            <TextInput
              label="URL"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={applyLink}>Apply</Button>
          </Group>
          <Divider />
          <Text size="sm" c="dimmed">Click Unlink to remove this link. You will be asked to confirm.</Text>
          <Group justify="space-between">
            <div />
            <Button color="red" variant="light" onClick={() => { setUnlinkConfirmValue(''); setUnlinkConfirmOpen(true); }}>Unlink…</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={unlinkConfirmOpen}
        onClose={() => setUnlinkConfirmOpen(false)}
        title="Confirm unlink"
        centered
        styles={{
          header: { background: 'var(--mantine-color-red-light)', borderBottom: '1px solid var(--mantine-color-red-3)' },
          title: { color: 'var(--mantine-color-red-8)', fontWeight: 600 },
        }}
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed" mt="xs">Copy the existing link and paste it to confirm unlinking.</Text>
          <TextInput
            label="Link"
            value={linkUrl}
            readOnly
            rightSection={<Button size="xs" variant="light" onClick={() => navigator.clipboard?.writeText(linkUrl)}>Copy</Button>}
            rightSectionWidth={80}
          />
          <TextInput
            label="Confirm"
            placeholder="https://"
            value={unlinkConfirmValue}
            onChange={(e) => setUnlinkConfirmValue(e.currentTarget.value)}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setUnlinkConfirmOpen(false)}>Cancel</Button>
            <Button color="red" onClick={doUnlink} disabled={unlinkConfirmValue !== (linkUrl || '')}>Unlink</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export default RichEmailEditor;
