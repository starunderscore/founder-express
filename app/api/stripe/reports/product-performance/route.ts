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
    const pageRes = await stripe.invoices.listLineItems(invoiceId, { limit: 100, starting_after, expand: ['data.price.product'] } as any);
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

  // Filter invoices by paid time and currency
  const filtered = invoices.filter((inv) => {
    const paidAt = (inv.status_transitions as any)?.paid_at || inv.created || 0; // seconds
    if (paidAt < start || paidAt > end) return false;
    const c = (inv.currency || '').toUpperCase();
    if (filterCurrency && c !== filterCurrency) return false;
    return true;
  });

  // Aggregate per product name
  const agg = new Map<string, { cents: number; count: number }>();
  for (const inv of filtered) {
    const lines = await listAllInvoiceLines(stripe, inv.id);
    for (const li of lines) {
      const lineCurrency = (li.currency || '').toUpperCase();
      if (filterCurrency && lineCurrency !== filterCurrency) continue;
      // Best-effort amount in cents
      const cents = (typeof (li as any).amount === 'number' && (li as any).amount)
        || (typeof (li as any).amount_excluding_tax === 'number' && (li as any).amount_excluding_tax)
        || (typeof (li as any).amount_subtotal === 'number' && (li as any).amount_subtotal)
        || (((li.quantity || 0) as number) * ((li.price as any)?.unit_amount || 0));
      if (!cents) continue;
      // Product name
      let name: string | undefined;
      const p = (li.price?.product ?? undefined) as any;
      if (p && typeof p === 'object' && 'name' in p && p.name) name = p.name as string;
      if (!name) name = li.price?.nickname || li.description || (typeof li.price?.product === 'string' ? li.price?.product : undefined) || 'Uncategorized';
      const cur = agg.get(name) || { cents: 0, count: 0 };
      cur.cents += Number(cents);
      cur.count += 1;
      agg.set(name, cur);
    }
  }

  const rows = Array.from(agg.entries()).map(([name, v]) => ({ name, value: v.cents / 100, count: v.count }));
  rows.sort((a, b) => b.value - a.value);
  return NextResponse.json({ rows });
}

