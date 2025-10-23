// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Run on Node (not edge) and allow dynamic
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe client
 * Use the EXACT API version you see on your Stripe Test events page.
 * If unsure, you can remove apiVersion to use your account default.
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-09-30.clover',
});

// Supabase (requires SERVICE ROLE key)
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Resend (optional)
const resend = new Resend(process.env.RESEND_API_KEY as string);

// --- i18n copy for the receipt email
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

// ---- Webhook handler
export async function POST(req: NextRequest) {
  // Entry log (safe; no secrets)
  console.log('🔔 Stripe webhook hit', {
    when: new Date().toISOString(),
    url: req.url,
    ct: req.headers.get('content-type'),
  });

  try {
    // Raw body that Stripe signed
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;

    if (!signature) {
      console.error('❌ Missing Stripe signature header');
      return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
    }
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'missing_webhook_secret' }, { status: 500 });
    }
    if (!body) {
      console.error('❌ Empty body');
      return NextResponse.json({ error: 'empty_body' }, { status: 400 });
    }

    // Verify signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Signature OK', { type: event.type, eventId: (event as any).id });
    } catch (err: any) {
      console.error('❌ Signature verification failed', { msg: err?.message });
      return NextResponse.json({ error: 'signature_verification_failed' }, { status: 400 });
    }

    // Handle the one we care about right now
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Email (works for Payment Links & Checkout)
      const email =
        session.customer_details?.email ||
        (session.customer_email as string | null) ||
        null;

      // Basic fields we can store without expansions
      const stripe_customer_id = (session.customer as string) || null;
      const stripe_status = session.mode === 'subscription' ? 'active' : 'paid';
      const stripe_price_id = null as string | null; // not expanded here
      const current_period_end = null as string | null; // not expanded here
      const is_subscriber = true;

      console.log('🧾 Parsed session', {
        email,
        stripe_customer_id,
        status: stripe_status,
        amount_total: session.amount_total,
        currency: session.currency,
      });

      // Upsert → requires UNIQUE(email) on public.stripe_subscriptions(email)
      if (email) {
        const payload = {
          email,
          stripe_customer_id,
          stripe_price_id,
          stripe_status,
          current_period_end,
          is_subscriber,
          updated_at: new Date().toISOString(),
        };

        const { error, data } = await supabase
          .from('stripe_subscriptions')
          .upsert(payload, { onConflict: 'email' });

        if (error) {
          console.error('❌ Supabase upsert error', {
            message: error.message,
            details: (error as any)?.details ?? null,
            hint: (error as any)?.hint ?? null,
            code: (error as any)?.code ?? null,
          });
        } else {
          console.log('✅ Supabase upsert SUCCESS', { email, data });
        }

        // Optional: send a simple receipt
        if (process.env.RESEND_API_KEY) {
          const lang = pickLang(session);
          const t = M[lang];
          const amount = ((session.amount_total ?? 0) / 100).toFixed(2);
          const currency = (session.currency || 'usd').toUpperCase();

          try {
            await resend.emails.send({
              from: process.env.RESEND_FROM || 'Zolarus <noreply@arison8.com>',
              to: email,
              subject: t.subject,
              text: t.body(amount, currency, session.id),
            });
            console.log('✉️ Receipt sent', { email });
          } catch (e: any) {
            console.error('❌ Resend error', { msg: e?.message });
          }
        }
      } else {
        console.warn('⚠️ No email on checkout.session.completed; skipping DB/email.');
      }
    } else {
      // Ignore other events for now (still log for traceability)
      console.log('ℹ️ Ignored event type', {
        type: (event as any).type,
        eventId: (event as any).id,
      });
    }

    console.log('🏁 Webhook processing completed');
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('💥 Webhook handler error', { msg: err?.message || String(err) });
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

// Health checks for the route
export async function GET() {
  return NextResponse.json({ ok: true, expects: 'POST from Stripe' }, { status: 200 });
}
export async function HEAD() {
  return new Response(null, { status: 200 });
}
