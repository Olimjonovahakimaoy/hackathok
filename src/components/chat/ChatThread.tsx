"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";

type M = { id: string; mine: boolean; text: string; createdAt: string; read: boolean };

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hour12: false });
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" });

export function ChatThread({ withId, initial, placeholder }: { withId: string; initial: M[]; placeholder?: string }) {
  const [msgs, setMsgs] = useState<M[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef(initial.at(-1)?.createdAt ?? "");

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?with=${encodeURIComponent(withId)}&after=${encodeURIComponent(lastRef.current)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: M[] };
      if (data.messages.length) {
        setMsgs((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
          lastRef.current = merged.at(-1)?.createdAt ?? lastRef.current;
          return merged;
        });
      }
    } catch {
      /* tarmoq vaqtincha yo'q — keyingi safar */
    }
  }, [withId]);

  useEffect(() => {
    poll();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 4000);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: withId, text: t }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yuborilmadi");
      setText("");
      setMsgs((p) => [...p, data.message]);
      lastRef.current = data.message.createdAt;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuborilmadi");
    } finally {
      setSending(false);
    }
  }

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="thin-scroll flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-ink-soft">Hali xabar yo&apos;q. Birinchi bo&apos;lib yozing 👋</p>}
        {msgs.map((m) => {
          const day = dayFmt.format(new Date(m.createdAt));
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && <div className="my-3 text-center"><span className="chip bg-cream text-ink-soft">{day.split("-").reverse().join(".")}</span></div>}
              <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-[15px] ${m.mine ? "rounded-br-lg bg-sky text-white" : "rounded-bl-lg bg-cream-light ring-1 ring-ink/5"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${m.mine ? "text-white/75" : "text-ink-soft"}`}>
                    {timeFmt.format(new Date(m.createdAt))}
                    {m.mine && <Icon name="check" size={12} className={m.read ? "text-green-soft" : ""} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {error && <p className="px-4 pb-1 text-sm font-semibold text-danger">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t border-ink/5 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={placeholder ?? "Xabar yozing…"}
          className="input max-h-36 min-h-12 resize-none"
        />
        <button disabled={sending || !text.trim()} className="btn-primary size-12 shrink-0 p-0" aria-label="Yuborish">
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  );
}
