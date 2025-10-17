'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
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
        // 1️⃣ Exchange OAuth code for a Supabase session
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Auth exchange error:', exchangeError);
            router.push('/');
            return;
          }
        }

        // 2️⃣ Get current user
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.user?.email) {
          console.error('No valid session after exchange', error);
          router.replace(`/sign-in?lang=${lang}`);
          return;
        }

        const email = data.session.user.email;
        const userId = data.session.user.id;

        // 3️⃣ Trigger welcome email once
        if (!sentRef.current && !cancelled) {
          sentRef.current = true;
          const flagKey = `welcome:${userId}`;

          if (!localStorage.getItem(flagKey)) {
            localStorage.setItem(flagKey, String(Date.now()));

            try {
              const res = await fetch('/api/email/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.str
