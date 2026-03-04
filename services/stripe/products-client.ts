export type StripeRecurring = { interval: 'day'|'week'|'month'|'year'; intervalCount?: number };
export type StripePrice = { id: string; currency: string; unitAmount: number; type: 'one_time'|'recurring'; recurring?: StripeRecurring; active?: boolean };
export type StripeProduct = { id: string; name: string; description?: string; active: boolean; defaultType?: 'one_time'|'recurring'; archiveAt?: number|null; removedAt?: number|null; createdAt?: number; prices: StripePrice[] };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function listStripeProducts(status: 'active'|'archived'|'removed' = 'active'): Promise<StripeProduct[]> {
  const res = await fetch(`/api/stripe/products?status=${status}`, { cache: 'no-store' });
  const data = await json(res);
  return data.products as StripeProduct[];
}

export async function createStripeProduct(input: { name: string; description?: string; active?: boolean; defaultType?: 'one_time'|'recurring' }): Promise<string> {
  const res = await fetch('/api/stripe/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const data = await json(res);
  return data.id as string;
}

export async function updateStripeProduct(id: string, patch: Partial<{ name: string; description?: string; active?: boolean; defaultType?: 'one_time'|'recurring' }>): Promise<void> {
  await fetch(`/api/stripe/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(json);
}

export async function archiveStripeProduct(id: string): Promise<void> {
  await fetch(`/api/stripe/products/${id}/archive`, { method: 'POST' }).then(json);
}

export async function removeStripeProduct(id: string): Promise<void> {
  await fetch(`/api/stripe/products/${id}/remove`, { method: 'POST' }).then(json);
}

export async function restoreStripeProduct(id: string): Promise<void> {
  await fetch(`/api/stripe/products/${id}/restore`, { method: 'POST' }).then(json);
}

export async function addStripePrice(productId: string, price: { currency: string; unitAmount: number; type: 'one_time'|'recurring'; recurring?: StripeRecurring }): Promise<string> {
  const res = await fetch(`/api/stripe/products/${productId}/prices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(price) });
  const data = await json(res);
  return data.id as string;
}

export async function updateStripePrice(productId: string, priceId: string, patch: { currency: string; unitAmount: number; type: 'one_time'|'recurring'; recurring?: StripeRecurring }): Promise<string> {
  const res = await fetch(`/api/stripe/products/${productId}/prices/${priceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  const data = await json(res);
  return data.id as string;
}

export async function removeStripePrice(productId: string, priceId: string): Promise<void> {
  await fetch(`/api/stripe/products/${productId}/prices/${priceId}`, { method: 'DELETE' }).then(json);
}

