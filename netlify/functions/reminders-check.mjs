// netlify/functions/reminders-check.mjs
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, context) => {
  const nowISO = new Date().toISOString();
  
  const envCheck = {
    has_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_RESEND_KEY: !!process.env.RESEND_API_KEY,
    time: nowISO
  };

  try {
    const { data: dueReminders, error: queryError } = await supabase
      .from('reminders')
      .select('id, title, remind_at, email')
      .lte('remind_at', nowISO)
      .is('sent_at', null);

    if (queryError) {
      return new Response(
        JSON.stringify({
          ...envCheck,
          stage: 'query',
          error: queryError.message,
          processed: 0,
          sent: 0
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const details = [];
    let sentCount = 0;

    for (const r of dueReminders ?? []) {
      const item = {
        id: r.id,
        email: r.email || null,
        title: r.title || null,
        remind_at: r.remind_at
      };

      if (!r.email) {
        item.skip = 'no email';
        details.push(item);
        continue;
      }

      try {
        const send = await resend.emails.send({
          from: 'Zolarus Reminders <onboarding@resend.dev>',
          to: r.email,
          subject: `Reminder: ${r.title ?? '(no title)'}`,
          html: `<h2>${r.title ?? 'Reminder'}</h2><p>Scheduled: ${new Date(r.remind_at).toISOString()}</p>`
        });
        item.resend_ok = true;
        item.resend_response = summarizeResend(send);
      } catch (e) {
        item.resend_ok = false;
        item.resend_error = String(e);
      }

      if (item.resend_ok) {
        const { error: updErr } = await supabase
          .from('reminders')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', r.id);
        if (updErr) {
          item.update_ok = false;
          item.update_error = updErr.message;
        } else {
          item.update_ok = true;
          sentCount++;
        }
      }
      details.push(item);
    }

    return new Response(
      JSON.stringify({
        ...envCheck,
        processed: dueReminders?.length ?? 0,
        sent: sentCount,
        details
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ...envCheck,
        stage: 'fatal',
        error: String(e),
        processed: 0,
        sent: 0
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

function summarizeResend(obj) {
  try {
    const { data, error } = obj || {};
    return {
      data_id: data?.id ?? null,
      data_to: data?.to ?? null,
      error: error ? String(error) : null
    };
  } catch {
    return { raw: 'unserializable resend response' };
  }
}