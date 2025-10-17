import type { Handler } from "@netlify/functions";

const siteBase =
  process.env.DEPLOY_URL ||      // best for functions
  process.env.URL ||             // production
  process.env.SITE_URL ||        // fallback
  process.env.APP_BASE_URL || ""; // last resort

export const handler: Handler = async () => {
  try {
    if (!siteBase) throw new Error("No site base URL available");

    const url = `${siteBase}/.netlify/functions/reminders-check?source=cron`;

    const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
    const text = await res.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: res.ok, status: res.status, length: text.length }),
      headers: { "content-type": "application/json" },
    };
  } catch (e: any) {
    return { statusCode: 500, body: `cron error: ${e?.message || String(e)}` };
  }
};
