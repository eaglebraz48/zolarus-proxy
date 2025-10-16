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
  
  console.log('[reminders-check] Starting at:', nowISO);
  console.log('[reminders-check] Env vars present:', {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_KEY: !!process.env.RESEND_API_KEY
  });

  try {
    console.log('[reminders-check] Querying reminders...');
    
    const { data: dueReminders, error: queryError } = await supabase
      .from('reminders')
      .select('id, title, remind_at, email, sent_at')
      .lte('remind_at', nowISO)
      .is('sent_at', null);

    console.log('[reminders-check] Query result:', {
      error: queryError,
      count: dueReminders?.length,
      data: dueReminders
    });

    if (queryError) {
      console.error('[reminders-check] Query failed:', queryError);
      return new Response(
        JSON.stringify({
          error: 'Query failed',
          message: queryError.message,
          processed: 0,
          sent: 0,
          time: nowISO
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!dueReminders || dueReminders.length === 0) {
      console.log('[reminders-check] No reminders due');
      return new Response(
        JSON.stringify({
          message: 'No reminders due',
          processed: 0,
          sent: 0,
          time: nowISO
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[reminders-check] Found ${dueReminders.length} due reminders`);

    const details = [];
    let sentCount = 0;

    for (const r of dueReminders) {
      console.log(`[reminders-check] Processing reminder: ${r.id}`);
      
      const item = {
        id: r.id,
        title: r.title,
        email: r.email,
        remind_at: r.remind_at,
        status: null
      };

      if (!r.email) {
        item.status = 'SKIP - no email';
        details.push(item);
        console.log(`[reminders-check] Skipped ${r.id}: no email`);
        continue;
      }

      try {
        console.log(`[reminders-check] Sending email to ${r.email}`);
        
        const send = await resend.emails.send({
          from: 'Zolarus Reminders <onboarding@resend.dev>',
          to: r.email,
          subject: `Reminder: ${r.title ?? '(no title)'}`,
          html: `<h2>${r.title ?? 'Reminder'}</h2><p>Scheduled: ${new Date(r.remind_at).toISOString()}</p>`
        });

        console.log(`[reminders-check] Email sent, response:`, send);
        item.resend_ok = true;
        item.resend_response = send;
      } catch (e) {
        item.resend_ok = false;
        item.resend_error = String(e);
        console.error(`[reminders-check] Email send failed:`, e);
      }

      if (item.resend_ok) {
        try {
          console.log(`[reminders-check] Marking ${r.id} as sent`);
          
          const { error: updErr } = await supabase
            .from('reminders')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', r.id);

          if (updErr) {
            item.update_ok = false;
            item.update_error = updErr.message;
            console.error(`[reminders-check] DB update failed:`, updErr);
          } else {
            item.update_ok = true;
            sentCount++;
            item.status = 'SENT';
            console.log(`[reminders-check] Successfully marked ${r.id} as sent`);
          }
        } catch (updateEx) {
          item.update_ok = false;
          item.update_error = String(updateEx);
          console.error(`[reminders-check] Update exception:`, updateEx);
        }
      }

      details.push(item);
    }

    const response = {
      processed: dueReminders.length,
      sent: sentCount,
      time: nowISO,
      details
    };

    console.log('[reminders-check] Final response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (e) {
    console.error('[reminders-check] Fatal error:', e);
    return new Response(
      JSON.stringify({
        error: 'Fatal error',
        message: String(e),
        processed: 0,
        sent: 0,
        time: nowISO
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};