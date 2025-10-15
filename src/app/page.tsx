'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Lang = 'en' | 'pt' | 'es' | 'fr';

const copy: Record<
  Lang,
  { title: string; subtitle: string; signIn: string; rights: string }
> = {
  en: {
    title: 'Welcome to Zolarus',
    subtitle:
      'Smart gifting made easy — share your referral link and earn rewards when friends join.',
    signIn: 'Sign in',
    rights: 'All rights reserved.',
  },
  pt: {
    title: 'Bem-vindo ao Zolarus',
    subtitle:
      'Presentes inteligentes de forma simples — compartilhe seu link de indicação e ganhe recompensas quando amigos entrarem.',
    signIn: 'Entrar',
    rights: 'Todos os direitos reservados.',
  },
  es: {
    title: 'Bienvenido a Zolarus',
    subtitle:
      'Regalos inteligentes de forma sencilla — comparte tu enlace de referidos y gana recompensas cuando tus amigos se unan.',
    signIn: 'Iniciar sesión',
    rights: 'Todos los derechos reservados.',
  },
  fr: {
    title: 'Bienvenue sur Zolarus',
    subtitle:
      'Des cadeaux intelligents en toute simplicité — partagez votre lien de parrainage et gagnez des récompenses quand des amis rejoignent.',
    signIn: 'Se connecter',
    rights: 'Tous droits réservés.',
  },
};

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const sp = useSearchParams();
  const lang = (sp.get('lang') || 'en') as Lang;
  const t = copy[lang];

  const withLang = (pathname: string) => {
    const params = new URLSearchParams();
    params.set('lang', lang);
    return { pathname, query: Object.fromEntries(params.entries()) };
  };

  const shell: React.CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 16px',
  };
  const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    padding: 24,
  };
  const title: React.CSSProperties = { fontSize: 32, fontWeight: 800, marginBottom: 8 };
  const subtitle: React.CSSProperties = { color: '#475569', lineHeight: 1.6, marginBottom: 20 };
  const ghostBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 12,
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    fontWeight: 600,
    textDecoration: 'none',
    color: '#0f172a',
    background: '#fff',
  };
  const footer: React.CSSProperties = {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid #e2e8f0',
    fontSize: 12,
    color: '#64748b',
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8" style={shell}>
      <section
        className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8"
        style={card}
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900" style={title}>
          {t.title}
        </h1>
        <p className="text-slate-600 mt-2" style={subtitle}>
          {t.subtitle}
        </p>

        <Link
          href={withLang('/sign-in')}
          className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50"
          style={ghostBtn}
        >
          {t.signIn}
        </Link>

        <footer className="mt-8 text-xs text-slate-500" style={footer}>
          © {new Date().getFullYear()} Zolarus. {t.rights}
        </footer>
      </section>
    </main>
  );
}
