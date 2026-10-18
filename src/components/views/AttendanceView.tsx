import type { Database, User, AttendanceStatus } from "@/lib/types";
import { attendanceOf } from "@/lib/stats";
import { fmtDay, weekday } from "@/lib/dates";
import { StatTile, cx } from "../ui";

const ST: Record<AttendanceStatus, { label: string; cls: string; dot: string }> = {
  present: { label: "Keldi", cls: "bg-green text-white", dot: "bg-green" },
  late: { label: "Kechikdi", cls: "bg-warn text-white", dot: "bg-warn" },
  absent: { label: "Kelmadi", cls: "bg-danger text-white", dot: "bg-danger" },
  excused: { label: "Sababli", cls: "bg-sky text-white", dot: "bg-sky" },
};
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

export function AttendanceView({ db, student }: { db: Database; student: User }) {
  const a = attendanceOf(db, student);
  const byMonth = new Map<string, typeof a.days>();
  for (const d of a.days) {
    const k = d.date.slice(0, 7);
    byMonth.set(k, [...(byMonth.get(k) ?? []), d]);
  }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile tone="green" label="Davomat" value={`${a.rate}%`} hint={`${a.total} o'quv kuni`} icon="calendar" />
        <StatTile tone="white" label="Kechikish" value={a.late} hint="marta" icon="clock" />
        <StatTile tone="white" label="Sababsiz" value={a.absent} hint="kun qoldirilgan" icon="alert" />
        <StatTile tone="white" label="Sababli" value={a.excused} hint="kun (kasallik va h.k.)" icon="file" />
      </div>
      {[...byMonth.entries()].map(([ym, days]) => {
        const [y, m] = ym.split("-").map(Number);
        const first = `${ym}-01`;
        const offset = (weekday(first) + 6) % 7; // Dushanbadan boshlanadi
        const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const map = new Map(days.map((d) => [d.date, d.status]));
        return (
          <section key={ym} className="card">
            <h3 className="mb-4 font-round text-lg font-bold">{MONTHS[m - 1]} {y}</h3>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((d) => (
                <div key={d} className="pb-1 font-semibold text-ink-soft">{d}</div>
              ))}
              {Array.from({ length: offset }).map((_, i) => <div key={`o${i}`} />)}
              {Array.from({ length: dim }).map((_, i) => {
                const date = `${ym}-${String(i + 1).padStart(2, "0")}`;
                const st = map.get(date);
                return (
                  <div
                    key={date}
                    title={st ? `${fmtDay(date)}: ${ST[st].label}` : fmtDay(date)}
                    className={cx("grid aspect-square place-items-center rounded-xl text-sm font-semibold", st ? ST[st].cls : "bg-cream-light text-ink-soft/60")}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        {Object.values(ST).map((s) => (
          <span key={s.label} className="on-bg inline-flex items-center gap-1.5"><span className={cx("size-3 rounded", s.dot)} />{s.label}</span>
        ))}
      </div>
    </div>
  );
}
