export type Action = 'read' | 'edit' | 'delete';
export type Resource = {
  key: string;
  label: string;
  actions: Action[];
  mocked?: boolean;
  adminOnly?: boolean;
  children?: Resource[];
  readVariants?: Array<{ key: string; label: string }>;
};

export function labelFor(resource: { label: string }, action: Action) {
  const actionLabel = action === 'read' ? 'Read' : action === 'edit' ? 'Edit' : 'Delete';
  return `${resource.label}: ${actionLabel}`;
}

export const RESOURCES: Resource[] = [
  {
    key: 'customers',
    label: 'Customers',
    actions: ['read', 'edit', 'delete'],
    children: [
      {
        key: 'customers-crm',
        label: 'CRM',
        actions: ['edit', 'delete'],
        readVariants: [
          { key: 'customers-crm-read-own', label: 'CRM — Read (Own)' },
          { key: 'customers-crm-read-all', label: 'CRM — Read (All)' },
        ],
      },
      { key: 'customers-vendor', label: 'Vendor', actions: ['read', 'edit', 'delete'] },
    ],
  },
  {
    key: 'email_subscriptions',
    label: 'Email subscriptions',
    actions: ['read', 'edit', 'delete'],
    children: [
      { key: 'email_newsletter', label: 'Newsletter', actions: ['read', 'edit', 'delete'] },
      { key: 'email_waiting_list', label: 'Waiting list', actions: ['read', 'edit', 'delete'] },
    ],
  },
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
  {
    key: 'finance',
    label: 'Finance',
    actions: ['read', 'edit', 'delete'],
    children: [
      { key: 'finance_overview', label: 'Overview', actions: ['read', 'edit', 'delete'] },
      { key: 'finance_invoices', label: 'Invoices', actions: ['read', 'edit', 'delete'] },
      { key: 'finance_reports', label: 'Financial reports', actions: ['read', 'edit', 'delete'] },
      { key: 'finance_settings', label: 'Financial settings', actions: ['read', 'edit', 'delete'] },
    ],
  },
  { key: 'tag_manager', label: 'Tag Manager', actions: ['read', 'edit', 'delete'] },
  { key: 'reports', label: 'Reports', actions: ['read'] },
  { key: 'company_settings', label: 'Company settings', actions: ['read', 'edit', 'delete'] },
  // Admin-only area — show as lines with an "admin only" chip
  { key: 'admin_settings', label: 'Admin settings', actions: [], adminOnly: true },
];

export function allPermissionNames(): string[] {
  const names: string[] = [];
  RESOURCES.forEach((r) => {
    if (r.adminOnly) return;
    if (r.children && r.children.length) {
      r.children.forEach((c) => {
        if (c.readVariants && c.readVariants.length) {
          c.readVariants.forEach((rv) => names.push(labelFor({ label: rv.label } as any, 'read')));
        }
        c.actions.forEach((a) => names.push(labelFor(c, a)));
      });
    } else {
      r.actions.forEach((a) => names.push(labelFor(r, a)));
    }
  });
  return names;
}
