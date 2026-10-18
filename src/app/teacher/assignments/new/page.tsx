import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel } from "@/lib/access";
import { addDays, localDate } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { AssignmentForm } from "@/components/teacher/AssignmentForm";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Vazifa berish" };

export default async function NewAssignment({ searchParams }: { searchParams: Promise<{ classId?: string; subjectId?: string }> }) {
  const { classId, subjectId } = await searchParams;
  const { classes } = await getTeacherCtx();
  const teachings = classes.flatMap(({ cls, subjectIds }) => subjectIds.map((s) => ({ classId: cls.id, label: classLabel(cls), subjectId: s })));
  const subjects = [...new Set(teachings.map((t) => t.subjectId))].map((s) => ({ id: s, name: getSubject(s).name, emoji: getSubject(s).emoji }));
  return (
    <div>
      <PageHeader back={{ href: "/teacher/assignments", label: "Vazifalar" }} title="Yangi vazifa" subtitle="Uy ishi, sinf ishi yoki avtomatik tekshiriladigan test." />
      {teachings.length === 0 ? (
        <EmptyState title="Sizga fan biriktirilmagan" />
      ) : (
        <AssignmentForm teachings={teachings} subjects={subjects} defaultClassId={classId} defaultSubjectId={subjectId} tomorrow={addDays(localDate(), 1)} />
      )}
    </div>
  );
}
