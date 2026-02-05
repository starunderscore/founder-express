import { NextResponse } from 'next/server';

export async function GET() {
  const stripe = !!process.env.STRIPE_API_KEY;
  const paypal = !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
  return NextResponse.json({
    providers: [
      { id: 'stripe', name: 'Stripe', configured: stripe, envVar: 'STRIPE_API_KEY' },
      { id: 'paypal', name: 'PayPal', configured: paypal, envVar: 'PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET' },
    ],
  });
}

