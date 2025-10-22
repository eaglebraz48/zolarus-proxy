// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Match the API version shown on your Stripe Test events
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-09-30.clover',
});

// Server-side Supabase + Resend
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
const resend = new Resend(process.env.RESEND_API_KEY as string);

// --- simple i18n
const M = {
  en: {
    subject: 'Thanks for your payment',
    body: (amt: string, cur: string, id: string) =>
      `We received your payment of ${amt} ${cur}.
Order: ${id}
If you have any questions, just reply to this email.`,
  },
  es: {
    subject: 'Gracias por tu pago',
    body: (amt: string, cur: string, id: string) =>
      `Hemos recibido tu pago de ${amt} ${cur}.
Pedido: ${id}
Si tienes preguntas, responde a este correo.`,
  },
  pt: {
    subject: 'Obrigado pelo seu pagamento',
    body: (amt: string, cur: string, id: string) =>
      `Recebemos o seu pagamento de ${amt} ${cur}.
Pedido: ${id}
Se tiver alguma dúvida, basta responder a este e-mail.`,
  },
  fr: {
    subject: 'Merci pour votre paiement',
    body: (amt: string, cur: string, id: string) =>
      `Nous avons reçu votre paiement de ${amt} ${cur}.
Commande : ${id}
Pour toute question, répondez simplement à cet e-mail.`,
  },
} as const;
type LangKey = keyof typeof M;

function pickLang(session: Stripe.Checkout.Session): LangKey {
  const ref = session.client_reference_id ?? '';
  const m = /^lang:([a-z]{2})$/i.exec(ref);
  if (m && (m[1].toLowerCase() in M)) return m[1].toLowerCase() as LangKey;
  const metaLang = (session.metadata?.lang || '').toLowerCase();
  return (metaLang && metaLang in M ? metaLang : 'en') as LangKey;
}

export async function POST(req: NextRequest) {
  try {
    // Raw body that Stripe signed
    const body = await req.text();

    // Headers
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;

    if (!signature) return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    if (!body) return NextResponse.json({ error: 'Empty body' }, { status: 400 });

    // Verify signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Signature verified:', { type: event.type });
    } catch (err: any) {
      console.error('❌ Signature verification failed:', err?.message || err);
      return NextResponse.json({ error: 'signature_verification_failed' }, { status: 400 });
    }

    // Handle what we care about
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Email resolution
      const email =
        session.customer_details?.email ||
        (session.customer_email as string | null) ||
        null;

      // Columns you actually have in Supabase (per your screenshots)
      const stripe_customer_id = (session.customer as string) || null;
      const stripe_subscription_id = (session.subscription as string) || null; // will be null for one-time payments
      const stripe_price_id = null as string | null; // not expanded here
      // For one-time payments, use 'paid'; for subscriptions, 'active' on checkout success is fine
      const stripe_status = session.mode === 'subscription' ? 'active' : 'paid';
      const stripe_current_period_end = null as string | null; // not available without expansion
      const is_subscriber = true; // your business rule

      if (!email) {
        console.warn('checkout.session.completed without email; skipping DB/email.');
      } else {
        // Upsert by email (make sure you created UNIQUE INDEX on email)
        const { error } = await supabase
          .from('stripe_subscriptions')
          .upsert(
            {
              email,
              stripe_customer_id,
              stripe_subscription_id,
              stripe_price_id,
              stripe_status,
              stripe_current_period_end,
              is_subscriber,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );

        if (error) {
          console.error('Supabase upsert error:', error.message);
        } else {
          console.log(`✅ Upserted stripe_subscriptions for ${email}`);
        }

        // Optional receipt via Resend
        if (process.env.RESEND_API_KEY) {
          const amount = ((session.amount_total ?? 0) / 100).toFixed(2);
          const currency = (session.currency || 'usd').toUpperCase();
          const t = M[pickLang(session)];
          try {
            await resend.emails.send({
              from: process.env.RESEND_FROM || 'Zolarus <noreply@arison8.com>',
              to: email,
              subject: t.subject,
              text: t.body(amount, currency, session.id),
            });
            console.log(`✉️ Sent receipt to ${email}`);
          } catch (e: any) {
            console.error('Resend error:', e?.message || e);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

// Health checks
export async function GET() {
  return NextResponse.json({ ok: true, expects: 'POST from Stripe' }, { status: 200 });
}
export async function HEAD() {
  return new Response(null, { status: 200 });
}
