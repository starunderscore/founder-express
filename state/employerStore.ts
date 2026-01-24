"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Permission = { id: string; name: string; description?: string };
export type Role = { id: string; name: string; description?: string; permissionIds: string[]; isArchived?: boolean; deletedAt?: number };
export type Employee = { id: string; name: string; email: string; roleIds: string[]; permissionIds: string[]; isAdmin?: boolean; dateOfBirth?: string };

type EmployerState = {
  permissions: Permission[];
  roles: Role[];
  employees: Employee[];
  // permissions
  addPermission: (name: string, description?: string) => void;
  removePermission: (id: string) => void;
  // roles
  addRole: (name: string, permissionIds?: string[], description?: string) => void;
  removeRole: (id: string) => void;
  archiveRole: (id: string) => void;
  restoreRole: (id: string) => void;
  softRemoveRole: (id: string) => void;
  restoreRemovedRole: (id: string) => void;
  updateRolePermissions: (id: string, permissionIds: string[]) => void;
  renameRole: (id: string, name: string) => void;
  updateRoleDescription: (id: string, description?: string) => void;
  // employees
  addEmployee: (name: string, email: string, roleIds?: string[], permissionIds?: string[], isAdmin?: boolean) => void;
  removeEmployee: (id: string) => void;
  assignRolesToEmployee: (id: string, roleIds: string[]) => void;
  assignPermissionsToEmployee: (id: string, permissionIds: string[]) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  // helpers
  getEffectivePermissionIds: (employeeId: string) => string[];
};

const actionLabel = (a: 'read' | 'edit' | 'delete') => (a === 'read' ? 'Read' : a === 'edit' ? 'Edit' : 'Delete');
const pname = (label: string, a: 'read' | 'edit' | 'delete') => `${label}: ${actionLabel(a)}`;

const seedPermissions: Permission[] = [
  // Customers
  { id: 'perm-customers-read', name: pname('Customers', 'read') },
  { id: 'perm-customers-edit', name: pname('Customers', 'edit') },
  { id: 'perm-customers-delete', name: pname('Customers', 'delete') },
  // Email subscriptions
  { id: 'perm-email-read', name: pname('Email subscriptions', 'read') },
  { id: 'perm-email-edit', name: pname('Email subscriptions', 'edit') },
  { id: 'perm-email-delete', name: pname('Email subscriptions', 'delete') },
  // Employees
  { id: 'perm-employees-read', name: pname('Employees', 'read') },
  { id: 'perm-employees-edit', name: pname('Employees', 'edit') },
  { id: 'perm-employees-delete', name: pname('Employees', 'delete') },
  // Website children
  { id: 'perm-website-newsbar-read', name: pname('News Bar', 'read') },
  { id: 'perm-website-newsbar-edit', name: pname('News Bar', 'edit') },
  { id: 'perm-website-newsbar-delete', name: pname('News Bar', 'delete') },
  { id: 'perm-website-blogs-read', name: pname('Blogs', 'read') },
  { id: 'perm-website-blogs-edit', name: pname('Blogs', 'edit') },
  { id: 'perm-website-blogs-delete', name: pname('Blogs', 'delete') },
  // Finance
  { id: 'perm-finance-read', name: pname('Finance', 'read') },
  { id: 'perm-finance-edit', name: pname('Finance', 'edit') },
  { id: 'perm-finance-delete', name: pname('Finance', 'delete') },
  // Tag Manager
  { id: 'perm-tagmgr-read', name: pname('Tag Manager', 'read') },
  { id: 'perm-tagmgr-edit', name: pname('Tag Manager', 'edit') },
  { id: 'perm-tagmgr-delete', name: pname('Tag Manager', 'delete') },
  // Reports (read only)
  { id: 'perm-reports-read', name: pname('Reports', 'read') },
  // Company settings
  { id: 'perm-company-read', name: pname('Company settings', 'read') },
  { id: 'perm-company-edit', name: pname('Company settings', 'edit') },
  { id: 'perm-company-delete', name: pname('Company settings', 'delete') },
];

const idByName = Object.fromEntries(seedPermissions.map((p) => [p.name, p.id]));

