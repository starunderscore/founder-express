export type BuiltinPermission = { id: string; name: string };

type Action = 'read' | 'edit' | 'delete';
type Resource = {
  key: string;
  label: string;
  actions: Action[];
  mocked?: boolean;
  adminOnly?: boolean;
  children?: Resource[];
};

const RESOURCES: Resource[] = [
  {
    key: 'customers',
    label: 'Customers',
    actions: ['read', 'edit', 'delete'],
    children: [
      { key: 'customers-crm-read-own', label: 'CRM — Read (Own)', actions: ['read'] },
      { key: 'customers-crm-read-all', label: 'CRM — Read (All)', actions: ['read'] },
      { key: 'customers-crm', label: 'CRM', actions: ['edit', 'delete'] },
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
];

const actionLabel = (a: Action) => (a === 'read' ? 'Read' : a === 'edit' ? 'Edit' : 'Delete');
export const labelFor = (resourceLabel: string, action: Action) => `${resourceLabel}: ${actionLabel(action)}`;

export function allBuiltinPermissions(): BuiltinPermission[] {
  const out: BuiltinPermission[] = [];
  const push = (key: string, label: string, a: Action) => {
    out.push({ id: `perm-${key}-${a}`, name: labelFor(label, a) });
  };
  for (const r of RESOURCES) {
    if (r.mocked) continue; // skip mocked resources
    if (r.children && r.children.length) {
      for (const c of r.children) {
        for (const a of c.actions) push(c.key, c.label, a);
      }
    } else {
      for (const a of r.actions) push(r.key, r.label, a);
    }
  }
  return out;
}

export function nameToIdMap(): Map<string, string> {
  return new Map(allBuiltinPermissions().map((p) => [p.name, p.id] as const));
}

export function idToNameMap(): Map<string, string> {
  return new Map(allBuiltinPermissions().map((p) => [p.id, p.name] as const));
}

export function namesToIds(names: string[]): string[] {
  const m = nameToIdMap();
  return names.map((n) => m.get(n)).filter(Boolean) as string[];
}

export function idsToNames(ids: string[]): string[] {
  const m = idToNameMap();
  return ids.map((id) => m.get(id)).filter(Boolean) as string[];
}
