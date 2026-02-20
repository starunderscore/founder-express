"use client";
import { create } from 'zustand';

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
  amount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  issuedAt: number;
  paidAt?: number;
  notes?: string;
  items?: InvoiceItem[];
  taxIds?: string[];
  subtotal?: number;
  taxTotal?: number;
};

export type Tax = {
  id: string;
  name: string;
  rate: number;
  enabled: boolean;
  isArchived?: boolean;
  deletedAt?: number;
};

export type Price = {
  id: string;
  currency: string;
  unitAmount: number;
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

export type InvoiceTemplate = {
  id: string;
  name: string;
  items: Omit<InvoiceItem, 'id'>[];
  taxIds: string[];
  isArchived?: boolean;
  deletedAt?: number;
};

export type FinanceSettings = {
  currency: string;
  gracePeriodDays: number;
  enforceTax: boolean;
  taxes: Tax[];
  templates: InvoiceTemplate[];
  products: Product[];
};

type FinanceState = {
  invoices: Invoice[];
  settings: FinanceSettings;
  // invoices
  addInvoice: (inv: Omit<Invoice, 'id' | 'issuedAt' | 'status'> & { status?: InvoiceStatus }) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  markPaid: (id: string) => void;
  // general
  setCurrency: (cur: string) => void;
  setGracePeriodDays: (days: number) => void;
  setEnforceTax: (enforce: boolean) => void;
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

const initialSettings: FinanceSettings = {
  currency: 'USD',
  gracePeriodDays: 7,
  enforceTax: true,
  taxes: [],
  templates: [],
  products: [],
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  invoices: [],
  settings: initialSettings,
  // invoices
  addInvoice: (inv) => set((s) => ({ invoices: [{ id: `inv-${Date.now()}`, issuedAt: Date.now(), status: inv.status ?? 'Unpaid', ...inv }, ...s.invoices] })),
  updateInvoice: (id, patch) => set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  removeInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
  markPaid: (id) => set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, status: 'Paid', paidAt: Date.now() } : x)) })),
  // general
  setCurrency: (cur) => set((s) => ({ settings: { ...s.settings, currency: cur } })),
  setGracePeriodDays: (days) => set((s) => ({ settings: { ...s.settings, gracePeriodDays: Math.max(0, Math.floor(days)) } })),
  setEnforceTax: (enforce) => set((s) => ({ settings: { ...s.settings, enforceTax: !!enforce } })),
  // taxes
  addTax: (t) => set((s) => ({ settings: { ...s.settings, taxes: [{ id: `tax-${Date.now()}`, enabled: t.enabled ?? true, name: t.name, rate: t.rate, ...t }, ...s.settings.taxes] } })),
  updateTax: (id, patch) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
  removeTax: (id) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, deletedAt: Date.now() } : x)) } })),
  archiveTax: (id) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, isArchived: true } : x)) } })),
  restoreTax: (id) => set((s) => ({ settings: { ...s.settings, taxes: s.settings.taxes.map((x) => (x.id === id ? { ...x, isArchived: false, deletedAt: undefined } : x)) } })),
  // templates
  addTemplate: (tpl) => set((s) => ({ settings: { ...s.settings, templates: [{ id: `tpl-${Date.now()}`, ...tpl }, ...s.settings.templates] } })),
  updateTemplate: (id, patch) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
  removeTemplate: (id) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, deletedAt: Date.now() } : x)) } })),
  archiveTemplate: (id) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, isArchived: true } : x)) } })),
  restoreTemplate: (id) => set((s) => ({ settings: { ...s.settings, templates: s.settings.templates.map((x) => (x.id === id ? { ...x, isArchived: false, deletedAt: undefined } : x)) } })),
  // products
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
  archiveProduct: (id) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((x) => (x.id === id ? { ...x, isArchived: true } : x)) } })),
  restoreProduct: (id) => set((s) => ({ settings: { ...s.settings, products: s.settings.products.map((x) => (x.id === id ? { ...x, isArchived: false, deletedAt: undefined } : x)) } })),
}));

