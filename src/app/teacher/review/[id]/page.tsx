import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx, pendingReviews, teacherTeaches } from "@/lib/access";
import { fmtDateTime } from "@/lib/dates";
import { SubmissionView } from "@/components/SubmissionView";
import { ReviewPanel } from "@/components/teacher/ReviewPanel";
import { Avatar, KindBadge, PageHeader, SubjectBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Ishni tekshirish" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, db } = await getTeacherCtx();
  const sub = db.submissions.find((s) => s.id === id);
  if (!sub) notFound();
  const a = idx(db).assignments.get(sub.assignmentId);
  if (!a || !teacherTeaches(db, user.id, a.classId, a.subjectId)) notFound();
  const st = idx(db).users.get(sub.studentId)!;
  const images = sub.fileIds
    .map((fid) => db.files.find((f) => f.id === fid))
    .filter((f): f is NonNullable<typeof f> => !!f && f.mime.startsWith("image/"))
    .map((f) => ({ id: f.id, name: f.name }));
  const annotated = (sub.annotatedFileIds ?? [])
    .map((fid) => db.files.find((f) => f.id === fid))
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size }));
  const queue = pendingReviews(db, user.id);
  const pos = queue.findIndex((q) => q.id === sub.id);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/teacher/review", label: `Tekshirish navbati${queue.length ? ` (${queue.length})` : ""}` }}
        title={a.title}
        subtitle={pos >= 0 ? `Navbatda ${pos + 1}/${queue.length}` : undefined}
      />
      <div className="card flex flex-wrap items-center gap-4">
        <Avatar user={st} size={52} />
        <div className="min-w-0 flex-1">
          <div className="font-round text-lg font-bold">{st.lastName} {st.firstName}</div>
          <div className="text-sm text-ink-soft">{classLabel(idx(db).classes.get(a.classId))} sinf · topshirdi {fmtDateTime(sub.submittedAt)}</div>
        </div>
        <div className="flex flex-wrap gap-2"><SubjectBadge subjectId={a.subjectId} /><KindBadge kind={a.kind} /></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-2 font-round text-lg font-bold">Topshiriq sharti</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{a.description}</p>
        </section>
        <section className="card">
          <h2 className="mb-4 font-round text-lg font-bold">O&apos;quvchi ishi</h2>
          <SubmissionView db={db} a={a} sub={sub} />
        </section>
      </div>
      <ReviewPanel submissionId={sub.id} images={images} isTest={a.kind === "test"} initial={{ grade: sub.grade, feedback: sub.feedback === "Test avtomatik tekshirildi." ? "" : sub.feedback, mistakes: sub.mistakes, annotated }} />
    </div>
  );
}
