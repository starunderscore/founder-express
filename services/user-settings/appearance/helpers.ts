import type { AppearanceCreateInput, AppearancePatchInput, AppearanceSettings } from './types';

const THEMES = new Set(['light', 'dark', 'auto']);

export function normalizeAppearance(id: string, raw: any): AppearanceSettings {
  const userId = String(raw?.userId || '').trim();
  const theme = THEMES.has(String(raw?.theme)) ? (raw.theme as any) : 'auto';
  const updatedAt = typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined;
  return { id, userId, theme, updatedAt };
}

export function buildAppearanceCreate(input: AppearanceCreateInput): Record<string, any> {
  const userId = String(input.userId || '').trim();
  if (!userId) throw new Error('userId is required');
  const theme = THEMES.has(input.theme) ? input.theme : 'auto';
  return { userId, theme, updatedAt: Date.now() };
}

export function buildAppearancePatch(input: AppearancePatchInput): Record<string, any> {
  const out: Record<string, any> = { updatedAt: Date.now() };
  if (typeof input.theme === 'string') {
    if (!THEMES.has(input.theme)) throw new Error('invalid theme');
    out.theme = input.theme;
  }
  return out;
}

