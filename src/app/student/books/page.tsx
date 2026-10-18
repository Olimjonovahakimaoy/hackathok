import Link from "next/link";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { classSubjects } from "@/lib/access";
import { lessonsFor } from "@/lib/lessons";
import { PageHeader, cx, subjectBg } from "@/components/ui";

export const metadata: Metadata = { title: "Darsliklar" };

export default async function BooksPage() {
  const { db, cls, kids } = await getStudentCtx();
  const subjects = classSubjects(db, cls).map(({ subject, teacher }) => ({
    subject,
    teacher,
    lessons: lessonsFor(subject.id, cls.grade).length,
    materials: db.materials.filter((m) => m.classId === cls.id && m.subjectId === subject.id).length,
  }));
  return (
    <div>
      <PageHeader
        title={kids ? "Darsliklarim 📚" : "Onlayn darsliklar"}
        subtitle="Kitob ko'tarib yurish shart emas: mavzular, ustoz materiallari va o'z-o'zini tekshirish testlari shu yerda."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {subjects.map(({ subject, teacher, lessons, materials }) => (
          <Link
            key={subject.id}
            href={`/student/books/${subject.id}`}
            className={cx(
              "group relative overflow-hidden rounded-[1.75rem] p-5 shadow-[0_6px_0_rgba(10,52,116,0.18)] transition hover:-translate-y-1",
              subjectBg(subject.id),
            )}
          >
            <div className="text-4xl transition group-hover:scale-110">{subject.emoji}</div>
            <div className={cx("mt-4 font-round text-lg leading-tight font-bold", subject.tone === "cream" ? "text-ink" : "text-white")}>{subject.name}</div>
            <div className={cx("mt-1 text-xs font-semibold", subject.tone === "cream" ? "text-ink-soft" : "text-white/85")}>
              {lessons} mavzu{materials ? ` · ${materials} material` : ""}
            </div>
            {teacher && !kids && <div className={cx("mt-2 truncate text-xs", subject.tone === "cream" ? "text-ink-soft" : "text-white/75")}>{teacher.firstName} {teacher.lastName}</div>}
            <span className="absolute -right-6 -bottom-6 size-24 rounded-full bg-white/10" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
