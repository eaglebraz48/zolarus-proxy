'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n/strings';
import { STRINGS } from '@/i18n/strings';
import { buildAmazonLinks, type Variant } from '@/lib/amazonLink';

function getLocaleFromParams(sp: URLSearchParams): Locale {
  const lang = (sp.get('lang') || 'en').toLowerCase();
  return (['en', 'pt', 'es', 'fr'].includes(lang) ? lang : 'en') as Locale;
}

// Wrapper with Suspense boundary
export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const sp = useSearchParams();
  const locale = getLocaleFromParams(sp);
  const T = STRINGS[locale];

  const [who, setWho] = React.useState('');
  const [occasion, setOccasion] = React.useState('');
  const [min, setMin] = React.useState<number | ''>('');
  const [max, setMax] = React.useState<number | ''>('');
  const [keywords, setKeywords] = React.useState('');
  const [showIdeas, setShowIdeas] = React.useState(false);

  function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setShowIdeas(true);
  }

  function onReset() {
    setWho('');
    setOccasion('');
    setMin('');
    setMax('');
    setKeywords('');
    setShowIdeas(false);
  }

  const variants: { v: Variant; title: string; note?: string }[] = React.useMemo(() => {
    const titles: string[] = T.ideas.suggestionTitles;
    const notes: string[] = T.ideas.suggestionNotes({ min, max });
    const order: Variant[] = ['core', 'accessory', 'popular30', 'sale'];
    return order.map((v, i) => ({
      v,
      title: titles[i] || v,
      note: notes[i] || '',
    }));
  }, [T, min, max]);

  const ideas = React.useMemo(() => {
    if (!showIdeas) return [];
    return variants.map((it) => {
      const link = buildAmazonLinks({
        locale,
        who,
        keywords,
        variant: it.v,
      });
      return { ...it, url: link.primaryUrl };
    });
  }, [showIdeas, variants, locale, who, keywords]);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontWeight: 700, fontSize: '2rem' }}>Zolarus</h1>

      <section style={{ marginTop: '1.5rem' }}>
        <h2
          style={{
            color: '#FF9900',
            fontWeight: 700,
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          {T.header}
        </h2>

        <p style={{ marginTop: 8 }}>{T.resultsIntro}</p>

        <form
          onSubmit={onGenerate}
          style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}
        >
          <input
            placeholder={T.placeholders.forWhom}
            value={who}
            onChange={(e) => setWho(e.target.value)}
            style={{ flex: '1 1 180px', padding: 6 }}
          />

          <input
            placeholder={T.placeholders.occasion}
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            style={{ flex: '1 1 180px', padding: 6 }}
          />

          <input
            placeholder={T.labels.min}
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value ? Number(e.target.value) : '')}
            style={{ width: 90, padding: 6 }}
          />
          <input
            placeholder={T.labels.max}
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value ? Number(e.target.value) : '')}
            style={{ width: 90, padding: 6 }}
          />

          <input
            placeholder={T.placeholders.keywords}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            style={{ flex: '2 1 280px', padding: 6 }}
          />

          <button
            type="submit"
            style={{
              backgroundColor: '#FF9900',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color .15s ease-in-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2A500')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF9900')}
          >
            {T.buttons.getIdeas}
          </button>

          <button
            type="button"
            onClick={onReset}
            style={{
              backgroundColor: '#232F3E',
              color: '#FFD814',
              border: '1px solid #FFD814',
              borderRadius: 6,
              padding: '8px 16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color .15s ease-in-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#37475A')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#232F3E')}
            title="Clear and start over"
          >
            {T.buttons.tryNew}
          </button>
        </form>

        {showIdeas && (
          <>
            <div style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
              {T.browserTranslateHint}
            </div>

            <div style={{ marginTop: 16, lineHeight: 1.75 }}>
              {ideas.map((s, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  {s.note && <div style={{ fontSize: 13, opacity: 0.85 }}>{s.note}</div>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {T.ideas.open}
                    </a>
                    <a href="https://www.amazon.com/shop" target="_blank" rel="noreferrer">
                      {T.ideas.moreOnPage}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}