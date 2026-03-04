import { NextResponse } from 'next/server';
import { getStripe } from '../../_lib/stripe';
import type Stripe from 'stripe';

function getRange(key: string, now: Date) {
  if (key === '6m') return { start: new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime() / 1000, end: now.getTime() / 1000 };
  if (key === '12m') return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime() / 1000, end: now.getTime() / 1000 };
  if (key === 'ytd') return { start: new Date(now.getFullYear(), 0, 1).getTime() / 1000, end: now.getTime() / 1000 };
  return { start: 0, end: now.getTime() / 1000 };
}

async function listAllPaidInvoices(stripe: Stripe, params: Stripe.InvoiceListParams) {
  const items: Stripe.Invoice[] = [];
  let starting_after: string | undefined = undefined;
  for (let page = 0; page < 50; page++) {
    const pageRes = await stripe.invoices.list({ ...params, limit: 100, starting_after });
    items.push(...pageRes.data);
    if (!pageRes.has_more) break;
    starting_after = pageRes.data[pageRes.data.length - 1]?.id;
    if (!starting_after) break;
  }
  return items;
}

async function listAllInvoiceLines(stripe: Stripe, invoiceId: string) {
  const items: Stripe.InvoiceLineItem[] = [];
  let starting_after: string | undefined = undefined;
  for (let page = 0; page < 50; page++) {
    const pageRes = await stripe.invoices.listLineItems(invoiceId, { limit: 100, starting_after } as any);
    items.push(...pageRes.data);
    if (!pageRes.has_more) break;
    starting_after = pageRes.data[pageRes.data.length - 1]?.id;
    if (!starting_after) break;
  }
  return items;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get('range') || '12m').toLowerCase();
  const filterCurrency = (searchParams.get('currency') || '').toUpperCase() || undefined;
  const { start, end } = getRange(range, new Date());

  const stripe = getStripe();

  const invoices = await listAllPaidInvoices(stripe, { status: 'paid' });

  const filtered = invoices.filter((inv) => {
    const paidAt = (inv.status_transitions as any)?.paid_at || inv.created || 0; // seconds
    if (paidAt < start || paidAt > end) return false;
    const c = (inv.currency || '').toUpperCase();
    if (filterCurrency && c !== filterCurrency) return false;
    return true;
  });

  // Cache tax rate details
  const taxRateCache = new Map<string, Stripe.TaxRate>();
  async function getTaxRate(id: string) {
    if (taxRateCache.has(id)) return taxRateCache.get(id)!;
    const tr = await stripe.taxRates.retrieve(id);
    taxRateCache.set(id, tr);
    return tr;
  }

  const agg = new Map<string, { name: string; cents: number; count: number }>();

  for (const inv of filtered) {
    let usedInvoiceLevel = false;
    if (Array.isArray((inv as any).total_tax_amounts) && (inv as any).total_tax_amounts.length > 0) {
      usedInvoiceLevel = true;
      for (const t of (inv as any).total_tax_amounts as any[]) {
        const id = typeof t.tax_rate === 'string' ? t.tax_rate : (t.tax_rate?.id || 'unknown');
        const tr = id ? await getTaxRate(id) : undefined;
        const name = tr?.display_name || tr?.description || tr?.id || 'Tax';
        const cents = Number(t.amount || 0);
        if (!cents) continue;
        const cur = agg.get(id) || { name, cents: 0, count: 0 };
        cur.cents += cents;
        cur.count += 1;
        agg.set(id, cur);
      }
    }
    if (!usedInvoiceLevel) {
      // Fallback: sum line item tax_amounts
      const lines = await listAllInvoiceLines(stripe, inv.id);
      for (const li of lines) {
        const arr = (li as any).tax_amounts as any[] | undefined;
        if (!Array.isArray(arr) || arr.length === 0) continue;
        for (const t of arr) {
          const id = typeof t.tax_rate === 'string' ? t.tax_rate : (t.tax_rate?.id || 'unknown');
          const tr = id ? await getTaxRate(id) : undefined;
          const name = tr?.display_name || tr?.description || tr?.id || 'Tax';
          const cents = Number(t.amount || 0);
          if (!cents) continue;
          const cur = agg.get(id) || { name, cents: 0, count: 0 };
          cur.cents += cents;
          cur.count += 1;
          agg.set(id, cur);
        }
      }
    }
  }

  const rows = Array.from(agg.values()).map((v) => ({ name: v.name, value: v.cents / 100, count: v.count }));
  rows.sort((a, b) => b.value - a.value);
  return NextResponse.json({ rows });
}

