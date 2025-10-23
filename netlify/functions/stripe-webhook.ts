// netlify/functions/stripe-webhook.ts
import type { Handler } from '@netlify/functions';
import type StripeNS from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

/* ---------- clients ---------- */
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
const resend = new Resend(process.env.RESEND_API_KEY as string);

/* ---------- i18n ---------- */
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

/* ---------- stripe (warm cache) ---------- */
let _stripe: StripeNS | null = null;
async function stripe(): Promise<StripeNS> {
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

/* ---------- db helpers ---------- */
async function upsertSubscriptionRow(args: {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_end: number | null;
}) {
  await supabase.from('subscriptions').upsert({
    user_id: args.user_id,
    stripe_customer_id: args.stripe_customer_id,
    stripe_subscription_id: args.stripe_subscription_id,
    status: args.status,
    current_period_end: args.current_period_end
      ? new Date(args.current_period_end * 1000).toISOString()
      : null,
  });
}

/* ---------- handler ---------- */
export const handler: Handler = async (event) => {
  const sig =
    (event.headers['stripe-signature'] as string) ||
    (event.headers['Stripe-Signature'] as string);
  const whsec = process.env.STRIPE_WEBHOOK_SECRET as string;

  if (!sig || !whsec) {
    return { statusCode: 400, body: 'Missing Stripe signature or webhook secret' };
  }

  try {
    const s = await stripe();

    // Netlify raw body handling
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '');

    let ev: StripeNS.Event;
    try {
      ev = s.webhooks.constructEvent(rawBody, sig, whsec);
    } catch (e: any) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'signature_verification_failed', message: e?.message }),
      };
    }

    /* ----------------- checkout.session.completed ----------------- */
    if (ev.type === 'checkout.session.completed') {
      const session = ev.data.object as StripeNS.Checkout.Session;

      // Require subscription checkout
      if (session.mode === 'subscription' && session.subscription && session.customer) {
        // We must have stored the Supabase user id in metadata when creating the session
        const userId = session.metadata?.sb_user_id || null;
        if (userId) {
          const sub = await s.subscriptions.retrieve(String(session.subscription));

          await upsertSubscriptionRow({
            user_id: userId,
            stripe_customer_id: String(session.customer),
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_end: sub.current_period_end ?? null,
          });
        }
      }

      // Optional: send email receipt via Resend (best-effort)
      const email =
        session.customer_details?.email ||
        (session.customer_email as string | undefined) ||
        null;
      if (email && process.env.RESEND_API_KEY) {
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
        } catch {
          /* ignore email errors */
        }
      }
    }

    /* ----------------- customer.subscription.* ----------------- */
    if (ev.type.startsWith('customer.subscription.')) {
      const sub = ev.data.object as StripeNS.Subscription;

      // Find our user by customer id
      const { data: row } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', String(sub.customer))
        .maybeSingle();

      const userId = row?.user_id || (sub.metadata?.sb_user_id as string | undefined);
      if (userId) {
        await upsertSubscriptionRow({
          user_id: userId,
          stripe_customer_id: String(sub.customer),
          stripe_subscription_id: sub.id,
          status: sub.status,
          current_period_end: sub.current_period_end ?? null,
        });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, type: ev.type }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'internal_error' }) };
  }
};
