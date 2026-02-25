import { NextResponse } from 'next/server';

// Attempt to detect enabled Firebase Auth providers by querying the project config via
// Google Identity Toolkit Admin API using Application Default Credentials if present.
// Falls back to "unknown" status when credentials or API access are not available.

type ProviderInfo = { id: string; name: string; status: 'enabled' | 'disabled' | 'unknown' };

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const baseProviders: ProviderInfo[] = [
    { id: 'google.com', name: 'Google', status: 'unknown' },
    { id: 'microsoft.com', name: 'Microsoft', status: 'unknown' },
    { id: 'github.com', name: 'GitHub', status: 'unknown' },
    { id: 'apple.com', name: 'Apple', status: 'unknown' },
    { id: 'facebook.com', name: 'Facebook', status: 'unknown' },
    { id: 'twitter.com', name: 'X (Twitter)', status: 'unknown' },
    { id: 'yahoo.com', name: 'Yahoo', status: 'unknown' },
    { id: 'password', name: 'Email & Password', status: 'unknown' },
    { id: 'phone', name: 'Phone', status: 'unknown' },
    { id: 'anonymous', name: 'Anonymous', status: 'unknown' },
  ];

  // If project ID is missing, return unknowns immediately.
  if (!projectId) {
    return NextResponse.json({ providers: baseProviders });
  }

  // Try to obtain an access token via firebase-admin default credentials (if configured).
  let accessToken: string | null = null;
  try {
    // Lazy import to avoid impacting edge runtimes and to keep it server-only
    const adminApp = await import('firebase-admin/app');
    const { getApps, initializeApp, applicationDefault } = adminApp;
    const app = getApps().length ? getApps()[0] : initializeApp({
      credential: applicationDefault(),
      projectId,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cred: any = (app as any).options?.credential;
    if (cred?.getAccessToken) {
      const t = await cred.getAccessToken();
      accessToken = t?.access_token || null;
    }
  } catch {
    // Ignore; accessToken stays null
  }

  if (!accessToken) {
    return NextResponse.json({ providers: baseProviders });
  }

  // Try Admin v2 first, then v1 as a fallback for older projects.
  async function fetchConfig(): Promise<any | null> {
    const headers = { Authorization: `Bearer ${accessToken}` } as const;
    const urls = [
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${encodeURIComponent(projectId)}/config`,
      `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/config`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers, cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // try next
      }
    }
    return null;
  }

  const cfg = await fetchConfig();
  if (!cfg) {
    return NextResponse.json({ providers: baseProviders });
  }

  // Normalize detection from multiple possible response shapes.
  const byId: Record<string, ProviderInfo> = Object.fromEntries(baseProviders.map((p) => [p.id, { ...p }]));

  // idpConfig array (common in v1)
  if (Array.isArray(cfg.idpConfig)) {
    for (const c of cfg.idpConfig) {
      if (c?.provider && byId[c.provider]) {
        byId[c.provider].status = c.enabled ? 'enabled' : 'disabled';
      }
    }
  }

  // v2 signIn config structure
  const signIn = cfg.signIn || cfg.mfa || cfg;
  if (signIn) {
    // Email/password
    if (signIn.email && typeof signIn.email.enabled === 'boolean') {
      byId['password'].status = signIn.email.enabled ? 'enabled' : 'disabled';
    } else if (typeof cfg.allowPasswordSignup === 'boolean') {
      byId['password'].status = cfg.allowPasswordSignup ? 'enabled' : 'disabled';
    }
    // Phone
    if (signIn.phoneNumber && typeof signIn.phoneNumber.enabled === 'boolean') {
      byId['phone'].status = signIn.phoneNumber.enabled ? 'enabled' : 'disabled';
    }
    // Anonymous
    if (signIn.anonymous && typeof signIn.anonymous.enabled === 'boolean') {
      byId['anonymous'].status = signIn.anonymous.enabled ? 'enabled' : 'disabled';
    } else if (typeof cfg.enableAnonymousUser === 'boolean') {
      byId['anonymous'].status = cfg.enableAnonymousUser ? 'enabled' : 'disabled';
    }
  }

  const providers = Object.values(byId);
  return NextResponse.json({ providers });
}

