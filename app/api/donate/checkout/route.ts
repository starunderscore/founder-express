import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { amount, interval } = body as { amount?: number; interval?: 'one_time' | 'monthly' };

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Donations not configured' }, { status: 501 });
  }

  // Placeholder: Here you would create a Stripe Checkout session
  // with mode: 'payment' for one-time or 'subscription' for monthly
  // and return the URL. We return 501 until fully configured.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

