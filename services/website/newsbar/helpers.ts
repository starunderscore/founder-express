import type { Newsbar, NewsbarUpsertInput } from './types';

export function normalizeNewsbar(raw: any): Newsbar {
  return {
    enabled: !!raw?.enabled,
    primaryHtml: String(raw?.primaryHtml || ''),
    secondaryHtml: String(raw?.secondaryHtml || ''),
    updatedAt: typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined,
    updatedBy: raw?.updatedBy ? String(raw.updatedBy) : undefined,
  };
}

export function buildNewsbarUpsert(input: NewsbarUpsertInput): Record<string, any> {
  return {
    enabled: !!input.enabled,
    primaryHtml: String(input.primaryHtml || '').trim(),
    secondaryHtml: String(input.secondaryHtml || '').trim(),
    updatedAt: Date.now(),
    updatedBy: input.updatedBy ? String(input.updatedBy) : undefined,
  } as const;
}

