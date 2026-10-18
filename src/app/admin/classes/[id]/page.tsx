import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminCtx } from "@/lib/context";
import { classLabel, classSubjects, idx, parentsOf, sortedClasses, studentsOf } from "@/lib/access";
import { computeRatings, attendanceOf } from "@/lib/stats";
import { lessonTime } from "@/lib/schedule";
import { getSubject } from "@/lib/subjects";
import { HomeroomSelect, MoveStudent, RegenerateTimetable, TeachingRow } from "@/components/admin/ClassManage";
import { ClassCardsButton, UserActions } from "@/components/admin/UserActions";
import { AvgBadge, Avatar, PageHeader, Section, cx, subjectBg } from "@/components/ui";

export const metadata: Metadata = { title: "Sinf" };
const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"];

export default async function AdminClass({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await getAdminCtx();
  const cls = idx(db).classes.get(id);
  if (!cls) notFound();
  const teachers = db.users.filter((u) => u.role === "teacher").sort((a, b) => a.lastName.localeCompare(b.lastName));
  const tOpts = teachers.map((t) => ({ id: t.id, label: `${t.lastName} ${t.firstName}${t.position ? ` — ${t.position}` : ""}` }));
  const students = studentsOf(db, cls.id);
  const ratings = computeRatings(db);
  const classOpts = sortedClasses(db).map((c) => ({ id: c.id, label: classLabel(c) }));
  const maxLessons = Math.max(...cls.timetable.map((d) => d.length), 0);

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: "/admin/classes", label: "Sinflar" }} title={`${classLabel(cls)} sinf`} subtitle={`${students.length} o'quvchi · ${cls.room ?? ""}`} action={<ClassCardsButton classId={cls.id} school={db.school.name} />} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Sinf rahbari va fan o'qituvchilari">
          <div className="mb-4">
            <span className="label">Sinf rahbari</span>
            <HomeroomSelect classId={cls.id} current={cls.homeroomTeacherId} teachers={tOpts} />
          </div>
          <ul className="divide-y divide-ink/5">
            {classSubjects(db, cls).map(({ subject, teacher }) => (
              <li key={subject.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-semibold">{subject.emoji} {subject.name}</span>
                <TeachingRow classId={cls.id} subjectId={subject.id} current={teacher?.id} teachers={tOpts} />
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Dars jadvali" action={<RegenerateTimetable classId={cls.id} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-ink-soft">#</th>
                  {DAYS.map((d) => <th key={d} className="p-1 text-left font-semibold text-ink-soft">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxLessons }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-1 align-top text-ink-soft">{i + 1}<div className="text-[10px]">{lessonTime(i).start}</div></td>
                    {cls.timetable.map((day, d) => (
                      <td key={d} className="p-1">
                        {day[i] ? <span className={cx("block rounded-lg px-2 py-1.5 font-semibold", subjectBg(day[i]), getSubject(day[i]).tone === "cream" ? "text-ink" : "text-white")}>{getSubject(day[i]).short}</span> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <Section title="O'quvchilar">
        <div className="overflow-x-auto">
          <table className="table-clean">
            <thead><tr><th>#</th><th>O&apos;quvchi</th><th>Login</th><th className="hidden md:table-cell">Ota-ona</th><th className="text-center">Baho</th><th className="hidden text-center sm:table-cell">Davomat</th><th>Sinf</th><th /></tr></thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id}>
                  <td className="text-ink-soft">{i + 1}</td>
                  <td><span className="flex items-center gap-2.5"><Avatar user={s} size={32} /><span className="font-semibold">{s.lastName} {s.firstName}</span></span></td>
                  <td className="font-mono text-sm">{s.login}</td>
                  <td className="hidden text-sm md:table-cell">{parentsOf(db, s).map((p) => <span key={p.id} className="block">{p.firstName} {p.lastName} <span className="text-xs text-ink-soft">{p.phone}</span></span>)}</td>
                  <td className="text-center"><AvgBadge value={ratings.get(s.id)?.gradeAvg ?? null} /></td>
                  <td className="hidden text-center text-sm sm:table-cell">{attendanceOf(db, s).rate}%</td>
                  <td><MoveStudent studentId={s.id} current={cls.id} classes={classOpts} /></td>
                  <td><UserActions id={s.id} name={`${s.firstName} ${s.lastName}`} school={db.school.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <p className="p-6 text-center text-sm text-ink-soft">Sinfda o&apos;quvchi yo&apos;q. <Link href="/admin/users?role=student" className="text-sky underline">Qo&apos;shish</Link></p>}
        </div>
      </Section>
    </div>
  );
}
