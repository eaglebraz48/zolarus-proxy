// netlify/functions/stripe-webhook.ts
import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const resend = new Resend(process.env.RESEND_API_KEY as string);

// --- simple i18n copy ---
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
  // client_reference_id like "lang:xx"
  const ref = session.client_reference_id ?? '';
  const m = /^lang:([a-z]{2})$/i.exec(ref);
  if (m) {
    const code = m[1].toLowerCase();
    if (code in M) return code as LangKey;
  }
  const metaLang = (session.metadata?.lang || '').toLowerCase();
  if (metaLang && metaLang in M) return metaLang as LangKey;
  return 'en';
}

export const handler: Handler = async (event) => {
  try {
    // Signature + secret
    const sig =
      (event.headers['stripe-signature'] as string) ||
      (event.headers['Stripe-Signature'] as string);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    if (!sig || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return { statusCode: 400, body: 'Missing Stripe signature or webhook secret' };
    }

    // Raw body (respect base64 encoding in Netlify dev)
    const bodyString = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '');

    const stripeEvent = stripe.webhooks.constructEvent(bodyString, sig, webhookSecret);

    // --- handle only what we need for now ---
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;

      // Identify customer email from Hosted Link / Checkout
      const email =
        session.customer_details?.email ||
        (session.customer_email as string | undefined) ||
        null;

      const lang = pickLang(session);
      const t = M[lang];

      // Derive a few optional Stripe fields (safe-null)
      const customerId = (session.customer as string) || null;
      // Checkout session doesn’t include line_items unless expanded;
      // keep price null unless you expand on the Stripe side later.
      const priceId = null as string | null;
      const status = 'active'; // on checkout completion for a sub link this is effectively active
      const periodEnd = null as string | null;

      // 🔄 Write ONLY to stripe_subscriptions (profiles untouched)
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

      // ✉️ Send localized receipt via Resend (optional)
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
        } catch (e: any) {
          console.error('Resend error:', e?.message || e);
        }
      }
    }

    // success
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err: any) {
    console.error('Webhook error:', err?.message || err);
    return { statusCode: 400, body: JSON.stringify({ error: err?.message || 'bad request' }) };
  }
};
