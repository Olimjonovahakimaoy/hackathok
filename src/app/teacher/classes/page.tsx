import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { ClassCards } from "@/components/teacher/ClassCards";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Sinflarim" };

export default async function ClassesPage() {
  const { user, db, classes } = await getTeacherCtx();
  return (
    <div>
      <PageHeader title="Sinflarim" subtitle="Siz dars beradigan va rahbarlik qiladigan barcha sinflar." />
      {classes.length ? <ClassCards db={db} teacherId={user.id} classes={classes} /> : <EmptyState title="Sizga hali sinf biriktirilmagan" text="Ma'muriyatga murojaat qiling." />}
    </div>
  );
}
