import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler() {
  const nowISO = new Date().toISOString();

  // Quick env sanity in the response (no secrets)
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
      return resp(500, {
        ...envCheck,
        stage: 'query',
        error: queryError.message
      });
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
        // Use a guaranteed-verified sender to remove DNS as a variable
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

      // Only mark as sent if Resend step said ok
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

    return resp(200, {
      ...envCheck,
      processed: dueReminders?.length ?? 0,
      sent: sentCount,
      details
    });
  } catch (e) {
    return resp(500, {
      ...envCheck,
      stage: 'fatal',
      error: String(e)
    });
  }
}

function resp(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

// avoid dumping huge objects
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
