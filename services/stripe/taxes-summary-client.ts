export type TaxRow = { name: string; value: number; count: number };
export type TaxesSummary = { rows: TaxRow[] };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function getTaxesSummary(range: '6m'|'12m'|'ytd'|'all', currency?: string): Promise<TaxesSummary> {
  const qs = new URLSearchParams({ range });
  if (currency) qs.set('currency', currency);
  const res = await fetch(`/api/stripe/reports/taxes-summary?${qs.toString()}`, { cache: 'no-store' });
  return json(res);
}

