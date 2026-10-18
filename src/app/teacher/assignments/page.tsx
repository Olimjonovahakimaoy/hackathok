import Link from "next/link";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx, studentsOf } from "@/lib/access";
import { fmtDateTime } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { Icon } from "@/components/Icon";
import { EmptyState, KindBadge, PageHeader, Tabs } from "@/components/ui";

export const metadata: Metadata = { title: "Vazifalar" };

export default async function TeacherAssignments({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "active" } = await searchParams;
  const { user, db } = await getTeacherCtx();
  const now = new Date();
  const mine = db.assignments.filter((a) => a.teacherId === user.id);
  const active = mine.filter((a) => new Date(a.dueAt) > now).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const past = mine.filter((a) => new Date(a.dueAt) <= now).sort((a, b) => b.dueAt.localeCompare(a.dueAt));
  const list = tab === "past" ? past : active;
  const { classes, subsByAssignment } = idx(db);
  return (
    <div>
      <PageHeader title="Vazifalar" subtitle="Siz bergan barcha uy ishlari va testlar." action={<Link href="/teacher/assignments/new" className="btn-primary"><Icon name="plus" size={18} /> Vazifa berish</Link>} />
      <Tabs active={tab} tabs={[{ key: "active", label: "Faol", href: "?tab=active", count: active.length }, { key: "past", label: "Muddati o'tgan", href: "?tab=past" }]} />
      {list.length === 0 ? (
        <EmptyState title="Vazifa yo'q" action={<Link href="/teacher/assignments/new" className="btn-primary">Birinchi vazifani berish</Link>} />
      ) : (
        <div className="card overflow-x-auto p-2 sm:p-4">
          <table className="table-clean">
            <thead>
              <tr><th>Vazifa</th><th>Sinf</th><th className="hidden md:table-cell">Muddat</th><th className="text-center">Topshirdi</th><th className="text-center">Tekshirish</th></tr>
            </thead>
            <tbody>
              {list.slice(0, 100).map((a) => {
                const ss = subsByAssignment.get(a.id) ?? [];
                const total = studentsOf(db, a.classId).length;
                const pend = ss.filter((s) => s.status === "submitted").length;
                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/teacher/assignments/${a.id}`} className="flex items-center gap-2 hover:underline">
                        <span className="text-lg">{getSubject(a.subjectId).emoji}</span>
                        <span><span className="block font-semibold">{a.title}</span><KindBadge kind={a.kind} /></span>
                      </Link>
                    </td>
                    <td className="font-round font-bold">{classLabel(classes.get(a.classId))}</td>
                    <td className="hidden text-sm md:table-cell">{fmtDateTime(a.dueAt)}</td>
                    <td className="text-center text-sm font-semibold">{ss.length}/{total}</td>
                    <td className="text-center">{pend > 0 ? <span className="chip bg-daisy text-white">{pend}</span> : <span className="text-ink-soft">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
