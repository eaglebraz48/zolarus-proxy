"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SubStatus = "active" | "inactive" | "loading";

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        if (!cancelled) setStatus("inactive");
        return;
      }

      // Try to read from subscriptions table (populated by your Stripe webhook)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data?.status) {
        setStatus("inactive");
        return;
      }

      const isActive = data.status === "active" || data.status === "trialing";
      setStatus(isActive ? "active" : "inactive");
    })();

    // Also react to auth state changes (sign-in/out) without reload
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) setStatus("inactive");
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    status,                 // "active" | "inactive" | "loading"
    loading: status === "loading",
    isActive: status === "active",
  };
}
