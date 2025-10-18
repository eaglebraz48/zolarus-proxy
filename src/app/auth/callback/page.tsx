'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/dashboard';
  const lang = sp.get('lang') || 'en';

  useEffect(() => {
    (async () => {
      try {
        // handles both code + provider cases
        await supabase.auth.exchangeCodeForSession(window.location.href);
      } finally {
        router.replace(`${next}?lang=${encodeURIComponent(lang)}`);
      }
    })();
  }, [router, next, lang]);

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <p>Signing you in…</p>
    </main>
  );
}
