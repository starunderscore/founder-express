export type EnvVar = {
  id: string;
  key: string;
  value: string;
  builtin?: boolean;
  hint?: string;
};

export type AppSettings = {
  websiteUrl: string;
  websiteName: string;
  env: EnvVar[];
};

export type SystemValueRow = { id: string; key: string; value: string; builtin?: boolean; hint?: string };

export type SettingsAdapter = {
  getSettings: () => AppSettings;
  setWebsiteUrl: (url: string) => void;
  setWebsiteName: (name: string) => void;
  addEnvVar: (v: Omit<EnvVar, 'id'>) => { ok: boolean; id?: string; reason?: string };
  updateEnvVar: (id: string, patch: Partial<Omit<EnvVar, 'id'>>) => void;
};
