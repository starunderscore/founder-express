export type StripeTax = { id: string; name: string; rate: number; enabled: boolean; inclusive?: boolean; country?: string; state?: string; description?: string; archiveAt?: number|null; removedAt?: number|null };

const json = (res: Response) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); };

export async function listStripeTaxes(status: 'active'|'archived'|'removed' = 'active'): Promise<StripeTax[]> {
  const res = await fetch(`/api/stripe/taxes?status=${status}`, { cache: 'no-store' });
  const data = await json(res);
  return data.taxes as StripeTax[];
}

export async function createStripeTax(input: { name: string; rate: number; enabled?: boolean; inclusive?: boolean; country?: string; state?: string; description?: string }): Promise<string> {
  const res = await fetch('/api/stripe/taxes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const data = await json(res);
  return data.id as string;
}

export async function updateStripeTax(id: string, patch: Partial<{ name: string; rate: number; enabled: boolean; inclusive: boolean; country: string; state: string; description: string }>): Promise<void> {
  await fetch(`/api/stripe/taxes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(json);
}

export async function archiveStripeTax(id: string): Promise<void> {
  await fetch(`/api/stripe/taxes/${id}/archive`, { method: 'POST' }).then(json);
}

export async function removeStripeTax(id: string): Promise<void> {
  await fetch(`/api/stripe/taxes/${id}/remove`, { method: 'POST' }).then(json);
}

export async function restoreStripeTax(id: string): Promise<void> {
  await fetch(`/api/stripe/taxes/${id}/restore`, { method: 'POST' }).then(json);
}
