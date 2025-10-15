"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Lang = "en" | "pt" | "es" | "fr";

export default function Header() {
  const pathname = usePathname();
  const search = useSearchParams();
  const isHome = pathname === "/";

  // Current language (query -> cookie/localStorage -> en)
  const lang: Lang = useMemo(() => {
    const q = (search?.get("lang") as Lang | null) || null;
    const ls =
      typeof window !== "undefined"
        ? ((localStorage.getItem("zola_lang") as Lang | null) || null)
        : null;
    const v = (q || ls || "en") as string;
    return (["en", "pt", "es", "fr"].includes(v) ? v : "en") as Lang;
  }, [search]);

  // Persist lang if query present
  useEffect(() => {
    const q = search?.get("lang");
    if (!q) return;
    if (["en", "pt", "es", "fr"].includes(q)) {
      document.cookie = `zola_lang=${q}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
      localStorage.setItem("zola_lang", q);
    }
  }, [search]);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const withLang = (href: string) => {
    const p = new URLSearchParams(search as unknown as URLSearchParams);
    p.set("lang", lang);
    return `${href}?${p.toString()}`;
  };

  const changeLang = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as Lang;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", v);
    window.location.assign(url.toString());
  };

  return (
    <header style={{ borderBottom: "1px solid #eee", padding: "12px 0" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href={withLang("/")}
          style={{
            fontWeight: 800,
            fontSize: 22,
            color: "#4338CA",
            textDecoration: "none",
          }}
        >
          Zolarus
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Language</span>
            <select
              value={lang}
              onChange={changeLang}
              style={{ padding: "6px 10px", borderRadius: 8 }}
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <Link href={withLang("/dashboard")} style={navLink}>
            Dashboard
          </Link>
          <Link href={withLang("/shop")} style={navLink}>
            Shop
          </Link>
          <Link href={withLang("/browse")} style={navLink}>
            Explore gifts
          </Link>
          <Link href={withLang("/referrals")} style={navLink}>
            Refs
          </Link>
          <Link href={withLang("/reminders")} style={navLink}>
            Reminders
          </Link>
          <Link href={withLang("/profile")} style={navLink}>
            Profile
          </Link>

          {/* On the landing page, ALWAYS show "Sign in" (hide email/Sign out). */}
          {isHome ? (
            <Link href={withLang("/sign-in")} style={signInBtn}>
              Sign in
            </Link>
          ) : userEmail ? (
            <>
              <span style={{ color: "#374151" }}>{userEmail}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.assign(withLang("/"));
                }}
                style={signOutBtn}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href={withLang("/sign-in")} style={signInBtn}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const navLink: React.CSSProperties = {
  color: "#1f2937",
  textDecoration: "none",
  fontWeight: 500,
};

const signInBtn: React.CSSProperties = {
  marginLeft: 8,
  backgroundColor: "#111827",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 12px",
  textDecoration: "none",
  fontWeight: 700,
};

const signOutBtn: React.CSSProperties = {
  marginLeft: 8,
  backgroundColor: "#111827",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};
