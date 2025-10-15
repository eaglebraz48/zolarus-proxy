import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import React from 'react';
import WelcomeEmail from '@/emails/WelcomeEmail';

export const runtime = 'nodejs'; // Required for Resend on Netlify/Next.js

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM || 'Zolarus <noreply@arison8.com>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'matt@arison8.com';

export async function POST(req: Request) {
  try {
    const { to, email, lang = 'en' } = await req.json();

    const recipient = Array.isArray(to) ? to[0] : (to || email);
    if (!recipient) {
      return NextResponse.json(
        { ok: false, error: 'Missing recipient' },
        { status: 400 }
      );
    }

    const subjects: Record<string, string> = {
      en: '🎁 Welcome to Zolarus!',
      pt: '🎁 Bem-vindo ao Zolarus!',
      es: '🎁 Bienvenido a Zolarus!',
      fr: '🎁 Bienvenue à Zolarus!',
    };

    const subject = subjects[lang] || subjects.en;

    const reactEmail = React.createElement(WelcomeEmail, { email: recipient, lang });

    const { data, error } = await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: [recipient],
      subject,
      react: reactEmail,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err: any) {
    console.error('🚨 Welcome email route error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
