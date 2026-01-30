# Web Content WYSIWYG — Reuse Guide

A reusable TipTap-based editor for website content (e.g., blog posts). This is the same UX as the email editor, but without the Email Variables dropdown.

- Component: `components/WebContentEditor.tsx`
- Editor engine: TipTap (`@tiptap/react` + StarterKit)
- UI: Mantine buttons/selects + Tabler icons
- Output: HTML string via `onChangeHTML`

## Capabilities

- Basic formatting: bold, italic, underline
- Headings: H1–H3 and paragraph
- Lists: bulleted and numbered
- Alignment: left, center, right
- Links: insert URL at selection
- Clear formatting, undo/redo
- Optional label-less toolbar (compact mode toggle)

## API

Import:

```tsx
import { WebContentEditor } from '@/components/WebContentEditor';
```

Props:

- `placeholder?: string` — Placeholder text shown when empty. Default: “Write your content…”.
- `initialHTML?: string` — Initial HTML content to load into the editor (use when editing existing content).
- `onChangeHTML?: (html: string) => void` — Called with HTML whenever the editor updates.
- `defaultShowLabels?: boolean` — If true, toolbar shows labeled buttons; otherwise compact icon-only toolbar. Default: `true`.
- `minRows?: number` — Approximate minimum height in text rows. Default: `10`.

Behavior:

- Emits HTML updates on every change via `onChangeHTML`.
- When `initialHTML` changes, the editor updates to match it (without re-emitting).
- Applies CSS class `webcontent-editor` to the editable area. You may use this class to style height/padding.

## Minimal Usage (Blog Compose)

```tsx
"use client";
import { useState } from 'react';
import { Card, Stack, Button } from '@mantine/core';
import { WebContentEditor } from '@/components/WebContentEditor';

export default function BlogComposeExample() {
  const [html, setHtml] = useState('');

  return (
    <Card withBorder>
      <Stack>
        <WebContentEditor
          placeholder="Write your post…"
          onChangeHTML={setHtml}
          defaultShowLabels={true}
          minRows={12}
        />
        <Button onClick={() => console.log('HTML to save:', html)}>Save</Button>
      </Stack>
    </Card>
  );
}
```

Notes:

- Use `defaultShowLabels={false}` for a compact toolbar in dense forms.
- Persist the `html` string to your store on save.

## Editing Existing Content

When editing, pass `initialHTML` and keep your local state in sync.

```tsx
const [html, setHtml] = useState(existing.bodyHtml || '');

<WebContentEditor
  placeholder="Update your content…"
  initialHTML={html}
  onChangeHTML={setHtml}
/>;
```

`initialHTML` updates the editor without firing `onChangeHTML`; the next user edit resumes change events.

## Styling the Editor Area

The editor is a contentEditable div with class `webcontent-editor`. Global styles give it:
- Subtle background (body),
- Multi-row min height,
- Padding,
- A single outline and focus ring.

Embed it inside a plain container or a Card without border to avoid double outlines. Clicking anywhere in the editor area focuses the caret.

Example optional global styling:

```tsx
<style jsx global>{`
  .webcontent-editor {
    min-height: 260px;
    border: 1px solid var(--mantine-color-gray-3);
    border-radius: 8px;
    padding: 12px;
  }
`}</style>
```

Wrap the component in a Mantine `Card` to match the standard in-app presentation.

## Accessibility

- Toolbar controls include `aria-label`s where applicable.
- Keyboard shortcuts are provided by TipTap/ProseMirror (e.g., Mod-B/Mod-I, undo/redo).

## Security and Rendering

- `onChangeHTML` returns raw HTML; sanitize before rendering on public pages if content can be user-provided.
- For internal previews, rendering with `dangerouslySetInnerHTML` is acceptable.

## SSR/Client Notes

- `WebContentEditor` is a client component (`"use client"`). Do not import it in server‑only contexts.
- TipTap mounts with `immediatelyRender: false` to avoid hydration flicker.

## Troubleshooting

- Toolbar buttons do nothing: ensure the editor has focus; buttons call `editor.chain().focus().…`.
- Content not updating when prop changes: use `initialHTML` for setting content; let user edits flow via `onChangeHTML`.
