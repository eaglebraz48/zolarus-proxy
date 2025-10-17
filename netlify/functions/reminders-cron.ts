// Netlify Scheduled Function: calls the checker with an absolute URL
import type { Handler } from "@netlify/functions";

const SITE =
  (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "").replace(
    /\/+$/,
    ""
  );

export const handler: Handler = async () => {
  if (!SITE || !/^https?:\/\//i.test(SITE)) {
    return {
      statusCode: 500,
      body: "Missing or invalid NEXT_PUBLIC_SITE_URL / APP_BASE_URL",
    };
  }

  const url = `${SITE}/.netlify/functions/reminders-check`;

  try {
    // Abort after 25s so the function doesn’t hang
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25_000);

    const res = await fetch(url, {
      method: "POST", // use POST so CDNs/proxies don’t cache it
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "User-Agent": "reminders-cron/1.0",
      },
      body: JSON.stringify({ source: "cron" }),
      signal: ac.signal,
    });

    clearTimeout(t);

    const text = await res.text();
    return {
      statusCode: res.ok ? 200 : res.status,
      body: text || "ok",
    };
  } catch (err: any) {
    return {
      statusCode: 502,
      body: `fetch error: ${err?.message || String(err)}`,
    };
  }
};
