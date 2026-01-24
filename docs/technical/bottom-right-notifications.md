# Bottom‑Right Notifications

A small notification system for brief status updates appears at the bottom right of the screen. It stacks, auto‑dismisses after a short duration, and can be dismissed early. It’s provided globally via the app’s Providers, so any client component can trigger it.

## Setup

- Global wiring: the provider is already mounted in `components/Providers.tsx:37` and included by the root layout `app/layout.tsx:48`. No additional setup is required for pages and components rendered under the default layout.
- Client components only: the hook is client‑side. Use it inside files marked with `"use client"` or within client components.

## API

- `useToast()`: returns `{ show, dismiss }`.
  - `show({ title?, message?, color?, duration? }) => id`
    - `title`: short heading text.
    - `message`: optional detail text.
    - `color`: one of `green | red | blue | yellow | gray | orange | grape`. Defaults to the theme surface.
    - `duration`: milliseconds before auto‑dismiss (default `3500`).
    - returns a unique `id` you can pass to `dismiss`.
  - `dismiss(id)`: closes a specific notification early.

Import path for the hook: `@/components/ToastProvider`.

## Usage Examples

Basic success message:

```tsx
"use client";
import { useToast } from '@/components/ToastProvider';

export default function Example() {
  const toast = useToast();
  return (
    <button
      onClick={() => toast.show({ title: 'Saved', message: 'Changes stored successfully.', color: 'green' })}
    >
      Save
    </button>
  );
}
```

Dismiss early if you have a long‑running flow:

```tsx
const id = toast.show({ title: 'Uploading…', message: 'This may take a moment.' });
await doUpload();
toast.dismiss(id);
toast.show({ title: 'Upload complete', color: 'green' });
```

See in‑app usage in CRM screens:

- Import and hook: `app/(employee)/employee/crm/page.tsx:5`, `app/(employee)/employee/crm/page.tsx:18`
- Typical calls: `app/(employee)/employee/crm/page.tsx:699`, `app/(employee)/employee/crm/page.tsx:717`
- Record detail views: `app/(employee)/employee/crm/customer/[id]/page.tsx:455`, `app/(employee)/employee/crm/vendor/[id]/page.tsx:745`

## Behavior

- Positioning: fixed at bottom‑right with stacking and spacing.
- Auto‑dismiss: default 3.5s; configurable per call via `duration`.
- Interaction: each notification has a close button and does not block page interaction; clicks pass through outside the cards.
- Theming: inherits Mantine variables for surface, text, and borders to match light/dark modes.

## Guidance

- Keep titles succinct; move details to `message` only when helpful.
- Use color sparingly:
  - `green`: successful operations
  - `red`: failures or destructive confirmations
  - `blue`/`grape`: informational
  - `yellow`/`orange`: warnings or partial success
- Prefer short durations (2–4s). For actions requiring attention, increase `duration` or trigger on explicit user gestures.

## Troubleshooting

- “useToast must be used within <ToastProvider>”: ensure the component rendering `useToast()` is part of the main app tree (it is by default via `Providers`) and runs on the client.
- No notification appears: confirm the calling component is client‑side and that no parent layout overrides the global `Providers`.

## Reference

- Provider and hook implementation: `components/ToastProvider.tsx`
- Global mount: `components/Providers.tsx:37`, `app/layout.tsx:48`

