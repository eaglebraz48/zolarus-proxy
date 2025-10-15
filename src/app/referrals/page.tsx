'use client';

import * as React from 'react';
import { Suspense } from 'react'; // ✅ added
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ensureMyReferralCode } from '@/lib/referrals';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const L: Record<Lang, any> = {
  en: {
    title: 'Your referrals',
    lead: 'People you’ve referred (read-only for now).',
    none: 'No referrals yet.',
    email: 'Email',
    status: 'Status',
    copied: 'Copied!',
    copy: 'Copy',
    share: 'Share',
    yourLink: 'Your referral link',
    count: (n: number) => `Total: ${n}`,
    back: 'Back to Dashboard',
  },
  pt: {
    title: 'Suas indicações',
    lead: 'Pessoas que você indicou (somente leitura por enquanto).',
    none: 'Nenhuma indicação ainda.',
    email: 'E-mail',
    status: 'Status',
    copied: 'Copiado!',
    copy: 'Copiar',
    share: 'Compartilhar',
    yourLink: 'Seu link de indicação',
    count: (n: number) => `Total: ${n}`,
    back: 'Voltar ao Painel',
  },
  es: {
    title: 'Tus referidos',
    lead: 'Personas que has referido (solo lectura por ahora).',
    none: 'Aún no hay referidos.',
    email: 'Correo',
    status: 'Estado',
    copied: '¡Copiado!',
    copy: 'Copiar',
    share: 'Compartir',
    yourLink: 'Tu enlace de referido',
    count: (n: number) => `Total: ${n}`,
    back: 'Volver al Panel',
  },
  fr: {
    title: 'Vos parrainages',
    lead: 'Personnes parrainées (lecture seule pour l’instant).',
    none: 'Aucun parrainage pour le moment.',
    email: 'E-mail',
    status: 'Statut',
    copied: 'Copié !',
    copy: 'Copier',
    share: 'Partager',
    yourLink: 'Votre lien de parrainage',
    count: (n: number) => `Total : ${n}`,
    back: 'Retour au tableau de bord',
  },
};

type Row = {
  id: string;
  status: string | null;
  referred_user_id: string;
  profiles?: { email?: string | null } | null;
};

async function copyText(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ✅ Wrapper added (this is the only real change)
export default function ReferralsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReferralsContent />
    </Suspense>
  );
}

function ReferralsContent() {
  const sp = useSearchParams();
  const lang = ((sp.get('lang') as Lang) || 'en') as Lang;
  const t = L[lang];

  const [rows, setRows] = React.useState<Row[]>([]);
  const [count, setCount] = React.useState(0);
  const [myLink, setMyLink] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      // who am i?
      const { data: userData } = await supabase.auth.getUser();
      const me = userData.user;
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const fallback = `${base}/?ref=global&lang=${lang}`;

      // build link asap with fallback
      setMyLink(fallback);

      if (!me) {
        setLoading(false);
        return;
      }

      // ensure a code exists, then build the link
      const code = await ensureMyReferralCode(supabase);
      const link = `${base}/?ref=${encodeURIComponent(code ?? 'global')}&lang=${lang}`;
      if (mounted) setMyLink(link);

      // count
      const { count: c } = await supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', me.id);
      if (mounted) setCount(c ?? 0);

      // list with joined email
      const { data } = await supabase
        .from('referrals')
        .select('id, status, referred_user_id, profiles:referred_user_id(email)')
        .eq('referrer_id', me.id)
        .order('created_at', { ascending: false });

      if (mounted) setRows((data as Row[]) || []);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [lang]);

  const onCopy = async () => {
    if (!myLink) return;
    const ok = await copyText(myLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onShare = async () => {
    if (!myLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on Zolarus',
          text: 'Smarter gifts and reminders. My invite:',
          url: myLink,
        });
      } else {
        const ok = await copyText(myLink);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch {}
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 6 }}>{t.title}</h1>

      {/* My link */}
      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 16,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t.yourLink}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={myLink}
            readOnly
            spellCheck={false}
            aria-label="Your referral link"
            style={{
              flex: '1 1 320px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '8px 10px',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          />
          <button onClick={onCopy} style={btnPrimary} disabled={!myLink}>
            {copied ? t.copied : t.copy}
          </button>
          <button onClick={onShare} style={btnSecondary} disabled={!myLink}>
            {t.share}
          </button>
        </div>
      </section>

      {/* Count + hint */}
      <div style={{ marginBottom: 10, fontWeight: 700 }}>
        {t.count(count)}{' '}
        <span style={{ color: '#6b7280', fontWeight: 500 }}>({t.lead})</span>
      </div>

      {/* List */}
      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 0,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 8,
            padding: '10px 12px',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: 700,
          }}
        >
          <div>{t.email}</div>
          <div>{t.status}</div>
        </div>

        {loading ? (
          <div style={{ padding: 14, color: '#6b7280' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 14, color: '#6b7280' }}>{t.none}</div>
        ) : (
          rows.map((r) => {
            const email = r.profiles?.email ?? '';
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: 8,
                  padding: '10px 12px',
                  borderTop: '1px solid #f3f4f6',
                }}
              >
                <div style={{ color: '#111827' }}>
                  {email || <span style={{ color: '#6b7280' }}>{r.referred_user_id}</span>}
                </div>
                <div style={{ color: '#374151' }}>{r.status ?? 'pending'}</div>
              </div>
            );
          })
        )}
      </section>

      <div style={{ marginTop: 16 }}>
        <Link
          href={`/dashboard?lang=${lang}`}
          style={{ color: '#1f2937', textDecoration: 'none', fontWeight: 600 }}
        >
          ← {t.back}
        </Link>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  backgroundColor: '#FF9900',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  backgroundColor: '#232F3E',
  color: '#FFD814',
  border: '1px solid #FFD814',
  borderRadius: 8,
  padding: '8px 14px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

