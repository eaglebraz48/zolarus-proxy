'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sendCustomWelcomeEmail } from '@/app/actions/sendCustomWelcomeEmail';

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get('redirect') ?? '/dashboard';
  const lang = sp.get('lang') ?? 'en';

  useEffect(() => {
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user?.email) {
        console.error('Login failed or session missing:', error);
        router.replace(`/sign-in?lang=${encodeURIComponent(lang)}`);
        return;
      }

      try {
        await sendCustomWelcomeEmail(session.user.email, lang);
      } catch (err) {
        console.error('Welcome email error:', err);
      } finally {
        router.replace(`${redirect}?lang=${encodeURIComponent(lang)}`);
      }
    })();
  }, [router, redirect, lang]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
