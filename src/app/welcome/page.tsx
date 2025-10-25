'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Lang = 'en' | 'pt' | 'es' | 'fr';

const greetings: Record<Lang, string> = {
  en: 'Welcome',
  pt: 'Bem-vindo',
  es: 'Bienvenido',
  fr: 'Bienvenue',
};

const ctas: Record<Lang, { signIn: string; dash: string }> = {
  en: { signIn: 'Sign in', dash: 'Go to dashboard' },
  pt: { signIn: 'Entrar', dash: 'Ir ao painel' },
  es: { signIn: 'Iniciar sesión', dash: 'Ir al panel' },
  fr: { signIn: 'Se connecter', dash: 'Aller au tableau de bord' },
};

function normalize(code?: string): Lang | undefined {
  if (!code) return;
  const c = code.toLowerCase();
  if (c.startsWith('pt')) return 'pt';
  if (c.startsWith('es')) return 'es';
  if (c.startsWith('fr')) return 'fr';
  if (c.startsWith('en')) return 'en';
}

function getStoredLang(): Lang | undefined {
  const ck = document.cookie.match(/(?:^|;)\s*zola_lang=([^;]+)/)?.[1] as Lang | undefined;
  const ls = (localStorage.getItem('zola_lang') as Lang | null) ?? undefined;
  const val = ck || ls;
  return (['en', 'pt', 'es', 'fr'].includes(val || '') ? (val as Lang) : undefined);
}

function setStoredLang(lang: Lang) {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toUTCString();
  document.cookie = `zola_lang=${lang}; path=/; expires=${expires}; SameSite=Lax`;
  localStorage.setItem('zola_lang', lang);
}

export default function WelcomePage() {
  const [lang, setLang] = useState<Lang | undefined>(undefined);

  useEffect(() => {
    const stored = getStoredLang();
    if (stored) return setLang(stored);
    const detected = normalize(navigator.language) || normalize(navigator.languages?.[0]) || 'en';
    setStoredLang(detected);
    setLang(detected);
  }, []);

  const lines = useMemo(
    () => (lang ? [greetings[lang]] : [greetings.en, greetings.pt, greetings.es, greetings.fr]),
    [lang]
  );

  const t = ctas[lang ?? 'en'];

  return (
    <main
      className="
        relative min-h-[100dvh] text-white flex items-center justify-center overflow-hidden
        bg-gradient-to-b from-[#0a0f1c] via-[#08101a] to-[#05070c]
      "
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60rem 35rem at 50% 20%, rgba(0, 219, 255, 0.18), transparent 60%), radial-gradient(24rem 16rem at 20% 90%, rgba(0, 161, 255, 0.12), transparent 60%), radial-gradient(24rem 16rem at 80% 90%, rgba(0, 161, 255, 0.12), transparent 60%)',
          filter: 'blur(0.5px)',
        }}
      />

      <div className="relative z-10 w-full max-w-6xl px-6 py-16 flex flex-col items-center text-center">
        <div className="relative w-full max-w-[820px] mx-auto">
          <div
            className="absolute inset-0 rounded-[2.5rem] blur-2xl opacity-60"
            style={{
              background:
                'radial-gradient(60% 60% at 50% 40%, rgba(0,215,255,0.25), transparent 70%)',
            }}
          />
          <div className="rounded-[2.5rem] p-1 bg-gradient-to-b from-cyan-500/30 to-cyan-400/10">
            <div className="rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,200,255,0.25)]">
              <Image
                src="/horse-blue.png"
                alt="Zolarus"
                width={1800}
                height={1800}
                priority
                className="w-full h-auto rounded-[2rem]"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-3">
          {lines.map((txt, i) => (
            <h1
              key={i}
              className={`tracking-tight ${
                i === 0
                  ? 'text-5xl md:text-7xl font-extrabold drop-shadow-[0_4px_24px_rgba(0,200,255,0.35)]'
                  : 'text-3xl md:text-4xl opacity-90'
              }`}
            >
              {txt}
            </h1>
          ))}
          <p className="mt-2 text-base md:text-lg text-white/70">
            Zolarus · English · Português (BR) · Español · Français
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-in"
            className="px-7 py-3 rounded-2xl border border-cyan-300/40 bg-cyan-500/15 hover:bg-cyan-500/25 transition shadow-[0_0_20px_rgba(0,200,255,0.25)]"
          >
            {t.signIn}
          </Link>
          <Link
            href="/dashboard"
            className="px-7 py-3 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/20 transition"
          >
            {t.dash}
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
          <span>Language:</span>
          {(['en', 'pt', 'es', 'fr'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setStoredLang(l);
                setLang(l);
              }}
              className={`px-2.5 py-1 rounded-md border transition ${
                lang === l
                  ? 'border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_16px_rgba(0,200,255,0.25)]'
                  : 'border-white/20 hover:bg-white/10'
              }`}
              aria-pressed={lang === l}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-white/50">© {new Date().getFullYear()} Zolarus.</p>
      </div>
    </main>
  );
}
