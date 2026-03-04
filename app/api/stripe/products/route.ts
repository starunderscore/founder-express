import { NextResponse } from 'next/server';
import { getStripe } from '../_lib/stripe';

function mapProduct(p: any, prices: any[]) {
  const archiveAt = p.metadata?.archiveAt ? Number(p.metadata.archiveAt) : null;
  const removedAt = p.metadata?.removedAt ? Number(p.metadata.removedAt) : null;
  return {
    id: p.id,
    name: p.name,
    description: p.description || undefined,
    active: !!p.active,
    defaultType: (p.metadata?.defaultType === 'recurring' || p.metadata?.defaultType === 'one_time') ? p.metadata.defaultType : undefined,
    archiveAt,
    removedAt,
    createdAt: p.created ? (Number(p.created) * 1000) : undefined,
    prices: prices.map((pr) => ({
      id: pr.id,
      currency: pr.currency?.toUpperCase?.() || 'USD',
      unitAmount: Number(pr.unit_amount || 0) / 100,
      type: pr.type === 'recurring' ? 'recurring' : 'one_time',
      recurring: pr.type === 'recurring' ? { interval: pr.recurring?.interval, intervalCount: pr.recurring?.interval_count } : undefined,
      active: pr.active,
    })),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'active';
  const stripe = getStripe();
  const listActive = await stripe.products.list({ active: true, limit: 100 });
  const listInactive = await stripe.products.list({ active: false, limit: 100 });
  const all = [...listActive.data, ...listInactive.data];
  const filtered = all.filter((p) => {
    const archiveAt = p.metadata?.archiveAt || null;
    const removedAt = p.metadata?.removedAt || null;
    if (status === 'removed') return !!removedAt;
    if (status === 'archived') return !removedAt && (!!archiveAt || !p.active);
    return !removedAt && !archiveAt && p.active;
  });
  const products = await Promise.all(filtered.map(async (p) => {
    const prices = await stripe.prices.list({ product: p.id, limit: 100 });
    return mapProduct(p, prices.data);
  }));
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const body = await req.json();
  const stripe = getStripe();
  const prod = await stripe.products.create({
    name: String(body.name || '').trim(),
    description: body.description || undefined,
    active: body.active !== false,
    metadata: { archiveAt: '', removedAt: '', defaultType: body.defaultType || '' },
  });
  return NextResponse.json({ id: prod.id });
}

