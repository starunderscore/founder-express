"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InvoiceStatus = 'Unpaid' | 'Paid';

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  customerId: string;
  amount: number; // total including taxes
  currency: string; // e.g., USD
  dueDate: string; // ISO yyyy-mm-dd
  status: InvoiceStatus;
  issuedAt: number; // ts
  paidAt?: number;
  notes?: string;
  items?: InvoiceItem[];
  taxIds?: string[]; // snapshot of applied taxes ids
  subtotal?: number;
  taxTotal?: number;
};

export type FinanceSettings = {
  currency: string; // default currency for new invoices
  gracePeriodDays: number; // days after due before marked late
  enforceTax: boolean; // auto-apply enabled taxes to new invoices
  taxes: Tax[];
  templates: InvoiceTemplate[];
  products: Product[];
  quickbooks?: {
    enabled: boolean;
    companyId: string; // Realm ID
  };
};

export type Tax = {
  id: string;
  name: string;
  rate: number; // percent, e.g., 8.25
  enabled: boolean;
  isArchived?: boolean;
  deletedAt?: number;
};

export type InvoiceTemplate = {
  id: string;
  name: string;
  items: Omit<InvoiceItem, 'id'>[];
  taxIds: string[];
  isArchived?: boolean;
  deletedAt?: number;
};

export type Price = {
  id: string;
  currency: string;
  unitAmount: number; // major units
  type: 'one_time' | 'recurring';
  recurring?: { interval: 'day' | 'week' | 'month' | 'year'; intervalCount?: number };
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  prices: Price[];
  defaultType?: 'one_time' | 'recurring';
  isArchived?: boolean;
  deletedAt?: number;
};

type FinanceState = {
  invoices: Invoice[];
  settings: FinanceSettings;
  addInvoice: (inv: Omit<Invoice, 'id' | 'issuedAt' | 'status'> & { status?: InvoiceStatus }) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  markPaid: (id: string) => void;
  clearAll: () => void;
  // settings
  setCurrency: (cur: string) => void;
  setGracePeriodDays: (days: number) => void;
  setEnforceTax: (enforce: boolean) => void;
  setQuickBooksEnabled?: (enabled: boolean) => void;
  setQuickBooksCompanyId?: (id: string) => void;
  // taxes
  addTax: (t: Omit<Tax, 'id' | 'enabled'> & { enabled?: boolean }) => void;
  updateTax: (id: string, patch: Partial<Omit<Tax, 'id'>>) => void;
  removeTax: (id: string) => void;
  archiveTax: (id: string) => void;
  restoreTax: (id: string) => void;
  // templates
  addTemplate: (tpl: Omit<InvoiceTemplate, 'id'>) => void;
  updateTemplate: (id: string, patch: Partial<Omit<InvoiceTemplate, 'id'>>) => void;
  removeTemplate: (id: string) => void;
  archiveTemplate: (id: string) => void;
  restoreTemplate: (id: string) => void;
  // products
  addProduct: (p: Omit<Product, 'id' | 'prices' | 'active'> & { active?: boolean }) => string;
  updateProduct: (id: string, patch: Partial<Omit<Product, 'id'>>) => void;
  removeProduct: (id: string) => void;
  addPriceToProduct: (productId: string, price: Omit<Price, 'id'>) => void;
  updatePriceOnProduct: (productId: string, priceId: string, patch: Partial<Omit<Price, 'id'>>) => void;
  removePriceFromProduct: (productId: string, priceId: string) => void;
  archiveProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
};

