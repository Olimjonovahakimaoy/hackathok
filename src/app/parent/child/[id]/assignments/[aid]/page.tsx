import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParentCtx } from "@/lib/context";
import { idx, submissionOf } from "@/lib/access";
import { fmtDateTime } from "@/lib/dates";
import { Attachments } from "@/components/Attachments";
import { SubmissionView } from "@/components/SubmissionView";
import { KindBadge, Notice, PageHeader, SubjectBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Vazifa" };

export default async function ParentAssignment({ params }: { params: Promise<{ id: string; aid: string }> }) {
  const { id, aid } = await params;
  const { db, children } = await getParentCtx();
  const child = children.find((c) => c.id === id);
  const a = idx(db).assignments.get(aid);
  if (!child || !a || a.classId !== child.classId) notFound();
  const sub = submissionOf(db, a.id, child.id);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader back={{ href: `/parent/child/${child.id}?tab=assignments`, label: "Uy ishlari" }} title={a.title} subtitle={`Muddat: ${fmtDateTime(a.dueAt)}`} />
      <div className="card space-y-3">
        <div className="flex flex-wrap gap-2"><SubjectBadge subjectId={a.subjectId} /><KindBadge kind={a.kind} /></div>
        <p className="whitespace-pre-wrap text-sm">{a.description}</p>
        <Attachments db={db} ids={a.fileIds} />
      </div>
      <div className="card">
        <h2 className="mb-4 font-round text-lg font-bold">{child.firstName}ning javobi</h2>
        {sub ? <SubmissionView db={db} a={a} sub={sub} /> : <Notice tone={new Date(a.dueAt) < new Date() ? "warn" : "sky"}>{new Date(a.dueAt) < new Date() ? "Topshirilmagan." : "Hali topshirilmagan — muddat tugamagan."}</Notice>}
      </div>
    </div>
  );
}
