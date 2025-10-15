import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event, context) {
  console.log('[reminders-check] Function invoked');

  try {
    // Get current time
    const now = new Date();
    const nowISO = now.toISOString();
    console.log(`[reminders-check] Current time: ${nowISO}`);

    // Query reminders that are due (remind_at <= now) and not yet sent
    const { data: dueReminders, error: queryError } = await supabase
      .from('reminders')
      .select('id, user_id, title, remind_at, email')
      .lte('remind_at', nowISO)
      .is('sent_at', null);

    if (queryError) {
      console.error('[reminders-check] Query error:', queryError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processed: 0,
          sent: 0,
          error: queryError.message,
        }),
      };
    }

    console.log(`[reminders-check] Found ${dueReminders?.length || 0} due reminders`);

    if (!dueReminders || dueReminders.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processed: 0,
          sent: 0,
          message: 'No reminders due at this time',
        }),
      };
    }

    let sentCount = 0;

    // Process each reminder
    for (const reminder of dueReminders) {
      try {
        console.log(`[reminders-check] Processing reminder: ${reminder.id}`);

        if (!reminder.email) {
          console.warn(`[reminders-check] Reminder ${reminder.id} has no email, skipping`);
          continue;
        }

        // Send email via Resend
        const emailResult = await resend.emails.send({
          from: 'Zolarus Reminders <reminders@zolarus.com>',
          to: reminder.email,
          subject: `Reminder: ${reminder.title}`,
          html: `
            <h2>Reminder: ${reminder.title}</h2>
            <p>This is your reminder for: <strong>${reminder.title}</strong></p>
            <p>Scheduled date/time: ${new Date(reminder.remind_at).toLocaleString()}</p>
            <hr />
            <p><small>From Zolarus Reminders</small></p>
          `,
        });

        console.log(
          `[reminders-check] Email sent to ${reminder.email} for reminder ${reminder.id}:`,
          emailResult
        );

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('reminders')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        if (updateError) {
          console.error(
            `[reminders-check] Failed to mark reminder ${reminder.id} as sent:`,
            updateError
          );
        } else {
          console.log(`[reminders-check] Marked reminder ${reminder.id} as sent`);
          sentCount++;
        }
      } catch (error) {
        console.error(`[reminders-check] Error processing reminder ${reminder.id}:`, error);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        processed: dueReminders.length,
        sent: sentCount,
      }),
    };
  } catch (error) {
    console.error('[reminders-check] Fatal error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        processed: 0,
        sent: 0,
        error: error.message,
      }),
    };
  }
}
