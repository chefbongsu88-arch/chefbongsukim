import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/* Sends the inquiry by email through Resend (https://resend.com) when RESEND_API_KEY is set.
   Without it, the form falls back to the visitor's mail app. */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const { name = '', email = '', type = '', message = '' } = body || {};
  if (!name.trim() || !email.trim() || !message.trim()) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 });
  if (message.length > 5000) return NextResponse.json({ ok: false, error: 'too long' }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO || 'chefbongsu88@gmail.com';
  const from = process.env.CONTACT_FROM || 'Website <onboarding@resend.dev>';
  if (!key) return NextResponse.json({ ok: false, fallback: 'mailto' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [to], reply_to: email,
      subject: `[${type}] ${name} — chefbongsukim.com`,
      text: `${message}\n\n---\n${name} <${email}>\n${type}`,
    }),
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: 'send failed' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
