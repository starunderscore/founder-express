import { describe, it, expect } from '@jest/globals';
import { computeChildToggle, computeGroupToggle, computeChildToggleVariant } from '../../components/permissionsMatrixLogic';
import { labelFor, permissionNamesForResourceKey } from '../../components/permissionsMatrixLogic';

const hasAll = (arr: string[], names: string[]) => names.every((n) => arr.includes(n));
const hasNone = (arr: string[], names: string[]) => names.every((n) => !arr.includes(n));

describe('PermissionsMatrix logic', () => {
  it('Customers group Read sets CRM Read(Own) when none selected and Vendor Read', () => {
    // None selected initially
    const next = computeGroupToggle([], 'customers', 'read', true);
    expect(next).toContain('CRM — Read (Own): Read');
    expect(next).not.toContain('CRM — Read (All): Read');
    expect(next).toContain('Vendor: Read');
  });

  it('Customers group Edit cascades to CRM and Vendor; ensures CRM read only if none selected', () => {
    // With no CRM read selected, group edit ensures Read(Own)
    let next = computeGroupToggle([], 'customers', 'edit', true);
    expect(next).toContain('CRM — Read (Own): Read');
    expect(next).toContain('CRM: Edit');
    expect(next).toContain('Vendor: Edit');

    // If CRM already has Read(All), group edit should not alter it
    next = computeGroupToggle(['CRM — Read (All): Read'], 'customers', 'edit', true);
    expect(next).toContain('CRM — Read (All): Read');
    expect(next).not.toContain('CRM — Read (Own): Read');
    expect(next).toContain('CRM: Edit');
    expect(next).toContain('Vendor: Edit');
  });

  it('Email subscriptions: group Read checks both Newsletter and Waiting list', () => {
    const next = computeGroupToggle([], 'email_subscriptions', 'read', true);
    expect(hasAll(next, [labelFor({ label: 'Newsletter' } as any, 'read'), labelFor({ label: 'Waiting list' } as any, 'read')])).toBe(true);
  });

  it('Website: group Read checks both News Bar and Blogs', () => {
    const next = computeGroupToggle([], 'website', 'read', true);
    expect(hasAll(next, [labelFor({ label: 'News Bar' } as any, 'read'), labelFor({ label: 'Blogs' } as any, 'read')])).toBe(true);
  });

  it('Finance: group Edit cascades with dependencies to all subsections', () => {
    const next = computeGroupToggle([], 'finance', 'edit', true);
    // Edit implies Read for each subsection
    const subs = ['Overview', 'Invoices', 'Financial reports', 'Financial settings'];
    for (const s of subs) {
      expect(next).toContain(labelFor({ label: s } as any, 'edit'));
      expect(next).toContain(labelFor({ label: s } as any, 'read'));
    }
  });

  it('CRM Edit/Delete select Read (Own) by default when no read variant selected; do not override existing Read(All)', () => {
    // Toggle edit on CRM child under Customers
    let next = computeChildToggle([], 'customers', 'customers-crm', 'edit', true);
    expect(next).toContain('CRM — Read (Own): Read');
    expect(next).not.toContain('CRM — Read (All): Read');
    expect(next).toContain('CRM: Edit');

    // Toggle delete should imply edit + read(own)
    next = computeChildToggle([], 'customers', 'customers-crm', 'delete', true);
    expect(next).toContain('CRM — Read (Own): Read');
    expect(next).not.toContain('CRM — Read (All): Read');
    expect(next).toContain('CRM: Edit');
    expect(next).toContain('CRM: Delete');

    // With Read(All) already on, toggling Edit preserves it
    next = computeChildToggle(['CRM — Read (All): Read'], 'customers', 'customers-crm', 'edit', true);
    expect(next).toContain('CRM — Read (All): Read');
    expect(next).not.toContain('CRM — Read (Own): Read');
  });

  it('CRM read variants are mutually exclusive', () => {
    let selected: string[] = [];
    // Turn on Read(Own)
    selected = computeChildToggleVariant(selected, 'customers', 'customers-crm', 'CRM — Read (Own)', true);
    expect(selected).toContain('CRM — Read (Own): Read');
    expect(selected).not.toContain('CRM — Read (All): Read');
    // Turn on Read(All) switches off Read(Own)
    selected = computeChildToggleVariant(selected, 'customers', 'customers-crm', 'CRM — Read (All)', true);
    expect(selected).toContain('CRM — Read (All): Read');
    expect(selected).not.toContain('CRM — Read (Own): Read');
  });

  it('CRM unchecking the only selected read variant clears Edit/Delete', () => {
    let selected: string[] = ['CRM — Read (Own): Read', 'CRM: Edit', 'CRM: Delete'];
    selected = computeChildToggleVariant(selected, 'customers', 'customers-crm', 'CRM — Read (Own)', false);
    expect(selected).not.toContain('CRM: Edit');
    expect(selected).not.toContain('CRM: Delete');
  });
});
