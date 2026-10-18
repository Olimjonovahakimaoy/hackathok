import Link from "next/link";
import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx, pendingReviews, studentsOf } from "@/lib/access";
import { fmtDateTime, fmtDay, localDate, weekday } from "@/lib/dates";
import { lessonTime } from "@/lib/schedule";
import { getSubject } from "@/lib/subjects";
import { ClassCards } from "@/components/teacher/ClassCards";
import { Icon } from "@/components/Icon";
import { Avatar, Section, StatTile, cx, subjectBg } from "@/components/ui";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default async function TeacherHome() {
  const { user, db, classes } = await getTeacherCtx();
  const today = localDate();
  const wd = weekday(today);
  const pend = pendingReviews(db, user.id);
  const { users, assignments } = idx(db);
  const studentsCount = classes.reduce((a, c) => a + studentsOf(db, c.cls.id).length, 0);

  // Bugungi darslarim (jadvaldan)
  const lessons =
    wd >= 1 && wd <= 5
      ? classes
          .flatMap(({ cls, subjectIds }) =>
            (cls.timetable[wd - 1] ?? []).map((sid, i) => ({ cls, sid, i })).filter((l) => subjectIds.includes(l.sid)),
          )
          .sort((a, b) => a.i - b.i)
      : [];
  const myAssignments = db.assignments.filter((a) => a.teacherId === user.id);
  const upcoming = myAssignments.filter((a) => new Date(a.dueAt) > new Date()).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 5);
  const attMissing = classes.filter((c) => c.homeroom && wd >= 1 && wd <= 5 && !db.attendance.some((a) => a.classId === c.cls.id && a.date === today));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-soft">{fmtDay(today, { weekday: true })}</p>
          <h1 className="font-round text-3xl font-bold tracking-tight sm:text-4xl">Assalomu alaykum, {user.firstName} {user.middleName ?? ""}</h1>
          <p className="mt-1 text-sm text-ink-soft">{user.position}</p>
        </div>
        <Link href="/teacher/assignments/new" className="btn-primary"><Icon name="plus" size={18} /> Vazifa berish</Link>
      </header>

      {attMissing.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-daisy-soft px-5 py-4">
          <span className="font-semibold text-daisy-dark">📋 Bugungi davomat hali belgilanmagan: {attMissing.map((c) => classLabel(c.cls)).join(", ")}</span>
          <Link href={`/teacher/classes/${attMissing[0].cls.id}?tab=attendance`} className="btn-daisy btn-sm">Belgilash</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile tone="sky" label="Sinflarim" value={classes.length} hint={`${studentsCount} o'quvchi`} icon="users" />
        <StatTile tone="daisy" label="Tekshirish kutmoqda" value={pend.length} hint="topshirilgan ishlar" icon="checkCircle" />
        <StatTile tone="green" label="Bugungi darslar" value={lessons.length} hint={wd === 0 || wd === 6 ? "dam olish kuni" : "jadval bo'yicha"} icon="calendar" />
        <StatTile tone="white" label="Faol vazifalar" value={myAssignments.filter((a) => new Date(a.dueAt) > new Date()).length} hint={`jami ${myAssignments.length}`} icon="clipboard" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Section title="Tekshirish navbati" action={<Link href="/teacher/review" className="text-sm font-semibold text-sky hover:underline">Barchasi</Link>}>
          {pend.length === 0 ? (
            <p className="rounded-2xl bg-green-soft p-4 text-sm font-semibold text-green-dark">Hamma ishlar tekshirilgan ✓</p>
          ) : (
            <ul className="space-y-2">
              {pend.slice(0, 6).map((s) => {
                const a = assignments.get(s.assignmentId)!;
                const st = users.get(s.studentId)!;
                return (
                  <li key={s.id}>
                    <Link href={`/teacher/review/${s.id}`} className="flex items-center gap-3 rounded-2xl bg-cream-light p-3 ring-1 ring-ink/5 transition hover:bg-white hover:ring-sky/40">
                      <Avatar user={st} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{st.lastName} {st.firstName} <span className="text-ink-soft">· {classLabel(idx(db).classes.get(a.classId))}</span></span>
                        <span className="block truncate text-xs text-ink-soft">{getSubject(a.subjectId).emoji} {a.title}</span>
                      </span>
                      <span className="hidden text-xs text-ink-soft sm:block">{fmtDateTime(s.submittedAt)}</span>
                      {s.late && <span className="chip bg-warn/15 text-[#8a5a00]">kech</span>}
                      <Icon name="arrowRight" size={16} className="text-ink-soft" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <div className="space-y-6">
          <Section title="Bugungi darslarim">
            {lessons.length === 0 ? (
              <p className="text-sm text-ink-soft">Bugun dars yo&apos;q.</p>
            ) : (
              <ol className="space-y-2">
                {lessons.map((l, k) => (
                  <li key={k} className="flex items-center gap-3 rounded-2xl bg-cream-light p-2.5">
                    <span className={cx("grid size-10 place-items-center rounded-xl text-lg", subjectBg(l.sid))}>{getSubject(l.sid).emoji}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{classLabel(l.cls)} · {getSubject(l.sid).name}</span>
                      <span className="text-xs text-ink-soft">{l.i + 1}-dars · {lessonTime(l.i).start}–{lessonTime(l.i).end} · {l.cls.room}</span>
                    </span>
                    <Link href={`/teacher/classes/${l.cls.id}?tab=journal&subject=${l.sid}`} className="btn-ghost btn-sm">Jurnal</Link>
                  </li>
                ))}
              </ol>
            )}
          </Section>
          <Section title="Yaqin muddatlar">
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-soft">Faol vazifa yo&apos;q.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcoming.map((a) => (
                  <li key={a.id}>
                    <Link href={`/teacher/assignments/${a.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-cream-light">
                      <span className="truncate"><b>{classLabel(idx(db).classes.get(a.classId))}</b> · {a.title}</span>
                      <span className="shrink-0 text-xs text-ink-soft">{fmtDateTime(a.dueAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-round text-xl font-bold">Sinflarim</h2>
        <ClassCards db={db} teacherId={user.id} classes={classes} />
      </section>
    </div>
  );
}
