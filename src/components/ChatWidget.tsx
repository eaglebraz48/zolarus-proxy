// src/components/ChatWidget.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Msg = { role: 'bot' | 'user'; text: string };

export default function ChatWidget({ email }: { email: string | null }) {
  const sp = useSearchParams();
  const lang = (sp.get('lang') || 'en').toLowerCase() as 'en' | 'pt' | 'es' | 'fr';

  const t = useMemo(() => {
    switch (lang) {
      case 'pt':
        return {
          hi: 'Oi! Sou o assistente do Zolarus. Em que posso ajudar?',
          placeholder: 'Escreva aqui…',
          suggestions: ['abrir lembretes', 'ir à loja', 'abrir perfil', 'voltar ao painel'],
        };
      case 'es':
        return {
          hi: '¡Hola! Soy el asistente de Zolarus. ¿En qué te ayudo?',
          placeholder: 'Escribe aquí…',
          suggestions: ['abrir recordatorios', 'ir a tienda', 'abrir perfil', 'volver al panel'],
        };
      case 'fr':
        return {
          hi: 'Salut ! Assistant Zolarus ici. Je peux aider avec quoi ?',
          placeholder: 'Écris ici…',
          suggestions: ['ouvrir rappels', 'aller à la boutique', 'ouvrir profil', 'retour au tableau'],
        };
      default:
        return {
          hi: 'Hi! Zolarus assistant here. What do you need?',
          placeholder: 'Type here…',
          suggestions: ['open reminders', 'go to shop', 'open profile', 'back to dashboard'],
        };
    }
  }, [lang]);

  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'bot', text: t.hi }]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // refresh greeting if lang changes
    setMsgs((m) => [{ role: 'bot', text: t.hi }, ...m.filter((x) => x.role !== 'bot' || x.text !== m[0]?.text)]);
  }, [t.hi]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, open]);

  function respond(text: string): string {
    const s = text.toLowerCase().trim();

    // simple nav hints (the page actually handles routing elsewhere)
    if (/(open|abrir).*(reminders|lembretes|recordatorios|rappels)/.test(s)) {
      return 'Navigating: Reminders.';
    }
    if (/(go|ir).*(shop|loja|tienda|boutique)/.test(s)) {
      return 'Navigating: Shop.';
    }
    if (/(open|abrir).*(profile|perfil)/.test(s)) {
      return 'Navigating: Profile.';
    }
    if (/(back|voltar|volver|retour).*(dashboard|painel|panel|tableau)/.test(s)) {
      return 'Navigating: Dashboard.';
    }

    // default
    return email
      ? `Got it. I’ll guide you here in the app, ${email}.`
      : 'Got it. I’ll guide you here in the app.';
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMsgs((m) => [...m, { role: 'user', text }, { role: 'bot', text: respond(text) }]);
    setInput('');
  };

  return (
    <>
      {/* floating button */}
      {!open && (
        <button
          aria-label="Open assistant"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            width: 56,
            height: 56,
            borderRadius: 28,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            fontSize: 24,
            cursor: 'pointer',
            zIndex: 40,
          }}
        >
          💬
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            width: 360,
            height: 480,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            background: '#ffffff',
            boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            zIndex: 40,
            overflow: 'hidden',
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
              background: '#f8fafc',
            }}
          >
            <strong>Zolarus Assistant</strong>
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 18,
                cursor: 'pointer',
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
              background: '#ffffff',
            }}
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? '#0f172a' : '#f8fafc',
                  color: m.role === 'user' ? '#ffffff' : '#0f172a',
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
          </div>

          {/* suggestions */}
          <div style={{ padding: '6px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {t.suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(s)}
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

          {/* input */}
          <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              aria-label="Message"
              style={{
                flex: 1,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 10px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                border: '1px solid #0f172a',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
