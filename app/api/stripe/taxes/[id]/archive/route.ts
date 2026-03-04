import { NextResponse } from 'next/server';
import { getStripe } from '../../../_lib/stripe';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const stripe = getStripe();
  await stripe.taxRates.update(params.id, { active: false, metadata: { archiveAt: String(Date.now()), removedAt: '' } });
  return NextResponse.json({ ok: true });
}

