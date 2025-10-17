// src/app/auth/callback/page.tsx
'use client';

import * as React from 'react';
import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = (sp.get('lang') ?? 'en').toLowerCase();
  const redirect = sp.get('redirect') ?? '/dashboard';

  // prevent duplicate sends during re-renders/navigation
  const sentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      // More reliable than getUser() immediately after magic link
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      const email = data?.session?.user?.email ?? null;

      if (error || !email) {
        console.error('Auth callback: no session/email', error);
        // your login page path is /sign-in (not /signin)
        router.replace(`/sign-in?lang=${lang}`);
        return;
      }

      // send welcome once per browser per user
      if (!sentRef.current) {
        sentRef.current = true;
        try {
          const userId = data.session.user.id;
          const flagKey = `welcome:${userId}`;
          if (!localStorage.getItem(flagKey)) {
            localStorage.setItem(flagKey, String(Date.now()));

            // your working route expects { to | email, lang }
            const res = await fetch('/api/email/welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: email, lang }),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              console.error('Welcome email API failed', { status: res.status, body });
            } else {
              console.log('✅ Welcome email triggered');
            }
          }
        } catch (e) {
          console.error('Failed to trigger welcome email', e);
        }
      }

      router.replace(`${redirect}?lang=${lang}`);
    }

    handleAuth();
    return () => {
      cancelled = true;
    };
  }, [router, lang, redirect]);

  return <main className="p-6">Finalizing your sign-in…</main>;
}


    handleAuth();
    return () => { cancelled = true; };
  }, [router, lang, redirect]);

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      Finalizing login…
    </div>
  );
}
