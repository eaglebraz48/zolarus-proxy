'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function SignInPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const redirect = sp.get('next') ?? sp.get('redirect') ?? '/dashboard';
  const lang = (sp.get('lang') ?? 'en').toLowerCase();

  // Load current session (no auto-redirect)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email ?? null);
      setLoadingSession(false);
    })();
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErr(null);

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || '';

      // 🔁 point to /callback (your actual page), and use a single "redirect" param
      const emailRedirectTo =
        `${origin}/callback?redirect=${encodeURIComponent(redirect)}&lang=${encodeURIComponent(lang)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });

      if (error) throw error;
      setStatus('sent');
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to send magic link.');
      setStatus('error');
    }
  }

  function goDashboard() {
    router.push(`${redirect}?lang=${encodeURIComponent(lang)}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setStatus('idle');
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 24 }}>Sign in</h1>

      {loadingSession ? null : userEmail ? (
        <div
          style={{
            padding: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            background: '#f8fafc',
            display: 'grid',
            gap: 12,
            maxWidth: 520,
          }}
        >
          <div>
            You’re already signed in as <strong>{userEmail}</strong>.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={goDashboard}
              style={{
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Go to dashboard
            </button>
            <button
              onClick={signOut}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : status === 'sent' ? (
        <div
          style={{
            padding: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            background: '#f8fafc',
          }}
        >
          <p>Check your inbox for a magic link. After you click it, you’ll be sent to your page.</p>
          <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Destination: <code>{redirect}</code>
          </p>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
          <label htmlFor="email" style={{ fontWeight: 700 }}>Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
          />

          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: status === 'sending' ? 0.7 : 1,
              width: 120,
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Send email'}
          </button>

          {err && <p style={{ color: '#b91c1c', marginTop: 4 }}>{err}</p>}

          <a href={`/?lang=${encodeURIComponent(lang)}`} style={{ marginTop: 10 }}>
            ← Back to home
          </a>
        </form>
      )}
    </main>
  );
}
