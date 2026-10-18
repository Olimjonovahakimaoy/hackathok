"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAttendance } from "@/app/teacher/actions";
import type { AttendanceStatus } from "@/lib/types";
import { Icon } from "../Icon";

const OPTS: { v: AttendanceStatus; label: string; on: string }[] = [
  { v: "present", label: "Keldi", on: "bg-green text-white" },
  { v: "late", label: "Kechikdi", on: "bg-warn text-white" },
  { v: "absent", label: "Kelmadi", on: "bg-danger text-white" },
  { v: "excused", label: "Sababli", on: "bg-sky text-white" },
];

export function AttendanceSheet({ classId, date, students, initial, saved }: { classId: string; date: string; students: { id: string; name: string }[]; initial: Record<string, AttendanceStatus>; saved: boolean }) {
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() => Object.fromEntries(students.map((s) => [s.id, initial[s.id] ?? "present"])));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const counts = OPTS.map((o) => ({ ...o, n: Object.values(marks).filter((m) => m === o.v).length }));

  const save = () =>
    start(async () => {
      const r = await saveAttendance(classId, date, marks);
      setMsg(r.ok ? { ok: true, text: r.message ?? "Saqlandi" } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {counts.map((c) => (
          <span key={c.v} className={`chip ${c.on}`}>{c.label}: {c.n}</span>
        ))}
        {!saved && <span className="chip bg-daisy-soft text-daisy-dark">hali saqlanmagan</span>}
        <button onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, "present"])))} className="btn-ghost btn-sm ml-auto">Hammasi keldi</button>
      </div>
      <ul className="card divide-y divide-ink/5 p-2">
        {students.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-2 py-2.5">
            <span className="font-semibold"><span className="mr-2 text-xs text-ink-soft">{i + 1}.</span>{s.name}</span>
            <div className="flex gap-1 rounded-2xl bg-cream-light p-1" role="radiogroup" aria-label={s.name}>
              {OPTS.map((o) => (
                <button
                  key={o.v}
                  role="radio"
                  aria-checked={marks[s.id] === o.v}
                  onClick={() => setMarks((m) => ({ ...m, [s.id]: o.v }))}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${marks[s.id] === o.v ? o.on : "text-ink-soft hover:bg-white"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {msg && <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-green-soft text-green-dark" : "bg-danger/10 text-danger"}`}>{msg.text}</p>}
      <button onClick={save} disabled={pending} className="btn-green w-full sm:w-auto"><Icon name="check" size={18} /> {pending ? "Saqlanmoqda…" : "Davomatni saqlash"}</button>
    </div>
  );
}
