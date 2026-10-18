import Link from "next/link";
import type { Metadata } from "next";
import { getAdminCtx } from "@/lib/context";
import { classLabel } from "@/lib/access";
import { schoolRating } from "@/lib/stats";
import { ClassesBoard } from "@/components/views/RatingView";
import { AvgBadge, Avatar, PageHeader, RankMedal, Tabs } from "@/components/ui";

export const metadata: Metadata = { title: "Reyting" };

export default async function AdminRating({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "classes" } = await searchParams;
  const { db } = await getAdminCtx();
  const filter = tab === "primary" ? (c: { grade: number }) => c.grade <= 4 : tab === "upper" ? (c: { grade: number }) => c.grade >= 5 : undefined;
  const list = schoolRating(db, filter).slice(0, 50);
  return (
    <div>
      <PageHeader title="Maktab reytingi" subtitle="Baholar (50) + uy ishlari (30) + vazifa natijalari (20)." />
      <Tabs active={tab} tabs={[{ key: "classes", label: "Sinflar", href: "?tab=classes" }, { key: "all", label: "Barcha o'quvchilar", href: "?tab=all" }, { key: "primary", label: "1–4 sinflar", href: "?tab=primary" }, { key: "upper", label: "5–11 sinflar", href: "?tab=upper" }]} />
      {tab === "classes" ? (
        <ClassesBoard db={db} />
      ) : (
        <div className="card overflow-x-auto p-2 sm:p-4">
          <table className="table-clean">
            <thead><tr><th>O&apos;rin</th><th>O&apos;quvchi</th><th>Sinf</th><th className="text-center">O&apos;rt. baho</th><th className="text-right">Ball</th></tr></thead>
            <tbody>
              {list.map(({ student, cls, row }, i) => (
                <tr key={student.id}>
                  <td><RankMedal rank={i + 1} /></td>
                  <td><span className="flex items-center gap-2.5"><Avatar user={student} size={32} /><span className="font-semibold">{student.lastName} {student.firstName}</span></span></td>
                  <td><Link href={`/admin/classes/${cls.id}`} className="font-round font-bold hover:underline">{classLabel(cls)}</Link></td>
                  <td className="text-center"><AvgBadge value={row.gradeAvg} /></td>
                  <td className="text-right font-round text-lg font-bold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
