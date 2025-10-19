// src/app/page.tsx
// Server component – Promise-based searchParams (matches Next 15 typing)

type Lang = 'en' | 'pt' | 'es' | 'fr';
type SP = Record<string, string | string[] | undefined>;

const T: Record<Lang, { title: string; blurb: string; cta: string }> = {
  en: {
    title: 'Welcome to Zolarus',
    blurb:
      'Smart gifting made easy — share your referral link and earn rewards when friends join.',
    cta: 'Sign in',
  },
  pt: {
    title: 'Bem-vindo ao Zolarus',
    blurb:
      'Presentes inteligentes, sem complicação — compartilhe seu link de indicação e ganhe recompensas quando amigos entrarem.',
    cta: 'Entrar',
  },
  es: {
    title: 'Bienvenido a Zolarus',
    blurb:
      'Regalos inteligentes hechos simples — comparte tu enlace de referido y gana recompensas cuando tus amigos se unan.',
    cta: 'Iniciar sesión',
  },
  fr: {
    title: 'Bienvenue sur Zolarus',
    blurb:
      'Des cadeaux malins en toute simplicité — partagez votre lien de parrainage et gagnez des récompenses lorsque vos amis nous rejoignent.',
    cta: 'Se connecter',
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SP>;
}) {
  const sp: SP = (await (searchParams ?? Promise.resolve({}))) as SP;

  const rawLang = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const lang = (rawLang as Lang) || 'en';
  const t = T[lang] ?? T.en;

  const signInHref = {
    pathname: '/sign-in',
    query: { next: '/dashboard', lang },
  };

  return (
    <main style={{ maxWidth: 920, margin: '40px auto', padding: '0 16px' }}>
      <section
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          background: '#ffffff',
          padding: '28px 24px',
        }}
      >
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
          {t.title}
        </h1>
        <p style={{ color: '#334155', marginBottom: 20 }}>{t.blurb}</p>

        <a
          href={`${signInHref.pathname}?next=${encodeURIComponent(
            signInHref.query.next
          )}&lang=${encodeURIComponent(lang)}`}
          style={{
            display: 'inline-block',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {t.cta}
        </a>
      </section>

      <footer style={{ marginTop: 24, color: '#64748b', fontSize: 12 }}>
        © 2025 Zolarus. All rights reserved.
      </footer>
    </main>
  );
}
