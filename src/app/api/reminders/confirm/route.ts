export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Tiny .ics generator for the confirmation email (optional)
function buildICS(title: string, startISO: string, minutes = 60) {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + minutes * 60000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const uid = `${crypto.randomUUID()}@zolarus`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zolarus//Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export async function POST(req: Request) {
  try {
    const { reminderId, title, remindAt } = (await req.json()) as {
      reminderId: string;
      title: string;
      remindAt: string;
    };

    // Server-side Supabase client using Service Role (env must be set)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Idempotent confirmation log
    try {
      await supabase
        .from('reminder_notifications')
        .insert({ reminder_id: reminderId, kind: 'confirm' })
        .select()
        .single();
    } catch {
      // swallow the insert error silently
    }

    // In-app ping for the owner
    let r = null;
    try {
      const { data } = await supabase
        .from('reminders')
        .select('user_id')
        .eq('id', reminderId)
        .single();
      r = data;
    } catch {
      r = null;
    }

    if (r?.user_id) {
      await supabase.from('inapp_notifications').insert({
        user_id: r.user_id,
        title: 'Reminder saved',
        body: title,
      });
    }

    // Optional: send email here with `buildICS(title, remindAt)`
    // (hook your mail provider and attach the ICS as "reminder.ics")

    return NextResponse.json({ ok: true });
  } catch {
    // Keep the page flow smooth even if the route fails
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
