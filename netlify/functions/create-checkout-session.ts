import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function has(k: string) { return !!process.env[k]; }
function val(k: string) { return process.env[k]; }
function must(k: string) {
  const v = val(k);
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
}

const supabase = createClient(must('SUPABASE_URL'), must('SUPABASE_SERVICE_ROLE_KEY'));
const stripe = new Stripe(must('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const body = event.body ? JSON.parse(event.body) : {};
    const user_id: string = String(body.user_id || '');
    const lang = (String(body.lang || 'en').toLowerCase()) as 'en'|'pt'|'es'|'fr';
    if (!user_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing user_id' }) };

    if (!has('STRIPE_PRICE_ID')) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing env: STRIPE_PRICE_ID' }) };
    }
    const PRICE_ID = val('STRIPE_PRICE_ID')!;

    // Infer SITE_URL locally if not set
    const host = event.headers['x-forwarded-host'] || event.headers.host || 'localhost:8888';
    const proto = (event.headers['x-forwarded-proto'] as string) || 'http';
    const SITE_URL = val('SITE_URL') || `${proto}://${host}`;

    // IMPORTANT: this must match your webhook table name
    // Your webhook upserts into "stripe_subscriptions", so read/write the same here.
    const { data: row, error: selErr } = await supabase
      .from('stripe_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (selErr) {
      console.error('[create-checkout] select error', selErr);
      return { statusCode: 500, body: JSON.stringify({ error: 'db_select_error', detail: selErr.message }) };
    }

    let customerId = row?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const c = await stripe.customers.create({ metadata: { sb_user_id: user_id } });
      customerId = c.id;

      // optionally persist customer for next time
      const { error: upErr } = await supabase
        .from('stripe_subscriptions')
        .upsert(
          { user_id, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (upErr) console.warn('[create-checkout] upsert customer warn', upErr.message);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${SITE_URL}/shop?thanks=sub&lang=${encodeURIComponent(lang)}`,
      cancel_url: `${SITE_URL}/shop?lang=${encodeURIComponent(lang)}`,
      client_reference_id: `lang:${lang}`,
      metadata: { sb_user_id: user_id, lang },
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err: any) {
    console.error('[create-checkout] error:', err?.message || err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'internal_error' }) };
  }
};
