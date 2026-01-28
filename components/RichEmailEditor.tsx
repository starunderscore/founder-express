"use client";
import { useState, useMemo, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Button, Group, Divider, Switch, Tooltip, Select, ActionIcon } from '@mantine/core';
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder, emptyNodeClass: 'is-editor-empty' }),
      LinkExt.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: initialHTML,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'newsletter-editor' } },
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

  return (
    <>
      <Group gap={6} wrap="wrap">
        <Select
          size="xs"
          data={[
            { value: 'paragraph', label: 'Paragraph' },
            { value: 'h1', label: 'H1' },
            { value: 'h2', label: 'H2' },
            { value: 'h3', label: 'H3' },
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
          <Button size="xs" variant={editor?.isActive('link') ? 'filled' : 'light'} leftSection={<IconLink size={14} />} onClick={() => { const url = prompt('Enter URL'); if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); }}>
            Link
          </Button>
        ) : (
          <Tooltip label="Link"><ActionIcon size="sm" variant={editor?.isActive('link') ? 'filled' : 'light'} onClick={() => { const url = prompt('Enter URL'); if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); }}><IconLink size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant="light" color="gray" leftSection={<IconClearFormatting size={14} />} onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</Button>
        ) : (
          <Tooltip label="Clear formatting"><ActionIcon size="sm" variant="light" color="gray" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}><IconClearFormatting size={14} /></ActionIcon></Tooltip>
        )}
        <Divider orientation="vertical" />
        {showLabels ? (
          <Button size="xs" variant="light" leftSection={<IconArrowBackUp size={14} />} onClick={() => editor?.chain().focus().undo().run()}>Undo</Button>
        ) : (
          <Tooltip label="Undo"><ActionIcon size="sm" variant="light" onClick={() => editor?.chain().focus().undo().run()}><IconArrowBackUp size={14} /></ActionIcon></Tooltip>
        )}
        {showLabels ? (
          <Button size="xs" variant="light" leftSection={<IconArrowForwardUp size={14} />} onClick={() => editor?.chain().focus().redo().run()}>Redo</Button>
        ) : (
          <Tooltip label="Redo"><ActionIcon size="sm" variant="light" onClick={() => editor?.chain().focus().redo().run()}><IconArrowForwardUp size={14} /></ActionIcon></Tooltip>
        )}
        <Switch size="xs" checked={showLabels} onChange={(e) => setShowLabels(e.currentTarget.checked)} label="Labels" style={{ marginLeft: 'auto' }} />
      </Group>

      <EditorContent editor={editor} />
    </>
  );
}

export default RichEmailEditor;
