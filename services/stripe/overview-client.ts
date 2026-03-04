export type StripeOverview = { customersCount: number; currency: string; totalPaid: number; totalUnpaid: number; lateCount: number };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function getStripeOverview(graceDays: number): Promise<StripeOverview> {
  const res = await fetch(`/api/stripe/overview?graceDays=${Math.max(0, Math.floor(Number(graceDays || 0)))}`, { cache: 'no-store' });
  return json(res);
}

