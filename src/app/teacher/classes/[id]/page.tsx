import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx, parentsOf, studentsOf } from "@/lib/access";
import { addDays, ageFrom, fmtDateTime, fmtDay, isSchoolDay, localDate, weekday } from "@/lib/dates";
import { attendanceOf, computeRatings } from "@/lib/stats";
import { getSubject } from "@/lib/subjects";
import { JournalGrid } from "@/components/teacher/JournalGrid";
import { AttendanceSheet } from "@/components/teacher/AttendanceSheet";
import { ClassBoard } from "@/components/views/RatingView";
import { Icon } from "@/components/Icon";
import { AvgBadge, Avatar, EmptyState, KindBadge, Notice, PageHeader, Tabs, cx } from "@/components/ui";

export const metadata: Metadata = { title: "Sinf" };

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; subject?: string; date?: string }> }) {
  const { id } = await params;
  const { tab = "students", subject, date } = await searchParams;
  const { user, db, classes } = await getTeacherCtx();
  const tc = classes.find((c) => c.cls.id === id);
  if (!tc) notFound();
  const { cls } = tc;
  const students = studentsOf(db, cls.id);
  const base = `/teacher/classes/${cls.id}`;
  const homeroom = idx(db).users.get(cls.homeroomTeacherId ?? "");
  const today = localDate();

  const tabs = [
    { key: "students", label: "O'quvchilar", href: `${base}?tab=students` },
    { key: "journal", label: "Jurnal", href: `${base}?tab=journal` },
    { key: "attendance", label: "Davomat", href: `${base}?tab=attendance` },
    { key: "assignments", label: "Vazifalar", href: `${base}?tab=assignments` },
    { key: "rating", label: "Reyting", href: `${base}?tab=rating` },
  ];

  let body: React.ReactNode = null;

  if (tab === "students") {
    const ratings = computeRatings(db);
    body = (
      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="table-clean">
          <thead>
            <tr>
              <th>#</th>
              <th>O&apos;quvchi</th>
              <th className="hidden md:table-cell">Tug&apos;ilgan</th>
              <th className="hidden lg:table-cell">Ota-ona</th>
              <th className="text-center">O&apos;rt. baho</th>
              <th className="hidden text-center sm:table-cell">Davomat</th>
              <th className="text-center">Reyting</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const r = ratings.get(s.id);
              const p = parentsOf(db, s)[0];
              return (
                <tr key={s.id}>
                  <td className="text-ink-soft">{i + 1}</td>
                  <td>
                    <Link href={`/teacher/students/${s.id}`} className="flex items-center gap-2.5 hover:underline">
                      <Avatar user={s} size={34} />
                      <span>
                        <span className="block font-semibold">{s.lastName} {s.firstName}</span>
                        <span className="block font-mono text-xs text-ink-soft">{s.login}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden text-sm md:table-cell">{s.birthDate ? `${s.birthDate.split("-").reverse().join(".")} (${ageFrom(s.birthDate)} yosh)` : "—"}</td>
                  <td className="hidden text-sm lg:table-cell">{p ? <><span className="font-semibold">{p.firstName} {p.lastName}</span><span className="block text-xs text-ink-soft">{p.phone}</span></> : "—"}</td>
                  <td className="text-center"><AvgBadge value={r?.gradeAvg ?? null} /></td>
                  <td className="hidden text-center text-sm sm:table-cell">{attendanceOf(db, s).rate}%</td>
                  <td className="text-center font-round font-bold">{r?.total ?? 0} <span className="text-xs font-normal text-ink-soft">#{r?.classRank}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === "journal") {
    const options = tc.subjectIds.length ? tc.subjectIds : db.teachings.filter((t) => t.classId === cls.id).map((t) => t.subjectId);
    const sid = subject && options.includes(subject) ? subject : options[0];
    const canEdit = tc.subjectIds.includes(sid);
    const lessonDays: string[] = [];
    for (let d = addDays(today, -35); d <= today; d = addDays(d, 1)) {
      if (isSchoolDay(d) && cls.timetable[weekday(d) - 1]?.includes(sid)) lessonDays.push(d);
    }
    const grades = db.grades
      .filter((g) => g.classId === cls.id && g.subjectId === sid && g.date >= addDays(today, -60))
      .map((g) => ({ id: g.id, studentId: g.studentId, date: g.date, value: g.value, type: g.type, comment: g.comment, mine: g.teacherId === user.id, locked: !!g.submissionId }));
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {options.map((s) => (
            <Link key={s} href={`${base}?tab=journal&subject=${s}`} className={cx("chip px-3 py-1.5 text-sm", s === sid ? "bg-sky text-white" : "bg-white text-ink")}>
              {getSubject(s).emoji} {getSubject(s).name}
            </Link>
          ))}
        </div>
        {!canEdit && <Notice tone="warn">Siz bu fandan dars bermaysiz — jurnal faqat ko&apos;rish uchun.</Notice>}
        <JournalGrid students={students.map((s) => ({ id: s.id, name: `${s.lastName} ${s.firstName}` }))} dates={lessonDays} grades={grades} subjectId={sid} canEdit={canEdit} today={today} />
        {canEdit && <p className="text-xs text-ink-soft">Katakni bosing → baho turini tanlang → 2–5 ni bosing. Halqali baholar — uy ishi, test yoki nazorat. Topshiriq orqali qo&apos;yilgan baholar &quot;Tekshirish&quot; bo&apos;limida o&apos;zgartiriladi.</p>}
      </div>
    );
  }

  if (tab === "attendance") {
    const days: string[] = [];
    for (let d = today; days.length < 10; d = addDays(d, -1)) if (isSchoolDay(d)) days.push(d);
    const sel = date && days.includes(date) ? date : days[0];
    const rec = db.attendance.find((a) => a.classId === cls.id && a.date === sel);
    const by = rec ? idx(db).users.get(rec.markedBy) : undefined;
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Link key={d} href={`${base}?tab=attendance&date=${d}`} className={cx("chip px-3 py-1.5 text-sm", d === sel ? "bg-night text-cream" : "bg-white text-ink")}>
              {fmtDay(d, { short: true })}{d === today ? " (bugun)" : ""}
            </Link>
          ))}
        </div>
        {rec && <p className="text-sm text-ink-soft">Oxirgi belgilagan: {by?.firstName} {by?.lastName} · {fmtDateTime(rec.updatedAt)}</p>}
        <AttendanceSheet key={sel} classId={cls.id} date={sel} saved={!!rec} students={students.map((s) => ({ id: s.id, name: `${s.lastName} ${s.firstName}` }))} initial={rec?.marks ?? {}} />
      </div>
    );
  }

  if (tab === "assignments") {
    const list = db.assignments
      .filter((a) => a.classId === cls.id && (tc.homeroom || tc.subjectIds.includes(a.subjectId)))
      .sort((a, b) => b.dueAt.localeCompare(a.dueAt));
    const subs = idx(db).subsByAssignment;
    body = list.length === 0 ? (
      <EmptyState title="Vazifa yo'q" action={<Link href={`/teacher/assignments/new?classId=${cls.id}`} className="btn-primary">Vazifa berish</Link>} />
    ) : (
      <ul className="space-y-2.5">
        {list.slice(0, 50).map((a) => {
          const ss = subs.get(a.id) ?? [];
          const pend = ss.filter((s) => s.status === "submitted").length;
          const mine = a.teacherId === user.id;
          return (
            <li key={a.id}>
              <Link href={`/teacher/assignments/${a.id}`} className="card flex flex-wrap items-center gap-3 py-4 transition hover:-translate-y-0.5">
                <span className="text-2xl">{getSubject(a.subjectId).emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{a.title}</span><KindBadge kind={a.kind} />{!mine && <span className="chip bg-cream text-ink-soft">boshqa ustoz</span>}</span>
                  <span className="text-xs text-ink-soft">{getSubject(a.subjectId).name} · muddat {fmtDateTime(a.dueAt)}</span>
                </span>
                <span className="text-sm font-semibold">{ss.length}/{students.length} topshirdi</span>
                {pend > 0 && <span className="chip bg-daisy text-white">{pend} tekshirish</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  if (tab === "rating") body = <ClassBoard db={db} classId={cls.id} linkBase="/teacher/students" />;

  return (
    <div>
      <PageHeader
        back={{ href: "/teacher/classes", label: "Sinflarim" }}
        title={`${classLabel(cls)} sinf`}
        subtitle={`${students.length} o'quvchi · ${cls.room ?? ""} · Sinf rahbari: ${homeroom ? `${homeroom.firstName} ${homeroom.lastName}` : "—"}`}
        action={
          <Link href={`/teacher/assignments/new?classId=${cls.id}`} className="btn-primary"><Icon name="plus" size={18} /> Vazifa</Link>
        }
      />
      <Tabs tabs={tabs} active={tab} />
      {body}
    </div>
  );
}
