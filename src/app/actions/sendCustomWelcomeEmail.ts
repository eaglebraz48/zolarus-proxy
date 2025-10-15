'use server';

import { Resend } from 'resend';
import WelcomeEmail from '@/emails/WelcomeEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

// Narrow lang to the allowed union:
type Lang = 'en' | 'pt' | 'es' | 'fr';
const LANGS: readonly Lang[] = ['en', 'pt', 'es', 'fr'];

export async function sendCustomWelcomeEmail(email: string, lang: string) {
  if (!email || !lang) return;

  // runtime guard so TS knows it's Lang
  const safeLang: Lang = (LANGS as readonly string[]).includes(lang) ? (lang as Lang) : 'en';

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Zolarus <noreply@arison8.com>',
      replyTo: process.env.RESEND_REPLY_TO || 'matt@arison8.com',
      to: [email],
      subject:
        {
          en: '🎁 Welcome to Zolarus!',
          pt: '🎁 Bem-vindo ao Zolarus!',
          es: '🎁 Bienvenido a Zolarus!',
          fr: '🎁 Bienvenue à Zolarus!',
        }[safeLang],
      react: React.createElement(WelcomeEmail, { email, lang: safeLang }),
    });

    if (error) {
      console.error('❌ Error sending welcome email:', error);
    } else {
      console.log('✅ Welcome email sent successfully to:', email);
    }

    return data;
  } catch (err) {
    console.error('🚨 Unexpected error sending email:', err);
  }
}
