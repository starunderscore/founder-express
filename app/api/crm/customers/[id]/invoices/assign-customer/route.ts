import { NextResponse } from 'next/server';
import { getAdminDb } from '@/app/api/_lib/firebase-admin';
import { getStripe } from '@/app/api/stripe/_lib/stripe';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null) as { stripeCustomerId?: string } | null;
    const rawId = (body?.stripeCustomerId || '').trim();
    if (!rawId) return NextResponse.json({ error: 'stripeCustomerId is required' }, { status: 400 });

    // Optional: basic guard for common Stripe ID prefix
    if (!/^cus_[A-Za-z0-9]+$/.test(rawId)) {
      return NextResponse.json({ error: 'Invalid Stripe customer ID format' }, { status: 400 });
    }

    const stripe = getStripe();
    // Validate existence in Stripe
    try {
      const cust = await stripe.customers.retrieve(rawId);
      if ((cust as any)?.deleted) {
        return NextResponse.json({ error: 'Stripe customer is deleted' }, { status: 400 });
      }
    } catch (e: any) {
      return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 });
    }

    const db = getAdminDb();
    const crmRef = db.collection('crm_customers').doc(params.id);
    const crmDoc = await crmRef.get();
    if (!crmDoc.exists) return NextResponse.json({ error: 'CRM record not found' }, { status: 404 });

    // Save directly to CRM record to avoid ambiguity
    await crmRef.set({ stripeCustomerId: rawId }, { merge: true });
    return NextResponse.json({ ok: true, stripeCustomerId: rawId });
  } catch (e: any) {
    console.error('assign stripe customer failed', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
