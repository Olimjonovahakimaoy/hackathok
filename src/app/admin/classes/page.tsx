import Link from "next/link";
import type { Metadata } from "next";
import { getAdminCtx } from "@/lib/context";
import { classLabel, classSubjects, idx, sortedClasses, studentsOf } from "@/lib/access";
import { NewClassForm } from "@/components/admin/ClassManage";
import { PageHeader, cx } from "@/components/ui";

export const metadata: Metadata = { title: "Sinflar" };

export default async function AdminClasses() {
  const { db } = await getAdminCtx();
  const teachers = db.users.filter((u) => u.role === "teacher").sort((a, b) => a.lastName.localeCompare(b.lastName)).map((t) => ({ id: t.id, label: `${t.lastName} ${t.firstName}` }));
  return (
    <div>
      <PageHeader title="Sinflar va darslar" subtitle="Sinf rahbarlari, fan o'qituvchilari va dars jadvali." />
      <div className="mb-5"><NewClassForm teachers={teachers} /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedClasses(db).map((c, i) => {
          const subs = classSubjects(db, c);
          const missing = subs.filter((s) => !s.teacher).length;
          const hr = idx(db).users.get(c.homeroomTeacherId ?? "");
          return (
            <Link key={c.id} href={`/admin/classes/${c.id}`} className="card flex items-center gap-4 transition hover:-translate-y-0.5">
              <span className={cx("grid size-16 shrink-0 place-items-center rounded-2xl font-display text-2xl text-cream", ["bg-green", "bg-sky", "bg-daisy"][i % 3])}>{classLabel(c)}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{studentsOf(db, c.id).length} o&apos;quvchi · {subs.length} fan</span>
                <span className="block truncate text-sm text-ink-soft">Rahbar: {hr ? `${hr.firstName} ${hr.lastName}` : "—"}</span>
                {missing > 0 && <span className="chip mt-1 bg-daisy-soft text-daisy-dark">{missing} fanga ustoz yo&apos;q</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
