// src/app/sign-in/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  // Raw query values
  const rawNext = sp.get('next') || '/dashboard';
  const lang = sp.get('lang') || 'en';

  // 1) Sanitize next to avoid loops
  const safeNext = useMemo(() => {
    if (rawNext.startsWith('/sign-in')) return '/dashboard';
    if (rawNext.startsWith('/go/holiday')) return '/dashboard';
    return rawNext;
  }, [rawNext]);

  // 2) Merge lang into the next URL safely (no double '?')
  const destination = useMemo(() => {
    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost';

      const url = new URL(safeNext, origin);
      if (!url.searchParams.get('lang')) {
        url.searchParams.set('lang', lang);
      }
      // Return a path+query only (no origin) for Next router
      return url.pathname + (url.search || '');
    } catch {
      // Fallback if URL constructor ever fails
      const sep = safeNext.includes('?') ? '&' : '?';
      return `${safeNext}${sep}lang=${encodeURIComponent(lang)}`;
    }
  }, [safeNext, lang]);

  // 3) If already signed in, go straight to destination (avoid redirecting to itself)
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Do not replace if we are already at the destination
        if (pathname + (sp.toString() ? `?${sp.toString()}` : '') !== destination) {
          router.replace(destination);
        }
      }
    })();
    // NOTE: sp is stable in Next’s app router; we compare strings to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname, destination]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErr(null);

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || '';

      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
        safeNext
      )}&lang=${encodeURIComponent(lang)}`;

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

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 24 }}>Sign in</h1>

      {status === 'sent' ? (
        <div
          style={{
            padding: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            background: '#f8fafc',
          }}
        >
          <p>
            Check your inbox for a magic link. After you click it, you’ll be sent to your page.
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Destination: <code>{destination}</code>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
          <label htmlFor="email" style={{ fontWeight: 700 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: '10px 12px',
            }}
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

