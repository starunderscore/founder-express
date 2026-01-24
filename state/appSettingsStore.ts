"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EmailAdapterSettings = {
  adapterUrl: string;
  apiKey: string;
  integrations?: EmailIntegration[];
  templateVars?: EmailTemplateVar[];
  templates?: EmailTemplate[];
};

export type EnvVar = {
  id: string;
  key: string;
  value: string;
  builtin?: boolean;
  hint?: string;
};

export type EmailIntegration = {
  id: string;
  provider: 'sendgrid' | 'mailgun' | 'postmark' | 'resend';
  label?: string;
  apiKey: string;
  enabled: boolean;
  createdAt: number;
};

export type EmailTemplateVar = {
  id: string;
  key: string;
  value: string;
  hint?: string;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  websiteUrl: string;
  email: EmailAdapterSettings;
  env: EnvVar[];
};

type AppSettingsState = {
  settings: AppSettings;
  setWebsiteUrl: (url: string) => void;
  setEmailAdapterUrl: (url: string) => void;
  setEmailApiKey: (key: string) => void;
  addEnvVar: (v: Omit<EnvVar, 'id'>) => { ok: boolean; id?: string; reason?: string };
  updateEnvVar: (id: string, patch: Partial<Omit<EnvVar, 'id'>>) => void;
  removeEnvVar: (id: string) => { ok: boolean; reason?: string };
  addEmailIntegration: (p: Omit<EmailIntegration, 'id' | 'createdAt' | 'enabled'> & { enabled?: boolean }) => { ok: boolean; id?: string; reason?: string };
  updateEmailIntegration: (id: string, patch: Partial<Omit<EmailIntegration, 'id' | 'createdAt'>>) => void;
  removeEmailIntegration: (id: string) => void;
  addEmailTemplateVar: (v: Omit<EmailTemplateVar, 'id'>) => { ok: boolean; id?: string; reason?: string };
  updateEmailTemplateVar: (id: string, patch: Partial<Omit<EmailTemplateVar, 'id'>>) => void;
  removeEmailTemplateVar: (id: string) => void;
  addEmailTemplate: (t: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; id?: string; reason?: string };
  updateEmailTemplate: (id: string, patch: Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>) => void;
  removeEmailTemplate: (id: string) => void;
};

