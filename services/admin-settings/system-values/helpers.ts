import type { AppSettings } from '@/state/appSettingsStore';
import type { SettingsAdapter, SystemValueRow } from './types';

export function rowsFromSettings(settings: AppSettings): SystemValueRow[] {
  const urlRow: SystemValueRow = { id: 'builtin-website-url', key: 'WEBSITE_URL', value: settings.websiteUrl || '', builtin: true, hint: 'Primary site URL' };
  const nameRow: SystemValueRow = { id: 'builtin-website-name', key: 'WEBSITE_NAME', value: settings.websiteName || '', builtin: true, hint: 'Brand name shown in UI/emails' };
  return [urlRow, nameRow, ...(settings.env || [])];
}

function listSystemValues(opts: { adapter: SettingsAdapter }): SystemValueRow[] {
  const { adapter } = opts;
  return rowsFromSettings(adapter.getSettings());
}

function updateBuiltinSystemValue(key: 'WEBSITE_URL' | 'WEBSITE_NAME', value: string, opts: { adapter: SettingsAdapter }): void {
  const { adapter } = opts;
  const v = String(value ?? '').trim();
  if (key === 'WEBSITE_URL') adapter.setWebsiteUrl(v);
  else adapter.setWebsiteName(v);
}

function createSystemEnvVar(input: { key: string; value: string; hint?: string }, opts: { adapter: SettingsAdapter }): { ok: boolean; id?: string; reason?: string } {
  const { adapter } = opts;
  const k = String(input.key || '').trim();
  if (!k) return { ok: false, reason: 'key is required' };
  return adapter.addEnvVar({ key: k, value: input.value ?? '', hint: input.hint } as any);
}

function updateSystemEnvVar(id: string, patch: Partial<{ key: string; value: string; hint?: string }>, opts: { adapter: SettingsAdapter }): void {
  const { adapter } = opts;
  const out: any = { ...patch };
  if (typeof patch.key === 'string') {
    const k = patch.key.trim();
    if (!k) throw new Error('key cannot be blank');
    out.key = k;
  }
  adapter.updateEnvVar(id, out);
}

export function buildSystemValuesService(adapter: SettingsAdapter) {
  return {
    list: () => listSystemValues({ adapter }),
    updateBuiltin: (k: 'WEBSITE_URL'|'WEBSITE_NAME', v: string) => updateBuiltinSystemValue(k, v, { adapter }),
    createEnvVar: (i: { key: string; value: string; hint?: string }) => createSystemEnvVar(i, { adapter }),
    updateEnvVar: (id: string, p: Partial<{ key: string; value: string; hint?: string }>) => updateSystemEnvVar(id, p, { adapter }),
  };
}