const seedRoles: Role[] = [
  // Small investor: minimal website read
  {
    id: 'role-small-investor',
    name: 'Small investor',
    permissionIds: [idByName[pname('News Bar', 'read')], idByName[pname('Blogs', 'read')]].filter(Boolean),
  },
  // Big investor: broad read access
  {
    id: 'role-big-investor',
    name: 'Big investor',
    permissionIds: [
      idByName[pname('Customers', 'read')],
      idByName[pname('Email subscriptions', 'read')],
      idByName[pname('Employees', 'read')],
      idByName[pname('News Bar', 'read')],
      idByName[pname('Blogs', 'read')],
      idByName[pname('Finance', 'read')],
      idByName[pname('Reports', 'read')],
      idByName[pname('Tag Manager', 'read')],
      idByName[pname('Company settings', 'read')],
    ].filter(Boolean) as string[],
  },
  // Editor: edit website + email subs + tag manager
  {
    id: 'role-editor',
    name: 'Editor',
    permissionIds: [
      idByName[pname('News Bar', 'read')],
      idByName[pname('News Bar', 'edit')],
      idByName[pname('Blogs', 'read')],
      idByName[pname('Blogs', 'edit')],
      idByName[pname('Email subscriptions', 'read')],
      idByName[pname('Email subscriptions', 'edit')],
      idByName[pname('Tag Manager', 'read')],
      idByName[pname('Tag Manager', 'edit')],
    ].filter(Boolean) as string[],
  },
  // Management: everything except admin areas; reports read-only; company settings no delete
  {
    id: 'role-management',
    name: 'Management',
    permissionIds: seedPermissions
      .map((p) => p.id)
      .filter((id) => id !== 'perm-reports-edit' && id !== 'perm-reports-delete' && id !== 'perm-company-delete'),
  },
];

