import { NextResponse } from 'next/server';
import { getStripe } from '../../_lib/stripe';

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const stripe = getStripe();
  const body = await _req.json();
  const update: any = {};
  if (typeof body.name === 'string') update.name = body.name.trim();
  if (typeof body.description === 'string') update.description = body.description.trim() || null;
  if (typeof body.active === 'boolean') update.active = body.active;
  const meta: Record<string, string> = {};
  if (body.defaultType) meta.defaultType = body.defaultType;
  if (Object.keys(meta).length) update.metadata = meta;
  await stripe.products.update(params.id, update);
  return NextResponse.json({ ok: true });
}

