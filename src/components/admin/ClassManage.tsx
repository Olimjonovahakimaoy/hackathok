"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignTeaching, createClass, moveStudent, regenerateTimetable, removeTeaching, setHomeroom } from "@/app/admin/actions";
import { Icon } from "../Icon";

type Opt = { id: string; label: string };

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Saqlandi" } : { ok: false, text: r.error ?? "Xatolik" });
      router.refresh();
    });
  return { pending, msg, run };
}

const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) =>
  m ? <span className={`text-xs font-semibold ${m.ok ? "text-green-dark" : "text-danger"}`}>{m.text}</span> : null;

export function NewClassForm({ teachers }: { teachers: Opt[] }) {
  const { pending, msg, run } = useAction();
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="btn-primary"><Icon name="plus" size={18} /> Yangi sinf</button>;
  return (
    <form
      action={(fd) => run(() => createClass(Number(fd.get("grade")), String(fd.get("letter")), String(fd.get("homeroom") || ""), String(fd.get("room") || "")))}
      className="card flex w-full flex-wrap items-end gap-3"
    >
      <label><span className="label">Sinf</span><select name="grade" className="input w-24">{Array.from({ length: 11 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
      <label><span className="label">Harf</span><input name="letter" maxLength={1} required defaultValue="B" className="input w-20 uppercase" /></label>
      <label className="min-w-52 flex-1"><span className="label">Sinf rahbari</span><select name="homeroom" className="input"><option value="">—</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
      <label><span className="label">Xona</span><input name="room" className="input w-32" placeholder="210-xona" /></label>
      <button disabled={pending} className="btn-green">Yaratish</button>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Bekor</button>
      <Msg m={msg} />
    </form>
  );
}

export function HomeroomSelect({ classId, current, teachers }: { classId: string; current?: string; teachers: Opt[] }) {
  const { pending, msg, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select defaultValue={current ?? ""} disabled={pending} onChange={(e) => run(() => setHomeroom(classId, e.target.value))} className="input w-full max-w-full sm:w-auto">
        <option value="">— tanlanmagan —</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <Msg m={msg} />
    </div>
  );
}

export function TeachingRow({ classId, subjectId, current, teachers }: { classId: string; subjectId: string; current?: string; teachers: Opt[] }) {
  const { pending, msg, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        defaultValue={current ?? ""}
        disabled={pending}
        onChange={(e) => e.target.value && run(() => assignTeaching(classId, subjectId, e.target.value))}
        className={`input w-full max-w-full py-2 sm:w-auto sm:min-w-56 ${!current ? "ring-2 ring-daisy" : ""}`}
      >
        <option value="">— ustoz tanlang —</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      {current && (
        <button disabled={pending} onClick={() => confirm("Bu fandan ustozni olib tashlaysizmi?") && run(() => removeTeaching(classId, subjectId))} className="rounded-xl p-2 text-ink-soft hover:bg-danger/10 hover:text-danger" aria-label="Olib tashlash">
          <Icon name="x" size={16} />
        </button>
      )}
      <Msg m={msg} />
    </div>
  );
}

export function RegenerateTimetable({ classId }: { classId: string }) {
  const { pending, msg, run } = useAction();
  return (
    <span className="inline-flex items-center gap-2">
      <button disabled={pending} onClick={() => confirm("Dars jadvali avtomatik qayta tuziladi. Davom etasizmi?") && run(() => regenerateTimetable(classId))} className="btn-ghost btn-sm">
        <Icon name="undo" size={14} /> Qayta tuzish
      </button>
      <Msg m={msg} />
    </span>
  );
}

export function MoveStudent({ studentId, current, classes }: { studentId: string; current: string; classes: Opt[] }) {
  const { pending, run } = useAction();
  return (
    <select defaultValue={current} disabled={pending} onChange={(e) => confirm("O'quvchini boshqa sinfga o'tkazasizmi?") ? run(() => moveStudent(studentId, e.target.value)) : (e.target.value = current)} className="rounded-xl bg-cream-light px-2 py-1 text-sm font-semibold" aria-label="Sinf">
      {classes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
    </select>
  );
}