export const useEmployerStore = create<EmployerState>()(
  persist(
    (set, get) => ({
      permissions: seedPermissions,
      roles: seedRoles,
      employees: [],
      // permissions
      addPermission: (name, description) =>
        set((s) => {
          const nm = String(name || '').trim();
          if (!nm) return {} as any;
          // No-op if permission with this name already exists
          if ((s.permissions || []).some((p) => p.name === nm)) return {} as any;
          // Use canonical seeded ID when possible so rules checks match
          const seeded = seedPermissions.find((p) => p.name === nm);
          const id = seeded ? seeded.id : `perm-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
          return { permissions: [{ id, name: nm, description }, ...s.permissions] } as any;
        }),
      removePermission: (id) =>
        set((s) => ({
          permissions: s.permissions.filter((p) => p.id !== id),
          roles: s.roles.map((r) => ({ ...r, permissionIds: r.permissionIds.filter((pid) => pid !== id) })),
          employees: s.employees.map((e) => ({ ...e, permissionIds: e.permissionIds.filter((pid) => pid !== id) })),
        })),
      // roles
      addRole: (name, permissionIds, description) => set((s) => {
        const nm = String(name || '').trim();
        if (!nm || nm.toLowerCase().includes('admin')) {
          return {} as any;
        }
        return { roles: [{ id: `role-${Date.now()}`, name: nm, description: description?.trim() || undefined, permissionIds: permissionIds || [], isArchived: false, deletedAt: undefined }, ...s.roles] } as any;
      }),
      removeRole: (id) =>
        set((s) => ({ roles: s.roles.filter((r) => r.id !== id), employees: s.employees.map((e) => ({ ...e, roleIds: e.roleIds.filter((rid) => rid !== id) })) })),
      archiveRole: (id) => set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, isArchived: true } : r)) })),
      restoreRole: (id) => set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, isArchived: false } : r)) })),
      softRemoveRole: (id) => set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, deletedAt: Date.now() } : r)) })),
      restoreRemovedRole: (id) => set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, deletedAt: undefined } : r)) })),
      updateRolePermissions: (id, permissionIds) =>
        set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, permissionIds } : r)) })),
      renameRole: (id, name) => set((s) => {
        const nm = String(name || '').trim();
        if (!nm || nm.toLowerCase().includes('admin')) return {} as any;
        return { roles: s.roles.map((r) => (r.id === id ? { ...r, name: nm } : r)) } as any;
      }),
      updateRoleDescription: (id, description) =>
        set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, description: description?.trim() || undefined } : r)) })),
      // employees
      addEmployee: (name, email, roleIds, permissionIds, isAdmin) => set((s) => ({ employees: [{ id: `emp-${Date.now()}`, name, email, roleIds: roleIds || [], permissionIds: permissionIds || [], isAdmin: !!isAdmin }, ...s.employees] })),
      removeEmployee: (id) => set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),
      assignRolesToEmployee: (id, roleIds) => set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, roleIds } : e)) })),
      assignPermissionsToEmployee: (id, permissionIds) => set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, permissionIds } : e)) })),
      updateEmployee: (id, patch) => set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      // helpers
      getEffectivePermissionIds: (employeeId) => {
        const s = get();
        const e = s.employees.find((x) => x.id === employeeId);
        if (!e) return [];
        const rolePerms = e.roleIds
          .map((rid) => s.roles.find((r) => r.id === rid)?.permissionIds || [])
          .flat();
        return Array.from(new Set([...rolePerms, ...e.permissionIds]));
      },
    }),
    {
      name: 'pattern-typing-employee',
      version: 6,
      migrate: (persisted: any, version) => {
        const state: EmployerState = persisted || { permissions: [], roles: [], employees: [] } as any;
        // Remove any admin roles
        state.roles = (state.roles || []).filter((r) => !r.name?.toLowerCase?.().includes('admin'));
        // Ensure role isArchived exists
        state.roles = (state.roles || []).map((r: any) => ({ ...r, isArchived: typeof r.isArchived === 'boolean' ? r.isArchived : false, deletedAt: typeof r.deletedAt === 'number' ? r.deletedAt : undefined }));
        // Ensure seed permission names exist
        const byName = new Map((state.permissions || []).map((p) => [p.name, p.id] as const));
        const ensurePerm = (name: string) => {
          if (!byName.has(name)) {
            const id = `perm-${Math.random().toString(36).slice(2,8)}`;
            state.permissions = [{ id, name }, ...(state.permissions || [])];
            byName.set(name, id);
          }
          return byName.get(name)!;
        };
        const roleEnsureIds = (names: string[]) => names.map(ensurePerm);

        const hasRole = (nm: string) => (state.roles || []).some((r) => r.name?.toLowerCase?.() === nm.toLowerCase());

        const r = (label: string, a: 'read' | 'edit' | 'delete') => pname(label, a);

        if (!hasRole('Small investor')) {
          state.roles = [{ id: `role-${Math.random().toString(36).slice(2,8)}`, name: 'Small investor', permissionIds: roleEnsureIds([r('News Bar', 'read'), r('Blogs', 'read')]) }, ...(state.roles || [])];
        }
        if (!hasRole('Big investor')) {
          state.roles = [{ id: `role-${Math.random().toString(36).slice(2,8)}`, name: 'Big investor', permissionIds: roleEnsureIds([
            r('Customers', 'read'), r('Email subscriptions', 'read'), r('Employees', 'read'), r('News Bar', 'read'), r('Blogs', 'read'), r('Finance', 'read'), r('Reports', 'read'), r('Tag Manager', 'read'), r('Company settings', 'read')
          ]) }, ...(state.roles || [])];
        }
        if (!hasRole('Editor')) {
          state.roles = [{ id: `role-${Math.random().toString(36).slice(2,8)}`, name: 'Editor', permissionIds: roleEnsureIds([
            r('News Bar', 'read'), r('News Bar', 'edit'), r('Blogs', 'read'), r('Blogs', 'edit'), r('Email subscriptions', 'read'), r('Email subscriptions', 'edit'), r('Tag Manager', 'read'), r('Tag Manager', 'edit')
          ]) }, ...(state.roles || [])];
        }
        if (!hasRole('Management')) {
          const allNames = seedPermissions.map((p) => p.name).filter((nm) => nm !== r('Reports', 'edit') && nm !== r('Reports', 'delete') && nm !== r('Company settings', 'delete'));
          state.roles = [{ id: `role-${Math.random().toString(36).slice(2,8)}`, name: 'Management', permissionIds: roleEnsureIds(allNames) }, ...(state.roles || [])];
        }

        // Dedupe permissions by id and by name
        {
          const seenId = new Set<string>();
          const nameToId = new Map<string, string>();
          const idRemap = new Map<string, string>();
          const dedup: Permission[] = [];
          for (const p of state.permissions || []) {
            if (!p || !p.id || !p.name) continue;
            if (seenId.has(p.id)) {
              // duplicate id; skip
              continue;
            }
            if (nameToId.has(p.name)) {
              // duplicate name with different id; remap this id to kept id
              idRemap.set(p.id, nameToId.get(p.name)!);
              continue;
            }
            seenId.add(p.id);
            nameToId.set(p.name, p.id);
            dedup.push(p);
          }
          // apply remap to roles and employees
          const remapIds = (ids: string[]) => Array.from(new Set(ids.map((id) => idRemap.get(id) || id)));
          state.roles = (state.roles || []).map((r) => ({ ...r, permissionIds: remapIds(r.permissionIds || []) }));
          state.employees = (state.employees || []).map((e) => ({ ...e, permissionIds: remapIds(e.permissionIds || []) }));
          state.permissions = dedup;
        }

        // Seed mocked employees if none exist
        if (!state.employees || state.employees.length === 0) {
          const roleByName = new Map((state.roles || []).map((ro) => [ro.name, ro.id] as const));
          const bugs: Employee = {
            id: `emp-${Math.random().toString(36).slice(2,8)}`,
            name: 'Bugs Bunny',
            email: 'bugs@looney.example',
            roleIds: [roleByName.get('Small investor')!].filter(Boolean) as string[],
            permissionIds: [],
            isAdmin: false,
          };
          const daffy: Employee = {
            id: `emp-${Math.random().toString(36).slice(2,8)}`,
            name: 'Daffy Duck',
            email: 'daffy@looney.example',
            roleIds: [roleByName.get('Big investor')!].filter(Boolean) as string[],
            permissionIds: [],
            isAdmin: false,
          };
          state.employees = [bugs, daffy, ...(state.employees || [])];
        }

        return state as any;
      },
    }
  )
);
