"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * If a referral link (?ref=…) is opened while a user is already signed in,
 * we clear any previous session so the new person starts fresh.
 */
export default function RefReset() {
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const hasRef = !!url.searchParams.get("ref");
        if (!hasRef) return;

        // If a session exists, sign it out and hard-reload to a clean state.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await supabase.auth.signOut();
          // also clear our local capture to avoid stale usernames, etc.
          localStorage.removeItem("incoming_ref_code");
          window.location.replace(url.origin + url.pathname + url.search);
        }
      } catch {}
    })();
  }, []);

  return null;
}
