// src/app/dashboard/page.tsx
'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ShopCTA from '@/components/ShopCTA';

/* ---------------------- i18n ---------------------- */
type Lang = 'en' | 'pt' | 'es' | 'fr';
const LANGS: Lang[] = ['en', 'pt', 'es', 'fr'];
const isLang = (v: string | null): v is Lang => !!v && LANGS.includes(v as Lang);

const L: Record<Lang, any> = {
  en: {
    title: 'Dashboard',
    welcome: 'Welcome,',
    profile: 'Profile',
    basicInfo: 'Basic info',
    setup: 'Set up profile',
    shop: 'Shop',
    exploreGifts: 'Explore gifts',
    refs: 'Refs',
    browseNow: 'Browse / Shop now',
    reminders: 'Reminders',
    remindersLead: "Set reminders for special occasions and we'll email you on time.",
    upcoming: 'Upcoming',
    open: 'Open',
    credits: 'Zola Credits',
    coming: 'Coming soon',
    referralsTitle: 'Referrals',
    referralsCaption: 'Credits toward shopping — start referring today.',
    copy: 'Copy',
    share: 'Share',
    compareTitle: 'Compare prices across stores',
    comparePriceLine: '$0.99/month subscription',
    subscribeCta: 'Subscribe — $0.99/mo',
    benefits:
      "Compare prices across other stores to save on gifts and everyday buys. We'll surface smart matches for what you're shopping, so you don’t overpay when prices vary.",
  },
  pt: {
    title: 'Painel',
    welcome: 'Bem-vindo,',
    profile: 'Perfil',
    basicInfo: 'Informações básicas',
    setup: 'Configurar perfil',
    shop: 'Shop',
    exploreGifts: 'Explorar presentes',
    refs: 'Indicações',
    browseNow: 'Ver / Comprar agora',
    reminders: 'Lembretes',
    remindersLead:
      'Defina lembretes de datas especiais e enviaremos um email na hora certa.',
    upcoming: 'Próximos',
    open: 'Abrir',
    credits: 'Créditos Zola',
    coming: 'Em breve',
    referralsTitle: 'Indicações',
    referralsCaption: 'Créditos para compras — comece a indicar hoje.',
    copy: 'Copiar',
    share: 'Compartilhar',
    compareTitle: 'Compare preços em várias lojas',
    comparePriceLine: 'Assinatura de US$ 0,99/mês',
    subscribeCta: 'Assinar — US$ 0,99/mês',
    benefits:
      'Compare preços em outras lojas para economizar em presentes e compras do dia a dia. Mostramos sugestões para o que você procura, evitando pagar mais quando os preços variam.',
  },
  es: {
    title: 'Panel',
    welcome: 'Bienvenido,',
    profile: 'Perfil',
    basicInfo: 'Información básica',
    setup: 'Configurar perfil',
    shop: 'Shop',
    exploreGifts: 'Explorar regalos',
    refs: 'Referidos',
    browseNow: 'Ver / Comprar ahora',
    reminders: 'Recordatorios',
    remindersLead:
      'Configura recordatorios de fechas especiales y te enviaremos un correo a tiempo.',
    upcoming: 'Próximos',
    open: 'Abrir',
    credits: 'Créditos Zola',
    coming: 'Próximamente',
    referralsTitle: 'Referidos',
    referralsCaption: 'Créditos para compras — empieza a referir hoy.',
    copy: 'Copiar',
    share: 'Compartir',
    compareTitle: 'Compara precios en varias tiendas',
    comparePriceLine: 'Suscripción de US$ 0,99/mes',
    subscribeCta: 'Suscribirse — US$ 0,99/mes',
    benefits:
      'Compara precios en otras tiendas para ahorrar en regalos y compras diarias. Te mostramos opciones para lo que buscas, así no pagas de más cuando los precios cambian.',
  },
  fr: {
    title: 'Tableau de bord',
    welcome: 'Bienvenue,',
    profile: 'Profil',
    basicInfo: 'Infos de base',
    setup: 'Configurer le profil',
    shop: 'Shop',
    exploreGifts: 'Idées cadeaux',
    refs: 'Parrainages',
    browseNow: 'Parcourir / Acheter',
    reminders: 'Rappels',
    remindersLead:
      'Créez des rappels pour les dates importantes et nous vous enverrons un email à temps.',
    upcoming: 'À venir',
    open: 'Ouvrir',
    credits: 'Crédits Zola',
    coming: 'Bientôt disponible',
    referralsTitle: 'Parrainages',
    referralsCaption: "Crédits shopping — commencez à parrainer aujourd'hui.",
    copy: 'Copier',
    share: 'Partager',
    compareTitle: 'Comparez les prix entre magasins',
    comparePriceLine: 'Abonnement à 0,99 $/mois',
    subscribeCta: 'S’abonner — 0,99 $/mois',
    benefits:
      'Comparez les prix dans d’autres boutiques pour économiser sur les cadeaux et les achats du quotidien. Nous proposons des correspondances pour ce que vous cherchez, afin d’éviter de payer trop cher.',
  },
};

/* ---------------------- styles ---------------------- */
const btnPrimary: React.CSSProperties = {
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-block',
  textDecoration: 'none',
};

const btnSecondary: React.CSSProperties = {
  background: '#e5e7eb',
  color: '#111827',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-block',
  textDecoration: 'none',
};

const btnDisabled: React.CSSProperties = {
  background: '#f3f4f6',
  color: '#9ca3af',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  fontWeight: 700,
  cursor: 'not-allowed',
};

const referralsCircleBtn: React.CSSProperties = {
  width: 120,
  height: 120,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '9999px',
  background: '#4f46e5',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
  boxShadow: '0 10px 30px rgba(79,70,229,0.3)',
};

