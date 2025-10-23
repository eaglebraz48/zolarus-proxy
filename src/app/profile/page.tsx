// src/app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

/* ---- language handling (reads from URL first, then cookie/localStorage) ---- */
type Lang = "en" | "pt" | "es" | "fr";
function getLang(): Lang {
  const fromQuery =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("lang") as Lang | null)
      : null;

  const ck =
    typeof document !== "undefined"
      ? document.cookie.match(/(?:^|;)\s*zola_lang=([^;]+)/)
      : null;

  const fromCookie = (ck?.[1] as Lang | undefined) ?? undefined;
  const fromLocal =
    (typeof window !== "undefined"
      ? (localStorage.getItem("zola_lang") as Lang | null)
      : null) ?? undefined;

  const val = fromQuery || fromCookie || fromLocal || "en";
  return (["en", "pt", "es", "fr"].includes(val) ? val : "en") as Lang;
}

/* ---- translations ---- */
const t: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    fullName: string;
    phone: string;
    phonePH: string;
    save: string;
    saving: string;
    back: string;
    loading: string;
    saved: string;
  }
> = {
  en: {
    title: "Profile",
    subtitle: "Basic information for your account.",
    fullName: "Full name",
    phone: "Phone (optional)",
    phonePH: "(555) 555-5555",
    save: "Save",
    saving: "Saving…",
    back: "← Back to dashboard",
    loading: "Loading…",
    saved: "Saved!",
  },
  pt: {
    title: "Perfil",
    subtitle: "Informações básicas da sua conta.",
    fullName: "Nome completo",
    phone: "Telefone (opcional)",
    phonePH: "(11) 99999-9999",
    save: "Salvar",
    saving: "Salvando…",
    back: "← Voltar ao painel",
    loading: "Carregando…",
    saved: "Salvo!",
  },
  es: {
    title: "Perfil",
    subtitle: "Información básica de tu cuenta.",
    fullName: "Nombre completo",
    phone: "Teléfono (opcional)",
    phonePH: "(55) 5555-5555",
    save: "Guardar",
    saving: "Guardando…",
    back: "← Volver al panel",
    loading: "Cargando…",
    saved: "¡Guardado!",
  },
  fr: {
    title: "Profil",
    subtitle: "Informations de base de votre compte.",
    fullName: "Nom complet",
    phone: "Téléphone (facultatif)",
    phonePH: "06 12 34 56 78",
    save: "Enregistrer",
    saving: "Enregistrement…",
    back: "← Retour au tableau de bord",
    loading: "Chargement…",
    saved: "Enregistré !",
  },
};

/* -------------------------------------------------------------- */

type Prof = { full_name: string | null; phone: string | null };

export default function ProfilePage() {
  const [lang, setLang] = useState<Lang>("en");
  const L = useMemo(() => t[lang], [lang]);

  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<Prof>({ full_name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setLang(getLang());

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        window.location.href = `/sign-in?redirect=/profile&lang=${getLang()}`;
        return;
      }
      setUserId(user.id);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (prof) setForm({ full_name: prof.full_name, phone: prof.phone });
      setLoading(false);
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: form.full_name?.trim() || null,
        phone: form.phone?.trim() || null,
      });

    setSaving(false);
    setMsg(error ? error.message : L.saved);
  }

  if (loading) return <div className="p-6">{L.loading}</div>;

  return (
    <Suspense fallback={null}>
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-4xl font-extrabold tracking-tight">{L.title}</h1>
        <p className="text-gray-600 mt-1">{L.subtitle}</p>

        <form onSubmit={saveProfile} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {L.fullName}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.full_name ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, full_name: e.target.value }))
              }
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {L.phone}
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.phone ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder={L.phonePH}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? L.saving : L.save}
            </button>

            <Link
              href={`/dashboard?lang=${lang}`}
              className="rounded-lg bg-gray-100 px-5 py-3 font-medium hover:bg-gray-200"
            >
              {L.back}
            </Link>
          </div>

          {msg && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                msg === L.saved
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {msg}
            </div>
          )}
        </form>
      </main>
    </Suspense>
  );
}
