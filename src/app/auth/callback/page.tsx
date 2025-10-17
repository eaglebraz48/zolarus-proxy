'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      router.push('/');
      return;
    }

    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Auth error:', error);
          router.push('/');
          return;
        }

        const { data } = await supabase.auth.getUser();
        const email = data.user?.email;

        if (email) {
          try {
            await fetch('/api/auth/send-welcome-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
          } catch (err) {
            console.error('Welcome email error:', err);
          }
        }

        router.push('/dashboard?lang=en');
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/');
      }
    };

    handleCallback();
  }, [code, router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Signing you in...</p>
    </div>
  );
}
