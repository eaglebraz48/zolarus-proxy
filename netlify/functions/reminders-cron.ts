// netlify/functions/reminders-cron.ts
import type { Handler } from '@netlify/functions';

const handler: Handler = async () => {
  const url = `${process.env.APP_BASE_URL}/.netlify/functions/reminders-check`;

  // real 30s timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: '{}',                 // mirrors your working curl
      signal: controller.signal,  // enforce timeout
    });

    const text = await res.text();
    return { statusCode: res.ok ? 200 : res.status, body: text };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err?.name === 'AbortError' ? 'timeout' : (err?.message || String(err)),
      }),
    };
  } finally {
    clearTimeout(timer);
  }
};

export { handler };
