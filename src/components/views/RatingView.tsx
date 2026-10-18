import type { Database, User } from "@/lib/types";
import { classLabel, idx } from "@/lib/access";
import { RATING_WEIGHTS, classRating, classesLeaderboard, computeRatings, schoolRating, type RatingRow } from "@/lib/stats";
import { AvgBadge, Avatar, ProgressBar, RankMedal, Tabs, cx } from "../ui";

export function RatingBreakdown({ row, kids }: { row: RatingRow; kids?: boolean }) {
  const parts = [
    { label: "Baholar", v: row.gradePts, max: RATING_WEIGHTS.grades, tone: "sky" as const, hint: row.gradeAvg ? `o'rtacha ${row.gradeAvg.toFixed(2)}` : "baho yo'q" },
    { label: "Uy ishlari", v: row.hwPts, max: RATING_WEIGHTS.homework, tone: "green" as const, hint: `${row.hwDone + row.hwLate}/${row.hwTotal} bajarilgan${row.hwLate ? `, ${row.hwLate} kechikkan` : ""}` },
    { label: "Vazifa natijalari", v: row.taskPts, max: RATING_WEIGHTS.tasks, tone: "daisy" as const, hint: row.taskAvgPct !== null ? `o'rtacha ${row.taskAvgPct}%` : "tekshirilgan ish yo'q" },
  ];
  return (
    <ul className="space-y-3">
      {parts.map((p) => (
        <li key={p.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">{p.label}</span>
            <span className="text-ink-soft"><b className="text-ink">{p.v}</b> / {p.max} {!kids && <span className="text-xs">· {p.hint}</span>}</span>
          </div>
          <ProgressBar value={p.v} max={p.max} tone={p.tone} label={p.label} />
        </li>
      ))}
    </ul>
  );
}

export function RatingView({
  db,
  student,
  tab,
  stage,
  basePath,
  kids,
  param = "tab",
}: {
  db: Database;
  student: User;
  tab: string;
  stage?: string;
  basePath: string;
  kids?: boolean;
  /** URL parametr nomi (sahifada "tab" band bo'lsa boshqasini bering) */
  param?: string;
}) {
  const rows = computeRatings(db);
  const me = rows.get(student.id);
  const cls = idx(db).classes.get(student.classId ?? "")!;
  const classSize = classRating(db, cls.id).length;
  const totalStudents = rows.size;
  const sep = basePath.includes("?") ? "&" : "?";
  const href = (t: string, s?: string) => `${basePath}${sep}${param}=${t}${s ? `&stage=${s}` : ""}`;

  return (
    <div className="space-y-5">
      {me && (
        <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
          <div className={cx("flex flex-col justify-between rounded-[1.75rem] p-6 text-white shadow-[0_6px_0_rgba(10,52,116,0.25)]", "bg-night")}>
            <div className="flex items-center gap-3">
              <Avatar user={student} size={48} />
              <div>
                <div className="font-round text-lg font-bold">{student.firstName} {student.lastName}</div>
                <div className="text-sm text-cream/70">{classLabel(cls)} sinf</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="font-display text-3xl text-green">{me.total}</div>
                <div className="text-xs text-cream/75">ball / 100</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="font-display text-3xl text-cream">{me.classRank}</div>
                <div className="text-xs text-cream/75">sinfda / {classSize}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="font-display text-3xl text-daisy">{me.rank}</div>
                <div className="text-xs text-cream/75">maktabda / {totalStudents}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="mb-1 font-round text-lg font-bold">Reyting qanday hisoblanadi?</h3>
            <p className="mb-4 text-sm text-ink-soft">
              Baholar (50) + uy ishlarini o&apos;z vaqtida bajarish (30) + vazifa va testlar natijasi (20) = 100 ball. Kechikkan uy ishi yarim ball oladi.
            </p>
            <RatingBreakdown row={me} kids={kids} />
          </div>
        </div>
      )}

      <Tabs
        active={tab}
        tabs={[
          { key: "class", label: `Sinf reytingi (${classLabel(cls)})`, href: href("class") },
          { key: "school", label: "Maktab reytingi", href: href("school") },
          { key: "classes", label: "Sinflar bellashuvi", href: href("classes") },
        ]}
      />

      {tab === "classes" ? (
        <ClassesBoard db={db} myClassId={cls.id} />
      ) : tab === "school" ? (
        <SchoolBoard db={db} meId={student.id} stage={stage} href={href} />
      ) : (
        <ClassBoard db={db} classId={cls.id} meId={student.id} />
      )}
    </div>
  );
}

export function ClassBoard({ db, classId, meId, linkBase }: { db: Database; classId: string; meId?: string; linkBase?: string }) {
  const list = classRating(db, classId);
  return (
    <div className="card overflow-x-auto p-2 sm:p-4">
      <table className="table-clean">
        <thead>
          <tr>
            <th className="w-14">O&apos;rin</th>
            <th>O&apos;quvchi</th>
            <th className="text-center">O&apos;rt. baho</th>
            <th className="hidden text-center sm:table-cell">Uy ishi</th>
            <th className="hidden text-center md:table-cell">Vazifalar</th>
            <th className="text-right">Ball</th>
          </tr>
        </thead>
        <tbody>
          {list.map(({ student, row }) => {
            const me = student.id === meId;
            const name = (
              <span className="flex items-center gap-2.5">
                <Avatar user={student} size={32} />
                <span className="font-semibold">{student.lastName} {student.firstName}{me && <span className="ml-1.5 chip bg-daisy text-white">siz</span>}</span>
              </span>
            );
            return (
              <tr key={student.id} className={me ? "bg-daisy-soft/60" : ""}>
                <td><RankMedal rank={row.classRank} /></td>
                <td>{linkBase ? <a href={`${linkBase}/${student.id}`} className="hover:underline">{name}</a> : name}</td>
                <td className="text-center"><AvgBadge value={row.gradeAvg} /></td>
                <td className="hidden text-center text-sm sm:table-cell">{row.hwTotal ? Math.round(((row.hwDone + row.hwLate) / row.hwTotal) * 100) : 0}%</td>
                <td className="hidden text-center text-sm md:table-cell">{row.taskAvgPct ?? "—"}{row.taskAvgPct !== null && "%"}</td>
                <td className="text-right font-round text-lg font-bold">{row.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SchoolBoard({ db, meId, stage, href }: { db: Database; meId: string; stage?: string; href: (t: string, s?: string) => string }) {
  const filter = stage === "primary" ? (c: { grade: number }) => c.grade <= 4 : stage === "upper" ? (c: { grade: number }) => c.grade >= 5 : undefined;
  const list = schoolRating(db, filter);
  const top = list.slice(0, 30);
  const myIdx = list.findIndex((r) => r.student.id === meId);
  const extra = myIdx >= 30 ? [list[myIdx]] : [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          ["", "Barcha sinflar"],
          ["primary", "1–4 sinflar"],
          ["upper", "5–11 sinflar"],
        ].map(([k, label]) => (
          <a key={k} href={href("school", k || undefined)} className={cx("chip px-3 py-1.5 text-sm", (stage ?? "") === k ? "bg-sky text-white" : "bg-white text-ink")}>
            {label}
          </a>
        ))}
      </div>
      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="table-clean">
          <thead>
            <tr>
              <th className="w-14">O&apos;rin</th>
              <th>O&apos;quvchi</th>
              <th>Sinf</th>
              <th className="text-center">O&apos;rt. baho</th>
              <th className="text-right">Ball</th>
            </tr>
          </thead>
          <tbody>
            {[...top, ...extra].map(({ student, cls, row }, i) => {
              const me = student.id === meId;
              const rank = filter ? list.indexOf(list.find((x) => x.student.id === student.id)!) + 1 : row.rank;
              return (
                <tr key={student.id} className={cx(me && "bg-daisy-soft/60", i === top.length && "border-t-4 border-cream")}>
                  <td><RankMedal rank={rank} /></td>
                  <td>
                    <span className="flex items-center gap-2.5">
                      <Avatar user={student} size={32} />
                      <span className="font-semibold">{student.lastName} {student.firstName}{me && <span className="ml-1.5 chip bg-daisy text-white">siz</span>}</span>
                    </span>
                  </td>
                  <td className="text-sm font-semibold text-ink-soft">{classLabel(cls)}</td>
                  <td className="text-center"><AvgBadge value={row.gradeAvg} /></td>
                  <td className="text-right font-round text-lg font-bold">{row.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ClassesBoard({ db, myClassId }: { db: Database; myClassId?: string }) {
  const list = classesLeaderboard(db);
  const max = Math.max(...list.map((l) => l.avg), 1);
  return (
    <div className="card">
      <p className="mb-4 text-sm text-ink-soft">Sinf balli — sinfdagi barcha o&apos;quvchilar reyting ballining o&apos;rtachasi.</p>
      <ol className="space-y-3">
        {list.map((r, i) => (
          <li key={r.cls.id} className={cx("flex items-center gap-3 rounded-2xl p-2", r.cls.id === myClassId && "bg-daisy-soft/60")}>
            <RankMedal rank={i + 1} />
            <span className="w-14 font-round text-lg font-bold">{classLabel(r.cls)}</span>
            <div className="flex-1">
              <ProgressBar value={r.avg} max={max} tone={i < 3 ? "green" : "sky"} label={classLabel(r.cls)} />
              <div className="mt-1 text-xs text-ink-soft">o&apos;rt. baho {r.gradeAvg.toFixed(2)} · uy ishi {r.hwRate}% · {r.students} o&apos;quvchi</div>
            </div>
            <span className="w-12 text-right font-round text-lg font-bold">{r.avg}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
