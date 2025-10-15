'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Listens for Supabase auth events. When a user signs in:
 * 1) Read the saved ?ref= from localStorage (set by RememberRefFromUrl)
 * 2) Look up the referrer by profiles.referral_code
 * 3) Upsert a row into the `referrals` table (referrer_id, referred_user_id)
 * 4) Send a welcome email to the new user via /api/send
 * 5) (Optional) Notify the referrer by email if you store their email in profiles
 */
export default function AuthEvents() {
  React.useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return;

      try {
        // new user
        const me = session.user;
        const myEmail = me.email ?? '';

        // grab ref code remembered by RememberRefFromUrl (or default to "global")
        const refCode =
          localStorage.getItem('referrer_code') ||
          localStorage.getItem('ref') ||
          'global';

        // if it's the global default, you can still welcome — just skip ref linking
        let referrerId: string | null = null;
        let referrerEmail: string | null = null;

        if (refCode && refCode !== 'global') {
          // find the referrer profile by referral_code
          const { data: refProfile, error: refLookupErr } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('referral_code', refCode)
            .maybeSingle();

          if (!refLookupErr && refProfile?.id) {
            referrerId = refProfile.id;
            referrerEmail = (refProfile as any).email ?? null;

            // link them in the `referrals` table (ignore if the link already exists)
            await supabase
              .from('referrals')
              .upsert(
                {
                  referrer_id: referrerId,
                  referred_user_id: me.id,
                  status: 'joined',
                },
                { onConflict: 'referrer_id,referred_user_id' },
              );
          }
        }

        // send welcome email to the new user
        if (myEmail) {
          await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: myEmail,
              subject: 'Welcome to Zolarus 🎁',
              html: `<h2>Welcome!</h2>
<p>Your account is ready. ${
                referrerId
                  ? `You joined with referral code <b>${refCode}</b>.`
                  : ``
              }</p>
<p>Happy gifting!</p>`,
            }),
          });
        }

        // OPTIONAL: notify the referrer that someone joined from their link
        if (referrerEmail) {
          await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: referrerEmail,
              subject: 'Your referral just joined 🎉',
              html: `<p>Great news — someone signed up using your referral link.</p>`,
            }),
          });
        }
      } catch (err) {
        // keep silent in UI, just log
        console.warn('AuthEvents error:', err);
      }
    });

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  // This renders nothing — it’s just a listener
  return null;
}
