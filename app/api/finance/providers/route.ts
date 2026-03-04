import { NextResponse } from 'next/server';

export async function GET() {
  const stripe = !!process.env.STRIPE_API_KEY;
  return NextResponse.json({
    providers: [
      { id: 'stripe', name: 'Stripe', configured: stripe, envVar: 'STRIPE_API_KEY' },
    ],
  });
}
