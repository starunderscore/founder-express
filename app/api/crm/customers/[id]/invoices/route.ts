import { NextResponse } from 'next/server';
import { getAdminDb } from '@/app/api/_lib/firebase-admin';
import { getStripe } from '@/app/api/stripe/_lib/stripe';
import type Stripe from 'stripe';

async function listAllInvoicesForCustomer(stripe: Stripe, customerId: string) {
  const items: Stripe.Invoice[] = [];
  let starting_after: string | undefined = undefined;
  // Fetch up to 1000 invoices defensively; break when page is short
  for (let i = 0; i < 10; i++) {
    const page = await stripe.invoices.list({ limit: 100, customer: customerId, starting_after });
    items.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
    if (!starting_after) break;
  }
  return items;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb();
    const crmDoc = await db.collection('crm_customers').doc(params.id).get();
    if (!crmDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const crm = crmDoc.data() as any;
    const stripeCustomerId = typeof crm?.stripeCustomerId === 'string' && crm.stripeCustomerId.trim()
      ? String(crm.stripeCustomerId).trim()
      : null;

    if (!stripeCustomerId) return NextResponse.json({ stripeCustomerId: null, invoices: [] });

    const stripe = getStripe();
    const invoices = await listAllInvoicesForCustomer(stripe, stripeCustomerId);
    const rows = invoices.map((inv) => ({
      id: inv.id,
      number: inv.number || null,
      status: inv.status || null,
      currency: inv.currency?.toUpperCase() || null,
      total: typeof inv.total === 'number' ? inv.total / 100 : null,
      created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      hosted_invoice_url: inv.hosted_invoice_url || null,
      invoice_pdf: inv.invoice_pdf || null,
    }));
    rows.sort((a, b) => (a.created && b.created ? (a.created < b.created ? 1 : -1) : 0));
    return NextResponse.json({ stripeCustomerId, invoices: rows });
  } catch (e: any) {
    console.error('crm invoices failed', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
