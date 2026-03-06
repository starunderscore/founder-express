import { NextResponse } from 'next/server';
import { getStripe } from '../../stripe/_lib/stripe';
import { getAdminAuth, getAdminDb } from '../../_lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email || undefined;
    if (!uid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    const existing = snap.exists ? (snap.data() as any) : null;
    if (existing?.stripeCustomerId) {
      return NextResponse.json({ ok: true, stripeCustomerId: existing.stripeCustomerId });
    }

    const stripe = getStripe();
    const customer = await stripe.customers.create({
      email,
      metadata: { firebaseUid: uid },
    });

    const payload: Record<string, any> = {
      stripeCustomerId: customer.id,
    };
    if (!existing) {
      payload.createdAt = new Date();
      if (email) payload.email = email;
    }
    await userRef.set(payload, { merge: true });

    return NextResponse.json({ ok: true, stripeCustomerId: customer.id });
  } catch (e: any) {
    console.error('after-signup failed', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

