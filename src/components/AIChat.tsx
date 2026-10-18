"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Markdown } from "./Markdown";
import { Eyes } from "./Brand";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChat({
  name,
  kids,
  subjects,
  suggestions,
  enabled,
}: {
  name: string;
  kids?: boolean;
  subjects: { id: string; name: string; emoji: string }[];
  suggestions: string[];
  enabled: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const history: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, subjectId: subjectId || undefined }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Javob olib bo'lmadi");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Xatolik");
        setMessages(history);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="card flex h-[calc(100dvh-13rem)] min-h-[480px] flex-col p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/5 px-5 py-3">
        <Eyes size={44} />
        <div className="flex-1">
          <div className="font-round font-bold">Ko&apos;zcha — AI yordamchi</div>
          <div className="text-xs text-ink-soft">Tushuntiradi, yo&apos;l ko&apos;rsatadi — lekin uy ishini sen uchun yechib bermaydi 😉</div>
        </div>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input w-auto py-2" aria-label="Fan">
          <option value="">Barcha fanlar</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
          ))}
        </select>
        {messages.length > 0 && (
          <button onClick={() => { abortRef.current?.abort(); setMessages([]); }} className="btn-ghost btn-sm">Yangi suhbat</button>
        )}
      </div>

      <div className="thin-scroll flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {!enabled && (
          <div className="rounded-2xl bg-[#fbecd1] p-4 text-sm font-medium text-[#7a5200]">
            AI yordamchi hali yoqilmagan. Maktab administratori serverga Anthropic API kalitini qo&apos;shgach ishlaydi.
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="text-5xl">{kids ? "🤖" : "✨"}</div>
            <h3 className="mt-3 font-round text-xl font-bold">Salom, {name}! Nimani tushunmayapsan?</h3>
            <p className="mt-1 max-w-md text-sm text-ink-soft">Savolingni yoz yoki quyidagilardan birini tanla.</p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={!enabled} className="rounded-2xl bg-sky-soft px-3.5 py-2 text-sm font-semibold text-sky-dark transition hover:bg-sky hover:text-white disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed ${
                m.role === "user" ? "rounded-br-lg bg-sky text-white" : "rounded-bl-lg bg-cream-light ring-1 ring-ink/5"
              }`}
            >
              {m.role === "assistant" ? (
                m.content ? <Markdown text={m.content} /> : <span className="inline-flex gap-1 py-1"><span className="size-2 animate-bounce rounded-full bg-ink/40" /><span className="size-2 animate-bounce rounded-full bg-ink/40 [animation-delay:120ms]" /><span className="size-2 animate-bounce rounded-full bg-ink/40 [animation-delay:240ms]" /></span>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-ink/5 p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          maxLength={3000}
          placeholder={enabled ? "Savolingni yoz…" : "AI o'chirilgan"}
          disabled={!enabled}
          className="input max-h-40 min-h-12 resize-none"
        />
        <button type="submit" disabled={busy || !input.trim() || !enabled} className="btn-primary size-12 shrink-0 p-0" aria-label="Yuborish">
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  );
}
