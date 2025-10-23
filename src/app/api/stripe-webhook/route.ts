// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// run on Node (not edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** ---------- Clients ---------- */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // use the EXACT version shown on your Stripe “Test events” page
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/** ---------- tiny i18n for receipt ---------- */
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

/** ---------- Webhook ---------- */
export async function POST(req: NextRequest) {
  // don’t parse the body — Stripe needs the raw string for signing
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;

  console.log('🔔 webhook hit', {
    when: new Date().toISOString(),
    len: body.length,
    hasSig: !!signature,
    url: req.url,
  });

  if (!signature) {
    console.error('❌ missing stripe-signature header');
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'missing_webhook_secret' }, { status: 500 });
  }
  if (!body) {
    console.error('❌ empty body');
    return NextResponse.json({ error: 'empty_body' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ signature ok', { type: event.type, id: (event as any).id });
  } catch (err: any) {
    console.error('❌ signature verification failed', { msg: err?.message });
    return NextResponse.json({ error: 'signature_verification_failed' }, { status: 400 });
  }

  // handle only what you need for now
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const email =
      session.customer_details?.email ||
      (session.customer_email as string | null) ||
      null;

    const stripe_customer_id = (session.customer as string) || null;
    const stripe_status = session.mode === 'subscription' ? 'active' : 'paid';

    // optional / not expanded in this flow
    const stripe_price_id = null as string | null;
    const current_period_end = null as string | null;

    console.log('🧾 parsed session', {
      email,
      stripe_customer_id,
      amount_total: session.amount_total,
      currency: session.currency,
      mode: session.mode,
    });

    if (email) {
      // table: public.stripe_subscriptions
      // columns: email, stripe_customer_id, stripe_price_id, stripe_status,
      //          current_period_end, is_subscriber, updated_at
      const { data, error } = await supabase
        .from('stripe_subscriptions')
        .upsert(
          {
            email,
            stripe_customer_id,
            stripe_price_id,
            stripe_status,
            current_period_end,
            is_subscriber: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' } // requires UNIQUE(email)
        );

      if (error) {
        console.error('❌ supabase upsert error', {
          message: error.message,
          details: (error as any)?.details ?? null,
          code: (error as any)?.code ?? null,
        });
      } else {
        console.log('✅ supabase upsert success', { email, data });
      }

      if (resend) {
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
          console.log('✉️ receipt sent', { email });
        } catch (e: any) {
          console.error('❌ resend error', { msg: e?.message });
        }
      }
    } else {
      console.warn('⚠️ no email on session; skipping db/email');
    }
  } else {
    console.log('ℹ️ ignored event', { type: event.type });
  }

  return NextResponse.json({ received: true });
}

/** ---------- health check ---------- */
export async function GET() {
  return NextResponse.json({ ok: true, expects: 'POST from Stripe' }, { status: 200 });
}
export async function HEAD() {
  return new Response(null, { status: 200 });
}
