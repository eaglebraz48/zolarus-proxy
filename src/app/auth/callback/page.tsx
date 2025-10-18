'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      // If no valid session, finalize magic link
      if (!session) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession();
        if (exchangeError) {
          console.error('Auth exchange error:', exchangeError.message);
          router.replace('/sign-in');
          return;
        }
      }

      // Redirect to dashboard after login
      const next = sp.get('next') || '/dashboard';
      const lang = sp.get('lang') || 'en';
      router.replace(`${next}?lang=${lang}`);
    })();
  }, [router, sp]);

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Signing you in…</h1>
      <p style={{ color: '#64748b' }}>
        Please wait a moment while we complete your login. You’ll be redirected automatically.
      </p>
    </main>
  );
}
