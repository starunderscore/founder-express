export type ProductRow = { name: string; value: number; count: number };
export type ProductPerformance = { rows: ProductRow[] };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function getProductPerformance(range: '6m'|'12m'|'ytd'|'all', currency?: string): Promise<ProductPerformance> {
  const qs = new URLSearchParams({ range });
  if (currency) qs.set('currency', currency);
  const res = await fetch(`/api/stripe/reports/product-performance?${qs.toString()}`, { cache: 'no-store' });
  return json(res);
}

