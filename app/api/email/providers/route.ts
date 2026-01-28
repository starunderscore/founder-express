import { NextResponse } from 'next/server';

export async function GET() {
  const sendgrid = !!process.env.SENDGRID_API_KEY;
  const resend = !!process.env.RESEND_API_KEY;
  return NextResponse.json({
    providers: [
      { id: 'sendgrid', name: 'SendGrid', configured: sendgrid, envVar: 'SENDGRID_API_KEY' },
      { id: 'resend', name: 'Resend', configured: resend, envVar: 'RESEND_API_KEY' },
    ],
  });
}

