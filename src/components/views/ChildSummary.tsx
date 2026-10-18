import Link from "next/link";
import type { Database, User } from "@/lib/types";
import { classLabel, idx } from "@/lib/access";
import { attendanceOf, computeRatings, gradesOf } from "@/lib/stats";
import { studentAssignments, isStale } from "@/lib/assignments";
import { fmtDay, localDate, addDays } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { GRADE_TYPE_LABEL } from "@/lib/grading";
import { Avatar, GradeBadge, Notice } from "../ui";
import { Icon } from "../Icon";

/** Ota-ona uchun farzand kartasi: asosiy ko'rsatkichlar va ogohlantirishlar */
export function ChildSummary({ db, child }: { db: Database; child: User }) {
  const cls = idx(db).classes.get(child.classId ?? "");
  const r = computeRatings(db).get(child.id);
  const att = attendanceOf(db, child);
  const list = studentAssignments(db, child);
  const todo = list.filter((x) => x.status === "pending" || x.status === "returned");
  const missing = list.filter((x) => x.status === "missing" && !isStale(x));
  const grades = gradesOf(db, child.id).slice(0, 8);
  const weekAgo = addDays(localDate(), -7);
  const weekAbs = att.days.filter((d) => d.date >= weekAgo && (d.status === "absent" || d.status === "late"));
  const lowGrades = gradesOf(db, child.id).filter((g) => g.date >= weekAgo && g.value <= 2);

  return (
    <article className="card space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar user={child} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="font-round text-2xl font-bold">{child.firstName} {child.lastName}</h2>
          <p className="text-sm text-ink-soft">{classLabel(cls)} sinf · sinfda {r?.classRank ?? "—"}-o&apos;rin</p>
        </div>
        <Link href={`/parent/child/${child.id}`} className="btn-primary btn-sm">Batafsil <Icon name="arrowRight" size={14} /></Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "O'rtacha baho", v: r?.gradeAvg?.toFixed(2) ?? "—", bg: "bg-sky text-white" },
          { l: "Reyting", v: `${r?.total ?? 0}`, bg: "bg-green text-white" },
          { l: "Davomat", v: `${att.rate}%`, bg: "bg-daisy text-white" },
          { l: "Uy ishi qarzi", v: `${missing.length}`, bg: missing.length ? "bg-danger text-white" : "bg-cream text-ink" },
        ].map((t) => (
          <div key={t.l} className={`rounded-2xl p-3 ${t.bg}`}>
            <div className="text-[11px] font-semibold uppercase opacity-85">{t.l}</div>
            <div className="font-round text-2xl font-bold">{t.v}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {missing.length > 0 && <Notice tone="warn">⚠️ {missing.length} ta uy ishi muddatida topshirilmagan: {missing.slice(0, 3).map((m) => m.a.title).join(", ")}{missing.length > 3 ? "…" : ""}</Notice>}
        {weekAbs.length > 0 && <Notice tone="daisy">📅 Oxirgi 7 kunda: {weekAbs.filter((d) => d.status === "absent").length} kun kelmagan, {weekAbs.filter((d) => d.status === "late").length} marta kechikkan.</Notice>}
        {lowGrades.length > 0 && <Notice tone="warn">📉 Bu hafta {lowGrades.length} ta qoniqarsiz baho: {[...new Set(lowGrades.map((g) => getSubject(g.subjectId).name))].join(", ")}</Notice>}
        {!missing.length && !weekAbs.length && !lowGrades.length && <Notice tone="green">✅ Hammasi yaxshi: qarz yo&apos;q, darslarga qatnashmoqda.</Notice>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="label">Oxirgi baholar</div>
          <ul className="space-y-1.5">
            {grades.map((g) => (
              <li key={g.id} className="flex items-center gap-3 text-sm">
                <GradeBadge value={g.value} size="sm" />
                <span className="min-w-0 flex-1 truncate"><b>{getSubject(g.subjectId).name}</b> · {GRADE_TYPE_LABEL[g.type]}</span>
                <span className="text-xs text-ink-soft">{fmtDay(g.date, { short: true })}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="label">Bajarilishi kerak ({todo.length})</div>
          {todo.length === 0 ? (
            <p className="text-sm text-ink-soft">Hozircha yo&apos;q.</p>
          ) : (
            <ul className="space-y-1.5">
              {todo.slice(0, 6).map(({ a }) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{getSubject(a.subjectId).emoji} {a.title}</span>
                  <span className="shrink-0 text-xs text-ink-soft">{fmtDay(localDate(a.dueAt), { short: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
