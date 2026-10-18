"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMaterial, deleteMaterial } from "@/app/teacher/actions";
import { FilePicker } from "../FilePicker";
import { Icon } from "../Icon";
import type { UploadedFile } from "@/lib/client-upload";

export function MaterialForm({ teachings, subjects }: { teachings: { classId: string; label: string; subjectId: string }[]; subjects: { id: string; name: string; emoji: string }[] }) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const opts = useMemo(() => teachings.filter((t) => t.subjectId === subjectId), [teachings, subjectId]);
  const [classIds, setClassIds] = useState<string[]>(() => opts.slice(0, 1).map((o) => o.classId));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await createMaterial({ classIds, subjectId, title, body, fileIds: files.map((f) => f.id) });
      if (r.ok) {
        setTitle(""); setBody(""); setFiles([]);
        setMsg({ ok: true, text: r.message ?? "Qo'shildi" });
        router.refresh();
      } else setMsg({ ok: false, text: r.error });
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-round text-lg font-bold">Yangi material</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Fan</span>
          <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setClassIds(teachings.filter((t) => t.subjectId === e.target.value).slice(0, 1).map((t) => t.classId)); }} className="input">
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
          </select>
        </label>
        <div>
          <span className="label">Sinflar</span>
          <div className="flex flex-wrap gap-1.5">
            {opts.map((o) => (
              <button key={o.classId} type="button" onClick={() => setClassIds((c) => (c.includes(o.classId) ? c.filter((x) => x !== o.classId) : [...c, o.classId]))} className={`rounded-xl px-3 py-2 text-sm font-bold ${classIds.includes(o.classId) ? "bg-sky text-white" : "bg-cream"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label className="block">
        <span className="label">Sarlavha</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={160} className="input" placeholder="Masalan: 5-bob. Kvadrat tenglamalar (darslik PDF)" />
      </label>
      <label className="block">
        <span className="label">Matn / konspekt</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="input" placeholder="Qoidalar, formulalar, misollar…" />
      </label>
      <div>
        <span className="label">Darslik PDF yoki rasmlar</span>
        <FilePicker value={files} onChange={setFiles} max={10} />
      </div>
      {msg && <p className={`rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-green-soft text-green-dark" : "bg-danger/10 text-danger"}`}>{msg.text}</p>}
      <button disabled={pending || !classIds.length} className="btn-primary"><Icon name="plus" size={18} /> {pending ? "Saqlanmoqda…" : "Qo'shish"}</button>
    </form>
  );
}

export function DeleteMaterialButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => confirm("Materialni o'chirasizmi?") && start(async () => { await deleteMaterial(id); router.refresh(); })}
      className="rounded-xl p-2 text-ink-soft hover:bg-danger/10 hover:text-danger"
      aria-label="O'chirish"
    >
      <Icon name="trash" size={16} />
    </button>
  );
}
