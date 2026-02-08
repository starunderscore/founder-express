import { Action, Resource, RESOURCES, labelFor } from './permissionsSchema';
export { labelFor } from './permissionsSchema';

function toggleName(name: string, checked: boolean, next: Set<string>) {
  if (checked) next.add(name); else next.delete(name);
}

function applyToggleWithDeps(res: { label: string }, action: Action, checked: boolean, next: Set<string>) {
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
}

function toggleReadVariants(variantNames: string[], checked: boolean, next: Set<string>) {
  for (const nm of variantNames) toggleName(nm, checked, next);
}

function ensureReadVariantForEdit(variantNames: string[], next: Set<string>) {
  // Only ensure a variant if none selected; choose least-privileged (Read Own)
  const anyOn = variantNames.some((n) => next.has(n));
  if (!anyOn) {
    const own = variantNames.find((n) => n.includes('Read (Own)')) || variantNames[0];
    // Enforce mutual exclusion: turn on own, turn others off
    toggleName(own, true, next);
    variantNames.filter((n) => n !== own).forEach((n) => toggleName(n, false, next));
  }
}

export function toggleSingleReadVariant(child: { label: string; readVariants?: Array<{ key: string; label: string }> }, variantNames: string[], variantName: string, checked: boolean, next: Set<string>) {
  if (checked) {
    // Turn on selected variant and turn off others (mutual exclusion)
    toggleName(variantName, true, next);
    variantNames.filter((n) => n !== variantName).forEach((n) => toggleName(n, false, next));
  } else {
    toggleName(variantName, false, next);
  }
  const anyOn = variantNames.some((n) => next.has(n));
  if (!anyOn) {
    toggleName(labelFor(child as any, 'edit'), false, next);
    toggleName(labelFor(child as any, 'delete'), false, next);
  }
}

export function permissionNamesForResourceKey(key: string): { resource?: Resource; children: Resource[] } {
  const r = RESOURCES.find((x) => x.key === key);
  return { resource: r, children: r?.children || [] };
}

export function computeGroupToggle(selected: string[], resourceKey: string, action: Action, checked: boolean): string[] {
  const { resource: r } = permissionNamesForResourceKey(resourceKey);
  if (!r) return selected;
  const hasChildren = !!(r.children && r.children.length);
  const children = r.children || [];
  const actionableChildren = (a: Action) => children.filter((c) => c.actions.includes(a) || (a === 'read' && c.readVariants && c.readVariants.length));

  const next = new Set(selected);
  if (!hasChildren) {
    applyToggleWithDeps(r, action, checked, next);
  } else {
    if (action === 'read') {
      children.forEach((c) => {
    if (c.readVariants && c.readVariants.length) {
      const names = c.readVariants.map((rv) => labelFor({ label: rv.label } as any, 'read'));
      if (checked) {
        ensureReadVariantForEdit(names, next);
      } else {
        toggleReadVariants(names, false, next);
        toggleName(labelFor(c as any, 'edit'), false, next);
        toggleName(labelFor(c as any, 'delete'), false, next);
      }
    } else if (c.actions.includes('read')) {
      applyToggleWithDeps(c, 'read', checked, next);
    }
      });
    } else {
      actionableChildren(action).forEach((c) => {
        if (checked && c.readVariants && c.readVariants.length) {
          const names = c.readVariants.map((rv) => labelFor({ label: rv.label } as any, 'read'));
          ensureReadVariantForEdit(names, next);
        }
        applyToggleWithDeps(c, action, checked, next);
      });
    }
  }
  return Array.from(next);
}

export function computeChildToggle(selected: string[], parentKey: string, childKey: string, action: Action, checked: boolean): string[] {
  const { resource: parent } = permissionNamesForResourceKey(parentKey);
  if (!parent) return selected;
  const child = (parent.children || []).find((c) => c.key === childKey);
  if (!child) return selected;
  const next = new Set(selected);
  if (action === 'read') {
    if (child.readVariants && child.readVariants.length) {
      const names = child.readVariants.map((rv) => labelFor({ label: rv.label } as any, 'read'));
      // Single variant toggle semantics: if not all selected, clear edit/delete
      // Here we cannot infer which single variant changed; apply group semantics instead
      toggleReadVariants([labelFor({ label: child.readVariants[0].label } as any, 'read')], checked, next);
      toggleReadVariants(names.slice(1), checked, next);
      const allOn = names.length > 0 && names.every((n) => next.has(n));
      if (!allOn) {
        toggleName(labelFor(child as any, 'edit'), false, next);
        toggleName(labelFor(child as any, 'delete'), false, next);
      }
    } else {
      applyToggleWithDeps(child, 'read', checked, next);
    }
  } else {
    if (checked && child.readVariants && child.readVariants.length) {
      const names = child.readVariants.map((rv) => labelFor({ label: rv.label } as any, 'read'));
      ensureReadVariantForEdit(names, next);
    }
    applyToggleWithDeps(child, action, checked, next);
  }
  return Array.from(next);
}

export function computeChildToggleVariant(selected: string[], parentKey: string, childKey: string, variantLabel: string, checked: boolean): string[] {
  const { resource: parent } = permissionNamesForResourceKey(parentKey);
  if (!parent) return selected;
  const child = (parent.children || []).find((c) => c.key === childKey);
  if (!child) return selected;
  const names = (child.readVariants || []).map((rv) => labelFor({ label: rv.label } as any, 'read'));
  const next = new Set(selected);
  toggleSingleReadVariant(child as any, names, `${variantLabel}: Read`, checked, next);
  return Array.from(next);
}
