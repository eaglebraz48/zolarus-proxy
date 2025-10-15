// src/app/reminders/page.tsx
'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'pt' | 'es' | 'fr';
const LANGS: Lang[] = ['en', 'pt', 'es', 'fr'];
const isLang = (v: string | null): v is Lang => !!v && LANGS.includes(v as Lang);

type TranslationStrings = {
  title: string;
  lead: string;
  back: string;
  formTitle: string;
  reminderTitle: string;
  date: string;
  time: string;
  create: string;
  creating: string;
  listTitle: string;
  none: string;
  statusScheduled: string;
  delete: string;
  deleting: string;
  required: string;
  saved: string;
  deleted: string;
};

const L: Record<Lang, TranslationStrings> = {
  en: {
    title: 'Reminders',
    lead: "Create reminders and we'll email you on time.",
    back: 'Back to Dashboard',
    formTitle: 'New reminder',
    reminderTitle: 'Title',
    date: 'Date',
    time: 'Time',
    create: 'Save reminder',
    creating: 'Saving…',
    listTitle: 'Your reminders',
    none: 'No reminders yet.',
    statusScheduled: 'scheduled',
    delete: 'Delete',
    deleting: 'Deleting…',
    required: 'Please enter a title, date, and time.',
    saved: 'Reminder saved.',
    deleted: 'Reminder deleted.',
  },
  pt: {
    title: 'Lembretes',
    lead: 'Crie lembretes e enviaremos um email na hora certa.',
    back: 'Voltar ao Painel',
    formTitle: 'Novo lembrete',
    reminderTitle: 'Título',
    date: 'Data',
    time: 'Hora',
    create: 'Salvar lembrete',
    creating: 'Salvando…',
    listTitle: 'Seus lembretes',
    none: 'Nenhum lembrete ainda.',
    statusScheduled: 'agendado',
    delete: 'Excluir',
    deleting: 'Excluindo…',
    required: 'Preencha título, data e hora.',
    saved: 'Lembrete salvo.',
    deleted: 'Lembrete excluído.',
  },
  es: {
    title: 'Recordatorios',
    lead: 'Crea recordatorios y te enviaremos un correo a tiempo.',
    back: 'Volver al Panel',
    formTitle: 'Nuevo recordatorio',
    reminderTitle: 'Título',
    date: 'Fecha',
    time: 'Hora',
    create: 'Guardar recordatorio',
    creating: 'Guardando…',
    listTitle: 'Tus recordatorios',
    none: 'Aún no hay recordatorios.',
    statusScheduled: 'programado',
    delete: 'Eliminar',
    deleting: 'Eliminando…',
    required: 'Ingresa título, fecha y hora.',
    saved: 'Recordatorio guardado.',
    deleted: 'Recordatorio eliminado.',
  },
  fr: {
    title: 'Rappels',
    lead: "Créez des rappels et nous vous enverrons un email à temps.",
    back: 'Retour au Tableau de bord',
    formTitle: 'Nouveau rappel',
    reminderTitle: 'Titre',
    date: 'Date',
    time: 'Heure',
    create: 'Enregistrer le rappel',
    creating: 'Enregistrement…',
    listTitle: 'Vos rappels',
    none: "Aucun rappel pour l'instant.",
    statusScheduled: 'planifié',
    delete: 'Supprimer',
    deleting: 'Suppression…',
    required: 'Veuillez saisir un titre, une date et une heure.',
    saved: 'Rappel enregistré.',
    deleted: 'Rappel supprimé.',
  },
};

type Row = {
  id: string;
  user_id: string;
  title: string | null;
  remind_at: string;
  created_at: string;
  email: string | null;
};

export default function RemindersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemindersContent />
    </Suspense>
  );
}

