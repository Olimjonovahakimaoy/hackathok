import Link from "next/link";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { classLabel, idx } from "@/lib/access";
import { studentAssignments } from "@/lib/assignments";
import { attendanceOf, avg, computeRatings, gradesBySubject, gradesOf } from "@/lib/stats";
import { scheduleFor, currentLessonIndex } from "@/lib/schedule";
import { fmtDay, localDate, relativeDue } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { GRADE_TYPE_LABEL } from "@/lib/grading";
import { Eyes } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { AvgBadge, GradeBadge, KindBadge, ProgressBar, Section, StatTile, StatusBadge, SubjectBadge, cx, subjectBg } from "@/components/ui";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default async function StudentHome() {
  const { user, db, cls, kids } = await getStudentCtx();
  const now = new Date();
  const today = localDate(now);
  const schedule = scheduleFor(cls, today);
  const nowIdx = schedule.isToday ? currentLessonIndex(schedule.lessons, now) : -1;
  const list = studentAssignments(db, user, now);
  const upcoming = list
    .filter((x) => x.status === "pending" || x.status === "returned")
    .sort((a, b) => a.a.dueAt.localeCompare(b.a.dueAt))
    .slice(0, 5);
  const grades = gradesOf(db, user.id);
  const rating = computeRatings(db, now).get(user.id);
  const att = attendanceOf(db, user);
  const classSize = db.users.filter((u) => u.role === "student" && u.classId === cls.id).length;
  const stars = db.gameStats.find((g) => g.studentId === user.id)?.stars ?? 0;
  const feedback = list
    .filter((x) => x.sub?.status === "graded" && x.sub.feedback && x.sub.gradedBy !== "auto")
    .sort((a, b) => (b.sub!.gradedAt ?? "").localeCompare(a.sub!.gradedAt ?? ""))
    .slice(0, 3);
  const users = idx(db).users;

  const scheduleBlock = (
    <Section
      title={schedule.isToday ? "Bugungi darslar" : `${fmtDay(schedule.day, { weekday: true })} — darslar`}
      action={!schedule.isToday && <span className="chip shrink-0 whitespace-nowrap bg-green-soft text-green-dark">Dam olish 🎉</span>}
    >
      {schedule.lessons.length === 0 ? (
        <p className="text-sm text-ink-soft">Dars jadvali kiritilmagan.</p>
      ) : (
        <ol className="space-y-2">
          {schedule.lessons.map((l, i) => {
            const s = getSubject(l.subjectId);
            return (
              <li key={i} className={cx("flex items-center gap-3 rounded-2xl p-2.5 transition", i === nowIdx ? "bg-sky-soft ring-2 ring-sky" : "bg-cream-light")}>
                <span className={cx("grid size-10 shrink-0 place-items-center rounded-xl text-lg", subjectBg(l.subjectId))}>{s.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="text-xs text-ink-soft">{i + 1}-dars · {l.start}–{l.end}</span>
                </span>
                {i === nowIdx && <span className="chip bg-sky text-white">hozir</span>}
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );

  const upcomingBlock = (
    <Section title={kids ? "Vazifalarim 📒" : "Yaqin muddatlar"} action={<Link href="/student/assignments" className="text-sm font-semibold text-sky hover:underline">Barchasi</Link>}>
      {upcoming.length === 0 ? (
        <p className="rounded-2xl bg-green-soft p-4 text-sm font-semibold text-green-dark">Hamma vazifalar bajarilgan. Barakalla! 🎉</p>
      ) : (
        <ul className="space-y-2.5">
          {upcoming.map(({ a, status }) => {
            const due = relativeDue(a.dueAt, now);
            return (
              <li key={a.id}>
                <Link href={`/student/assignments/${a.id}`} className="flex items-center gap-3 rounded-2xl bg-cream-light p-3 ring-1 ring-ink/5 transition hover:bg-white hover:ring-sky/40">
                  <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl text-xl", subjectBg(a.subjectId))}>{getSubject(a.subjectId).emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{a.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-ink-soft">{getSubject(a.subjectId).name}</span>
                      <KindBadge kind={a.kind} />
                      {status === "returned" && <StatusBadge status="returned" />}
                    </span>
                    <span className={cx("mt-1 block text-xs font-semibold sm:hidden", due.tone === "late" ? "text-danger" : due.tone === "soon" ? "text-daisy-dark" : "text-sky-dark")}>⏰ {due.text}</span>
                  </span>
                  <span className={cx("chip hidden shrink-0 sm:inline-flex", due.tone === "soon" ? "bg-daisy text-white" : due.tone === "late" ? "bg-danger/10 text-danger" : "bg-sky-soft text-sky-dark")}>
                    <Icon name="clock" size={12} /> {due.text}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );

  const gradesBlock = (
    <Section title={kids ? "Oxirgi baholarim ⭐" : "Oxirgi baholar"} action={<Link href="/student/grades" className="text-sm font-semibold text-sky hover:underline">Jurnal</Link>}>
      {grades.length === 0 ? (
        <p className="text-sm text-ink-soft">Hali baho yo&apos;q.</p>
      ) : (
        <ul className="divide-y divide-ink/5">
          {grades.slice(0, 6).map((g) => (
            <li key={g.id} className="flex items-center gap-3 py-2.5">
              <GradeBadge value={g.value} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{getSubject(g.subjectId).name}</span>
                <span className="block truncate text-xs text-ink-soft">{GRADE_TYPE_LABEL[g.type]}{g.comment ? ` · ${g.comment}` : ""}</span>
              </span>
              <span className="text-xs text-ink-soft">{fmtDay(g.date, { short: true })}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );

  if (kids) {
    const tiles = [
      { href: "/student/assignments", title: "vazifalar", sub: `${upcoming.length} ta kutmoqda`, bg: "bg-green", emoji: "📒" },
      { href: "/student/games", title: "o'yinlar", sub: `⭐ ${stars} yulduz yig'ding`, bg: "bg-daisy", emoji: "🎮" },
      { href: "/student/books", title: "darsliklar", sub: "O'qi, o'rgan, sinab ko'r", bg: "bg-sky", emoji: "📚" },
      { href: "/student/rating", title: "reyting", sub: rating ? `Sinfda ${rating.classRank}-o'rin` : "—", bg: "bg-cream", emoji: "🏆" },
    ];
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-5 rounded-[2rem] bg-cream p-6 shadow-[0_6px_0_rgba(10,52,116,0.25)]">
          <Eyes size={96} className="h-auto w-16 animate-float sm:w-24" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl leading-tight text-night sm:text-4xl">Salom, {user.firstName}! 👋</h1>
            <p className="mt-1 font-semibold text-ink-soft">{fmtDay(today, { weekday: true })} · {classLabel(cls)} sinf</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-center">
            <div className="text-3xl">⭐</div>
            <div className="font-display text-2xl text-night">{stars}</div>
            <div className="text-xs font-semibold text-ink-soft">yulduz</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className={cx("group rounded-[1.75rem] p-5 shadow-[0_6px_0_rgba(10,52,116,0.25)] transition hover:-translate-y-1", t.bg)}>
              <div className="text-4xl transition group-hover:scale-110">{t.emoji}</div>
              <div className={cx("mt-3 font-display text-2xl leading-none sm:text-3xl", t.bg === "bg-cream" ? "text-green" : "text-cream")}>{t.title}</div>
              <div className={cx("mt-1.5 text-sm font-semibold", t.bg === "bg-cream" ? "text-ink-soft" : "text-white/90")}>{t.sub}</div>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {upcomingBlock}
          {scheduleBlock}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {gradesBlock}
          {feedback.length > 0 ? (
            <Section title="Ustozim nima dedi? 💬">
              <ul className="space-y-3">
                {feedback.map(({ a, sub }) => (
                  <li key={a.id} className="rounded-2xl bg-daisy-soft p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-daisy-dark">
                      {getSubject(a.subjectId).emoji} {a.title} <GradeBadge value={sub!.grade!} size="sm" />
                    </div>
                    <p className="mt-1 text-sm">{sub!.feedback}</p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }

  // ---------------- 5–11 sinflar ----------------
  const bySubject = [...gradesBySubject(db, user.id).entries()]
    .map(([sid, gs]) => ({ sid, avg: avg(gs.map((g) => g.value)) ?? 0, n: gs.length }))
    .sort((a, b) => b.avg - a.avg);
  const hwPct = rating && rating.hwTotal ? Math.round(((rating.hwDone + rating.hwLate) / rating.hwTotal) * 100) : 0;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", hour12: false }).format(now));
  const greet = hour < 11 ? "Xayrli tong" : hour < 17 ? "Xayrli kun" : "Xayrli kech";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-soft">{fmtDay(today, { weekday: true })}</p>
          <h1 className="font-round text-3xl font-bold tracking-tight sm:text-4xl">{greet}, {user.firstName}</h1>
          <p className="mt-1 text-sm text-ink-soft">{classLabel(cls)} sinf · {classSize} o&apos;quvchi</p>
        </div>
        <Link href="/student/ai" className="btn-daisy"><Icon name="sparkles" size={18} /> AI yordamchidan so&apos;rash</Link>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile tone="sky" label="O'rtacha baho" value={rating?.gradeAvg?.toFixed(2) ?? "—"} hint={`${rating?.gradesCount ?? 0} ta baho`} icon="star" />
        <StatTile tone="green" label="Reyting" value={`${rating?.total ?? 0}`} hint={`Sinfda ${rating?.classRank ?? "—"}-o'rin · maktabda ${rating?.rank ?? "—"}`} icon="trophy" />
        <StatTile tone="daisy" label="Uy ishlari" value={`${hwPct}%`} hint={`${(rating?.hwDone ?? 0) + (rating?.hwLate ?? 0)} / ${rating?.hwTotal ?? 0} bajarildi`} icon="clipboard" />
        <StatTile tone="white" label="Davomat" value={`${att.rate}%`} hint={`${att.absent} kun qoldirilgan`} icon="calendar" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          {upcomingBlock}
          {feedback.length > 0 && (
            <Section title="Ustozlar izohi">
              <ul className="space-y-3">
                {feedback.map(({ a, sub }) => (
                  <li key={a.id}>
                    <Link href={`/student/assignments/${a.id}`} className="block rounded-2xl bg-cream-light p-3.5 ring-1 ring-ink/5 hover:ring-sky/40">
                      <div className="flex items-center justify-between gap-2">
                        <SubjectBadge subjectId={a.subjectId} short />
                        <GradeBadge value={sub!.grade!} size="sm" />
                      </div>
                      <p className="mt-2 text-sm font-semibold">{a.title}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">“{sub!.feedback}” — {users.get(sub!.gradedBy ?? "")?.lastName}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {gradesBlock}
        </div>
        <div className="space-y-6">
          {scheduleBlock}
          <Section title="Fanlar bo'yicha o'rtacha">
            <ul className="space-y-3">
              {bySubject.map((r) => (
                <li key={r.sid}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold">{getSubject(r.sid).emoji} {getSubject(r.sid).name}</span>
                    <AvgBadge value={r.avg} />
                  </div>
                  <ProgressBar value={r.avg} max={5} tone={r.avg >= 4.5 ? "green" : r.avg >= 3.5 ? "sky" : "daisy"} label={getSubject(r.sid).name} />
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
