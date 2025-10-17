"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thread, setThread] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I can explain Zolarus and nudge you through reminders. Ask me anything.",
    },
  ]);

  const boxRef = useRef<HTMLDivElement>(null);

  // Persist locally so it “learns” per user without touching the DB yet
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zolarus_chat");
      if (saved) setThread(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("zolarus_chat", JSON.stringify(thread));
    } catch {}
  }, [thread]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [thread, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...thread, { role: "user" as const, content: text }];
    setThread(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }), // small context
      });
      const data = await res.json();
      setThread((t) => [...t, { role: "assistant", content: data.reply }]);
    } catch {
      setThread((t) => [
        ...t,
        {
          role: "assistant",
          content:
            "Hmm, I couldn’t reach the server. Try again, or check your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Minimal inline styles to avoid adding/altering any global CSS
  const s: Record<string, React.CSSProperties> = {
    fab: {
      position: "fixed",
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      background: "#111827",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 8px 24px rgba(0,0,0,.18)",
      cursor: "pointer",
      zIndex: 60,
    },
    panel: {
      position: "fixed",
      bottom: 88,
      right: 20,
      width: 360,
      maxWidth: "86vw",
      height: 460,
      background: "white",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      boxShadow: "0 12px 32px rgba(0,0,0,.12)",
      display: open ? "flex" : "none",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 60,
    },
    header: {
      padding: "12px 14px",
      borderBottom: "1px solid #F3F4F6",
      fontWeight: 600,
    },
    body: {
      flex: 1,
      padding: 12,
      overflowY: "auto",
      background: "#FAFAFB",
    },
    msgUser: {
      alignSelf: "flex-end",
      background: "#111827",
      color: "white",
      padding: "8px 10px",
      borderRadius: 10,
      maxWidth: "80%",
      margin: "6px 0",
      whiteSpace: "pre-wrap",
    },
    msgBot: {
      alignSelf: "flex-start",
      background: "white",
      color: "#111827",
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid #E5E7EB",
      maxWidth: "80%",
      margin: "6px 0",
      whiteSpace: "pre-wrap",
    },
    footer: {
      padding: 10,
      borderTop: "1px solid #F3F4F6",
      display: "flex",
      gap: 8,
    },
    input: {
      flex: 1,
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      padding: "8px 10px",
      outline: "none",
    },
    send: {
      background: "#111827",
      color: "white",
      border: "none",
      borderRadius: 8,
      padding: "8px 12px",
      cursor: "pointer",
    },
  };

  return (
    <>
      <div style={s.fab} onClick={() => setOpen((v) => !v)} aria-label="Chat">
        💬
      </div>

      <section style={s.panel} aria-live="polite">
        <div style={s.header}>Zolarus Assistant</div>
        <div style={s.body} ref={boxRef}>
          {thread.map((m, i) => (
            <div key={i} style={m.role === "user" ? s.msgUser : s.msgBot}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={s.msgBot}>
              Typing<span style={{ opacity: 0.6 }}>…</span>
            </div>
          )}
        </div>
        <div style={s.footer}>
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about reminders, schedules…"
          />
          <button style={s.send} onClick={send} disabled={loading}>
            Send
          </button>
        </div>
      </section>
    </>
  );
}
