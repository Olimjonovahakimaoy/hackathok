"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewSubmission } from "@/app/teacher/actions";
import { ImageAnnotator } from "./ImageAnnotator";
import { Icon } from "../Icon";
import type { UploadedFile } from "@/lib/client-upload";

const PHRASES = ["Barakalla, juda yaxshi!", "Toza va tartibli yozilgan.", "Hisoblashda e'tiborli bo'ling.", "Mavzuni qayta o'qing.", "Shartni to'liq yozing.", "Javob birligini unutmang.", "Xatolarni tuzatib, qayta yuboring."];
const MISTAKE_HINTS = ["Hisoblash xatosi", "Imlo xatosi", "Tinish belgisi", "Birlik ko'rsatilmagan", "Shart yozilmagan", "Chizma aniq emas", "Xulosa yo'q"];

export function ReviewPanel({
  submissionId,
  images,
  initial,
  isTest,
}: {
  submissionId: string;
  images: { id: string; name: string }[];
  initial: { grade?: number; feedback?: string; mistakes?: string[]; annotated: UploadedFile[] };
  isTest: boolean;
}) {
  const router = useRouter();
  const [grade, setGrade] = useState<number | undefined>(initial.grade);
  const [feedback, setFeedback] = useState(initial.feedback ?? "");
  const [mistakes, setMistakes] = useState<string[]>(initial.mistakes ?? []);
  const [draft, setDraft] = useState("");
  const [annotated, setAnnotated] = useState<UploadedFile[]>(initial.annotated);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const addMistake = (m: string) => {
    const v = m.trim();
    if (v) setMistakes((x) => [...x, v]);
    setDraft("");
  };

  const send = (action: "grade" | "return") => {
    setError(null);
    start(async () => {
      const r = await reviewSubmission({ submissionId, grade, feedback, mistakes, annotatedFileIds: annotated.map((a) => a.id), action });
      if (!r.ok) return setError(r.error);
      router.push(r.data?.nextId ? `/teacher/review/${r.data.nextId}` : "/teacher/review?done=1");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        {images.length > 0 && !isTest && (
          <>
            <h2 className="font-round text-lg font-bold">Rasmga belgi qo&apos;yish</h2>
            {images.map((im) => (
              <ImageAnnotator key={im.id} src={`/api/files/${im.id}`} name={im.name} onSaved={(f) => setAnnotated((a) => [...a, f])} />
            ))}
          </>
        )}
      </div>
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <section className="card space-y-4">
          <div>
            <span className="label">Baho</span>
            <div className="grid grid-cols-4 gap-2">
              {[5, 4, 3, 2].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setGrade(v)}
                  className={`rounded-2xl py-3 font-round text-2xl font-bold transition ${grade === v ? (v >= 5 ? "bg-green" : v >= 4 ? "bg-sky" : v >= 3 ? "bg-warn" : "bg-danger") + " text-white shadow-[0_4px_0_rgba(0,0,0,0.15)]" : "bg-cream text-ink hover:bg-cream-dark"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="label">Izoh</span>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} maxLength={2000} className="input" placeholder="O'quvchiga izoh…" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PHRASES.map((p) => (
                <button key={p} type="button" onClick={() => setFeedback((f) => (f ? `${f} ${p}` : p))} className="rounded-full bg-sky-soft px-2.5 py-1 text-xs font-semibold text-sky-dark hover:bg-sky hover:text-white">{p}</button>
              ))}
            </div>
          </label>
          <div>
            <span className="label">Xatolar ro&apos;yxati</span>
            {mistakes.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {mistakes.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-xl bg-[#fdeeee] px-3 py-1.5 text-sm">
                    <Icon name="x" size={14} className="text-danger" />
                    <span className="flex-1">{m}</span>
                    <button type="button" onClick={() => setMistakes((x) => x.filter((_, k) => k !== i))} className="text-ink-soft hover:text-danger" aria-label="O'chirish"><Icon name="trash" size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMistake(draft); } }} className="input py-2" placeholder="Masalan: 3-misolda ishora xatosi" />
              <button type="button" onClick={() => addMistake(draft)} className="btn-ghost shrink-0 px-3" aria-label="Qo'shish"><Icon name="plus" size={18} /></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MISTAKE_HINTS.map((p) => (
                <button key={p} type="button" onClick={() => addMistake(p)} className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-danger/10 hover:text-danger">+ {p}</button>
              ))}
            </div>
          </div>
          {annotated.length > 0 && (
            <div>
              <span className="label">Belgilangan rasmlar ({annotated.length})</span>
              <div className="flex flex-wrap gap-2">
                {annotated.map((a) => (
                  <span key={a.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${a.id}`} alt="" className="size-16 rounded-xl object-cover ring-1 ring-ink/10" />
                    <button type="button" onClick={() => setAnnotated((x) => x.filter((y) => y.id !== a.id))} className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-white" aria-label="Olib tashlash"><Icon name="x" size={10} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => send("grade")} disabled={pending || !grade} className="btn-green py-3"><Icon name="check" size={18} /> Baholash</button>
            {!isTest && <button type="button" onClick={() => send("return")} disabled={pending} className="btn-daisy py-3"><Icon name="undo" size={18} /> Qayta ishlashga</button>}
          </div>
          <p className="text-xs text-ink-soft">Baho avtomatik jurnalga tushadi va o&apos;quvchi hamda ota-onaga ko&apos;rinadi. &quot;Qayta ishlashga&quot; — o&apos;quvchi xatolarni tuzatib qayta yuboradi.</p>
        </section>
      </aside>
    </div>
  );
}
