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

  const code = sp.get('code');                 // PKCE / newer magic-link style
  const tokenHash = sp.get('token_hash');      // older magic-link style
  const lang = (sp.get('lang') ?? 'en').toLowerCase();
  const redirect = sp.get('redirect') ?? sp.get('next') ?? '/dashboard';

  const emailedTo = sp.get('email') || undefined; // some providers include it
  const sentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1) Exchange session
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'magiclink',
            token_hash: tokenHash,
            email: emailedTo, // safe if undefined
          });
          if (error) throw error;
        }

        // 2) Confirm session exists
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          router.replace(`/sign-in?lang=${lang}`);
          return;
        }

        // (optional one-time welcome email guard)
        if (!sentRef.current && !cancelled) {
          sentRef.current = true;
          const uid = data.session.user.id;
          const k = `welcome:${uid}`;
          if (!localStorage.getItem(k)) {
            localStorage.setItem(k, String(Date.now()));
            try {
              await fetch('/api/email/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: data.session.user.email, lang }),
              });
            } catch { /* non-fatal */ }
          }
        }

        // 3) Send them where they meant to go
        router.replace(`${redirect}?lang=${lang}`);
      } catch {
        router.replace(`/sign-in?lang=${lang}`);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [code, tokenHash, emailedTo, redirect, lang, router]);

  return null;
}