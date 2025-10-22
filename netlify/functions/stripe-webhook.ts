// netlify/functions/stripe-webhook.ts
import type { Handler } from '@netlify/functions';
import type StripeNS from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ---------- Clients (no bundling issues)
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
const resend = new Resend(process.env.RESEND_API_KEY as string);

// ---------- i18n copy
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

// ---------- cache Stripe instance across warm invocations
let _stripe: StripeNS | null = null;
async function getStripe(): Promise<StripeNS> {
  if (_stripe) return _stripe;
  const Stripe = (await import('stripe')).default;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-06-20',
  }) as unknown as StripeNS;
  return _stripe;
}

function pickLang(session: StripeNS.Checkout.Session): LangKey {
  const ref = session.client_reference_id ?? '';
  const m = /^lang:([a-z]{2})$/i.exec(ref);
  if (m && (m[1].toLowerCase() in M)) return m[1].toLowerCase() as LangKey;
  const metaLang = (session.metadata?.lang || '').toLowerCase();
  return (metaLang && metaLang in M ? metaLang : 'en') as LangKey;
}

export const handler: Handler = async (event) => {
  // Allow browser probe to show health without logging errors
  if (!event.headers['stripe-signature'] && !event.headers['Stripe-Signature']) {
    return { statusCode: 400, body: 'Missing Stripe signature' };
  }

  try {
    const stripe = await getStripe();

    const sig =
      (event.headers['stripe-signature'] as string) ||
      (event.headers['Stripe-Signature'] as string);

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
    if (!sig || !webhookSecret) {
      console.error('Missing signature or secret', { hasSig: Boolean(sig), hasSecret: Boolean(webhookSecret) });
      return { statusCode: 400, body: 'Missing Stripe signature or webhook secret' };
    }

    // 🔥 CRITICAL FIX: Netlify Functions receive the body differently
    // We need to handle it as a raw string, NOT convert to Buffer
    let rawBody: string;
    
    if (event.isBase64Encoded) {
      // If Netlify base64-encoded it, decode to UTF-8 string
      rawBody = Buffer.from(event.body || '', 'base64').toString('utf8');
    } else {
      // Use the body as-is (this is what Stripe signed)
      rawBody = event.body || '';
    }

    // Debug logging (remove after fixing)
    console.log('Webhook attempt:', {
      bodyLength: rawBody.length,
      isBase64: event.isBase64Encoded,
      hasSig: Boolean(sig),
      sigPrefix: sig?.substring(0, 20),
      secretPrefix: webhookSecret?.substring(0, 10),
      contentType: event.headers['content-type'] || event.headers['Content-Type'],
    });

    let stripeEvent: StripeNS.Event;
    try {
      // Pass rawBody as string, NOT Buffer - Stripe SDK handles conversion
      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (e: any) {
      console.error('❌ Signature verification failed:', {
        msg: e?.message,
        bodyLen: rawBody.length,
        bodyPreview: rawBody.substring(0, 100),
        sigHeader: sig?.substring(0, 50),
      });
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          error: 'signature_verification_failed',
          message: e?.message,
          hint: 'Check webhook secret matches Test mode in Stripe Dashboard'
        }) 
      };
    }

    console.log('✅ Signature verified, event type:', stripeEvent.type);

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as StripeNS.Checkout.Session;

      const email =
        session.customer_details?.email ||
        (session.customer_email as string | undefined) ||
        null;

      const lang = pickLang(session);
      const t = M[lang];

      const customerId = (session.customer as string) || null;
      const priceId = null as string | null;
      const status = 'active';
      const periodEnd = null as string | null;

      if (email) {
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

        if (error) {
          console.error('Supabase upsert error:', error.message);
        } else {
          console.log(`✅ stripe_subscriptions upserted for ${email}`);
        }
      } else {
        console.warn('⚠️ No email on checkout.session.completed; skipping DB write.');
      }

      if (email && process.env.RESEND_API_KEY) {
        const amount = ((session.amount_total ?? 0) / 100).toFixed(2);
        const currency = (session.currency || 'usd').toUpperCase();
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM || 'Zolarus <noreply@arison8.com>',
            to: email,
            subject: t.subject,
            text: t.body(amount, currency, session.id),
          });
          console.log(`✅ Email sent to ${email}`);
        } catch (e: any) {
          console.error('Resend error:', e?.message || e);
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true, type: stripeEvent.type }) };
  } catch (err: any) {
    console.error('Webhook error:', err?.message || err, err?.stack);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'internal_error' }) };
  }
};