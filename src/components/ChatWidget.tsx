'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

type Msg = { role: 'bot' | 'user'; text: string };
type Lang = 'en' | 'pt' | 'es' | 'fr';

export default function ChatWidget({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const lang = (sp.get('lang') as Lang) ?? 'en';

  // localized strings
  const hello =
    {
      en: 'Hi! I can explain Zolarus and nudge you through reminders. Ask me anything.',
      pt: 'Olá! Posso explicar o Zolarus e orientar você com lembretes. Pergunte-me qualquer coisa.',
      es: '¡Hola! Puedo explicar Zolarus y guiarte con recordatorios. Pregúntame lo que quieras.',
      fr: 'Salut ! Je peux expliquer Zolarus et vous guider avec des rappels. Posez-moi vos questions.',
    }[lang];

  const placeholder =
    {
      en: 'Ask about reminders, schedules…',
      pt: 'Pergunte sobre lembretes, horários…',
      es: 'Pregunta sobre recordatorios, horarios…',
      fr: 'Demandez des rappels, des horaires…',
    }[lang];

  const qs = {
    en: [
      'how do i create a reminder?',
      'why complete my profile?',
      'open reminders',
      'go to shop',
      'back to dashboard',
    ],
    pt: [
      'como criar um lembrete?',
      'por que completar meu perfil?',
      'abrir lembretes',
      'ir à loja',
      'voltar ao painel',
    ],
    es: [
      '¿cómo creo un recordatorio?',
      '¿por qué completar mi perfil?',
      'abrir recordatorios',
      'ir a la tienda',
      'volver al panel',
    ],
    fr: [
      'comment créer un rappel ?',
      'pourquoi compléter mon profil ?',
      'ouvrir les rappels',
      'aller à la boutique',
      'retour au tableau de bord',
    ],
  }[lang];

  const [open, setOpen] = useState(true);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ role: 'bot', text: hello }]);

  // if language changes while mounted, refresh the initial greeting
  useEffect(() => {
    setMsgs((m) => (m.length === 1 && m[0].role === 'bot' ? [{ role: 'bot', text: hello }] : m));
  }, [hello]);

  const listRef = useRef<HTMLDivElement>(null);

  // auto-scroll chat
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  // helpers
  const withLang = (path: string) => `${path}?lang=${encodeURIComponent(lang)}`;
  const go = (path: string) => router.push(withLang(path));
  const nowPath = useMemo(() => pathname || '/', [pathname]);

  // core brain
  function answerFor(qRaw: string): { reply: string; nav?: string } {
    const q = qRaw.toLowerCase().trim();

    // quick nav (any page)
    if (/^(open|go to|take me to)\s+(reminder|reminders)\b/.test(q) || /open reminders?/.test(q)) {
      return { reply: label('Opening Reminders…'), nav: '/reminders' };
    }
    if (/back( to)? (home|dashboard)/.test(q) || /^dashboard$/.test(q)) {
      return { reply: label('Heading back to your Dashboard…'), nav: '/dashboard' };
    }
    if (/open shop|go to shop|where.*shop/.test(q) || /^shop$/.test(q)) {
      return { reply: label('Taking you to the Shop…'), nav: '/shop' };
    }
    if (/open profile|edit profile|profile page/.test(q) || /^profile$/.test(q)) {
      return { reply: label('Opening your Profile…'), nav: '/profile' };
    }
    if (/sign ?in|login|log in/.test(q)) {
      return { reply: label('Opening sign in…'), nav: '/sign-in' };
    }

    // sign-in / home
    if (nowPath === '/' || nowPath === '/sign-in') {
      if (q.includes('why') && (q.includes('sign') || q.includes('email'))) {
        return {
          reply: label(
            "You sign in with your email so we can send magic links and deliver your reminders to the right inbox. No passwords to remember—just click the link we send and you're in."
          ),
        };
      }
      return {
        reply: label(
          'This page sends you a sign-in link. Type your email and press **Send email**. Once you’re in, I can guide you to **Reminders** or your **Dashboard**.'
        ),
      };
    }

    // dashboard
    if (nowPath === '/dashboard') {
      if (q.includes('profile')) {
        return {
          reply: label(
            "Your profile helps personalize reminders and messages (name, optional phone later). It makes Zolarus feel like *your* assistant—quick to recognize you and faster to help."
          ),
        };
      }
      if (q.includes('reminder')) {
        return {
          reply: label(
            "Click **Open** in the Reminders card. Set a title and time, and I'll handle the email right on time—so you don't need another calendar to babysit."
          ),
        };
      }
      if (q.includes('shop')) {
        return {
          reply: label(
            'Shop lets you spin up gift ideas fast. For now we open Amazon with the filters you choose. More stores soon—this is just the start.'
          ),
        };
      }
      if (q.includes('credit') || q.includes('zola credit')) {
        return {
          reply: label(
            "Zola Credits are **coming soon**. If you want a head start, share your referral link at the bottom of this page (the box with **Copy**/**Share**). Send it to friends, family, or group chats—when credits drop, you'll be glad you seeded it."
          ),
        };
      }
      return {
        reply: label(
          'This is your **Dashboard**. From here you can set up your **Profile**, manage **Reminders**, and browse the **Shop**. Ask me to “open reminders”, “go to shop”, or “edit profile”.'
        ),
      };
    }

    // profile
    if (nowPath === '/profile') {
      if (q.includes('why') || q.includes('what for') || q.includes('complete')) {
        return {
          reply: label(
            'Completing your profile helps me greet you properly and (soon) tailor reminders. It’s quick—name and optional phone—and it keeps your account tidy for future features.'
          ),
        };
      }
      if (q.includes('back') || q.includes('dashboard')) {
        return { reply: label('Going back to your Dashboard…'), nav: '/dashboard' };
      }
      return {
        reply: label(
          'Update your **Full name** (and optional phone), then click **Save**. Ask “back to dashboard” when you’re done.'
        ),
      };
    }

    // reminders
    if (nowPath === '/reminders') {
      if (q.includes('how') && (q.includes('create') || q.includes('make') || q.includes('set'))) {
        return {
          reply: label(
            'Type a **Title** (e.g., “Mom’s birthday”), choose a date/time, then **Save reminder**. I’ll email you right on time. You can delete any reminder on this page.'
          ),
        };
      }
      if (q.includes('recurr') || q.includes('repeat') || q.includes('cron')) {
        return {
          reply: label(
            'Recurring schedules are supported by the backend cron. For now, set single reminders here; we’ll surface friendly repeat options in the UI soon.'
          ),
        };
      }
      return {
        reply: label(
          'This page lists your upcoming reminders. Create a new one at the top. Ask me “back to dashboard” or “open shop” anytime.'
        ),
      };
    }

    // shop
    if (nowPath === '/shop') {
      if (
        q.includes('how') ||
        q.includes('what') ||
        q.includes('explain') ||
        q.includes('why only amazon') ||
        q.includes('other store') ||
        q.includes('walmart') ||
        q.includes('target')
      ) {
        return {
          reply: label(
            'The Shop currently launches Amazon with your picks. Use the fields at the top (for whom, occasion, keywords, budget), then click **Get ideas**. We’re adding more stores soon — **Walmart, Target, Best Buy, and Etsy** — so you’ll be able to browse the same filters across multiple retailers.'
          ),
        };
      }
      return {
        reply: label(
          'Right now we open Amazon with your filters for fast gift ideas. **Coming soon:** Walmart, Target, Best Buy, and Etsy. Ask “back to dashboard” when you’re done.'
        ),
      };
    }

    // refs (might 404 for now)
    if (nowPath === '/refs') {
      return {
        reply: label(
          'Referrals are **coming soon** (this page may show 404 for now). Head back to your **Dashboard** to copy your referral link at the bottom—share it with friends and family so we can start counting for credits.'
        ),
        nav: '/dashboard',
      };
    }

    // fallback (including 404)
    if (q.includes('back')) return { reply: label('Heading back to your Dashboard…'), nav: '/dashboard' };
    return {
      reply: label(
        'I can navigate (e.g., “open reminders”, “back to dashboard”, “open shop”) or explain what’s on this page. Try asking “how do I create a reminder?” or “why complete my profile?”.'
      ),
    };
  }

  function sendUser() {
    const text = input.trim();
    if (!text) return;
    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');

    const { reply, nav } = answerFor(text);
    setMsgs((m) => [...m, { role: 'bot', text: personalize(reply) }]);
    if (nav) setTimeout(() => go(nav), 400);
  }

  // light personalization hook
  function personalize(s: string) {
    return s; // keeping it neutral (no PII echo); safe-by-default
  }

  function label(enText: string): string {
    // keep answers in English for now; easy place to expand later if you want per-language content
    return enText;
  }

  if (!open) {
    return (
      <button
        aria-label="Open Zolarus Assistant"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 50,
          borderRadius: '9999px',
          width: 54,
          height: 54,
          border: 'none',
          background: '#0f172a',
          color: '#fff',
          boxShadow: '0 10px 25px rgba(2,6,23,.25)',
          cursor: 'pointer',
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        height: 420,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        boxShadow: '0 16px 40px rgba(2,6,23,.18)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* header with X */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
        }}
      >
        <span>Zolarus Assistant</span>
        <button
          aria-label="Close"
          onClick={() => setOpen(false)}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 18,
            lineHeight: 1,
            cursor: 'pointer',
            color: '#0f172a',
          }}
        >
          ×
        </button>
      </div>

      {/* messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
     {msgs.map((m, i) => (
  <div
    key={i}
    style={{
      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
      background: m.role === 'user' ? '#0f172a' : '#f8fafc',
      color: m.role === 'user' ? '#fff' : '#0f172a',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '8px 10px',
      maxWidth: '85%',
      whiteSpace: 'pre-wrap',
    }}
  >
    {m.text}
  </div>
))}

          >
            {m.text}
          </div>
        ))}

        {/* localized quick suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {qs.map((s) => (
            <button
              key={s}
              onClick={() => {
                setInput(s);
                setTimeout(sendUser, 0);
              }}
              style={{
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                borderRadius: 999,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendUser();
        }}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          aria-label="Ask Zolarus Assistant"
          style={{
            flex: 1,
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        />
        <button
          type="submit"
          style={{
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
