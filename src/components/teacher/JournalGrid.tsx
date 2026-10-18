"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGrade, deleteGrade } from "@/app/teacher/actions";
import { Icon } from "../Icon";
import type { GradeType } from "@/lib/types";

export interface JGrade { id: string; studentId: string; date: string; value: number; type: GradeType; comment?: string; mine: boolean; locked: boolean }

const TYPE_LABEL: Record<GradeType, string> = { dars: "Dars", uy_ishi: "Uy ishi", nazorat: "Nazorat", test: "Test" };
const color = (v: number) => (v >= 5 ? "bg-green" : v >= 4 ? "bg-sky" : v >= 3 ? "bg-warn" : "bg-danger");
const WD = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

export function JournalGrid({
  students,
  dates,
  grades,
  subjectId,
  canEdit,
  today,
}: {
  students: { id: string; name: string }[];
  dates: string[];
  grades: JGrade[];
  subjectId: string;
  canEdit: boolean;
  today: string;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<{ sid: string; date: string } | null>(null);
  const [type, setType] = useState<GradeType>("dars");
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState(today);

  const byCell = useMemo(() => {
    const m = new Map<string, JGrade[]>();
    for (const g of grades) m.set(`${g.studentId}|${g.date}`, [...(m.get(`${g.studentId}|${g.date}`) ?? []), g]);
    return m;
  }, [grades]);
  const avgOf = (sid: string) => {
    const vs = grades.filter((g) => g.studentId === sid).map((g) => g.value);
    return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
  };
  const allDates = useMemo(() => [...new Set([...dates, ...grades.map((g) => g.date)])].sort().slice(-14), [dates, grades]);
  const selStudent = students.find((s) => s.id === sel?.sid);
  const cellGrades = sel ? byCell.get(`${sel.sid}|${sel.date}`) ?? [] : [];

  const put = (value: number) => {
    if (!sel) return;
    setError(null);
    start(async () => {
      const r = await addGrade({ studentId: sel.sid, subjectId, date: sel.date, value, type, comment });
      if (!r.ok) setError(r.error);
      else {
        setComment("");
        router.refresh();
      }
    });
  };
  const remove = (id: string) =>
    start(async () => {
      const r = await deleteGrade(id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });

  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    const w = new Date(`${d}T12:00:00Z`).getUTCDay();
    return { top: `${day}.${m}`, bottom: WD[w] };
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-x-auto p-0">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-48 border-b border-ink/10 bg-white px-4 py-3 text-left text-xs font-semibold text-ink-soft uppercase">O&apos;quvchi</th>
              {allDates.map((d) => (
                <th key={d} className={`border-b border-ink/10 px-1 py-2 text-center text-[11px] font-semibold ${d === today ? "bg-sky-soft text-sky-dark" : "text-ink-soft"}`}>
                  <div>{fmt(d).top}</div>
                  <div className="font-normal">{fmt(d).bottom}</div>
                </th>
              ))}
              {canEdit && (
                <th className="border-b border-ink/10 px-2 py-2 text-center text-[11px] font-semibold text-ink-soft">
                  <input type="date" value={customDate} max={today} onChange={(e) => setCustomDate(e.target.value)} className="w-28 rounded-lg bg-cream-light px-1 py-1 text-[11px]" aria-label="Boshqa sana" />
                </th>
              )}
              <th className="border-b border-ink/10 px-3 py-2 text-center text-xs font-semibold text-ink-soft uppercase">O&apos;rt.</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => {
              const a = avgOf(s.id);
              return (
                <tr key={s.id} className="group">
                  <td className="sticky left-0 z-10 border-b border-ink/5 bg-white px-4 py-2 font-semibold group-hover:bg-cream-light">
                    <span className="mr-2 text-xs text-ink-soft">{idx + 1}.</span>{s.name}
                  </td>
                  {[...allDates, ...(canEdit ? [customDate] : [])].map((d, k) => {
                    const gs = byCell.get(`${s.id}|${d}`) ?? [];
                    const active = sel?.sid === s.id && sel?.date === d;
                    const custom = canEdit && k === allDates.length;
                    return (
                      <td key={`${d}${k}`} className={`border-b border-ink/5 p-1 text-center ${d === today ? "bg-sky-soft/40" : ""}`}>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setSel({ sid: s.id, date: d })}
                          className={`flex min-h-9 w-full min-w-9 items-center justify-center gap-0.5 rounded-lg transition ${active ? "ring-2 ring-daisy" : canEdit ? "hover:bg-cream" : ""}`}
                          aria-label={`${s.name}, ${d}`}
                        >
                          {gs.map((g) => (
                            <span key={g.id} title={`${TYPE_LABEL[g.type]}${g.comment ? `: ${g.comment}` : ""}`} className={`grid size-7 place-items-center rounded-md text-xs font-bold text-white ${color(g.value)} ${g.type !== "dars" ? "ring-2 ring-white ring-offset-1 ring-offset-ink/20" : ""}`}>
                              {g.value}
                            </span>
                          ))}
                          {gs.length === 0 && canEdit && <span className="text-ink/15">{custom ? "+" : "·"}</span>}
                        </button>
                      </td>
                    );
                  })}
                  <td className="border-b border-ink/5 px-3 text-center font-round font-bold">{a ? a.toFixed(1) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEdit && sel && selStudent && (
        <div className="sticky bottom-4 z-20 rounded-3xl bg-night p-4 text-cream shadow-2xl animate-pop">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-round text-lg font-bold">{selStudent.name}</div>
              <div className="text-xs text-cream/70">{sel.date.split("-").reverse().join(".")}</div>
            </div>
            <button onClick={() => setSel(null)} className="rounded-xl p-2 hover:bg-white/10" aria-label="Yopish"><Icon name="x" /></button>
          </div>
          {cellGrades.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {cellGrades.map((g) => (
                <span key={g.id} className="inline-flex items-center gap-2 rounded-xl bg-white/10 py-1 pr-1 pl-2 text-sm">
                  <b>{g.value}</b> {TYPE_LABEL[g.type]}
                  {g.mine && !g.locked && (
                    <button onClick={() => remove(g.id)} disabled={pending} className="grid size-6 place-items-center rounded-lg bg-white/10 hover:bg-danger" aria-label="O'chirish"><Icon name="trash" size={13} /></button>
                  )}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as GradeType)} className="rounded-xl bg-white/10 px-3 py-2 text-sm text-cream" aria-label="Baho turi">
              <option value="dars" className="text-ink">Darsdagi javob</option>
              <option value="nazorat" className="text-ink">Nazorat ishi</option>
              <option value="uy_ishi" className="text-ink">Uy ishi</option>
              <option value="test" className="text-ink">Test</option>
            </select>
            <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={200} placeholder="Izoh (ixtiyoriy)" className="min-w-40 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-cream placeholder:text-cream/50" />
            <div className="flex gap-1.5">
              {[5, 4, 3, 2].map((v) => (
                <button key={v} disabled={pending} onClick={() => put(v)} className={`size-11 rounded-xl font-round text-lg font-bold text-white transition hover:scale-105 disabled:opacity-50 ${color(v)}`}>{v}</button>
              ))}
            </div>
          </div>
          {error && <p className="mt-2 text-sm font-semibold text-daisy">{error}</p>}
        </div>
      )}
    </div>
  );
}
