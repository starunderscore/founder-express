import { NextResponse } from 'next/server';
import { getStripe } from '../_lib/stripe';

function mapTax(tr: any) {
  const archiveAt = tr.metadata?.archiveAt ? Number(tr.metadata.archiveAt) : null;
  const removedAt = tr.metadata?.removedAt ? Number(tr.metadata.removedAt) : null;
  return {
    id: tr.id,
    name: tr.display_name,
    rate: Number(tr.percentage) || 0,
    enabled: !!tr.active,
    inclusive: !!tr.inclusive,
    country: tr.country || undefined,
    state: tr.state || undefined,
    description: tr.description || undefined,
    archiveAt,
    removedAt,
    createdAt: tr.created ? (Number(tr.created) * 1000) : undefined,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'active';
  const stripe = getStripe();
  const act = await stripe.taxRates.list({ active: true, limit: 100 });
  const inact = await stripe.taxRates.list({ active: false, limit: 100 });
  const all = [...act.data, ...inact.data];
  const filtered = all.filter((t) => {
    const archiveAt = t.metadata?.archiveAt || null;
    const removedAt = t.metadata?.removedAt || null;
    if (status === 'removed') return !!removedAt;
    if (status === 'archived') return !removedAt && !!archiveAt;
    return !removedAt && !archiveAt;
  });
  const rows = filtered.map(mapTax);
  return NextResponse.json({ taxes: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const stripe = getStripe();
  const tr = await stripe.taxRates.create({
    display_name: String(body.name || '').trim(),
    percentage: Number(body.rate) || 0,
    inclusive: !!body.inclusive,
    active: body.enabled !== false,
    description: body.description ? String(body.description) : undefined,
    country: body.country || undefined,
    state: body.state || undefined,
    metadata: { archiveAt: '', removedAt: '' },
  });
  return NextResponse.json({ id: tr.id });
}
