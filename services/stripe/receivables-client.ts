export type AgingItem = {
  id: string;
  customerId?: string | null;
  dueDate?: string | null;
  daysPastDue: number;
  amount: number; // in major units
  status: string;
};

export type AgingBucket = { name: string; amount: number; count: number; items: AgingItem[] };
export type AgingResponse = { currency: string; buckets: AgingBucket[]; total: number; totalCount: number };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function getAccountsReceivableAging(currency?: string): Promise<AgingResponse> {
  const qs = new URLSearchParams();
  if (currency) qs.set('currency', currency);
  const res = await fetch(`/api/stripe/reports/accounts-receivable-aging${qs.size ? `?${qs.toString()}` : ''}`, { cache: 'no-store' });
  return json(res);
}