const nowSeed = Date.now();
const defaults: AppSettings = {
  websiteUrl: '',
  email: {
    adapterUrl: '',
    apiKey: '',
    integrations: [],
    templateVars: [
      { id: 'tmpl-company-name', key: 'COMPANY_NAME', value: 'Acme Inc.', hint: 'Shown in email headers/footers' },
    ],
    templates: [
      {
        id: 'tmpl-seed-1',
        name: 'Welcome Email',
        subject: 'Welcome to {{COMPANY_NAME}}',
        body: '<p>Hi {{name}},</p><p>Welcome to <strong>{{COMPANY_NAME}}</strong>! We\'re excited to have you on board.</p><p>Cheers,<br/>The {{COMPANY_NAME}} Team</p>',
        createdAt: nowSeed,
        updatedAt: nowSeed,
      },
      {
        id: 'tmpl-seed-2',
        name: 'Weekly Update',
        subject: 'This week at {{COMPANY_NAME}}',
        body: '<p>Hi {{name}},</p><p>Here\'s what\'s new this week at {{COMPANY_NAME}}:</p><ul><li>Feature A improvements</li><li>Upcoming events</li><li>Community highlights</li></ul><p>Best,<br/>{{COMPANY_NAME}}</p>',
        createdAt: nowSeed,
        updatedAt: nowSeed,
      },
    ],
  },
  env: [],
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      settings: defaults,
      setWebsiteUrl: (url) => set((s) => ({ settings: { ...s.settings, websiteUrl: url.trim() } })),
      setEmailAdapterUrl: (url) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, adapterUrl: url.trim() } } })),
      setEmailApiKey: (key) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, apiKey: key } } })),
      addEmailIntegration: (p) => {
        const id = `ei-${Date.now()}`;
        const item: EmailIntegration = { id, provider: p.provider, apiKey: p.apiKey, label: p.label?.trim() || undefined, enabled: p.enabled ?? true, createdAt: Date.now() };
        set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, integrations: [item, ...(s.settings.email.integrations || [])] } } }));
        return { ok: true, id };
      },
      updateEmailIntegration: (id, patch) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, integrations: (s.settings.email.integrations || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) } } })),
      removeEmailIntegration: (id) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, integrations: (s.settings.email.integrations || []).filter((x) => x.id !== id) } } })),
      addEmailTemplateVar: (v) => {
        const id = `tvar-${Date.now()}`;
        set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, templateVars: [{ id, ...v }, ...((s.settings.email.templateVars) || [])] } } }));
        return { ok: true, id };
      },
      updateEmailTemplateVar: (id, patch) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, templateVars: (s.settings.email.templateVars || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) } } })),
      removeEmailTemplateVar: (id) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, templateVars: (s.settings.email.templateVars || []).filter((x) => x.id !== id) } } })),
      addEmailTemplate: (t) => {
        const id = `tmpl-${Date.now()}`;
        const now = Date.now();
        const item: EmailTemplate = { id, name: t.name, subject: t.subject, body: t.body, createdAt: now, updatedAt: now };
        set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, templates: [item, ...(s.settings.email.templates || [])] } } }));
        return { ok: true, id };
      },
      updateEmailTemplate: (id, patch) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, templates: (s.settings.email.templates || []).map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)) } } })),
      removeEmailTemplate: (id) => set((s) => ({ settings: { ...s.settings, email: { ...s.settings.email, templates: (s.settings.email.templates || []).filter((x) => x.id !== id) } } })),
      addEnvVar: (v) => {
        const id = `env-${Date.now()}`;
        set((s) => ({ settings: { ...s.settings, env: [{ id, ...v }, ...s.settings.env] } }));
        return { ok: true, id };
      },
      updateEnvVar: (id, patch) => set((s) => ({ settings: { ...s.settings, env: s.settings.env.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeEnvVar: (id) => {
        let ok = true; let reason = undefined as string | undefined;
        // Built-ins are not deletable; guard in case any are stored with builtin flag
        set((s) => {
          const row = s.settings.env.find((x) => x.id === id);
          if (row?.builtin) { ok = false; reason = 'Built-in cannot be deleted'; return s; }
          return { settings: { ...s.settings, env: s.settings.env.filter((x) => x.id !== id) } } as any;
        });
        return { ok, reason };
      },
    }),
    {
      name: 'app-settings',
      version: 6,
      migrate: (persisted: any, version) => {
        if (!persisted) return undefined as any;
        if (!persisted.settings) persisted.settings = defaults;
        if (typeof persisted.settings.websiteUrl !== 'string') persisted.settings.websiteUrl = '';
        if (version < 2) {
          const email: EmailAdapterSettings = { adapterUrl: '', apiKey: '' };
          persisted.settings.email = persisted.settings.email || email;
          if (typeof persisted.settings.email.adapterUrl !== 'string') persisted.settings.email.adapterUrl = '';
          if (typeof persisted.settings.email.apiKey !== 'string') persisted.settings.email.apiKey = '';
        }
        if (version < 3) {
          if (!Array.isArray(persisted.settings.env)) persisted.settings.env = [];
        }
        if (version < 4) {
          if (!persisted.settings.email) persisted.settings.email = { adapterUrl: '', apiKey: '' };
          if (!Array.isArray(persisted.settings.email.integrations)) persisted.settings.email.integrations = [];
        }
        if (version < 5) {
          if (!persisted.settings.email) persisted.settings.email = { adapterUrl: '', apiKey: '' } as any;
          if (!Array.isArray(persisted.settings.email.templateVars)) {
            persisted.settings.email.templateVars = [
              { id: 'tmpl-company-name', key: 'COMPANY_NAME', value: 'Acme Inc.', hint: 'Shown in email headers/footers' },
            ];
          }
        }
        if (version < 6) {
          if (!Array.isArray(persisted.settings.email.templates) || persisted.settings.email.templates.length === 0) {
            const now = Date.now();
            persisted.settings.email.templates = [
              { id: 'tmpl-seed-1', name: 'Welcome Email', subject: 'Welcome to {{COMPANY_NAME}}', body: '<p>Hi {{name}},</p><p>Welcome to <strong>{{COMPANY_NAME}}</strong>! We\'re excited to have you on board.</p><p>Cheers,<br/>The {{COMPANY_NAME}} Team</p>', createdAt: now, updatedAt: now },
              { id: 'tmpl-seed-2', name: 'Weekly Update', subject: 'This week at {{COMPANY_NAME}}', body: '<p>Hi {{name}},</p><p>Here\'s what\'s new this week at {{COMPANY_NAME}}:</p><ul><li>Feature A improvements</li><li>Upcoming events</li><li>Community highlights</li></ul><p>Best,<br/>{{COMPANY_NAME}}</p>', createdAt: now, updatedAt: now },
            ];
          }
        }
        return persisted as any;
      },
    }
  )
);
