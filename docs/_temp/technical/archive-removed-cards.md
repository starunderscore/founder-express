# Archive/Removed Cards on Detail/Edit Pages

This spec defines how to present the status of a record (Archived or Removed) on its detail/edit pages (e.g., Roles edit view). The goal is to clearly communicate state without blocking normal navigation, and to guide users back to the correct list.

## Placement

- Location: Top of the content area, above the main card/form.
- Width: Full content width.
- Spacing: `mb="md"` (or equivalent) beneath the alert.

## Variants

### Removed Card

- Color: `red`
- Variant: `light`
- Title: `Removed`
- Body copy: “This item is removed and appears in the Removed tab.”
- Behavior: The back button on the page should route to the Removed list for the feature area.

### Archived Card

- Color: `gray`
- Variant: `light`
- Title: `Archived`
- Body copy: “This item is archived and hidden from the Active list.”
- Behavior: The back button on the page should route to the Archive list for the feature area.

## Behavior Rules

- Exactly one card is shown at a time.
  - If `deletedAt` is present (truthy number), show the Removed card.
  - Else if `isArchived` is true, show the Archived card.
  - Else show no status card.
- Back button routing:
  - Removed -> navigate back to the “Removed” listing page.
  - Archived -> navigate back to the “Archive” listing page.
  - Active (neither removed nor archived) -> navigate back to the “Active” listing page.
- The card is informational; it does not lock the form or change field enablement by itself.

## Copy Guidance

- Keep the headline to a single word: “Removed”, “Archived”.
- Keep the body copy short, describing where the record appears and its visibility:
  - Removed: “appears in the Removed tab.”
  - Archived: “hidden from the Active list.”

## Visual Guidelines

- Use component: `Alert` (Mantine)
- Colors: `red` for Removed, `gray` for Archived
- Variant: `light`
- Margins: `mb="md"` under the alert
- Do not include action buttons in the card; actions are handled via the page’s actions menu or listing pages.

## Example (React/Mantine)

```tsx
{record.deletedAt && (
  <Alert color="red" variant="light" mb="md" title="Removed">
    This item is removed and appears in the Removed tab.
  </Alert>
)}
{!record.deletedAt && record.isArchived && (
  <Alert color="gray" variant="light" mb="md" title="Archived">
    This item is archived and hidden from the Active list.
  </Alert>
)}
```

Back button routing example:

```tsx
<ActionIcon
  variant="subtle"
  aria-label="Back"
  onClick={() => {
    if (record.deletedAt) router.push('/…/removed');
    else if (record.isArchived) router.push('/…/archive');
    else router.push('/…');
  }}
/>
```

## Scope

- Applies to all entity detail/edit pages that support archive or soft-remove states (e.g., Roles).
- Listing pages (Active/Archive/Removed) should not show these status cards; they belong on the per-record detail/edit pages.

