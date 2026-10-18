import Link from "next/link";
import type { Database } from "@/lib/types";
import { classLabel, studentsOf, pendingReviews, idx, type TeacherClass } from "@/lib/access";
import { classAttendanceRate, computeRatings } from "@/lib/stats";
import { getSubject } from "@/lib/subjects";
import { localDate } from "@/lib/dates";
import { cx } from "../ui";

const BG = ["bg-green", "bg-sky", "bg-daisy"];

export function ClassCards({ db, teacherId, classes }: { db: Database; teacherId: string; classes: TeacherClass[] }) {
  const ratings = computeRatings(db);
  const pending = pendingReviews(db, teacherId);
  const { assignments } = idx(db);
  const today = localDate();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {classes.map(({ cls, subjectIds, homeroom }, i) => {
        const students = studentsOf(db, cls.id);
        const avg = students.length ? students.reduce((a, s) => a + (ratings.get(s.id)?.total ?? 0), 0) / students.length : 0;
        const att = classAttendanceRate(db, cls.id, today);
        const pend = pending.filter((p) => assignments.get(p.assignmentId)?.classId === cls.id).length;
        return (
          <Link key={cls.id} href={`/teacher/classes/${cls.id}`} className="group card flex flex-col gap-4 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className={cx("grid size-16 place-items-center rounded-2xl font-display text-2xl text-cream", BG[i % 3])}>{classLabel(cls)}</div>
              <div className="flex flex-col items-end gap-1">
                {homeroom && <span className="chip bg-night text-cream">Sinf rahbari</span>}
                {pend > 0 && <span className="chip bg-daisy text-white">{pend} ta tekshirish</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subjectIds.map((s) => (
                <span key={s} className="chip bg-cream text-ink">{getSubject(s).emoji} {getSubject(s).name}</span>
              ))}
            </div>
            <dl className="grid grid-cols-3 gap-2 border-t border-ink/5 pt-3 text-center">
              <div><dt className="text-[11px] font-semibold text-ink-soft uppercase">O&apos;quvchi</dt><dd className="font-round text-xl font-bold">{students.length}</dd></div>
              <div><dt className="text-[11px] font-semibold text-ink-soft uppercase">Reyting</dt><dd className="font-round text-xl font-bold">{avg.toFixed(1)}</dd></div>
              <div><dt className="text-[11px] font-semibold text-ink-soft uppercase">Bugun</dt><dd className="font-round text-xl font-bold">{att === null ? "—" : `${att}%`}</dd></div>
            </dl>
          </Link>
        );
      })}
    </div>
  );
}