function RemindersContent() {
  const sp = useSearchParams();
  const lang = (isLang(sp.get('lang')) ? (sp.get('lang') as Lang) : 'en') as Lang;
  const t = L[lang];

  const [userId, setUserId] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const me = userData.user;
      if (!me) {
        setUserId(null);
        setUserEmail(null);
        setRows([]);
        setLoading(false);
        return;
      }
      if (mounted) {
        setUserId(me.id);
        setUserEmail(me.email || null);
      }

      const { data } = await supabase
        .from('reminders')
        .select('id,user_id,title,remind_at,created_at,email')
        .eq('user_id', me.id)
        .order('remind_at', { ascending: true });

      if (mounted) setRows((data as Row[]) || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const withLang = (href: string) => {
    const p = new URLSearchParams(sp as any);
    p.set('lang', lang);
    return `${href}?${p.toString()}`;
  };

  const toISOFromLocal = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
    const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
    return dt.toISOString();
  };

  async function createReminder() {
    if (!userId || !userEmail || !title.trim() || !date || !time) {
      setFlash(t.required);
      return;
    }
    setSaving(true);

    const iso = toISOFromLocal(date, time);

    const { data, error } = await supabase
      .from('reminders')
      .insert([{ user_id: userId, email: userEmail, title: title.trim(), remind_at: iso }])
      .select('id,user_id,title,remind_at,created_at,email')
      .single();

    setSaving(false);
    if (error) {
      console.error('Insert error:', error);
      setFlash(error.message);
      return;
    }

    fetch('/api/reminders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId: (data as any).id, title, remindAt: iso }),
    }).catch((err) => console.error('Confirm error:', err));

    setRows((prev) => [...prev, data as Row].sort((a, b) => a.remind_at.localeCompare(b.remind_at)));
    setTitle('');
    setDate('');
    setTime('');
    setFlash(t.saved);
    setTimeout(() => setFlash(null), 2000);
  }

  async function deleteReminder(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      setFlash(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setFlash(t.deleted);
    setTimeout(() => setFlash(null), 2000);
  }

  const formatLocal = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 6 }}>{t.title}</h1>
      <p style={{ color: '#374151', marginBottom: 16 }}>{t.lead}</p>

      {flash && (
        <div
          style={{
            marginBottom: 12,
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            padding: '8px 10px',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {flash}
        </div>
      )}

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
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{t.formTitle}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px auto', gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.reminderTitle}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={t.date}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label={t.time}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}
          />
          <button
            onClick={createReminder}
            disabled={saving || !userId || !userEmail}
            style={{
              backgroundColor: '#FF9900',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontWeight: 700,
              cursor: saving || !userEmail ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? t.creating : t.create}
          </button>
        </div>
      </section>

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
            gridTemplateColumns: '2fr 1fr auto',
            gap: 8,
            padding: '10px 12px',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: 700,
          }}
        >
          <div>{t.listTitle}</div>
          <div style={{ textTransform: 'capitalize' }}>{t.statusScheduled}</div>
          <div />
        </div>
        {loading ? (
          <div style={{ padding: 14, color: '#6b7280' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 14, color: '#6b7280' }}>{t.none}</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr auto',
                gap: 8,
                padding: '10px 12px',
                borderTop: '1px solid #f3f4f6',
              }}
            >
              <div style={{ color: '#111827' }}>
                <div style={{ fontWeight: 600 }}>{r.title || '(untitled)'}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>
                  {formatLocal(r.remind_at)} {r.email && `· ${r.email}`}
                </div>
              </div>
              <div style={{ color: '#374151' }}>{t.statusScheduled}</div>
              <div>
                <button
                  onClick={() => deleteReminder(r.id)}
                  disabled={deletingId === r.id}
                  style={{
                    backgroundColor: '#232F3E',
                    color: '#FFD814',
                    border: '1px solid #FFD814',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontWeight: 700,
                    cursor: deletingId === r.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deletingId === r.id ? t.deleting : t.delete}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <div style={{ marginTop: 16 }}>
        <Link
          href={withLang('/dashboard')}
          style={{ color: '#1f2937', textDecoration: 'none', fontWeight: 600 }}
        >
          ← {t.back}
        </Link>
      </div>
    </div>
  );
}