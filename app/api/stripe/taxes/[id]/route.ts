import { NextResponse } from 'next/server';
import { getStripe } from '../../_lib/stripe';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const stripe = getStripe();
  const body = await req.json();
  // If only toggling enabled, update active flag
  if (typeof body.enabled === 'boolean' && !('name' in body) && !('rate' in body)) {
    await stripe.taxRates.update(params.id, { active: body.enabled });
    return NextResponse.json({ ok: true });
  }

  // If description is present alone, update in place
  if (typeof body.description === 'string' && !('name' in body) && !('rate' in body) && !('inclusive' in body) && !('country' in body) && !('state' in body)) {
    await stripe.taxRates.update(params.id, { description: body.description });
    return NextResponse.json({ ok: true });
  }

  // If name/rate/inclusive/country/state changed, create a new tax rate and deactivate old
  if (typeof body.name === 'string' || typeof body.rate === 'number' || typeof body.inclusive === 'boolean' || typeof body.country === 'string' || typeof body.state === 'string') {
    // Fetch original for metadata reuse
    const orig = await stripe.taxRates.retrieve(params.id);
    const tr = await stripe.taxRates.create({
      display_name: (typeof body.name === 'string' ? String(body.name).trim() : (orig.display_name as any)),
      percentage: (typeof body.rate === 'number' ? body.rate : (orig.percentage as any)) as any,
      inclusive: (typeof body.inclusive === 'boolean' ? body.inclusive : (orig.inclusive as any)) as any,
      country: (typeof body.country === 'string' ? body.country : (orig.country as any)) as any,
      state: (typeof body.state === 'string' ? body.state : (orig.state as any)) as any,
      active: true,
      description: (typeof body.description === 'string' ? body.description : (orig.description as any)) as any,
      metadata: orig.metadata || {},
    });
    await stripe.taxRates.update(params.id, { active: false });
    return NextResponse.json({ id: tr.id });
  }

  return NextResponse.json({ ok: true });
}
