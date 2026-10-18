import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx, studentsOf, teacherTeaches } from "@/lib/access";
import { fmtDateTime, relativeDue } from "@/lib/dates";
import { Attachments } from "@/components/Attachments";
import { AssignmentActions } from "@/components/teacher/AssignmentActions";
import { Avatar, GradeBadge, KindBadge, PageHeader, ProgressBar, Section, StatTile, StatusBadge, SubjectBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Vazifa" };

export default async function TeacherAssignment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, db } = await getTeacherCtx();
  const a = idx(db).assignments.get(id);
  if (!a || (!teacherTeaches(db, user.id, a.classId, a.subjectId) && idx(db).classes.get(a.classId)?.homeroomTeacherId !== user.id)) notFound();
  const cls = idx(db).classes.get(a.classId);
  const students = studentsOf(db, a.classId);
  const subs = idx(db).subsByAssignment.get(a.id) ?? [];
  const byStudent = new Map(subs.map((s) => [s.studentId, s]));
  const graded = subs.filter((s) => s.status === "graded");
  const avgGrade = graded.length ? graded.reduce((x, s) => x + (s.grade ?? 0), 0) / graded.length : null;
  const due = relativeDue(a.dueAt);
  const canReview = teacherTeaches(db, user.id, a.classId, a.subjectId);

  const qStats = a.kind === "test" && a.questions
    ? a.questions.map((q, i) => {
        const answered = subs.filter((s) => s.answers);
        const ok = answered.filter((s) => s.answers![i] === q.correct).length;
        return { q, pct: answered.length ? Math.round((ok / answered.length) * 100) : 0 };
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: "/teacher/assignments", label: "Vazifalar" }} title={a.title} subtitle={`${classLabel(cls)} sinf · muddat ${fmtDateTime(a.dueAt)} (${due.text})`} action={<AssignmentActions id={a.id} canEdit={a.teacherId === user.id} />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile tone="sky" label="Topshirdi" value={`${subs.length}/${students.length}`} hint={`${subs.filter((s) => s.late).length} ta kechikkan`} />
        <StatTile tone="daisy" label="Tekshirish kerak" value={subs.filter((s) => s.status === "submitted").length} />
        <StatTile tone="green" label="Baholangan" value={graded.length} />
        <StatTile tone="white" label="O'rtacha baho" value={avgGrade ? avgGrade.toFixed(2) : "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Section title="Topshiriq">
            <div className="mb-3 flex flex-wrap gap-2"><SubjectBadge subjectId={a.subjectId} /><KindBadge kind={a.kind} />{a.allowLate && <span className="chip bg-cream text-ink">kechiktirish mumkin</span>}</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{a.description || "—"}</p>
            <div className="mt-4"><Attachments db={db} ids={a.fileIds} /></div>
          </Section>
          {qStats.length > 0 && (
            <Section title="Savollar tahlili">
              <ol className="space-y-3">
                {qStats.map(({ q, pct }, i) => (
                  <li key={q.id}>
                    <div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-semibold">{i + 1}. {q.text}</span><span className="shrink-0 text-ink-soft">{pct}% to&apos;g&apos;ri</span></div>
                    <ProgressBar value={pct} tone={pct >= 70 ? "green" : pct >= 40 ? "sky" : "daisy"} />
                    <div className="mt-1 text-xs text-ink-soft">To&apos;g&apos;ri javob: {q.options[q.correct]}</div>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        <Section title="O'quvchilar">
          <ul className="divide-y divide-ink/5">
            {students.map((s) => {
              const sub = byStudent.get(s.id);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Avatar user={s} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.lastName} {s.firstName}</span>
                    <span className="text-xs text-ink-soft">{sub ? fmtDateTime(sub.submittedAt) : "topshirmagan"}{sub?.score !== undefined && sub.maxScore ? ` · ${sub.score}/${sub.maxScore}` : ""}</span>
                  </span>
                  <StatusBadge status={sub ? sub.status : new Date(a.dueAt) < new Date() ? "missing" : "pending"} late={sub?.late} />
                  {sub?.grade && <GradeBadge value={sub.grade} size="sm" />}
                  {sub && canReview && (
                    <Link href={`/teacher/review/${sub.id}`} className={sub.status === "submitted" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
                      {sub.status === "submitted" ? "Tekshirish" : "Ko'rish"}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </div>
  );
}
