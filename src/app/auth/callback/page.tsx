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

  const lang = sp.get('lang') ?? 'en';
  const redirect = sp.get('redirect') ?? '/dashboard';

  const sentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (cancelled) return;

      if (error || !user?.email) {
        console.error('Auth callback: could not resolve user', error);
        router.replace(`/signin?lang=${lang}`);
        return;
      }

      if (!sentRef.current) {
        sentRef.current = true;

        try {
          const flagKey = `welcome:${user.id}`;
          if (!localStorage.getItem(flagKey)) {
            localStorage.setItem(flagKey, String(Date.now()));

            const res = await fetch('/api/send-welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, lang }),
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
    return () => { cancelled = true; };
  }, [router, lang, redirect]);

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      Finalizing login…
    </div>
  );
}
