// src/app/callback/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// normalize a possibly-encoded redirect like "/dashboard%3Flang%3Den" and force lang once
function toDestWithLang(dest: string | null | undefined, lang: string) {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const decoded = decodeURIComponent(dest || '/dashboard');
  const url = new URL(decoded, base);
  url.searchParams.set('lang', lang);
  return url.pathname + (url.search ? url.search : '');
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24, textAlign: 'center' }}>Signing you in…</main>}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const code = sp.get('code') || sp.get('token_hash') || undefined; // supabase can send either
  const lang = (sp.get('lang') ?? 'en').toLowerCase();
  const redirectRaw = sp.get('redirect') ?? sp.get('next') ?? '/dashboard';
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const dest = toDestWithLang(redirectRaw, lang);

      try {
        // If the link brought a code, exchange exactly once.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            // Failed to exchange: send to sign-in with the intended next.
            router.replace(`/sign-in?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(dest)}`);
            return;
          }
          // Clean the URL (remove code/type) so we don't re-trigger on client refresh.
          try {
            const clean = new URL(window.location.href);
            clean.searchParams.delete('code');
            clean.searchParams.delete('token_hash');
            clean.searchParams.delete('type');
            window.history.replaceState({}, '', clean.toString());
          } catch {}
          // Success → go to the intended destination.
          router.replace(dest);
          return;
        }

        // No code in URL: if we already have a session, just go.
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          router.replace(dest);
          return;
        }

        // No code and no session → back to sign-in with the intended next.
        router.replace(`/sign-in?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(dest)}`);
      } catch {
        router.replace(`/sign-in?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(toDestWithLang('/dashboard', lang))}`);
      }
    })();
  }, [code, lang, redirectRaw, router]);

  // nothing to render
  return null;
}
