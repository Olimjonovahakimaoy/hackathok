import Link from "next/link";
import type { Metadata } from "next";
import { getAdminCtx } from "@/lib/context";
import { classLabel, pendingReviews, sortedClasses, studentsOf, teacherClasses } from "@/lib/access";
import { classAttendanceRate, classesLeaderboard } from "@/lib/stats";
import { addDays, fmtDateTime, fmtDay, isSchoolDay, localDate } from "@/lib/dates";
import { Avatar, ProgressBar, Section, StatTile, cx } from "@/components/ui";

export const metadata: Metadata = { title: "Boshqaruv paneli" };

export default async function AdminHome() {
  const { db } = await getAdminCtx();
  const today = localDate();
  let lastDay = today;
  while (!isSchoolDay(lastDay)) lastDay = addDays(lastDay, -1);
  const count = (r: string) => db.users.filter((u) => u.role === r).length;
  const classes = sortedClasses(db);
  const attRows = classes.map((c) => ({ c, rate: classAttendanceRate(db, c.id, lastDay), marked: db.attendance.some((a) => a.classId === c.id && a.date === lastDay) }));
  const marked = attRows.filter((r) => r.marked);
  const schoolAtt = marked.length ? Math.round(marked.reduce((a, r) => a + (r.rate ?? 0), 0) / marked.length) : null;
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const teachers = db.users
    .filter((u) => u.role === "teacher")
    .map((t) => ({
      t,
      classes: teacherClasses(db, t.id).length,
      pending: pendingReviews(db, t.id).length,
      given: db.assignments.filter((a) => a.teacherId === t.id && a.createdAt >= weekAgo).length,
      graded: db.grades.filter((g) => g.teacherId === t.id && g.createdAt >= weekAgo).length,
    }))
    .sort((a, b) => b.pending - a.pending);
  const leaders = classesLeaderboard(db).slice(0, 5);
  const activeStudents = db.users.filter((u) => u.role === "student" && u.lastLoginAt && u.lastLoginAt >= weekAgo).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-ink-soft">{fmtDay(today, { weekday: true })}</p>
        <h1 className="font-round text-3xl font-bold tracking-tight sm:text-4xl">{db.school.name}</h1>
      </header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile tone="sky" label="O'quvchilar" value={count("student")} hint={`${classes.length} ta sinf · ${activeStudents} faol (7 kun)`} icon="users" />
        <StatTile tone="green" label="Ustozlar" value={count("teacher")} hint={`${count("parent")} ota-ona hisobi`} icon="school" />
        <StatTile tone="daisy" label="Davomat" value={schoolAtt === null ? "—" : `${schoolAtt}%`} hint={`${fmtDay(lastDay)} · ${marked.length}/${classes.length} sinf belgilagan`} icon="calendar" />
        <StatTile tone="white" label="Topshiriqlar" value={db.submissions.length} hint={`${db.submissions.filter((s) => s.status === "submitted").length} ta tekshirilmagan`} icon="clipboard" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Ustozlar faolligi (7 kun)">
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead><tr><th>Ustoz</th><th className="text-center">Sinf</th><th className="text-center">Vazifa</th><th className="text-center">Baho</th><th className="text-center">Tekshirilmagan</th></tr></thead>
              <tbody>
                {teachers.map(({ t, classes: c, pending, given, graded }) => (
                  <tr key={t.id}>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <Avatar user={t} size={32} />
                        <span><span className="block text-sm font-semibold">{t.lastName} {t.firstName}</span><span className="text-xs text-ink-soft">{t.lastLoginAt ? `kirgan: ${fmtDateTime(t.lastLoginAt)}` : "hali kirmagan"}</span></span>
                      </span>
                    </td>
                    <td className="text-center">{c}</td>
                    <td className="text-center">{given}</td>
                    <td className="text-center">{graded}</td>
                    <td className="text-center"><span className={cx("chip", pending > 15 ? "bg-danger/10 text-danger" : pending ? "bg-warn/15 text-[#8a5a00]" : "bg-green-soft text-green-dark")}>{pending}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <div className="space-y-6">
          <Section title={`Davomat · ${fmtDay(lastDay)}`}>
            <ul className="space-y-2.5">
              {attRows.map(({ c, rate, marked: m }) => (
                <li key={c.id} className="flex items-center gap-3">
                  <Link href={`/admin/classes/${c.id}`} className="w-12 font-round font-bold hover:underline">{classLabel(c)}</Link>
                  <div className="flex-1">{m ? <ProgressBar value={rate ?? 0} tone={(rate ?? 0) >= 90 ? "green" : "daisy"} /> : <span className="text-xs font-semibold text-danger">belgilanmagan</span>}</div>
                  <span className="w-10 text-right text-sm font-semibold">{m ? `${rate}%` : ""}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Eng yaxshi sinflar" action={<Link href="/admin/rating" className="text-sm font-semibold text-sky hover:underline">Reyting</Link>}>
            <ol className="space-y-2">
              {leaders.map((l, i) => (
                <li key={l.cls.id} className="flex items-center justify-between rounded-xl bg-cream-light px-3 py-2 text-sm">
                  <span className="font-semibold">{["🥇", "🥈", "🥉", "4.", "5."][i]} {classLabel(l.cls)} <span className="font-normal text-ink-soft">· {studentsOf(db, l.cls.id).length} o&apos;quvchi</span></span>
                  <span className="font-round font-bold">{l.avg}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}
