import type { AppSettings, EnvVar } from '@/state/appSettingsStore';

export type SystemValueRow = { id: string; key: string; value: string; builtin?: boolean; hint?: string };

export type SettingsAdapter = {
  getSettings: () => AppSettings;
  setWebsiteUrl: (url: string) => void;
  setWebsiteName: (name: string) => void;
  addEnvVar: (v: Omit<EnvVar, 'id'>) => { ok: boolean; id?: string; reason?: string };
  updateEnvVar: (id: string, patch: Partial<Omit<EnvVar, 'id'>>) => void;
};

