# Rich Email WYSIWYG — Reuse Guide

This document describes how to reuse the newsletter WYSIWYG editor in other parts of the app (e.g., blog posts). It is based on the editor used at `/employee/email-subscriptions/newsletters/new`.

- Component: `components/RichEmailEditor.tsx`
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
- Personalization tokens via a Variables dropdown (integrated with Email Variables settings)

## API

Import:

```tsx
import { RichEmailEditor } from '@/components/RichEmailEditor';
```

Props:

- `placeholder?: string` — Placeholder text shown when empty. Default: “Write your message…”.
- `initialHTML?: string` — Initial HTML content to load into the editor (use when editing existing content).
- `onChangeHTML?: (html: string) => void` — Called with HTML whenever the editor updates.
- `defaultShowLabels?: boolean` — If true, toolbar shows labeled buttons; otherwise compact icon-only toolbar. Default: `true`.

Behavior:

- Emits HTML updates on every change via `onChangeHTML`.
- When `initialHTML` changes, the editor updates to match it (without re-emitting).
- Applies CSS class `newsletter-editor` to the editable area. You may use this class to style height/padding.

## Dependencies

- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`, `@tiptap/extension-link`, `@tiptap/extension-text-align`
- Mantine Core components and Tabler icons
- Email Variables integration: `listenEmailVars` from `lib/firebase/emailSettings`
  - If Email Variables are not configured, the Variables dropdown will be empty but harmless. The editor remains fully functional.

## Minimal Usage (Blog Compose)

```tsx
"use client";
import { useState } from 'react';
import { Card, Stack, Button } from '@mantine/core';
import { RichEmailEditor } from '@/components/RichEmailEditor';

export default function BlogComposeExample() {
  const [html, setHtml] = useState('');

  return (
    <Card withBorder>
      <Stack>
        <RichEmailEditor
          placeholder="Write your post…"
          onChangeHTML={setHtml}
          defaultShowLabels={false}
        />
        <Button onClick={() => console.log('HTML to save:', html)}>Save</Button>
      </Stack>
    </Card>
  );
}
```

Notes:

- Use `defaultShowLabels={false}` for a compact toolbar in dense forms.
- Persist the `html` string to your store (Zustand/Firestore/etc.) on save.

## Editing Existing Content

When editing, pass `initialHTML` and keep your local state in sync.

```tsx
const [html, setHtml] = useState(existing.bodyHtml || '');

<RichEmailEditor
  placeholder="Update your content…"
  initialHTML={html}
  onChangeHTML={setHtml}
/>;
```

`initialHTML` updates the editor without firing `onChangeHTML`; the next user edit resumes change events.

## Styling the Editor Area

The editor root receives `class="newsletter-editor"`. Example styling:

```tsx
<style jsx global>{`
  .newsletter-editor {
    min-height: 260px;
    border: 1px solid var(--mantine-color-gray-3);
    border-radius: 8px;
    padding: 12px;
  }
`}</style>
```

You can also wrap the component in a Mantine `Card` and apply spacing there (as in newsletters/new).

## Personalization Tokens (Optional)

- The Variables dropdown inserts tokens like `{{USERNAME}}` or custom keys configured under Company Settings → Email Variables.
- For non-email contexts (e.g., blogs), you can ignore this dropdown. If no variables are configured, the dropdown will be empty.
- If you need to hide it altogether, wrap `RichEmailEditor` and render a variant without that control (or fork the component to add a `showVariables` prop).

## Accessibility

- Toolbar controls include `aria-label`s where applicable.
- Keyboard shortcuts are provided by TipTap/ProseMirror (e.g., Mod-B/Mod-I, undo/redo).

## Security and Rendering

- `onChangeHTML` returns raw HTML; sanitize before rendering on public pages if content can come from untrusted sources.
- For internal blog previews, rendering with `dangerouslySetInnerHTML` is acceptable; sanitize for public output.

## SSR/Client Notes

- `RichEmailEditor` is a client component (`"use client"`). Do not import it in server‑only contexts.
- TipTap mounts with `immediatelyRender: false` to avoid hydration flicker.

## Troubleshooting

- Toolbar buttons do nothing: ensure the editor has focus; buttons call `editor.chain().focus().…`.
- Variables dropdown empty: add Email Variables in Company Settings (optional); editor works without them.
- Content not updating when prop changes: use `initialHTML` for setting content; call state setter to update the value.

## Migration Tips (Using in Blogs)

- Replace bespoke TipTap setup in the blog compose page with `RichEmailEditor`:
  - Remove local `useEditor` usage.
  - Store HTML in state via `onChangeHTML`.
  - Reuse preview modal logic by injecting the HTML into `dangerouslySetInnerHTML`.

