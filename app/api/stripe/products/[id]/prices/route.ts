import { NextResponse } from 'next/server';
import { getStripe } from '../../../_lib/stripe';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const stripe = getStripe();
  const body = await req.json();
  const payload: any = {
    product: params.id,
    currency: String(body.currency || 'USD').toLowerCase(),
    unit_amount: Math.round(Number(body.unitAmount || 0) * 100),
  };
  if (body.type === 'recurring') {
    payload.recurring = { interval: body.recurring?.interval || 'month', interval_count: Number(body.recurring?.intervalCount) || 1 };
  }
  const pr = await stripe.prices.create(payload);
  return NextResponse.json({ id: pr.id });
}

