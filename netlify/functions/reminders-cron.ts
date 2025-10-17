// netlify/functions/reminders-cron.ts
import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  try {
    const base = process.env.APP_BASE_URL!;
    const url = `${base}/.netlify/functions/reminders-check?source=cron`;

    const res = await fetch(url, { method: "GET" });
    const body = await res.text();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: res.ok,
        status: res.status,
        length: body.length,
      }),
      headers: { "content-type": "application/json" },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: `cron error: ${err?.message || String(err)}`,
    };
  }
};
