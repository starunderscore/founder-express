import { describe, it, expect } from '@jest/globals';
import { buildSystemValuesService, rowsFromSettings, type SystemValueRow, type SettingsAdapter } from '../../../../services/admin-settings/system-values';

const makeAdapter = (seed?: Partial<ReturnType<SettingsAdapter['getSettings']>>): SettingsAdapter => {
  let state = {
    websiteUrl: '',
    websiteName: '',
    cookiePolicyEnabled: true,
    privacyPolicyEnabled: true,
    email: { adapterUrl: '', apiKey: '', integrations: [], templateVars: [], templates: [] },
    env: [] as any[],
    ...(seed as any),
  };
  return {
    getSettings: () => state as any,
    setWebsiteUrl: (url) => { state = { ...(state as any), websiteUrl: url }; },
    setWebsiteName: (name) => { state = { ...(state as any), websiteName: name }; },
    addEnvVar: (v) => { const id = `env-test-${Date.now()}`; state = { ...(state as any), env: [{ id, ...v }, ...state.env] }; return { ok: true, id }; },
    updateEnvVar: (id, patch) => { state = { ...(state as any), env: state.env.map((x: any) => (x.id === id ? { ...x, ...patch } : x)) }; },
  };
};

describe('services/admin-settings/system-values helpers', () => {
  it('rowsFromSettings builds built-ins + env rows', () => {
    const rows = rowsFromSettings({
      websiteUrl: 'https://acme.test',
      websiteName: 'Acme',
      cookiePolicyEnabled: true,
      privacyPolicyEnabled: true,
      email: { adapterUrl: '', apiKey: '' } as any,
      env: [{ id: 'env-1', key: 'MY_KEY', value: 'v1' } as any],
    } as any) as SystemValueRow[];
    expect(rows.some(r => r.key === 'WEBSITE_URL' && r.value === 'https://acme.test')).toBe(true);
    expect(rows.some(r => r.key === 'WEBSITE_NAME' && r.value === 'Acme')).toBe(true);
    expect(rows.some(r => r.id === 'env-1' && r.key === 'MY_KEY')).toBe(true);
  });

  it('service updates built-ins via adapter', () => {
    const adapter = makeAdapter();
    const svc = buildSystemValuesService(adapter);
    svc.updateBuiltin('WEBSITE_URL', ' https://x.example ');
    svc.updateBuiltin('WEBSITE_NAME', ' X Co ');
    const rows = svc.list();
    expect(rows.find(r => r.key === 'WEBSITE_URL')?.value).toBe('https://x.example');
    expect(rows.find(r => r.key === 'WEBSITE_NAME')?.value).toBe('X Co');
  });

  it('service creates and updates env vars', () => {
    const adapter = makeAdapter();
    const svc = buildSystemValuesService(adapter);
    const res = svc.createEnvVar({ key: ' TEST_KEY ', value: 'v', hint: 'h' });
    expect(res.ok).toBe(true);
    const id = res.id!;
    let rows = svc.list();
    expect(rows.some(r => r.id === id && r.key === 'TEST_KEY' && r.value === 'v')).toBe(true);
    svc.updateEnvVar(id, { value: 'v2' });
    rows = svc.list();
    expect(rows.find(r => r.id === id)?.value).toBe('v2');
  });
});

