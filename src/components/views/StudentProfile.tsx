import Link from "next/link";
import type { Database, User } from "@/lib/types";
import { classLabel, idx, parentsOf } from "@/lib/access";
import { ageFrom, fmtDateTime } from "@/lib/dates";
import { attendanceOf, computeRatings } from "@/lib/stats";
import { studentAssignments } from "@/lib/assignments";
import { getSubject } from "@/lib/subjects";
import { Icon } from "../Icon";
import { Avatar, GradeBadge, Section, StatTile, StatusBadge } from "../ui";
import { RatingBreakdown } from "./RatingView";
import { GradesView } from "./GradesView";

/** O'quvchi to'liq kartasi (ustoz va ma'muriyat uchun) */
export function StudentProfile({ db, student, chatBase, submissionBase }: { db: Database; student: User; chatBase?: string; submissionBase?: string }) {
  const cls = idx(db).classes.get(student.classId ?? "");
  const r = computeRatings(db).get(student.id);
  const att = attendanceOf(db, student);
  const parents = parentsOf(db, student);
  const recent = studentAssignments(db, student)
    .filter((x) => x.sub)
    .sort((a, b) => b.sub!.submittedAt.localeCompare(a.sub!.submittedAt))
    .slice(0, 8);
  const info: [string, string][] = [
    ["Sinf", classLabel(cls)],
    ["Tug'ilgan sana", student.birthDate ? `${student.birthDate.split("-").reverse().join(".")} (${ageFrom(student.birthDate)} yosh)` : "—"],
    ["Jinsi", student.gender === "f" ? "Qiz" : student.gender === "m" ? "O'g'il" : "—"],
    ["Login", student.login],
    ["Manzil", student.address ?? "—"],
    ["Oxirgi kirish", student.lastLoginAt ? fmtDateTime(student.lastLoginAt) : "hali kirmagan"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="card">
          <div className="mb-4 flex items-center gap-4">
            <Avatar user={student} size={64} />
            <div className="min-w-0 flex-1">
              <h2 className="font-round text-2xl font-bold">{student.lastName} {student.firstName} {student.middleName ?? ""}</h2>
              <p className="text-sm text-ink-soft">{classLabel(cls)} sinf o&apos;quvchisi</p>
            </div>
            {chatBase && (
              <Link href={`${chatBase}?with=${student.id}`} className="btn-ghost btn-sm"><Icon name="message" size={16} /> Yozish</Link>
            )}
          </div>
          <dl className="divide-y divide-ink/5 text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-ink-soft">{k}</dt>
                <dd className={`text-right font-semibold ${k === "Login" ? "font-mono" : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <div className="label">Ota-ona</div>
            {parents.length === 0 ? (
              <p className="text-sm text-ink-soft">Biriktirilmagan</p>
            ) : (
              <ul className="space-y-2">
                {parents.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-cream-light p-3">
                    <Avatar user={p} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{p.firstName} {p.lastName} <span className="font-normal text-ink-soft">({p.position ?? "ota-ona"})</span></span>
                      <a href={`tel:${p.phone?.replace(/\s/g, "")}`} className="text-xs text-sky hover:underline">{p.phone}</a>
                    </span>
                    {chatBase && <Link href={`${chatBase}?with=${p.id}`} className="btn-ghost btn-sm"><Icon name="message" size={14} /></Link>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <StatTile tone="sky" label="O'rtacha baho" value={r?.gradeAvg?.toFixed(2) ?? "—"} hint={`${r?.gradesCount ?? 0} ta baho`} />
            <StatTile tone="green" label="Reyting" value={r?.total ?? 0} hint={`sinfda ${r?.classRank ?? "—"}-o'rin`} />
            <StatTile tone="daisy" label="Uy ishlari" value={`${r?.hwTotal ? Math.round(((r.hwDone + r.hwLate) / r.hwTotal) * 100) : 0}%`} hint={`${r?.hwLate ?? 0} ta kechikkan`} />
            <StatTile tone="white" label="Davomat" value={`${att.rate}%`} hint={`${att.absent} sababsiz, ${att.excused} sababli`} />
          </div>
          {r && (
            <Section title="Reyting tarkibi">
              <RatingBreakdown row={r} />
            </Section>
          )}
        </div>
      </div>

      <Section title="Oxirgi topshiriqlar">
        {recent.length === 0 ? (
          <p className="text-sm text-ink-soft">Topshiriq yo&apos;q.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {recent.map(({ a, sub, status }) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="text-xl">{getSubject(a.subjectId).emoji}</span>
                <span className="min-w-0 flex-1">
                  {submissionBase ? (
                    <Link href={`${submissionBase}/${sub!.id}`} className="block truncate text-sm font-semibold hover:underline">{a.title}</Link>
                  ) : (
                    <span className="block truncate text-sm font-semibold">{a.title}</span>
                  )}
                  <span className="text-xs text-ink-soft">{fmtDateTime(sub!.submittedAt)}</span>
                </span>
                <StatusBadge status={status} late={sub!.late} />
                {sub!.grade && <GradeBadge value={sub!.grade} size="sm" />}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div>
        <h2 className="mb-3 font-round text-xl font-bold">Baholar</h2>
        <GradesView db={db} student={student} />
      </div>
    </div>
  );
}