const defaultSettings: FinanceSettings = {
  currency: 'USD',
  gracePeriodDays: 7,
  enforceTax: true,
  taxes: [
    { id: 'tax-std', name: 'Standard Tax', rate: 8.25, enabled: true },
    { id: 'tax-old', name: 'Legacy Tax', rate: 5.0, enabled: false, isArchived: true },
  ],
  templates: [
    {
      id: 'tpl-basic',
      name: 'Basic service',
      items: [
        { description: 'Service fee', quantity: 1, unitPrice: 100 },
      ],
      taxIds: ['tax-std'],
    },
    {
      id: 'tpl-old',
      name: 'Legacy template',
      items: [
        { description: 'Old service', quantity: 1, unitPrice: 50 },
      ],
      taxIds: ['tax-old'],
      isArchived: true,
    },
  ],
  products: [
    { id: 'prod-basic', name: 'Basic Plan', description: 'Monthly subscription', active: true, defaultType: 'recurring', prices: [
      { id: 'price-basic-m', currency: 'USD', unitAmount: 10, type: 'recurring', recurring: { interval: 'month', intervalCount: 1 } },
      { id: 'price-basic-y', currency: 'USD', unitAmount: 100, type: 'recurring', recurring: { interval: 'year', intervalCount: 1 } },
    ]},
    { id: 'prod-onetime', name: 'One-time Setup', description: 'Setup fee', active: true, defaultType: 'one_time', prices: [
      { id: 'price-setup', currency: 'USD', unitAmount: 49, type: 'one_time' },
    ]},
    { id: 'prod-old', name: 'Legacy Product', description: 'Deprecated', active: false, defaultType: 'one_time', isArchived: true, prices: [
      { id: 'price-old', currency: 'USD', unitAmount: 5, type: 'one_time' },
    ]},
  ],
  quickbooks: { enabled: false, companyId: '' },
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      invoices: [],
      settings: defaultSettings,
      addInvoice: (inv) =>
        set((s) => {
          // Compute totals if items/taxes present
          let subtotal = 0;
          if (Array.isArray(inv.items) && inv.items.length > 0) {
            subtotal = inv.items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);
          }
          const taxes = (inv.taxIds || []).map((id) => s.settings.taxes.find((t) => t.id === id)).filter(Boolean) as Tax[];
          const taxTotal = subtotal * taxes.reduce((acc, t) => acc + (t.enabled ? t.rate / 100 : 0), 0);
          const total = inv.items ? Math.round((subtotal + taxTotal) * 100) / 100 : inv.amount;
          const newInv: Invoice = {
            ...inv,
            amount: total,
            subtotal: inv.items ? subtotal : undefined,
            taxTotal: inv.items ? taxTotal : undefined,
            id: `inv-${Date.now()}`,
            issuedAt: Date.now(),
            status: inv.status ?? 'Unpaid',
          };
          return { invoices: [newInv, ...s.invoices] };
        }),
      updateInvoice: (id, patch) =>
        set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
      markPaid: (id) =>
        set((s) => ({
          invoices: s.invoices.map((x) => (x.id === id ? { ...x, status: 'Paid', paidAt: Date.now() } : x)),
        })),
      clearAll: () => set(() => ({ invoices: [] })),
      // settings
      setCurrency: (cur) => set((s) => ({ settings: { ...s.settings, currency: cur } })),
      setGracePeriodDays: (days) => set((s) => ({ settings: { ...s.settings, gracePeriodDays: Math.max(0, Math.floor(days)) } })),
      setEnforceTax: (enforce) => set((s) => ({ settings: { ...s.settings, enforceTax: !!enforce } })),
      setQuickBooksEnabled: (enabled) => set((s) => ({ settings: { ...s.settings, quickbooks: { ...(s.settings.quickbooks || { enabled: false, companyId: '' }), enabled: !!enabled } } })),
      setQuickBooksCompanyId: (id) => set((s) => ({ settings: { ...s.settings, quickbooks: { ...(s.settings.quickbooks || { enabled: false, companyId: '' }), companyId: id.trim() } } })),
      addTax: (t) => set((s) => ({ settings: { ...s.settings, taxes: [{ id: `tax-${Date.now()}`, name: t.name, rate: t.rate, enabled: t.enabled ?? true }, ...s.settings.taxes] } })),
      updateTax: (id, patch) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeTax: (id) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, deletedAt: Date.now() } : x)) } })),
      archiveTax: (id) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, isArchived: true } : x)) } })),
      restoreTax: (id) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, isArchived: false } : x)) } })),
      addTemplate: (tpl) => set((s) => ({ settings: { ...s.settings, templates: [{ id: `tpl-${Date.now()}`, ...tpl }, ...s.settings.templates] } })),
      updateTemplate: (id, patch) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeTemplate: (id) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, deletedAt: Date.now() } : x)) } })),
      archiveTemplate: (id) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, isArchived: true } : x)) } })),
      restoreTemplate: (id) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, isArchived: false } : x)) } })),
      addProduct: (p) => {
        const id = `prod-${Date.now()}`;
        set((s) => ({ settings: { ...s.settings, products: [{ id, name: p.name, description: p.description, active: (p as any).active ?? true, prices: [], defaultType: ((p as any).defaultType) || 'one_time' }, ...s.settings.products] } }));
        return id;
      },
      updateProduct: (id, patch) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeProduct: (id) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((x) => (x.id === id ? { ...x, deletedAt: Date.now() } : x)) } })),
      addPriceToProduct: (productId, price) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((p) => (p.id === productId ? { ...p, prices: [{ id: `price-${Date.now()}`, ...price }, ...p.prices] } : p)) } })),
      updatePriceOnProduct: (productId, priceId, patch) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((p) => (p.id === productId ? { ...p, prices: p.prices.map((pr) => (pr.id === priceId ? { ...pr, ...patch } : pr)) } : p)) } })),
      removePriceFromProduct: (productId, priceId) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((p) => (p.id === productId ? { ...p, prices: p.prices.filter((pr) => pr.id !== priceId) } : p)) } })),
      archiveProduct: (id) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((p) => (p.id === id ? { ...p, isArchived: true } : p)) } })),
      restoreProduct: (id) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((p) => (p.id === id ? { ...p, isArchived: false } : p)) } })),
    }),
    {
      name: 'pattern-typing-finance',
      version: 8,
      migrate: (persisted: any, version) => {
        if (!persisted) return { invoices: [], settings: defaultSettings } as any;
        if (!('settings' in persisted)) {
          return { ...persisted, settings: defaultSettings } as any;
        }
        if (version < 2) {
          if (!Array.isArray(persisted.settings.taxes)) persisted.settings.taxes = defaultSettings.taxes;
          if (!Array.isArray(persisted.settings.templates)) persisted.settings.templates = defaultSettings.templates;
        }
        if (version < 3) {
          if (!Array.isArray(persisted.settings.products)) persisted.settings.products = defaultSettings.products;
        }
        if (version < 4) {
          if (Array.isArray(persisted.settings.products)) {
            persisted.settings.products = persisted.settings.products.map((p: any) => ({ ...p, defaultType: p.defaultType || (Array.isArray(p.prices) && p.prices.some((x: any) => x.type === 'recurring') ? 'recurring' : 'one_time') }));
          }
        }
        if (version < 5) {
          if (typeof persisted.settings.enforceTax !== 'boolean') persisted.settings.enforceTax = true;
        }
        if (version < 6) {
          // Remove deprecated defaultPrice if present
          if ('defaultPrice' in (persisted.settings || {})) {
            delete persisted.settings.defaultPrice;
          }
        }
        if (version < 7) {
          const safeFlag = (v: any) => (typeof v === 'boolean' ? v : false);
          if (Array.isArray(persisted.settings.taxes)) {
            persisted.settings.taxes = persisted.settings.taxes.map((t: any) => ({ ...t, isArchived: safeFlag(t.isArchived) }));
          }
          if (Array.isArray(persisted.settings.templates)) {
            persisted.settings.templates = persisted.settings.templates.map((t: any) => ({ ...t, isArchived: safeFlag(t.isArchived) }));
          }
          if (Array.isArray(persisted.settings.products)) {
            persisted.settings.products = persisted.settings.products.map((p: any) => ({ ...p, isArchived: safeFlag(p.isArchived) }));
          }
        }
        if (version < 8) {
          const norm = (v: any) => (typeof v === 'number' ? v : undefined);
          if (Array.isArray(persisted.settings.taxes)) {
            persisted.settings.taxes = persisted.settings.taxes.map((t: any) => ({ ...t, deletedAt: norm(t.deletedAt) }));
          }
          if (Array.isArray(persisted.settings.templates)) {
            persisted.settings.templates = persisted.settings.templates.map((t: any) => ({ ...t, deletedAt: norm(t.deletedAt) }));
          }
          if (Array.isArray(persisted.settings.products)) {
            persisted.settings.products = persisted.settings.products.map((p: any) => ({ ...p, deletedAt: norm(p.deletedAt) }));
          }
          if (!persisted.settings.quickbooks) persisted.settings.quickbooks = { enabled: false, companyId: '' };
        }

        return persisted as any;
      },
    }
  )
);
