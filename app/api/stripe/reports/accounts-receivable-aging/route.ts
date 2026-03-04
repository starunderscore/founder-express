import { NextResponse } from 'next/server';
import { getStripe } from '../../_lib/stripe';
import type Stripe from 'stripe';

type Bucket = { name: string; min: number; max: number; amountCents: number; count: number; items: any[] };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filterCurrency = (searchParams.get('currency') || '').toUpperCase() || undefined;
  const stripe = getStripe();

  async function listAll(status: 'open' | 'uncollectible') {
    const items: Stripe.Invoice[] = [] as any;
    let starting_after: string | undefined = undefined;
    for (let page = 0; page < 20; page++) {
      const pageRes = await stripe.invoices.list({ status, limit: 100, starting_after });
      items.push(...pageRes.data);
      if (!pageRes.has_more) break;
      starting_after = pageRes.data[pageRes.data.length - 1]?.id;
      if (!starting_after) break;
    }
    return items;
  }

  // Fetch unpaid-like invoices
  const [open, uncollectible] = await Promise.all([listAll('open'), listAll('uncollectible')]);
  let invoices = [...open, ...uncollectible];

  if (filterCurrency) {
    invoices = invoices.filter((i) => (i.currency || '').toUpperCase() === filterCurrency);
  }

  // Decide a display currency
  const currency = (filterCurrency || invoices[0]?.currency?.toUpperCase?.() || 'USD').toUpperCase();

  const nowSec = Math.floor(Date.now() / 1000);

  const buckets: Bucket[] = [
    { name: '0–30 days', min: 0, max: 30, amountCents: 0, count: 0, items: [] },
    { name: '31–60 days', min: 31, max: 60, amountCents: 0, count: 0, items: [] },
    { name: '61–90 days', min: 61, max: 90, amountCents: 0, count: 0, items: [] },
    { name: '90+ days', min: 91, max: Number.POSITIVE_INFINITY, amountCents: 0, count: 0, items: [] },
  ];

  for (const inv of invoices) {
    // Remaining balance in cents
    const amountCents = (inv.amount_remaining ?? inv.amount_due ?? 0) as number;
    if (!amountCents) continue;

    // Determine due date in seconds
    let dueSec: number | null = null;
    if (typeof inv.due_date === 'number') dueSec = inv.due_date;
    else if (inv.next_payment_attempt) dueSec = inv.next_payment_attempt as number;
    else if (typeof inv.created === 'number') dueSec = inv.created; // fallback

    let pastDays = 0;
    if (dueSec && nowSec > dueSec) {
      pastDays = Math.floor((nowSec - dueSec) / 86400);
    }

    const bucket = buckets.find((b) => pastDays >= b.min && pastDays <= b.max);
    if (!bucket) continue;

    bucket.amountCents += amountCents;
    bucket.count += 1;
    bucket.items.push({
      id: inv.id,
      customerId: typeof inv.customer === 'string' ? inv.customer : (inv.customer as any)?.id,
      dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
      daysPastDue: pastDays,
      amount: amountCents / 100,
      status: inv.status,
    });
  }

  const bucketsOut = buckets.map((b) => ({ name: b.name, amount: b.amountCents / 100, count: b.count, items: b.items }));
  const total = bucketsOut.reduce((s, b) => s + b.amount, 0);
  const totalCount = bucketsOut.reduce((s, b) => s + b.count, 0);

  return NextResponse.json({ currency, buckets: bucketsOut, total, totalCount });
}
