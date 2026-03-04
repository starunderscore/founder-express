import { NextResponse } from 'next/server';
import { getStripe } from '../../_lib/stripe';

type RangeKey = '30d' | '6m' | '12m' | 'ytd';

function rangeWindow(now: Date, range: RangeKey): { start: number; end: number; granularity: 'day'|'month'; label: string } {
  const end = Math.floor(now.getTime() / 1000);
  if (range === '30d') {
    const start = Math.floor(new Date(now.getTime() - 30 * 86400 * 1000).getTime() / 1000);
    return { start, end, granularity: 'day', label: 'last 30 days' };
  }
  if (range === '6m') {
    const startD = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const start = Math.floor(startD.getTime() / 1000);
    return { start, end, granularity: 'month', label: 'last 6 months' };
  }
  if (range === '12m') {
    const startD = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const start = Math.floor(startD.getTime() / 1000);
    return { start, end, granularity: 'month', label: 'last 12 months' };
  }
  // ytd
  const startD = new Date(now.getFullYear(), 0, 1);
  const start = Math.floor(startD.getTime() / 1000);
  return { start, end, granularity: 'month', label: `year to date (${now.getFullYear()})` };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get('range') as RangeKey) || '12m';
  const currency = (searchParams.get('currency') || '').toLowerCase();
  const now = new Date();
  const { start, end, granularity, label } = rangeWindow(now, range);

  const stripe = getStripe();
  const series: { label: string; value: number }[] = [];

  // Build buckets
  if (granularity === 'day') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400 * 1000);
      series.push({ label: d.toLocaleDateString(), value: 0 });
    }
  } else {
    const startD = new Date(start * 1000);
    const months = (now.getFullYear() - startD.getFullYear()) * 12 + (now.getMonth() - startD.getMonth()) + 1;
    for (let i = 0; i < months; i++) {
      const d = new Date(startD.getFullYear(), startD.getMonth() + i, 1);
      series.push({ label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), value: 0 });
    }
  }

  // Fetch paid invoices (paginate up to ~1000)
  let starting_after: string | undefined = undefined;
  let fetched = 0;
  const max = 1000;
  while (true) {
    const list = await stripe.invoices.list({ status: 'paid', created: { gte: start, lte: end }, limit: 100, starting_after } as any);
    for (const inv of list.data) {
      if (currency && inv.currency !== currency) continue;
      const paidAt = (inv as any)?.status_transitions?.paid_at || inv.created;
      const dt = new Date((paidAt || inv.created) * 1000);
      const amount = (inv.amount_paid || 0) / 100;
      if (granularity === 'day') {
        const lbl = dt.toLocaleDateString();
        const b = series.find((s) => s.label === lbl); if (b) b.value += amount;
      } else {
        const lbl = dt.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        const b = series.find((s) => s.label === lbl); if (b) b.value += amount;
      }
    }
    fetched += list.data.length;
    if (!list.has_more || list.data.length === 0 || fetched >= max) break;
    starting_after = list.data[list.data.length - 1].id;
  }

  const total = series.reduce((a, b) => a + b.value, 0);

  // Month-to-date
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mStartSec = Math.floor(mStart.getTime() / 1000);
  const mList = await stripe.invoices.list({ status: 'paid', created: { gte: mStartSec, lte: end }, limit: 100 } as any);
  const mtd = mList.data.reduce((sum, inv) => {
    if (currency && inv.currency !== currency) return sum;
    return sum + (inv.amount_paid || 0);
  }, 0) / 100;
  const mtdCount = mList.data.filter((inv) => (!currency || inv.currency === currency)).length;

  return NextResponse.json({ series, label, total, mtd, mtdLabel: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), mtdCount });
}
