export type FinanceGeneral = { currency: string; gracePeriodDays: number; enforceTax: boolean };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function getStripeFinanceGeneral(): Promise<FinanceGeneral> {
  const res = await fetch('/api/stripe/finance-general', { cache: 'no-store' });
  return json(res);
}

export async function patchStripeFinanceGeneral(patch: Partial<FinanceGeneral>): Promise<void> {
  await fetch('/api/stripe/finance-general', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(json);
}

