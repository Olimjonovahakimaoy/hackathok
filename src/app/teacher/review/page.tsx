import Link from "next/link";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx, pendingReviews } from "@/lib/access";
import { fmtDateTime } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { Icon } from "@/components/Icon";
import { Avatar, EmptyState, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Tekshirish" };

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ done?: string; class?: string }> }) {
  const { done, class: classFilter } = await searchParams;
  const { user, db, classes } = await getTeacherCtx();
  const { users, assignments, classes: cmap } = idx(db);
  const all = pendingReviews(db, user.id);
  const list = classFilter ? all.filter((s) => assignments.get(s.assignmentId)?.classId === classFilter) : all;
  return (
    <div>
      <PageHeader title="Tekshirish" subtitle="Eng birinchi topshirilganlardan boshlab. Baholagach keyingi ish avtomatik ochiladi." />
      {done && <div className="mb-4"><Notice tone="green">Barcha ishlar tekshirildi! 🎉</Notice></div>}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/teacher/review" className={`chip px-3 py-1.5 text-sm ${!classFilter ? "bg-night text-cream" : "bg-white"}`}>Hammasi ({all.length})</Link>
        {classes.map(({ cls }) => {
          const n = all.filter((s) => assignments.get(s.assignmentId)?.classId === cls.id).length;
          return n ? <Link key={cls.id} href={`/teacher/review?class=${cls.id}`} className={`chip px-3 py-1.5 text-sm ${classFilter === cls.id ? "bg-night text-cream" : "bg-white"}`}>{classLabel(cls)} ({n})</Link> : null;
        })}
      </div>
      {list.length === 0 ? (
        <EmptyState emoji="✅" title="Tekshiriladigan ish yo'q" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((s) => {
            const a = assignments.get(s.assignmentId)!;
            const st = users.get(s.studentId)!;
            return (
              <li key={s.id}>
                <Link href={`/teacher/review/${s.id}`} className="card flex items-center gap-4 transition hover:-translate-y-0.5">
                  <Avatar user={st} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{st.lastName} {st.firstName} <span className="text-ink-soft">· {classLabel(cmap.get(a.classId))}</span></span>
                    <span className="block truncate text-sm text-ink-soft">{getSubject(a.subjectId).emoji} {a.title}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                      {fmtDateTime(s.submittedAt)}
                      {s.fileIds.length > 0 && <span className="inline-flex items-center gap-1"><Icon name="image" size={12} /> {s.fileIds.length}</span>}
                      {s.late && <span className="chip bg-warn/15 text-[#8a5a00]">kechikkan</span>}
                      {s.attempts > 1 && <span className="chip bg-daisy-soft text-daisy-dark">{s.attempts}-urinish</span>}
                    </span>
                  </span>
                  <Icon name="arrowRight" className="text-ink-soft" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
