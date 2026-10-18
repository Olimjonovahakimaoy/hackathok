import type { Database, User } from "@/lib/types";
import { avg, gradesOf } from "@/lib/stats";
import { idx, classSubjects } from "@/lib/access";
import { fmtDay } from "@/lib/dates";
import { GRADE_TYPE_LABEL } from "@/lib/grading";
import { AvgBadge, EmptyState, GradeBadge, cx, subjectBg } from "../ui";

/** O'quvchi baholari — fanlar bo'yicha jurnal ko'rinishi (o'quvchi va ota-ona uchun) */
export function GradesView({ db, student, kids }: { db: Database; student: User; kids?: boolean }) {
  const cls = idx(db).classes.get(student.classId ?? "");
  if (!cls) return null;
  const all = gradesOf(db, student.id);
  if (!all.length) return <EmptyState emoji="📓" title="Hali baholar yo'q" />;
  const subjects = classSubjects(db, cls).map(({ subject, teacher }) => {
    const gs = all.filter((g) => g.subjectId === subject.id);
    return { subject, teacher, gs, average: avg(gs.map((g) => g.value)) };
  });
  const overall = avg(all.map((g) => g.value));
  const dist = [5, 4, 3, 2].map((v) => ({ v, n: all.filter((g) => g.value === v).length }));

  return (
    <div className="space-y-5">
      <div className="card grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-4">
          <div className={cx("grid size-20 place-items-center rounded-3xl font-round text-3xl font-bold text-white", (overall ?? 0) >= 4.5 ? "bg-green" : (overall ?? 0) >= 3.5 ? "bg-sky" : "bg-daisy")}>
            {overall?.toFixed(1)}
          </div>
          <div>
            <div className="font-round text-lg font-bold">Umumiy o&apos;rtacha</div>
            <div className="text-sm text-ink-soft">{all.length} ta baho</div>
          </div>
        </div>
        <div className="flex gap-2 sm:justify-end">
          {dist.map((d) => (
            <div key={d.v} className="flex-1 rounded-2xl bg-cream-light p-3 text-center sm:max-w-24">
              <GradeBadge value={d.v} size="sm" />
              <div className="mt-1 font-round text-xl font-bold">{d.n}</div>
              <div className="text-[11px] text-ink-soft">ta</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {subjects.map(({ subject, teacher, gs, average }) => (
          <section key={subject.id} className="card">
            <div className="flex items-center gap-3">
              <span className={cx("grid size-11 place-items-center rounded-2xl text-xl", subjectBg(subject.id))}>{subject.emoji}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-round text-base font-bold">{subject.name}</h3>
                <p className="truncate text-xs text-ink-soft">{teacher ? `${teacher.firstName} ${teacher.lastName}` : "Ustoz biriktirilmagan"}</p>
              </div>
              <AvgBadge value={average} />
            </div>
            {gs.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Baho yo&apos;q</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {gs.slice(0, kids ? 12 : 20).map((g) => (
                  <li key={g.id}>
                    <GradeBadge value={g.value} size="sm" title={`${fmtDay(g.date)} · ${GRADE_TYPE_LABEL[g.type]}${g.comment ? ` · ${g.comment}` : ""}`} />
                  </li>
                ))}
              </ul>
            )}
            {gs.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-sky">Batafsil</summary>
                <ul className="mt-2 divide-y divide-ink/5">
                  {gs.slice(0, 15).map((g) => (
                    <li key={g.id} className="flex items-center gap-3 py-1.5">
                      <span className="w-16 shrink-0 text-xs text-ink-soft">{fmtDay(g.date, { short: true })}</span>
                      <span className="flex-1 truncate text-xs">{GRADE_TYPE_LABEL[g.type]}{g.comment ? ` · ${g.comment}` : ""}</span>
                      <GradeBadge value={g.value} size="sm" />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
