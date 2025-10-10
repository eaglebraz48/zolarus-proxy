// netlify/functions/reminders-check.ts
import type { Handler } from "@netlify/functions";
import { Resend } from "resend";

// ENV you need in Netlify (Project → Site configuration → Environment variables):
//  - SUPABASE_URL
//  - SUPABASE_SERVICE_ROLE_KEY
//  - RESEND_API_KEY
//  - APP_BASE_URL  (e.g. https://zolarus.arison8.com)

const resend = new Resend(process.env.RESEND_API_KEY!);

type Reminder = {
  id: string;
  user_id: string;
  title: string | null;
  contact_name: string | null;
  occasion: string | null;
  remind_at: string; // ISO
  sent_at: string | null;
};

type Profile = {
  id: string;
  email: string | null;
  lang?: string | null;
};

const sb = (path: string, init: RequestInit = {}) =>
  fetch(`${process.env.SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });

export const handler: Handler = async () => {
  try {
    // Check reminders due in the last 10 minutes up to now
    const now = new Date();
    const winStart = new Date(now.getTime() - 10 * 60 * 1000);

    const { reminders, errR } = await selectDueReminders(winStart, now);
    if (errR) throw errR;

    if (!reminders.length) {
      return ok({ processed: 0, sent: 0 });
    }

    const userIds = Array.from(new Set(reminders.map(r => r.user_id)));
    const profiles = await getProfiles(userIds);
    const byUser = new Map(profiles.map(p => [p.id, p]));

    let sentCount = 0;

    for (const r of reminders) {
      const p = byUser.get(r.user_id);
      const to = p?.email;
      const lang = (p?.lang || "en") as "en" | "pt" | "es" | "fr";

      if (!to) {
        // Mark sent so we don't retry forever (or choose to skip marking)
        await markSent([r.id]);
        continue;
      }

      const subject = subjectByLang(lang, r);
      const html = renderReminderHtml(lang, r);

      try {
        await resend.emails.send({
          from: "Zolarus <noreply@arison8.com>",
          to: [to],
          subject,
          html,
        });

        await markSent([r.id]);
        sentCount++;
      } catch (e) {
        console.error("Failed to send reminder", r.id, e);
        // Not marking sent here so it can retry on the next run
      }
    }

    return ok({ processed: reminders.length, sent: sentCount });
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: "reminders-check failed" }) };
  }
};

function ok(body: any) {
  return { statusCode: 200, body: JSON.stringify(body) };
}

async function selectDueReminders(from: Date, to: Date) {
  const url =
    `/reminders?select=id,user_id,title,contact_name,occasion,remind_at,sent_at` +
    `&remind_at=lte.${to.toISOString()}` +
    `&remind_at=gte.${from.toISOString()}` +
    `&sent_at=is.null`;

  const res = await sb(url);
  if (!res.ok) return { reminders: [] as Reminder[], errR: await res.text() };
  const reminders = (await res.json()) as Reminder[];
  return { reminders, errR: null as any };
}

async function getProfiles(userIds: string[]) {
  if (!userIds.length) return [];
  const inList = userIds.map(id => `"${id}"`).join(",");
  const url = `/profiles?select=id,email,lang&id=in.(${inList})`;
  const res = await sb(url);
  if (!res.ok) return [];
  return (await res.json()) as Profile[];
}

async function markSent(ids: string[]) {
  if (!ids.length) return;
  const inList = ids.map(id => `"${id}"`).join(",");
  await sb(`/reminders?id=in.(${inList})`, {
    method: "PATCH",
    body: JSON.stringify({ sent_at: new Date().toISOString() }),
  });
}

function subjectByLang(lang: "en" | "pt" | "es" | "fr", r: Reminder): string {
  const title = r.title || "Reminder";
  const map = {
    en: `⏰ Reminder: ${title}`,
    pt: `⏰ Lembrete: ${title}`,
    es: `⏰ Recordatorio: ${title}`,
    fr: `⏰ Rappel : ${title}`,
  };
  return map[lang] || map.en;
}

function renderReminderHtml(lang: "en" | "pt" | "es" | "fr", r: Reminder) {
  const when = new Date(r.remind_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const app = process.env.APP_BASE_URL || "https://app.arison8.com";
  const who = r.contact_name || "";
  const occ = r.occasion ? ` • ${r.occasion}` : "";
  const title = r.title || "Reminder";

  const intro: Record<typeof lang, string> = {
    en: "Here's your reminder:",
    pt: "Seu lembrete:",
    es: "Aquí está tu recordatorio:",
    fr: "Voici votre rappel :",
  };

  const open: Record<typeof lang, string> = {
    en: "Open Zolarus",
    pt: "Abrir Zolarus",
    es: "Abrir Zolarus",
    fr: "Ouvrir Zolarus",
  };

  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px">
    <h1 style="margin:0 0 12px">Zolarus</h1>
    <p style="font-size:16px">${intro[lang]}</p>
    <div style="border:1px solid #eee;border-radius:12px;padding:16px;margin:12px 0">
      <p style="margin:0 0 8px"><strong>${title}</strong>${occ}</p>
      ${who ? `<p style="margin:0 0 8px">For: ${who}</p>` : ""}
      <p style="margin:0;color:#555">Scheduled for ${when}</p>
    </div>
    <p>
      <a href="${app}/reminders"
         style="display:inline-block;padding:10px 16px;background:#6b46ff;color:white;text-decoration:none;border-radius:8px">
         ${open[lang]}
      </a>
    </p>
    <p style="color:#999;font-size:12px">You’re receiving this because you created a reminder in Zolarus.</p>
  </div>`;
}

