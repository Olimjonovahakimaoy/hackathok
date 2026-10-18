import Link from "next/link";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel } from "@/lib/access";
import { ClassBoard, ClassesBoard } from "@/components/views/RatingView";
import { PageHeader, Tabs } from "@/components/ui";

export const metadata: Metadata = { title: "Reyting" };

export default async function TeacherRating({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "school" } = await searchParams;
  const { db, classes } = await getTeacherCtx();
  const sel = classes.find((c) => c.cls.id === tab);
  return (
    <div>
      <PageHeader title="Reyting" subtitle="Baholar (50) + uy ishlari (30) + vazifa natijalari (20) = 100 ball." />
      <Tabs active={tab} tabs={[{ key: "school", label: "Sinflar bellashuvi", href: "?tab=school" }, ...classes.map((c) => ({ key: c.cls.id, label: classLabel(c.cls), href: `?tab=${c.cls.id}` }))]} />
      {sel ? <ClassBoard db={db} classId={sel.cls.id} linkBase="/teacher/students" /> : <ClassesBoard db={db} />}
      {!sel && <p className="mt-4 text-sm text-ink-soft">Sinf ichidagi reytingni ko&apos;rish uchun yuqoridan sinfni tanlang yoki <Link className="text-sky underline" href="/teacher/classes">sinflarim</Link> sahifasiga o&apos;ting.</p>}
    </div>
  );
}
