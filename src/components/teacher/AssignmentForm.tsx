"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssignment } from "@/app/teacher/actions";
import { FilePicker } from "../FilePicker";
import { Icon } from "../Icon";
import type { UploadedFile } from "@/lib/client-upload";
import type { AssignmentKind } from "@/lib/types";

type Q = { text: string; options: string[]; correct: number };
const blankQ = (): Q => ({ text: "", options: ["", "", "", ""], correct: -1 });

export function AssignmentForm({
  teachings,
  subjects,
  defaultClassId,
  defaultSubjectId,
  tomorrow,
}: {
  teachings: { classId: string; label: string; subjectId: string }[];
  subjects: { id: string; name: string; emoji: string }[];
  defaultClassId?: string;
  defaultSubjectId?: string;
  tomorrow: string;
}) {
  const router = useRouter();
  const initialSubject =
    defaultSubjectId && subjects.some((s) => s.id === defaultSubjectId)
      ? defaultSubjectId
      : teachings.find((t) => t.classId === defaultClassId)?.subjectId ?? subjects[0]?.id ?? "";
  const [subjectId, setSubjectId] = useState(initialSubject);
  const classesForSubject = useMemo(() => teachings.filter((t) => t.subjectId === subjectId), [teachings, subjectId]);
  const [classIds, setClassIds] = useState<string[]>(() => {
    const c = teachings.find((t) => t.subjectId === initialSubject && t.classId === defaultClassId);
    return c ? [c.classId] : classesForSubject.slice(0, 1).map((t) => t.classId);
  });
  const [kind, setKind] = useState<AssignmentKind>("homework");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(tomorrow);
  const [dueTime, setDueTime] = useState("08:00");
  const [allowLate, setAllowLate] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [questions, setQuestions] = useState<Q[]>([blankQ(), blankQ()]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const changeSubject = (s: string) => {
    setSubjectId(s);
    setClassIds(teachings.filter((t) => t.subjectId === s).slice(0, 1).map((t) => t.classId));
  };
  const toggleClass = (id: string) => setClassIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const updQ = (i: number, patch: Partial<Q>) => setQuestions((qs) => qs.map((q, k) => (k === i ? { ...q, ...patch } : q)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createAssignment({
        classIds,
        subjectId,
        kind,
        title,
        description,
        dueDate,
        dueTime,
        allowLate,
        fileIds: files.map((f) => f.id),
        questions: kind === "test" ? questions : undefined,
      });
      if (!r.ok) setError(r.error);
      else router.push(r.data?.ids.length === 1 ? `/teacher/assignments/${r.data.ids[0]}` : "/teacher/assignments");
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <section className="card space-y-4">
          <div className="inline-flex rounded-2xl bg-cream p-1">
            {(
              [
                ["homework", "📒 Uy ishi"],
                ["classwork", "✍️ Sinf ishi"],
                ["test", "📝 Test"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" onClick={() => { setKind(k); setDueTime(k === "test" ? "20:00" : "08:00"); }} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${kind === k ? "bg-white text-night shadow" : "text-ink-soft"}`}>
                {l}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="label">Sarlavha</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={160} className="input" placeholder={kind === "test" ? "Masalan: Kvadrat tenglamalar — test" : "Masalan: 214–220-misollar"} />
          </label>
          <label className="block">
            <span className="label">Topshiriq matni</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={5000} className="input" placeholder="Nima qilish kerak, qaysi betdan, qanday topshirish…" />
          </label>
          <div>
            <span className="label">Fayllar (darslik sahifasi, misollar rasmi, PDF)</span>
            <FilePicker value={files} onChange={setFiles} max={10} />
          </div>
        </section>

        {kind === "test" && (
          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-round text-lg font-bold">Test savollari ({questions.length})</h2>
              <span className="text-xs text-ink-soft">To&apos;g&apos;ri javobni doirachani bosib belgilang</span>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-3xl bg-cream-light p-4 ring-1 ring-ink/5">
                <div className="flex items-start gap-2">
                  <span className="mt-3 font-round font-bold text-ink-soft">{i + 1}.</span>
                  <input value={q.text} onChange={(e) => updQ(i, { text: e.target.value })} className="input bg-white" placeholder="Savol matni" />
                  {questions.length > 2 && (
                    <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, k) => k !== i))} className="mt-1.5 rounded-xl p-2 text-ink-soft hover:bg-danger/10 hover:text-danger" aria-label="Savolni o'chirish"><Icon name="trash" size={18} /></button>
                  )}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, k) => (
                    <div key={k} className="flex items-center gap-2">
                      <button type="button" onClick={() => updQ(i, { correct: k })} aria-label="To'g'ri javob" className={`grid size-7 shrink-0 place-items-center rounded-full ring-2 ${q.correct === k ? "bg-green text-white ring-green" : "ring-ink/20"}`}>
                        {q.correct === k && <Icon name="check" size={14} />}
                      </button>
                      <input value={o} onChange={(e) => updQ(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} className="input bg-white py-2" placeholder={`${String.fromCharCode(65 + k)} variant`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setQuestions((qs) => [...qs, blankQ()])} className="btn-ghost w-full"><Icon name="plus" size={18} /> Savol qo&apos;shish</button>
          </section>
        )}
      </div>

      <aside className="space-y-5">
        <section className="card space-y-4">
          <label className="block">
            <span className="label">Fan</span>
            <select value={subjectId} onChange={(e) => changeSubject(e.target.value)} className="input">
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
              ))}
            </select>
          </label>
          <div>
            <span className="label">Sinflar (bir nechtasini tanlash mumkin)</span>
            <div className="flex flex-wrap gap-2">
              {classesForSubject.map((t) => (
                <button key={t.classId} type="button" onClick={() => toggleClass(t.classId)} className={`rounded-2xl px-4 py-2 font-round font-bold transition ${classIds.includes(t.classId) ? "bg-sky text-white" : "bg-cream text-ink"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Muddat</span>
              <input type="date" value={dueDate} min={tomorrow < dueDate ? undefined : undefined} onChange={(e) => setDueDate(e.target.value)} required className="input" />
            </label>
            <label className="block">
              <span className="label">Soat</span>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} required className="input" />
            </label>
          </div>
          {kind !== "test" && (
            <label className="flex items-center gap-3 rounded-2xl bg-cream-light p-3 text-sm font-medium">
              <input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} className="size-5 accent-sky" />
              Muddatdan keyin ham topshirishga ruxsat (yarim ball)
            </label>
          )}
          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
          <button disabled={pending || !classIds.length} className="btn-primary w-full py-3"><Icon name="send" size={18} /> {pending ? "Saqlanmoqda…" : classIds.length > 1 ? `${classIds.length} ta sinfga berish` : "Vazifani berish"}</button>
        </section>
        <p className="px-2 text-xs text-ink-soft">O&apos;quvchilar vazifani darhol ko&apos;radi. Uy ishini rasmga olib yoki matn ko&apos;rinishida topshiradi, test esa avtomatik tekshiriladi va baho jurnalga tushadi.</p>
      </aside>
    </form>
  );
}
