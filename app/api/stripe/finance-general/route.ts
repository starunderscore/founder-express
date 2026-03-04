import { NextResponse } from 'next/server';
import { getStripe } from '../_lib/stripe';

const KEY_CURRENCY = 'fg_currency';
const KEY_GRACE = 'fg_grace';
const KEY_ENFORCE = 'fg_enforceTax';

function normalize(meta: Record<string, any> | null | undefined) {
  const m = meta || {};
  const currency = typeof m[KEY_CURRENCY] === 'string' && m[KEY_CURRENCY] ? String(m[KEY_CURRENCY]).toUpperCase() : 'USD';
  const grace = Number(m[KEY_GRACE]);
  const gracePeriodDays = Number.isFinite(grace) ? Math.max(0, Math.floor(grace)) : 0;
  const enforceTax = String(m[KEY_ENFORCE] || '').toLowerCase() === 'true';
  return { currency, gracePeriodDays, enforceTax };
}

export async function GET() {
  const stripe = getStripe();
  const acct = await stripe.accounts.retrieve();
  return NextResponse.json(normalize((acct as any).metadata));
}

export async function PATCH(req: Request) {
  const stripe = getStripe();
  const body = await req.json().catch(() => ({}));
  const acct = await stripe.accounts.retrieve();
  const id = (acct as any).id as string;
  const meta: Record<string, string> = {};
  if (typeof body.currency === 'string') meta[KEY_CURRENCY] = String(body.currency).toUpperCase();
  if (body.gracePeriodDays != null) meta[KEY_GRACE] = String(Math.max(0, Math.floor(Number(body.gracePeriodDays) || 0)));
  if (typeof body.enforceTax === 'boolean') meta[KEY_ENFORCE] = String(!!body.enforceTax);
  if (Object.keys(meta).length > 0) {
    await stripe.accounts.update(id, { metadata: meta } as any);
  }
  return NextResponse.json({ ok: true });
}

