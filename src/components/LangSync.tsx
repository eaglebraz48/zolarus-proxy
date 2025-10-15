// src/components/LangSync.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Ensures there's always a ?lang in the URL.
 * - If missing, use localStorage z_lang (or "en") and replace the URL.
 * - Also keep localStorage updated when URL has lang.
 */
export default function LangSync() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    const current = sp.get("lang");
    if (!current) {
      const def = (typeof window !== "undefined" && localStorage.getItem("z_lang")) || "en";
      const next = new URLSearchParams(sp);
      next.set("lang", def);
      router.replace(pathname + "?" + next.toString());
      return;
    }
    if (typeof window !== "undefined") localStorage.setItem("z_lang", current);
  }, [router, pathname, sp]);

  return null;
}
