import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx, teacherCanSeeStudent } from "@/lib/access";
import { StudentProfile } from "@/components/views/StudentProfile";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "O'quvchi" };

export default async function TeacherStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, db } = await getTeacherCtx();
  const s = idx(db).users.get(id);
  if (!s || s.role !== "student" || !teacherCanSeeStudent(db, user.id, s.id)) notFound();
  const cls = idx(db).classes.get(s.classId!);
  return (
    <div>
      <PageHeader back={{ href: `/teacher/classes/${s.classId}`, label: `${classLabel(cls)} sinf` }} title={`${s.firstName} ${s.lastName}`} />
      <StudentProfile db={db} student={s} chatBase="/teacher/chat" submissionBase="/teacher/review" />
    </div>
  );
}
