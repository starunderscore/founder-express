import { NextRequest, NextResponse } from 'next/server';

function ok(data: any, init: ResponseInit = {}) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
      ...init.headers,
    },
  });
}

export async function OPTIONS() {
  return ok({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    let email = '';
    let name = '';
    let list = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = (body.email || '').toString();
      name = (body.name || '').toString();
      list = (body.list || '').toString();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      email = (form.get('email') || '').toString();
      name = (form.get('name') || '').toString();
      list = (form.get('list') || '').toString();
    } else {
      // default: try json
      const body = await req.json().catch(() => ({}));
      email = (body.email || '').toString();
      name = (body.name || '').toString();
      list = (body.list || '').toString();
    }

    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      return ok({ ok: false, reason: 'Invalid email' }, { status: 400 });
    }

    // Scaffold: Here is where you would persist to Firebase.
    // Example signature (not implemented): await saveToFirebase({ email: e, name, list })
    console.log('[newsletter/subscribe]', { email: e, name, list, at: Date.now() });

    return ok({ ok: true });
  } catch (err: any) {
    console.error('newsletter subscribe error', err);
    return ok({ ok: false, reason: 'Server error' }, { status: 500 });
  }
}

