import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import React from 'react';
import WelcomeEmail from '@/emails/WelcomeEmail';

export const runtime = 'nodejs'; // Required for Resend on Netlify/Next.js

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || 'Zolarus <noreply@arison8.com>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'matt@arison8.com';

// Basic email validator (very simple)
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const { to, email, lang = 'en' } = await req.json();

    // Log incoming request (redact sensitive info if needed)
    console.log('📩 Incoming welcome email request:', { to, email, lang });

    const recipient = Array.isArray(to) ? to[0] : (to || email);

    if (!recipient || !isValidEmail(recipient)) {
      console.error('❗ Invalid or missing recipient:', recipient);
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid recipient email address' },
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

    // Log full response from Resend
    console.log('📨 Resend response:', { data, error });

    if (error || !data?.id) {
      console.error('❌ Resend error:', error || 'No data returned');
      return NextResponse.json(
        { ok: false, error: error || 'Failed to send email, no response from Resend' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    console.error('🚨 Welcome email route error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}