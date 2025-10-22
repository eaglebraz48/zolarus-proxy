// app/api/stripe-webhook/route.ts
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use the API version shown in your Stripe Test events panel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-09-30.clover',
});

// Supabase + Resend
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
const resend = new Resend(process.env.RESEND_API_KEY as string);

// --- i18n copy
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
    // 1) Raw body exactly as Stripe signed it
    const body = await req.text();
    const h = headers(); // sync
    const signature = h.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    if (!body || body.length === 0) {
      console.error('❌ Empty body received');
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    // 2) Verify signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Signature verified:', { type: event.type, len: body.length });
    } catch (err: any) {
      console.error('❌ Signature verification failed:', {
        msg: err?.message,
        len: body.length,
        ct: h.get('content-type'),
        apiVersion: h.get('stripe-version') || null,
      });
      return NextResponse.json({ error: 'signature_verification_failed' }, { status: 400 });
    }

    // 3) Handle events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const email =
        session.customer_details?.email ||
        (session.customer_email as string | null) ||
        null;

      if (email) {
        const lang = pickLang(session);
        const t = M[lang];

        const customerId = (session.customer as string) || null;
        const priceId = null as string | null; // not expanded here
        const status = 'active';
        const periodEnd = null as string | null;

        const { error } = await supabase
          .from('stripe_subscriptions')
          .upsert(
            {
              email,
              stripe_customer_id: customerId,
              stripe_price_id: priceId,
              stripe_status: status,
              current_period_end: periodEnd,
              is_subscriber: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );

        if (error) console.error('Supabase upsert error:', error.message);
        else console.log(`✅ Upserted subscription for ${email}`);

        if (process.env.RESEND_API_KEY) {
          const amount = ((session.amount_total ?? 0) / 100).toFixed(2);
          const currency = (session.currency || 'usd').toUpperCase();
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
      } else {
        console.warn('⚠️ checkout.session.completed without email; skipping DB/email.');
      }
    }

    return NextResponse.json({ received: true, type: (event as any)?.type ?? 'unknown' });
  } catch (err: any) {
    console.error('Webhook error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

// Optional health endpoints (nice for quick checks)
export async function GET() {
  return NextResponse.json({ ok: true, expects: 'POST from Stripe' }, { status: 200 });
}
export async function HEAD() { return new Response(null, { status: 200 }); }
