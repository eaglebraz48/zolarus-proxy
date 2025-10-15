'use server';

import { Resend } from 'resend';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail(email: string, title: string, remindAt: string) {
  if (!email || !title || !remindAt) return;

  try {
    const when = new Date(remindAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f7f7f8;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
          <h1 style="margin-top:0">⏰ Reminder from Zolarus</h1>
          <p style="font-size:16px;margin:8px 0">Don’t forget:</p>
          <p style="font-size:18px;font-weight:600;color:#2b2f36">${title}</p>
          <p style="font-size:14px;color:#444">Scheduled for <b>${when}</b></p>
          <a href="${process.env.APP_BASE_URL || process.env.URL || process.env.DEPLOY_URL || '#'}"
             style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:10px;background:#6d4aff;color:#fff;text-decoration:none;font-weight:600"
             target="_blank" rel="noreferrer">Open Zolarus</a>
          <hr style="margin:24px 0;border:0;border-top:1px solid #eee" />
          <p style="font-size:12px;color:#666">Zolarus · arison8.com</p>
        </div>
      </div>`;

    const { data, error } = await resend.emails.send({
      from: 'Zolarus <reminders@arison8.com>',
      to: [email],
      subject: `⏰ Reminder: ${title}`,
      html,
    });

    if (error) console.error('Error sending reminder email:', error);
    return data;
  } catch (err) {
    console.error('Unexpected error sending reminder email:', err);
  }
}
