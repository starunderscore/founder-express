"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LeadSource =
  | 'no-source'
  | 'Website'
  | 'Referral'
  | 'Paid Ads'
  | 'Social'
  | 'Event'
  | 'Import'
  | 'Waiting List'
  | 'Other';

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByPhotoURL?: string;
};

export type Email = {
  id: string;
  email: string;
  label?: string;
  kind?: 'Personal' | 'Work';
  notes?: Note[];
};

export type Phone = {
  id: string;
  number: string;
  label?: string;
  ext?: string;
  addressId?: string; // if attached to a building/address
  kind?: 'Personal' | 'Work';
  notes?: Note[];
};

export type Address = {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
  isHQ?: boolean;
  phones?: Phone[];
};

export type Contact = {
  id: string;
  name: string;
  title?: string;
  createdAt?: number;
  deletedAt?: number; // soft-deleted timestamp for contacts
  tags?: string[];
  emails?: Email[];
  phones?: Phone[];
  addresses?: Address[];
  notes?: Note[];
  // management flags for contact-level actions
  isBlocked?: boolean;
  isArchived?: boolean;
  doNotContact?: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes?: Note[];
  source: LeadSource;
  sourceDetail?: string; // when source is 'Other'
  createdAt: number;
  tags: string[];
  type: 'customer' | 'vendor';
  addresses?: Address[];
  contacts?: Contact[];
  emails?: Email[]; // additional organization-level emails
  phones?: Phone[]; // additional organization-level phones
  ownerId?: string; // employee id who owns this record
  // management flags
  isBlocked?: boolean; // block sign-in or access
  isArchived?: boolean; // hide from active lists
  doNotContact?: boolean; // marketing/ops restriction
  deletedAt?: number; // soft-deleted timestamp
};

type CRMState = {
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'type'> & { type?: 'customer' | 'vendor' }) => string;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  clearAll: () => void;
};

export const useCRMStore = create<CRMState>()(
  persist(
    (set) => ({
      customers: [],
      addCustomer: (c) => {
        let newId = '';
        set((s) => {
          newId = `cus-${Date.now()}`;
          return { customers: [{ ...c, type: c.type ?? 'customer', id: newId, createdAt: Date.now() }, ...s.customers] };
        });
        return newId;
      },
      updateCustomer: (id, patch) =>
        set((s) => ({ customers: s.customers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeCustomer: (id) => set((s) => ({ customers: s.customers.filter((x) => x.id !== id) })),
      clearAll: () => set(() => ({ customers: [] })),
    }),
    {
      name: 'pattern-typing-crm',
      version: 12,
      migrate: (persisted: any, version?: number) => {
        if (!persisted) return { customers: [] } as any;
        if (!Array.isArray(persisted.customers)) return { customers: [] } as any;

        // Coerce old shapes into the new one
        const customers = (persisted.customers as any[]).map((c) => {
          const type = c?.type ?? 'customer';
          const base = { ...c, type } as any;

          // v1 -> v2 notes migration (string -> Note[])
          if (typeof base.notes === 'string') {
            const body = base.notes.trim();
            base.notes = body
              ? [
                  {
                    id: `note-${base.id ?? Date.now()}`,
                    title: 'Note',
                    body,
                    createdAt: base.createdAt ?? Date.now(),
                  },
                ]
              : [];
          }
          if (!Array.isArray(base.notes)) base.notes = [];

          // normalize old source label casing
          if (base.source === 'waiting list') base.source = 'Waiting List';

          // v2 -> v3 initialize new collections
          if (!Array.isArray(base.addresses)) base.addresses = [];
          if (!Array.isArray(base.contacts)) base.contacts = [];
          if (!Array.isArray(base.emails)) base.emails = [];
          if (!Array.isArray(base.phones)) base.phones = [];

          // ensure only one HQ
          let hqFound = false;
          base.addresses = base.addresses.map((a: any) => {
            const isHQ = !!a?.isHQ && !hqFound;
            if (isHQ) hqFound = true;
            return { ...a, isHQ };
          });

          // ensure notes arrays exist on emails/phones and normalize kind
          const normalizeKind = (v: any) => (v === 'Personal' || v === 'Work' ? v : undefined);
          base.emails = base.emails.map((e: any) => ({ ...e, notes: Array.isArray(e?.notes) ? e.notes : [], kind: normalizeKind(e?.kind) }));
          base.phones = base.phones.map((p: any) => ({ ...p, notes: Array.isArray(p?.notes) ? p.notes : [], kind: normalizeKind(p?.kind) }));

          // v4 -> v5: ownerId optional, keep if present otherwise undefined
          if (typeof base.ownerId !== 'string') base.ownerId = undefined;

          // v5 -> v6: ensure notes have optional author fields
          if (Array.isArray(base.notes)) {
            base.notes = base.notes.map((n: any) => ({
              ...n,
              createdByName: typeof n?.createdByName === 'string' ? n.createdByName : undefined,
              createdByEmail: typeof n?.createdByEmail === 'string' ? n.createdByEmail : undefined,
              createdByPhotoURL: typeof n?.createdByPhotoURL === 'string' ? n.createdByPhotoURL : undefined,
            }));
          }

          // v6 -> v7: ensure contact subcollections exist and normalize contact notes
          base.contacts = base.contacts.map((c: any) => {
            const cc: any = { ...c };
            if (typeof cc.createdAt !== 'number') cc.createdAt = Date.now();
            if (typeof cc.deletedAt !== 'number') cc.deletedAt = undefined;
            if (!Array.isArray(cc.tags)) cc.tags = [];
            if (!Array.isArray(cc.emails)) cc.emails = [];
            if (!Array.isArray(cc.phones)) cc.phones = [];
            if (!Array.isArray(cc.addresses)) cc.addresses = [];
            if (!Array.isArray(cc.notes)) cc.notes = [];
            cc.notes = cc.notes.map((n: any) => ({
              ...n,
              createdByName: typeof n?.createdByName === 'string' ? n.createdByName : undefined,
              createdByEmail: typeof n?.createdByEmail === 'string' ? n.createdByEmail : undefined,
              createdByPhotoURL: typeof n?.createdByPhotoURL === 'string' ? n.createdByPhotoURL : undefined,
            }));
            cc.emails = cc.emails.map((e: any) => ({ ...e, notes: Array.isArray(e?.notes) ? e.notes : [], kind: normalizeKind(e?.kind) }));
            cc.phones = cc.phones.map((p: any) => ({ ...p, notes: Array.isArray(p?.notes) ? p.notes : [], kind: normalizeKind(p?.kind) }));
            // v9 -> v10: initialize contact management flags
            if (typeof cc.isBlocked !== 'boolean') cc.isBlocked = false;
            if (typeof cc.isArchived !== 'boolean') cc.isArchived = false;
            if (typeof cc.doNotContact !== 'boolean') cc.doNotContact = false;
            return cc;
          });

          // v8 -> v9: initialize management flags
          if (typeof base.isBlocked !== 'boolean') base.isBlocked = false;
          if (typeof base.isArchived !== 'boolean') base.isArchived = false;
          if (typeof base.doNotContact !== 'boolean') base.doNotContact = false;
          // v11 -> v12: initialize deletedAt
          if (typeof base.deletedAt !== 'number') base.deletedAt = undefined;

          return base;
        });

        return { ...persisted, customers } as any;
      },
    }
  )
);
