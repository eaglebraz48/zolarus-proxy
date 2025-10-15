"use client";

import { useEffect } from "react";

/**
 * Saves ?ref=… from the URL into localStorage ("incoming_ref_code").
 * Lightweight and safe to place in layout or the home page.
 */
export default function RefCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (ref) localStorage.setItem("incoming_ref_code", ref);
    } catch {}
  }, []);
  return null;
}
