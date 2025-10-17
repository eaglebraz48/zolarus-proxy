import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// --- env required (already in your Netlify env list) ---
// RESEND_API_KEY, RESEND_FROM, (optional) RESEND_REPLY_TO
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async () => {
  const now = new Date();
  const windowMs = 2 * 60 * 1000; // +/- 2 minutes
  const floor = new Date(now.getTime() - windowMs).toISOString();
  const ceil  = new Date(now.getTime() + windowMs).toISOString();

  // Adjust table/columns if yours differ:
  // id, user_id, email, subject, body, send_at (timestamptz), sent (bool), sent_at (timestamptz)
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id, email, subject, body, send_at")
    .eq("sent", false)
    .gte("send_at", floor)
    .lte("send_at", ceil)
    .limit(50);

  if (error) {
    console.error("fetch reminders error:", error);
    return { statusCode: 500, body: "fetch error" };
  }

  for (const r of reminders ?? []) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: r.email,
        reply_to: process.env.RESEND_REPLY_TO || undefined,
        subject: r.subject || "Reminder",
        html: `<p>${r.body || "You asked to be reminded."}</p>
               <p><small>Scheduled: ${new Date(r.send_at).toLocaleString()}</small></p>`
      });

      await supabase
        .from("reminders")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", r.id);
    } catch (e) {
      console.error("send/update failed:", r.id, e);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ processed: reminders?.length ?? 0 }) };
};
