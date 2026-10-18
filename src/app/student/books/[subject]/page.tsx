import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { classSubjects, idx } from "@/lib/access";
import { lessonsFor } from "@/lib/lessons";
import { fmtDay, localDate } from "@/lib/dates";
import { Attachments } from "@/components/Attachments";
import { Icon } from "@/components/Icon";
import { EmptyState, PageHeader, cx, subjectBg } from "@/components/ui";

export const metadata: Metadata = { title: "Fan" };

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: sid } = await params;
  const { db, cls, kids } = await getStudentCtx();
  const entry = classSubjects(db, cls).find((s) => s.subject.id === sid);
  if (!entry) notFound();
  const lessons = lessonsFor(sid, cls.grade);
  const materials = db.materials.filter((m) => m.classId === cls.id && m.subjectId === sid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const users = idx(db).users;

  return (
    <div>
      <PageHeader back={{ href: "/student/books", label: "Darsliklar" }} title={`${entry.subject.emoji} ${entry.subject.name}`} subtitle={entry.teacher ? `Ustoz: ${entry.teacher.firstName} ${entry.teacher.lastName}` : undefined} />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className="on-bg mb-3 font-round text-lg font-bold">Mavzular</h2>
          {lessons.length === 0 ? (
            <EmptyState emoji="📖" title="Bu sinf uchun mavzular hali qo'shilmagan" text="Ustozingiz materiallar bo'limiga darslik qo'shadi." />
          ) : (
            <ol className="space-y-3">
              {lessons.map((l, i) => (
                <li key={l.id}>
                  <Link href={`/student/books/${sid}/${l.id}`} className="card flex items-center gap-4 transition hover:-translate-y-0.5">
                    <span className={cx("grid size-12 shrink-0 place-items-center rounded-2xl font-round text-lg font-bold text-white", subjectBg(sid))}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-round font-bold">{l.title}</span>
                      <span className="block text-sm text-ink-soft">{l.intro}</span>
                    </span>
                    <span className="hidden shrink-0 text-xs font-semibold text-ink-soft sm:block">{l.minutes} daq · {l.quiz.length} savol</span>
                    <Icon name="arrowRight" size={18} className="shrink-0 text-ink-soft" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h2 className="on-bg mb-3 font-round text-lg font-bold">Ustoz materiallari</h2>
          {materials.length === 0 ? (
            <div className="card text-sm text-ink-soft">Hozircha material yo&apos;q.</div>
          ) : (
            <ul className="space-y-3">
              {materials.map((m) => {
                const fresh = localDate(m.createdAt) >= localDate(new Date(Date.now() - 3 * 864e5));
                return (
                  <li key={m.id} className="card">
                    <details open={fresh}>
                      <summary className="flex cursor-pointer list-none items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-daisy-soft text-daisy-dark"><Icon name="file" size={20} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{m.title} {fresh && <span className="chip ml-1 bg-daisy text-white">yangi</span>}</span>
                          <span className="text-xs text-ink-soft">{users.get(m.teacherId)?.lastName} · {fmtDay(localDate(m.createdAt))}</span>
                        </span>
                      </summary>
                      <div className={cx("mt-3 space-y-3 border-t border-ink/5 pt-3", kids && "text-base")}>
                        {m.body && <p className="prose-lesson whitespace-pre-wrap text-sm">{m.body}</p>}
                        <Attachments db={db} ids={m.fileIds} />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
