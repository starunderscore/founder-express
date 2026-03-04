import { NextResponse } from 'next/server';
import { getStripe } from '../../../../_lib/stripe';

export async function PATCH(req: Request, { params }: { params: { id: string; priceId: string } }) {
  const stripe = getStripe();
  const body = await req.json();
  // Strategy: create a new price with updated fields, deactivate old
  const payload: any = {
    product: params.id,
    currency: String(body.currency || 'USD').toLowerCase(),
    unit_amount: Math.round(Number(body.unitAmount || 0) * 100),
  };
  if (body.type === 'recurring') {
    payload.recurring = { interval: body.recurring?.interval || 'month', interval_count: Number(body.recurring?.intervalCount) || 1 };
  }
  const pr = await stripe.prices.create(payload);
  await stripe.prices.update(params.priceId, { active: false });
  return NextResponse.json({ id: pr.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; priceId: string } }) {
  const stripe = getStripe();
  await stripe.prices.update(params.priceId, { active: false });
  return NextResponse.json({ ok: true });
}

