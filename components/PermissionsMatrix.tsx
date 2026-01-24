"use client";
import { useMemo } from 'react';
import { Badge, Checkbox, Group, Table, Text } from '@mantine/core';

export type Action = 'read' | 'edit' | 'delete';
export type Resource = {
  key: string;
  label: string;
  actions: Action[];
  mocked?: boolean;
  adminOnly?: boolean;
  children?: Resource[];
};

export const RESOURCES: Resource[] = [
  { key: 'customers', label: 'Customers', actions: ['read', 'edit', 'delete'] },
  { key: 'email_subscriptions', label: 'Email subscriptions', actions: ['read', 'edit', 'delete'] },
  { key: 'employees', label: 'Employees', actions: ['read', 'edit', 'delete'], adminOnly: true },
  {
    key: 'website',
    label: 'Website',
    actions: ['read', 'edit', 'delete'],
    children: [
      { key: 'website_newsbar', label: 'News Bar', actions: ['read', 'edit', 'delete'] },
      { key: 'website_blogs', label: 'Blogs', actions: ['read', 'edit', 'delete'] },
    ],
  },
  { key: 'achievements', label: 'Achievements', actions: ['read', 'edit', 'delete'], mocked: true },
  { key: 'finance', label: 'Finance', actions: ['read', 'edit', 'delete'] },
  { key: 'tag_manager', label: 'Tag Manager', actions: ['read', 'edit', 'delete'] },
  { key: 'reports', label: 'Reports', actions: ['read'] },
  { key: 'company_settings', label: 'Company settings', actions: ['read', 'edit', 'delete'] },
];

export function labelFor(resource: { label: string }, action: Action) {
  const actionLabel = action === 'read' ? 'Read' : action === 'edit' ? 'Edit' : 'Delete';
  return `${resource.label}: ${actionLabel}`;
}

export function allPermissionNames(): string[] {
  const names: string[] = [];
  RESOURCES.forEach((r) => {
    if (r.adminOnly) return;
    if (r.children && r.children.length) {
      r.children.forEach((c) => c.actions.forEach((a) => names.push(labelFor(c, a))));
    } else {
      r.actions.forEach((a) => names.push(labelFor(r, a)));
    }
  });
  return names;
}

export function PermissionsMatrix({ value, onChange, disabledNames = [] }: { value: string[]; onChange: (names: string[]) => void; disabledNames?: string[] }) {
  const selected = useMemo(() => new Set(value), [value]);
  const disabled = useMemo(() => new Set(disabledNames), [disabledNames]);
  const effHas = (name: string) => selected.has(name) || disabled.has(name);
  const has = (name: string) => effHas(name);
  const toggleName = (name: string, checked: boolean, next: Set<string>) => {
    if (disabled.has(name)) return;
    if (checked) next.add(name); else next.delete(name);
  };

  const toggleWithDeps = (res: { label: string }, action: Action, checked: boolean) => {
    const next = new Set(selected);
    // Apply dependency chain within the same resource: delete -> edit -> read
    if (checked) {
      if (action === 'delete') {
        toggleName(labelFor(res, 'read'), true, next);
        toggleName(labelFor(res, 'edit'), true, next);
        toggleName(labelFor(res, 'delete'), true, next);
      } else if (action === 'edit') {
        toggleName(labelFor(res, 'read'), true, next);
        toggleName(labelFor(res, 'edit'), true, next);
      } else {
        toggleName(labelFor(res, 'read'), true, next);
      }
    } else {
      if (action === 'read') {
        toggleName(labelFor(res, 'delete'), false, next);
        toggleName(labelFor(res, 'edit'), false, next);
        toggleName(labelFor(res, 'read'), false, next);
      } else if (action === 'edit') {
        toggleName(labelFor(res, 'delete'), false, next);
        toggleName(labelFor(res, 'edit'), false, next);
      } else {
        toggleName(labelFor(res, 'delete'), false, next);
      }
    }
    onChange(Array.from(next));
  };

  return (
    <Table verticalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Permission</Table.Th>
          <Table.Th>Read</Table.Th>
          <Table.Th>Edit</Table.Th>
          <Table.Th>Delete</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {RESOURCES.map((r) => {
          const hasChildren = !!(r.children && r.children.length);
          const children = r.children || [];
          const groupChecked = (a: Action) => hasChildren ? children.every((c) => has(labelFor(c, a))) : has(labelFor(r, a));
          const onGroupToggle = (a: Action, checked: boolean) => {
            if (!hasChildren) {
              toggleWithDeps(r, a, checked);
            } else {
              // Apply to all children with dependency rules, skipping disabled
              children.forEach((c) => toggleWithDeps(c, a, checked));
            }
          };
          return (
            <>
              <Table.Tr key={r.key}>
                <Table.Td width="40%">
                  <Group gap={8} align="center">
                    <Text>{r.label}</Text>
                    {r.mocked && <Badge size="xs" variant="light" color="gray">mocked</Badge>}
                    {r.adminOnly && <Badge size="xs" variant="light" color="indigo">admin only</Badge>}
                  </Group>
                </Table.Td>
                <Table.Td>
                  {(r.mocked || r.adminOnly) ? (
                    <Text c="dimmed" style={{ textDecoration: 'line-through' }}>—</Text>
                  ) : r.actions.includes('read') ? (
                    <Checkbox checked={groupChecked('read')} onChange={(e) => onGroupToggle('read', e.currentTarget.checked)} aria-label={`${r.label} read`} disabled={disabled.has(labelFor(r, 'read')) && !r.children?.length} />
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {(r.mocked || r.adminOnly) ? (
                    <Text c="dimmed" style={{ textDecoration: 'line-through' }}>—</Text>
                  ) : r.actions.includes('edit') ? (
                    <Checkbox checked={groupChecked('edit')} onChange={(e) => onGroupToggle('edit', e.currentTarget.checked)} aria-label={`${r.label} edit`} disabled={disabled.has(labelFor(r, 'edit')) && !r.children?.length} />
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {(r.mocked || r.adminOnly) ? (
                    <Text c="dimmed" style={{ textDecoration: 'line-through' }}>—</Text>
                  ) : r.actions.includes('delete') ? (
                    <Checkbox checked={groupChecked('delete')} onChange={(e) => onGroupToggle('delete', e.currentTarget.checked)} aria-label={`${r.label} delete`} disabled={disabled.has(labelFor(r, 'delete')) && !r.children?.length} />
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Table.Td>
              </Table.Tr>
              {hasChildren && children.map((c) => (
                <Table.Tr key={c.key}>
                  <Table.Td>
                    <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center' }}>
                      <Text>{c.label}</Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Checkbox checked={has(labelFor(c, 'read'))} onChange={(e) => toggleWithDeps(c, 'read', e.currentTarget.checked)} aria-label={`${c.label} read`} disabled={disabled.has(labelFor(c, 'read'))} />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox checked={has(labelFor(c, 'edit'))} onChange={(e) => toggleWithDeps(c, 'edit', e.currentTarget.checked)} aria-label={`${c.label} edit`} disabled={disabled.has(labelFor(c, 'edit'))} />
                  </Table.Td>
                    <Table.Td>
                    <Checkbox checked={has(labelFor(c, 'delete'))} onChange={(e) => toggleWithDeps(c, 'delete', e.currentTarget.checked)} aria-label={`${c.label} delete`} disabled={disabled.has(labelFor(c, 'delete'))} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
