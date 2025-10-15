'use client';

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Supported languages and translations
const LANGS = ["en", "pt", "es", "fr"];
type Lang = (typeof LANGS)[number];
const isLang = (v: string | null): v is Lang => !!v && LANGS.includes(v as Lang);

const L: Record<Lang, any> = {
  en: {
    title: "Sign in",
    email: "Email",
    send: "Send email",
    back: "← Back to home",
    sent: "Check your email for the login link!",
  },
  pt: {
    title: "Entrar",
    email: "Email",
    send: "Enviar email",
    back: "← Voltar ao início",
    sent: "Verifique seu email pelo link!",
  },
  es: {
    title: "Iniciar sesión",
    email: "Correo",
    send: "Enviar correo",
    back: "← Volver al inicio",
    sent: "¡Revisa tu correo para el enlace!",
  },
  fr: {
    title: "Se connecter",
    email: "Email",
    send: "Envoyer l’email",
    back: "← Retour à l’accueil",
    sent: "Vérifiez votre email pour le lien !",
  },
};

// ✅ Suspense wrapper added
export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const sp = useSearchParams();
  const lang = (isLang(sp.get("lang")) ? sp.get("lang") : "en") as Lang;
  const t = L[lang];
  const redirect = sp.get("redirect") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const withLang = (href: string) => {
    const p = new URLSearchParams(sp as unknown as URLSearchParams);
    p.set("lang", lang);
    return `${href}?${p.toString()}`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(
            redirect
          )}&lang=${lang}`,
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert(t.sent);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontWeight: 900, fontSize: 34, marginBottom: 16 }}>{t.title}</h1>
      <form onSubmit={handleSend} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label htmlFor="email" style={{ fontWeight: 700 }}>
          {t.email}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 16,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#3B82F6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            width: "fit-content",
          }}
        >
          {loading ? "…" : t.send}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <Link href={withLang("/")}>{t.back}</Link>
      </div>
    </div>
  );
}
