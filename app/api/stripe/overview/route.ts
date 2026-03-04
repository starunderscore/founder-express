import { NextResponse } from 'next/server';
import { getStripe } from '../_lib/stripe';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const graceDays = Math.max(0, Math.floor(Number(searchParams.get('graceDays') || '0')));
  const stripe = getStripe();

  // Customers (first page)
  const customers = await stripe.customers.list({ limit: 100 });
  const customersCount = customers.data.length;

  // Paid invoices
  const paid = await stripe.invoices.list({ status: 'paid', limit: 100 });
  const totalPaidCents = paid.data.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const currency = paid.data[0]?.currency?.toUpperCase?.() || 'USD';

  // Open invoices (unpaid/outstanding)
  const open = await stripe.invoices.list({ status: 'open', limit: 100 });
  const totalUnpaidCents = open.data.reduce((sum, inv) => sum + (inv.amount_remaining || inv.amount_due || 0), 0);
  const nowSec = Math.floor(Date.now() / 1000);
  const graceSec = graceDays * 86400;
  const lateCount = open.data.filter((inv) => {
    const due = typeof inv.due_date === 'number' ? inv.due_date : null;
    if (!due) return false;
    return (due + graceSec) < nowSec;
  }).length;

  return NextResponse.json({
    customersCount,
    currency,
    totalPaid: totalPaidCents / 100,
    totalUnpaid: totalUnpaidCents / 100,
    lateCount,
  });
}