/* ---------------------------------------------------------------------- */

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const sp = useSearchParams();
  const lang = (isLang(sp.get('lang')) ? (sp.get('lang') as Lang) : 'en') as Lang;
  const t = L[lang];

  const [email, setEmail] = React.useState<string | null>(null);
  const [referralCount, setReferralCount] = React.useState<number>(0);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=global&lang=${lang}`
      : '';

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (mounted) setEmail(user?.email ?? null);

      if (user?.id) {
        const { count } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', user.id);
        if (mounted) setReferralCount(count ?? 0);
      } else {
        setReferralCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lang]);

  const withLang = (href: string) => {
    const p = new URLSearchParams(sp as unknown as URLSearchParams);
    p.set('lang', lang);
    return `${href}?${p.toString()}`;
  };

  return (
    // WRAPPER: relative so the background ornaments can be absolutely positioned
    <div style={{ position: 'relative' }}>
      {/* DECORATIVE BACKGROUND ONLY (balanced left/right) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* Left circle */}
        <div
          style={{
            position: 'absolute',
            left: '6%',
            top: 130,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(14,165,233,0.10), rgba(14,165,233,0.04) 60%, transparent 70%)',
            boxShadow:
              '0 0 0 1px rgba(14,165,233,0.12), inset 0 0 60px rgba(14,165,233,0.10)',
            filter: 'saturate(0.88)',
          }}
        />
        {/* Right circle */}
        <div
          style={{
            position: 'absolute',
            right: '4%',
            top: 130,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(14,165,233,0.10), rgba(14,165,233,0.04) 60%, transparent 70%)',
            boxShadow:
              '0 0 0 1px rgba(14,165,233,0.12), inset 0 0 60px rgba(14,165,233,0.10)',
            filter: 'saturate(0.88)',
          }}
        />
      </div>

      {/* CONTENT */}
      <div
        style={{
          maxWidth: 900,
          margin: '2rem auto',
          padding: '0 1rem',
          position: 'relative',
          zIndex: 1, // keep above ornaments
        }}
      >
        <h1
          style={{
            fontWeight: 800,
            fontSize: '2rem',
            marginBottom: 12,
            color: '#0ea5e9',
          }}
        >
          {t.title}
        </h1>

        {email && (
          <div style={{ color: '#374151', marginBottom: 20 }}>
            {t.welcome}{' '}
            <span style={{ fontWeight: 600, color: '#0ea5e9' }}>{email}</span>!
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <Card>
            <CardTitle>{t.profile}</CardTitle>
            <div style={{ color: '#374151', marginBottom: 8 }}>{t.basicInfo}</div>
            <Link href={withLang('/profile')} style={btnPrimary}>
              {t.setup}
            </Link>
          </Card>

          <Card>
            <CardTitle>{t.reminders}</CardTitle>
            <div style={{ color: '#374151', marginBottom: 8 }}>{t.remindersLead}</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>0</div>
            <Link href={withLang('/reminders')} style={btnPrimary}>
              {t.open}
            </Link>
          </Card>

          {/* Shop card */}
          <Card>
            <CardTitle>{t.shop}</CardTitle>
            <Link href={withLang('/shop')} style={btnSecondary}>
              {t.browseNow}
            </Link>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, color: '#111827' }}>{t.compareTitle}</div>
              <div style={{ fontWeight: 700, color: '#111827' }}>
                {t.comparePriceLine}
              </div>
              <p style={{ marginTop: 8, color: '#374151' }}>{t.benefits}</p>
            </div>

            <div style={{ marginTop: 8 }}>
              <ShopCTA />
            </div>
          </Card>

          {/* Zola Credits card */}
          <Card>
            <CardTitle>Zola Credits</CardTitle>
            <div style={{ marginBottom: 8 }}>
              <button style={btnDisabled} disabled>
                Coming soon
              </button>
            </div>
            <div style={{ marginTop: 64, color: '#2563eb', fontWeight: 700 }}>
              Start referring now!
            </div>
          </Card>
        </div>

        {/* referrals row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            marginTop: 24,
          }}
        >
          <Link href={withLang('/referrals')} style={referralsCircleBtn}>
            {t.referralsTitle}
          </Link>
          <div style={{ fontSize: 14, color: '#374151', textAlign: 'center' }}>
            {t.referralsCaption}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginTop: 12,
              width: '100%',
              maxWidth: 560,
            }}
          >
            <input
              value={shareUrl}
              readOnly
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              style={{
                background: '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t.copy}
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Join me on Zolarus', url: shareUrl });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                }
              }}
              style={{
                background: '#F59E0B',
                color: '#111827',
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t.share}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- tiny UI helpers -------------------------- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid rgba(14,165,233,0.26)', // stronger cyan line
        borderRadius: 14,
        padding: 16,
        background: '#fff',
        boxShadow: '0 2px 0 rgba(2,6,23,0.02), 0 10px 28px rgba(2,6,23,0.06)', // soft depth
        transition: 'box-shadow .18s ease, transform .18s ease, border-color .18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(14,165,233,0.36)';
        e.currentTarget.style.boxShadow =
          '0 4px 0 rgba(2,6,23,0.03), 0 18px 44px rgba(2,6,23,0.12)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(14,165,233,0.26)';
        e.currentTarget.style.boxShadow =
          '0 2px 0 rgba(2,6,23,0.02), 0 10px 28px rgba(2,6,23,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontWeight: 800,
        fontSize: 17,
        marginBottom: 10,
        color: '#0f172a',
        letterSpacing: '0.1px',
      }}
    >
      {children}
    </div>
  );
}
