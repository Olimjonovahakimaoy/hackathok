import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { deriveStatus } from "@/lib/assignments";
import { idx, submissionOf } from "@/lib/access";
import { fmtDateTime, relativeDue } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { Attachments } from "@/components/Attachments";
import { SubmissionView } from "@/components/SubmissionView";
import { HomeworkForm } from "@/components/student/HomeworkForm";
import { TestRunner } from "@/components/student/TestRunner";
import { Icon } from "@/components/Icon";
import { KindBadge, Notice, PageHeader, SubjectBadge, cx } from "@/components/ui";
import Link from "next/link";

export const metadata: Metadata = { title: "Vazifa" };

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, db, kids } = await getStudentCtx();
  const a = idx(db).assignments.get(id);
  if (!a || a.classId !== user.classId) notFound();
  const sub = submissionOf(db, a.id, user.id);
  const st = deriveStatus(a, sub);
  const due = relativeDue(a.dueAt);
  const teacher = idx(db).users.get(a.teacherId);
  const files = (sub?.fileIds ?? [])
    .map((fid) => db.files.find((f) => f.id === fid))
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ href: "/student/assignments", label: "Vazifalar" }} title={a.title} />

      <div className="card mb-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SubjectBadge subjectId={a.subjectId} />
          <KindBadge kind={a.kind} />
          <span className={cx("chip", due.tone === "late" ? "bg-danger/10 text-danger" : due.tone === "soon" ? "bg-daisy text-white" : "bg-sky-soft text-sky-dark")}>
            <Icon name="clock" size={12} /> {fmtDateTime(a.dueAt)} · {due.text}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{a.description}</p>
        <Attachments db={db} ids={a.fileIds} title="Ustoz biriktirgan fayllar" />
        <div className="flex items-center justify-between gap-3 border-t border-ink/5 pt-3 text-sm text-ink-soft">
          <span>Ustoz: <b className="text-ink">{teacher?.firstName} {teacher?.lastName}</b></span>
          {teacher && (
            <Link href={`/student/chat?with=${teacher.id}`} className="inline-flex items-center gap-1.5 font-semibold text-sky hover:underline">
              <Icon name="message" size={16} /> Savol berish
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-round text-lg font-bold">{a.kind === "test" ? "Test" : "Mening javobim"}</h2>

        {a.kind === "test" ? (
          sub ? (
            <SubmissionView db={db} a={a} sub={sub} />
          ) : st.canSubmit && a.questions?.length ? (
            <TestRunner assignmentId={a.id} kids={kids} questions={a.questions.map((q) => ({ id: q.id, text: q.text, options: q.options }))} />
          ) : (
            <Notice tone="warn">Test muddati tugagan — endi topshirib bo&apos;lmaydi.</Notice>
          )
        ) : (
          <div className="space-y-6">
            {sub && <SubmissionView db={db} a={a} sub={sub} />}
            {st.canSubmit ? (
              <div className={sub ? "border-t border-ink/10 pt-5" : ""}>
                {sub?.status === "returned" && <div className="mb-4"><Notice tone="daisy">Ustoz ishni qayta ishlashga qaytardi. Xatolarni tuzatib, qayta yuboring.</Notice></div>}
                {sub?.status === "submitted" && <p className="mb-3 text-sm font-semibold text-ink-soft">Ustoz tekshirguncha javobni o&apos;zgartirishingiz mumkin:</p>}
                {st.overdue && !sub && <div className="mb-4"><Notice tone="warn">Muddat o&apos;tgan, lekin ustoz kechiktirib topshirishga ruxsat bergan. Kechikkan ish reytingga yarim ball bilan hisoblanadi.</Notice></div>}
                <HomeworkForm assignmentId={a.id} kids={kids} initialText={sub?.text ?? ""} initialFiles={files} resubmit={!!sub} />
              </div>
            ) : (
              !sub && <Notice tone="warn">Topshirish muddati tugagan.</Notice>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
