// src/components/ChatWidget.tsx
// Zolarus Assistant with memory read/write (Supabase) + robust shopping parser + branded avatar
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AssistantAvatar from '@/components/AssistantAvatar'; // ← avatar

type Msg = { role: 'bot' | 'user'; text: string };
type Lang = 'en' | 'pt' | 'es' | 'fr';

type MemoryInsert = {
  user_id: string;
  lang: Lang;
  role: 'user' | 'bot';
  text: string;
  intent?: string | null;
  meta?: Record<string, any> | null;
  session_id?: string | null;
};

async function saveMemory(row: Omit<MemoryInsert, 'user_id'>) {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return; // only after login
  const { error } = await supabase.from('zola_memories').insert([{ ...row, user_id: uid }]);
  if (error) console.error('saveMemory error', error);
}

async function getRecentMemories(limit = 5) {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('zola_memories')
    .select('created_at, lang, role, text, intent, meta')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('getRecentMemories error', error); return []; }
  return data ?? [];
}

export default function ChatWidget({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();

  const debug = sp.get('debug') === '1';

  // language
  const langRaw = (sp.get('lang') || 'en').toLowerCase();
  const allowed: Lang[] = ['en', 'pt', 'es', 'fr'];
  const lang: Lang = (allowed as string[]).includes(langRaw) ? (langRaw as Lang) : 'en';

  // profile
  const [fullName, setFullName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // debug counters
  const [memCount, setMemCount] = useState<number>(0);
  const [lastShop, setLastShop] = useState<any>(null);

  // listen for profile name events
  useEffect(() => {
    function onName(e: any) { setFullName(e?.detail?.fullName ?? null); }
    window.addEventListener('zolarus-profile-name', onName);
    return () => window.removeEventListener('zolarus-profile-name', onName);
  }, []);

  // auth/session listener
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        if (!cancelled) { setFullName(null); setUserId(null); }
        return;
      }
      setUserId(user.id);
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      if (!cancelled) {
        setFullName(data?.full_name ?? null);
        window.dispatchEvent(new CustomEvent('zolarus-profile-name', { detail: { fullName: data?.full_name ?? null } }));
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const id = s?.user?.id ?? null;
      setUserId(id);
      if (!id) setFullName(null);
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  function firstNameFrom(name?: string | null) {
    if (!name) return null;
    const parts = name.trim().split(/\s+/);
    return parts[0] || null;
  }
  const firstName = firstNameFrom(fullName);

  const pick = (obj: Record<string, string>) => obj[lang] ?? obj.en;

  const hello = firstName
    ? pick({
        en: `Hi, ${firstName}! I can explain Zolarus and nudge you through reminders. Ask me anything.`,
        pt: `Olá, ${firstName}! Posso explicar o Zolarus e orientar você com lembretes. Pergunte-me qualquer coisa.`,
        es: `¡Hola, ${firstName}! Puedo explicar Zolarus y guiarte con recordatorios. Pregúntame lo que quieras.`,
        fr: `Salut, ${firstName} ! Je peux expliquer Zolarus et vous guider avec des rappels. Posez-moi vos questions.`,
      })
    : pick({
        en: 'Hi! I can explain Zolarus and nudge you through reminders. Ask me anything.',
        pt: 'Olá! Posso explicar o Zolarus e orientar você com lembretes. Pergunte-me qualquer coisa.',
        es: '¡Hola! Puedo explicar Zolarus y guiarte con recordatorios. Pregúntame lo que quieras.',
        fr: 'Salut ! Je peux expliquer Zolarus et vous guider avec des rappels. Posez-moi vos questions.',
      });

  const placeholder = pick({
    en: 'Ask about reminders, schedules…',
    pt: 'Pergunte sobre lembretes, horários…',
    es: 'Pregunta sobre recordatorios, horarios…',
    fr: 'Demandez des rappels, des horaires…',
  });

  const allQs: Record<Lang, string[]> = {
    en: ['how do i create a reminder?','why complete my profile?','open reminders','go to shop','back to dashboard'],
    pt: ['como criar um lembrete?','por que completar meu perfil?','abrir lembretes','ir à loja','voltar ao painel'],
    es: ['¿cómo creo un recordatorio?','¿por qué completar mi perfil?','abrir recordatorios','ir a la tienda','volver al panel'],
    fr: ['comment créer un rappel ?','pourquoi compléter mon profil ?','ouvrir les rappels','aller à la boutique','retour au tableau de bord'],
  };
  const qs = allQs[lang] ?? allQs.en;

  const [open, setOpen] = useState(true);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ role: 'bot', text: hello }]);

  // refresh initial greeting when it changes
  useEffect(() => {
    setMsgs((m) => (m.length === 1 && m[0].role === 'bot' ? [{ role: 'bot', text: hello }] : m));
  }, [hello]);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  // language-preserving nav + force refresh
  const withLang = (path: string) => `${path}${path.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}`;
  const go = (path: string) => {
    const dest = withLang(path);
    router.push(dest);
    router.refresh(); // ensure same-route param changes take effect
  };

  const nowPath = useMemo(() => pathname || '/', [pathname]);

  // ───────────────────────────────────────────────────────────────────────────────
  // Shopping parser (expanded triggers + “between X and Y”) + soft defaults
  // ───────────────────────────────────────────────────────────────────────────────
  type ParsedShopping = {
    recipient?: string;
    occasion?: string;
    budget?: string; // "0-50", "50-100", "100-"
    keywords?: string;
  };

  function parseShopping(text: string): ParsedShopping | null {
    const q = text.toLowerCase().trim();

    // broaden intent triggers
    const isShopping =
      /(gift|present|ideas?|recommend|buy|shop|shopping|what.*get|find|search|look\s*for)/.test(q) ||
      /\b\$ ?\d{1,4}\b/.test(q) || /\bbetween\s*\$?\d{1,4}\s*(and|-|to)\s*\$?\d{1,4}\b/.test(q);

    if (!isShopping) return null;

    // recipient — also map common nouns
    const forMatch =
      q.match(/\bfor (my |the )?([a-z ]+?)(?:'s| on | for | with | under | over | above | more than | at | between | to | and |$)/) ||
      q.match(/\bfor ([a-z]+)\b/);

    let recipientRaw = (forMatch?.[2] || forMatch?.[1])?.trim();
    const norm = (s?: string) => s?.replace(/\s+/g, ' ').trim();
    const recipientLex: Record<string, string> = {
      women: 'woman', woman: 'woman', ladies: 'woman', lady: 'woman',
      men: 'man', man: 'man', guys: 'man', guy: 'man',
      mom: 'mom', mother: 'mom', dad: 'dad', father: 'dad',
      sister: 'sister', brother: 'brother', wife: 'wife', husband: 'husband',
      girlfriend: 'girlfriend', boyfriend: 'boyfriend', kid: 'kid', kids: 'kid', child: 'kid', teen: 'teen',
    };
    if (recipientRaw) {
      const key = norm(recipientRaw || '');
      if (key && recipientLex[key]) recipientRaw = recipientLex[key];
    }

    // occasion
    const occasion =
      (/\bbirthday\b/.test(q) && 'birthday') ||
      (/\bchristmas|xmas|holiday\b/.test(q) && 'holiday') ||
      (/\banniversary\b/.test(q) && 'anniversary') ||
      (/\bhousewarming\b/.test(q) && 'housewarming') ||
      undefined;

    // budget
    let budget: string | undefined;

    // "between $50 and $100", "from $50 to $100"
    const mBetween = q.match(/\b(between|from)\s*\$?(\d{1,4})\s*(and|-|to)\s*\$?(\d{1,4})\b/);
    // "$50 - $100"
    const mRange = q.match(/\$ ?(\d{1,4})\s*-\s*\$?(\d{1,4})/);
    // "under $50"
    const mUnder = q.match(/\bunder\s*\$?(\d{1,4})\b/);
    // "over $100"
    const mOver =
      q.match(/\bover\s*\$?(\d{1,4})\b/) ||
      q.match(/\bmore than\s*\$?(\d{1,4})\b/) ||
      q.match(/\babove\s*\$?(\d{1,4})\b/);

    if (mBetween) budget = `${mBetween[2]}-${mBetween[4]}`;
    else if (mRange) budget = `${mRange[1]}-${mRange[2]}`;
    else if (mUnder) budget = `0-${mUnder[1]}`;
    else if (mOver) budget = `${mOver[1]}-`;
    else {
      const mDollar = q.match(/\$ ?(\d{1,4})\b/);
      if (mDollar) budget = `0-${mDollar[1]}`;
    }

    // strip budget + intent verbs before deriving keywords
    let cleaned = q
      .replace(/\b(between|from)\s*\$?\d{1,4}\s*(and|-|to)\s*\$?\d{1,4}\b/g, ' ')
      .replace(/\$ ?\d{1,4}\s*-\s*\$?\d{1,4}/g, ' ')
      .replace(/\bunder\s*\$?\d{1,4}\b/g, ' ')
      .replace(/\bover\s*\$?\d{1,4}\b/g, ' ')
      .replace(/\bmore than\s*\$?\d{1,4}\b/g, ' ')
      .replace(/\babove\s*\$?\d{1,4}\b/g, ' ')
      .replace(/\$ ?\d{1,4}\b/g, ' ')
      .replace(/\b(find|search|look\s*for|buy|shop|shopping|gift|gifts?|ideas?|recommend)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // try to infer keywords from "ideas for X" or general leftovers
    const kw =
      (cleaned.match(/ideas? for (.*)/)?.[1] ||
        cleaned.match(/gift for (.*)/)?.[1] ||
        cleaned.match(/buy (.*)/)?.[1] ||
        cleaned);

    const keywords = kw
      ?.replace(/\b(for|with|on|my|him|her|them|me)\b/gi, '')
      .trim();

    const recipient = recipientRaw && recipientRaw.length <= 40 ? recipientRaw : undefined;

    // if we ended up with nothing meaningful, bail
    if (!recipient && !budget && !keywords) return null;

    return { recipient, occasion, budget, keywords: keywords || undefined };
  }

  // soft prefs in localStorage
  function prefKey(id: string) { return `zolarus:prefs:${id}`; }
  type SoftPrefs = { lastBudget?: string; lastKeywords?: string };
  function loadPrefs(): SoftPrefs {
    if (!userId) return {};
    try { const raw = localStorage.getItem(prefKey(userId)); return raw ? JSON.parse(raw) as SoftPrefs : {}; }
    catch { return {}; }
  }
  function savePrefs(p: SoftPrefs) {
    if (!userId) return;
    try {
      const curr = loadPrefs();
      localStorage.setItem(prefKey(userId), JSON.stringify({ ...curr, ...p }));
    } catch {}
  }

  function replyLine(s: string) { return s; }

  function answerFor(qRaw: string): { reply: string; nav?: string } {
    const q = qRaw.toLowerCase().trim();

    // natural-language → /shop with params
    const parsed = parseShopping(qRaw);
    if (parsed) {
      const defaults = loadPrefs();

      // Only reuse old keywords if user didn’t specify a new recipient
      const budget = parsed.budget ?? defaults.lastBudget;
      const keywords = parsed.keywords ?? (parsed.recipient ? undefined : defaults.lastKeywords);

      if (parsed.budget) savePrefs({ lastBudget: parsed.budget });
      if (parsed.keywords) savePrefs({ lastKeywords: parsed.keywords });

      const params = new URLSearchParams();
      if (parsed.recipient) params.set('for', parsed.recipient);
      if (parsed.occasion) params.set('occasion', parsed.occasion);
      if (budget) params.set('budget', budget);        // supports "min-max" and "min-"
      if (keywords) params.set('keywords', keywords);

      const base = `/shop?${params.toString()}`;

      const filled: string[] = [];
      if (!parsed.budget && budget) filled.push('budget');
      if (!parsed.keywords && keywords) filled.push('keywords');
      const note =
        filled.length === 0 ? '' :
        filled.length === 1 ? ` (I used your usual ${filled[0]}—you can change it there).` :
                              ` (I used your usual ${filled.join(' & ')}—tweak anything you want).`;

      return { reply: replyLine(`Got it—opening Shop with those filters${note}`), nav: base };
    }

    // quick nav
    if (/^(open|go to|take me to)\s+(reminder|reminders)\b/.test(q) || /open reminders?/.test(q))
      return { reply: replyLine('Opening Reminders…'), nav: '/reminders' };
    if (/back( to)? (home|dashboard)/.test(q) || /^dashboard$/.test(q))
      return { reply: replyLine('Heading back to your Dashboard…'), nav: '/dashboard' };
    if (/open shop|go to shop|where.*shop/.test(q) || /^shop$/.test(q))
      return { reply: replyLine('Taking you to the Shop…'), nav: '/shop' };
    if (/open profile|edit profile|profile page/.test(q) || /^profile$/.test(q))
      return { reply: replyLine('Opening your Profile…'), nav: '/profile' };
    if (/sign ?in|login|log in/.test(q))
      return { reply: replyLine('Opening sign in…'), nav: '/sign-in' };

    // contextual help by path
    if (nowPath === '/' || nowPath === '/sign-in') {
      if (q.includes('why') && (q.includes('sign') || q.includes('email'))) {
        return { reply: replyLine("You sign in with your email so we can send magic links and deliver your reminders to the right inbox. No passwords to remember—just click the link we send and you're in.") };
      }
      return { reply: replyLine('This page sends you a sign-in link. Type your email and press **Send email**. Once you’re in, I can guide you to **Reminders** or your **Dashboard**.') };
    }

    if (nowPath === '/dashboard') {
      if (q.includes('profile')) {
        return { reply: replyLine("Your profile helps personalize reminders and messages (name, optional phone later). It makes Zolarus feel like *your* assistant—quick to recognize you and faster to help.") };
      }
      if (q.includes('reminder')) {
        return { reply: replyLine("Click **Open** in the Reminders card. Set a title and time, and I'll handle the email right on time—so you don't need another calendar to babysit.") };
      }
      if (q.includes('shop')) {
        return { reply: replyLine('Shop lets you spin up gift ideas fast. For now we open Amazon with the filters you choose. More stores soon—this is just the start.') };
      }
      if (q.includes('credit') || q.includes('zola credit')) {
        return { reply: replyLine("Zola Credits are **coming soon**. If you want a head start, share your referral link at the bottom of this page (the box with **Copy**/**Share**). When credits drop, you’ll be glad you seeded it.") };
      }
      return { reply: replyLine('This is your **Dashboard**. From here you can set up your **Profile**, manage **Reminders**, and browse the **Shop**. Ask me to “open reminders”, “go to shop”, or “edit profile”.') };
    }

    if (nowPath === '/profile') {
      if (q.includes('why') || q.includes('what for') || q.includes('complete'))
        return { reply: replyLine('Completing your profile helps me greet you properly and (soon) tailor reminders. It’s quick—name and optional phone—and it keeps your account tidy for future features.') };
      if (q.includes('back') || q.includes('dashboard'))
        return { reply: replyLine('Going back to your Dashboard…'), nav: '/dashboard' };
      return { reply: replyLine('Update your **Full name** (and optional phone), then click **Save**. Ask “back to dashboard” when you’re done.') };
    }

    if (nowPath === '/reminders') {
      if (q.includes('how') && (q.includes('create') || q.includes('make') || q.includes('set')))
        return { reply: replyLine('Type a **Title** (e.g., “Mom’s birthday”), choose a date/time, then **Save reminder**. I’ll email you right on time. You can delete any reminder on this page.') };
      if (q.includes('recurr') || q.includes('repeat') || q.includes('cron'))
        return { reply: replyLine('Recurring schedules are supported by the backend cron. For now, set single reminders here; we’ll surface friendly repeat options in the UI soon.') };
      return { reply: replyLine('This page lists your upcoming reminders. Create a new one at the top. Ask me “back to dashboard” or “open shop” anytime.') };
    }

    if (nowPath === '/shop') {
      if (q.includes('how') || q.includes('what') || q.includes('explain') || q.includes('why only amazon') || q.includes('other store') || q.includes('walmart') || q.includes('target')) {
        return { reply: replyLine('The Shop currently launches Amazon with your picks. Use the fields at the top (for whom, occasion, keywords, budget), then click **Get ideas**. We’re adding more stores soon — **Walmart, Target, Best Buy, and Etsy**.') };
      }
      return { reply: replyLine('Right now we open Amazon with your filters for fast gift ideas. **Coming soon:** Walmart, Target, Best Buy, and Etsy. Ask “back to dashboard” when you’re done.') };
    }

    if (nowPath === '/refs') {
      return { reply: replyLine('Referrals are **coming soon** (this page may show 404 for now). Head back to your **Dashboard** to copy your referral link at the bottom.'), nav: '/dashboard' };
    }

    if (q.includes('back')) return { reply: replyLine('Heading back to your Dashboard…'), nav: '/dashboard' };
    return { reply: replyLine('I can navigate (e.g., “open reminders”, “back to dashboard”, “open shop”) or explain what’s on this page. Try asking “how do I create a reminder?” or “gift ideas under $50 for mom”.') };
  }

  // optional: fetch a small “resume” nudge
  useEffect(() => {
    let done = false;
    (async () => {
      const recent = await getRecentMemories(5);
      if (done) return;
      setMemCount(recent?.length || 0);
      const ls = recent?.find((r: any) => r.intent === 'shopping' && r.meta);
      if (ls?.meta) setLastShop(ls.meta);
    })();
    return () => { done = true; };
  }, [lang]);

  function sendUser() {
    const text = input.trim();
    if (!text) return;

    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');

    saveMemory({
      role: 'user',
      text,
      lang,
      intent: 'chat',
      meta: { pathname, query: sp ? Object.fromEntries(sp.entries()) : null },
    });

    const { reply, nav } = answerFor(text);

    setMsgs((m) => [...m, { role: 'bot', text: reply }]);

    saveMemory({ role: 'bot', text: reply, lang, intent: 'reply', meta: { pathname } });

    if (nav) setTimeout(() => go(nav), 400);
  }

  if (!open) {
    return (
      <button
        aria-label="Open Zolarus Assistant"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 50, borderRadius: '9999px',
          width: 54, height: 54, border: 'none', background: '#0f172a', color: '#fff',
          boxShadow: '0 10px 25px rgba(2,6,23,.25)', cursor: 'pointer',
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
        // CHANGED: add subtle cyan glow to match brand
        boxShadow:
          '0 16px 40px rgba(2,6,23,.18), 0 0 22px rgba(0, 220, 255, 0.24)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          minHeight: 56, // give avatar room
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AssistantAvatar size={44} /> {/* CHANGED: bigger & clearer */}
          <span>Zolarus Assistant</span>
          {debug && <span style={{ fontSize: 11, color: '#64748b' }}>mem {memCount}{lastShop ? ' · resume' : ''}</span>}
        </div>
        <button
          aria-label="Close"
          onClick={() => setOpen(false)}
          style={{ border: 'none', background: 'transparent', fontSize: 18, lineHeight: 1, cursor: 'pointer', color: '#0f172a' }}
        >
          ×
        </button>
      </div>

      {/* messages */}
      <div
        ref={listRef}
        style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {msgs.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                alignSelf: isUser ? 'flex-end' : 'stretch',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              {/* bot avatar on the left of messages */}
              {!isUser && <AssistantAvatar size={24} glow={false} bordered />}

              <div
                style={{
                  background: isUser ? '#0f172a' : '#f8fafc',
                  color: isUser ? '#fff' : '#0f172a',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '8px 10px',
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {/* quick suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {(qs ?? []).map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); setTimeout(sendUser, 0); }}
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
        onSubmit={(e) => { e.preventDefault(); sendUser(); }}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          aria-label="Ask Zolarus Assistant"
          style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
        />
        <button
          type="submit"
          style={{
            background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 14px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
