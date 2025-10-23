'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  return (
    <Suspense fallback={<main style={{ padding: '2rem', textAlign: 'center' }}>Signing you in…</main>}>
      <CallbackContent />
    </Suspense>
  );
}

function CallbackContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const code = sp.get('code');
  const lang = (sp.get('lang') ?? 'en').toLowerCase();
  // accept either "redirect" or legacy "next"
  const redirect = sp.get('redirect') ?? sp.get('next') ?? '/dashboard';
  const sentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // Exchange code (email magic link or OAuth)
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Auth exchange error:', exchangeError);
            router.replace('/sign-in'); // points to the fixed route
            return;
          }
        }

        // Confirm session exists
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.user?.email) {
          console.error('No session after callback', error);
          router.replace(`/sign-in?lang=${lang}`);
          return;
        }

        const email = data.session.user.email;
        const userId = data.session.user.id;

        // Fire welcome email once per browser
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
              }
            } catch (e) {
              console.error('Welcome email request error', e);
            }
          }
        }

        router.replace(`${redirect}?lang=${lang}`);
      } catch (e) {
        console.error('Callback error', e);
        router.replace('/');
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [code, router, lang, redirect]);

  return null;
}
