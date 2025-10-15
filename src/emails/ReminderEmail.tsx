// src/emails/ReminderEmail.tsx
import * as React from 'react';

export default function ReminderEmail({
  title,
  remindAt,
  baseUrl = 'https://zolarus.arison8.com',
}: {
  title?: string | null;
  remindAt: string;         // ISO string
  baseUrl?: string;         // e.g. https://zolarus.arison8.com
}) {
  const when = new Date(remindAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const href = `${baseUrl.replace(/\/$/, '')}/reminders`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 24, maxWidth: 600 }}>
      <h1 style={{ marginTop: 0 }}>Zolarus Reminder</h1>
      <p style={{ fontSize: 16 }}>
        Here’s your reminder: <strong>{title || 'Untitled reminder'}</strong>
      </p>
      <p style={{ color: '#666' }}>Scheduled for {when}</p>

      <a
        href={href}
        style={{
          display: 'inline-block',
          marginTop: 16,
          padding: '10px 16px',
          background: '#6b46ff',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open Zolarus
      </a>

      <p style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
        You’re receiving this because you created a reminder in Zolarus.
      </p>
    </div>
  );
}
