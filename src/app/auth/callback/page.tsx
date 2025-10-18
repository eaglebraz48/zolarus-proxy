// src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const next = sp.get('next') || '/dashboard';
      const lang = sp.get('lang') || 'en';

      // Finalize the magic-link login (PKCE)
      const { error } = await supabase.auth.exchangeCodeForSession();

      // If something odd happens, fall back to sign-in but preserve intent
      if (error && error.message !== 'Auth session missing!') {
        router.replace(
          `/sign-in?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}&error=auth`
        );
        return;
      }

      // Success → send them to their intended page (default /dashboard)
      const join = next.includes('?') ? '&' : '?';
      router.replace(`${next}${join}lang=${encodeURIComponent(lang)}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Signing you in…</h1>
      <p style={{ color: '#64748b' }}>
        One moment. If this takes longer than a couple seconds, you can close this tab.
      </p>
    </main>
  );
}
