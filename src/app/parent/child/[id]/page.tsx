import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParentCtx } from "@/lib/context";
import { classLabel, classSubjects, idx } from "@/lib/access";
import { studentAssignments, isStale } from "@/lib/assignments";
import { fmtDateTime } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { scheduleFor } from "@/lib/schedule";
import { fmtDay } from "@/lib/dates";
import { GradesView } from "@/components/views/GradesView";
import { AttendanceView } from "@/components/views/AttendanceView";
import { RatingView } from "@/components/views/RatingView";
import { ChildSummary } from "@/components/views/ChildSummary";
import { Icon } from "@/components/Icon";
import { GradeBadge, KindBadge, PageHeader, Section, StatusBadge, Tabs } from "@/components/ui";

export const metadata: Metadata = { title: "Farzandim" };

export default async function ChildPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; stage?: string; rtab?: string }> }) {
  const { id } = await params;
  const { tab = "overview", stage, rtab = "class" } = await searchParams;
  const { db, children } = await getParentCtx();
  const child = children.find((c) => c.id === id);
  if (!child) notFound();
  const cls = idx(db).classes.get(child.classId!)!;
  const base = `/parent/child/${child.id}`;

  let body: React.ReactNode;
  if (tab === "grades") body = <GradesView db={db} student={child} />;
  else if (tab === "attendance") body = <AttendanceView db={db} student={child} />;
  else if (tab === "rating") body = <RatingView db={db} student={child} tab={rtab} stage={stage} basePath={`${base}?tab=rating`} param="rtab" />;
  else if (tab === "assignments") {
    const list = studentAssignments(db, child).filter((x) => !(x.status === "missing" && isStale(x))).slice(0, 60);
    body = (
      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="table-clean">
          <thead><tr><th>Vazifa</th><th className="hidden sm:table-cell">Muddat</th><th>Holat</th><th className="text-center">Baho</th></tr></thead>
          <tbody>
            {list.map(({ a, sub, status }) => (
              <tr key={a.id}>
                <td>
                  <Link href={`${base}/assignments/${a.id}`} className="hover:underline">
                    <span className="block font-semibold">{getSubject(a.subjectId).emoji} {a.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-soft">{getSubject(a.subjectId).name} <KindBadge kind={a.kind} /></span>
                  </Link>
                </td>
                <td className="hidden text-sm sm:table-cell">{fmtDateTime(a.dueAt)}</td>
                <td><StatusBadge status={status} late={sub?.late} /></td>
                <td className="text-center">{sub?.grade ? <GradeBadge value={sub.grade} size="sm" /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else {
    const sch = scheduleFor(cls);
    body = (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChildSummary db={db} child={child} />
        <div className="space-y-6">
          <Section title={sch.isToday ? "Bugungi darslar" : `${fmtDay(sch.day, { weekday: true })} darslari`}>
            <ol className="space-y-1.5 text-sm">
              {sch.lessons.map((l, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-cream-light px-3 py-2">
                  <span className="w-24 text-xs text-ink-soft">{l.start}–{l.end}</span>
                  <span className="font-semibold">{getSubject(l.subjectId).emoji} {getSubject(l.subjectId).name}</span>
                </li>
              ))}
            </ol>
          </Section>
          <Section title="Ustozlar">
            <ul className="space-y-2">
              {classSubjects(db, cls).filter((x) => x.teacher).map(({ subject, teacher }) => (
                <li key={subject.id} className="flex items-center justify-between gap-2 text-sm">
                  <span><b>{subject.name}</b> · {teacher!.firstName} {teacher!.lastName}</span>
                  <Link href={`/parent/chat?with=${teacher!.id}`} className="text-sky hover:underline" aria-label={`${teacher!.firstName} ga yozish`}><Icon name="message" size={18} /></Link>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader back={{ href: "/parent", label: "Farzandlarim" }} title={`${child.firstName} ${child.lastName}`} subtitle={`${classLabel(cls)} sinf`} />
      <Tabs
        active={tab}
        tabs={[
          { key: "overview", label: "Umumiy", href: `${base}?tab=overview` },
          { key: "grades", label: "Baholar", href: `${base}?tab=grades` },
          { key: "assignments", label: "Uy ishlari", href: `${base}?tab=assignments` },
          { key: "attendance", label: "Davomat", href: `${base}?tab=attendance` },
          { key: "rating", label: "Reyting", href: `${base}?tab=rating` },
        ]}
      />
      {body}
    </div>
  );
}
