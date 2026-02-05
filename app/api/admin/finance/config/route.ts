import { NextResponse } from 'next/server';

export async function GET() {
  const rawKey = process.env.QB_API_KEY || '';
  const hasKey = !!rawKey && rawKey.trim().length > 0;
  const suffix = hasKey ? rawKey.slice(-4) : null;

  const rawRealm = process.env.QB_REALM_ID || '';
  const hasRealm = !!rawRealm && rawRealm.trim().length > 0;
  const realmSuffix = hasRealm ? String(rawRealm).slice(-4) : null;

  return NextResponse.json({ hasKey, suffix, hasRealm, realmSuffix });
}

