// src/app/callback/page.tsx
'use client';

export const dynamic = 'force-dynamic'; // don’t prerender this page

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const code = sp.get('code');
  const lang = (sp.get('lang') ?? 'en').toLowerCase();
  const redirect = sp.get('redirect') ?? '/dashboard';
  const sentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // 1) If we arrived with an OAuth code, exchange it for a session
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Auth exchange error:', exchangeError);
            router.replace('/');
            return;
          }
        }

        // 2) Read session
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.user?.email) {
          console.error('No session after callback', error);
          router.replace(`/sign-in?lang=${lang}`);
          return;
        }

        const email = data.session.user.email;
        const userId = data.session.user.id;

        // 3) Trigger your existing welcome email route once
        if (!sentRef.current && !cancelled) {
          sentRef.current = true;

          const flagKey = `welcome:${userId}`;
          if (!localStorage.getItem(flagKey)) {
            localStorage.setItem(flagKey, String(Date.now()));

            try {
              const res = await fetch('/api/email/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: email, lang }),
              });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                console.error('Welcome email API failed', { status: res.status, body });
              } else {
                console.log('✅ Welcome email triggered from /callback');
              }
            } catch (e) {
              console.error('Welcome email request error', e);
            }
          }
        }

        // 4) Go to app
        router.replace(`${redirect}?lang=${lang}`);
      } catch (e) {
        console.error('Callback error', e);
        router.replace('/');
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [code, router, lang, redirect]);

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Signing you in…</p>
    </main>
  );
}
