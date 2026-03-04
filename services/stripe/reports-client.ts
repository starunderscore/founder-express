export type RevenueSeriesPoint = { label: string; value: number };
export type RevenueSummary = { series: RevenueSeriesPoint[]; label: string; total: number; mtd: number; mtdLabel: string; mtdCount: number };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function getRevenueSummary(range: '30d'|'6m'|'12m'|'ytd', currency?: string): Promise<RevenueSummary> {
  const qs = new URLSearchParams({ range }); if (currency) qs.set('currency', currency);
  const res = await fetch(`/api/stripe/reports/revenue-summary?${qs.toString()}`, { cache: 'no-store' });
  return json(res);
}

