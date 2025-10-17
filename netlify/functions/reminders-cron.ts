// netlify/functions/reminders-cron.ts
import type { Handler } from '@netlify/functions';

const handler: Handler = async () => {
  const url = `${process.env.APP_BASE_URL}/.netlify/functions/reminders-check`;

  try {
    const res = await fetch(url, { method: 'POST' });
    const text = await res.text();
    return { statusCode: res.ok ? 200 : res.status, body: text };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: error.message || String(error) }),
    };
  }
};

export { handler };
