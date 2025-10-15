// src/components/ReferralShare.tsx
"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { ensureMyReferralCode } from "@/lib/referrals";

type Props = {
  lang: "en" | "pt" | "es" | "fr";
};

export default function ReferralShare({ lang }: Props) {
  const [link, setLink] = React.useState<string>("");
  const [copyMsg, setCopyMsg] = React.useState<string>("");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const code = await ensureMyReferralCode(supabase);
      if (!mounted) return;

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      if (origin && code) {
        const url = new URL(origin);
        url.searchParams.set("ref", code);
        url.searchParams.set("lang", lang);
        setLink(url.toString());
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lang]);

  async function onCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch {
      setCopyMsg("Copy failed");
      setTimeout(() => setCopyMsg(""), 1500);
    }
  }

  async function onShare() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Zolarus",
          text: "Get gift ideas and deals on Zolarus — my invite link:",
          url: link,
        });
      } catch {
        // user canceled share
      }
    } else {
      onCopy();
    }
  }

  if (!link) return null;

  return (
    <div
      style={{
        marginTop: 16,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: 10,
      }}
    >
      <input
        readOnly
        value={link}
        style={{
          width: 360,
          maxWidth: "70vw",
          padding: "6px 8px",
          border: "1px solid #D1D5DB",
          borderRadius: 6,
          fontSize: 13,
        }}
      />
      <button
        type="button"
        onClick={onCopy}
        style={{
          backgroundColor: "#232F3E",
          color: "#FFD814",
          border: "1px solid #FFD814",
          borderRadius: 8,
          padding: "8px 12px",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Copy
      </button>
      <button
        type="button"
        onClick={onShare}
        style={{
          backgroundColor: "#FF9900",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Share
      </button>
      {!!copyMsg && (
        <span style={{ marginLeft: 6, fontSize: 12, color: "#111827" }}>
          {copyMsg}
        </span>
      )}
    </div>
  );
}
