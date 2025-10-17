import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

type Reminder = {
  id: string;
  email: string;
  title: string;          // <- use title, not subject
  remind_at: string;      // timestamp
  status: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_BASE_URL = process.env.APP_BASE_URL!; // e.g. https://zolarus.arison8.com

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export const handler: Handler = async () => {
  try {
    // Pull due reminders (status pending & remind_at <= now)
    const { data, error } = await supabase
      .from<Reminder>("reminders")
      .select("id,email,title,remind_at,status")
      .lte("remind_at", new Date().toISOString())
      .in("status", ["PENDING", "QUEUED"]);

    if (error) {
      console.error("fetch reminders error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, step: "fetch", error })
      };
    }

    const due = data ?? [];
    if (due.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, processed: 0, sent: 0 })
      };
    }

    // Call the existing confirm API for each reminder
    const confirmUrl = `${APP_BASE_URL}/api/reminders/confirm`;
    let sent = 0;

    for (const r of due) {
      try {
        const res = await fetch(confirmUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: r.id })
        });

        if (res.ok) sent += 1;
        else {
          const txt = await res.text().catch(() => "");
          console.error("confirm failed", r.id, res.status, txt);
        }
      } catch (e) {
        console.error("confirm error", r.id, e);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, processed: due.length, sent })
    };
  } catch (e) {
    console.error("cron fatal", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, step: "fatal", error: String(e) })
    };
  }
};
