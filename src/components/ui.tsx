import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { getSubject } from "@/lib/subjects";
import type { AssignmentKind, SubmissionStatus, User } from "@/lib/types";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function PageHeader({ title, subtitle, action, back }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="on-bg-soft mb-2 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
            <Icon name="arrowLeft" size={16} /> {back.label}
          </Link>
        )}
        <h1 className="on-bg font-round text-3xl font-bold tracking-tight sm:text-[2.1rem]">{title}</h1>
        {subtitle && <p className="on-bg-soft mt-1 text-sm font-medium">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}

const TONES = {
  green: "bg-green text-white",
  daisy: "bg-daisy text-white",
  sky: "bg-sky text-white",
  cream: "bg-cream-light text-ink ring-1 ring-ink/5",
  white: "bg-white text-ink",
  night: "bg-night text-cream",
} as const;
export type Tone = keyof typeof TONES;

export function StatTile({ label, value, hint, tone = "white", icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; icon?: IconName }) {
  const light = tone === "cream" || tone === "white";
  return (
    <div className={cx("rounded-[1.75rem] p-5 shadow-[var(--shadow-soft)]", TONES[tone])}>
      <div className="flex items-center justify-between">
        <span className={cx("text-xs font-semibold tracking-wide uppercase", light ? "text-ink-soft" : "text-white/85")}>{label}</span>
        {icon && <Icon name={icon} size={18} className={light ? "text-ink-soft" : "text-white/80"} />}
      </div>
      <div className="mt-2 font-round text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className={cx("mt-1 text-xs font-medium", light ? "text-ink-soft" : "text-white/85")}>{hint}</div>}
    </div>
  );
}

export function gradeColor(v: number) {
  if (v >= 5) return "bg-green text-white";
  if (v >= 4) return "bg-sky text-white";
  if (v >= 3) return "bg-warn text-white";
  return "bg-danger text-white";
}

export function GradeBadge({ value, size = "md", title }: { value: number; size?: "sm" | "md" | "lg"; title?: string }) {
  const s = size === "sm" ? "size-7 text-sm rounded-lg" : size === "lg" ? "size-14 text-2xl rounded-2xl" : "size-9 text-base rounded-xl";
  return (
    <span title={title} className={cx("inline-grid shrink-0 place-items-center font-round font-bold", s, gradeColor(value))}>
      {value}
    </span>
  );
}

export function AvgBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm text-ink-soft">—</span>;
  const tone = value >= 4.5 ? "text-green-dark bg-green-soft" : value >= 3.5 ? "text-sky-dark bg-sky-soft" : value >= 3 ? "text-[#9a6a12] bg-[#fbecd1]" : "text-danger bg-danger/10";
  return <span className={cx("chip font-round text-sm", tone)}>{value.toFixed(2)}</span>;
}

const AVATAR_TONES = ["bg-green", "bg-sky", "bg-daisy", "bg-night", "bg-green-dark", "bg-sky-dark", "bg-daisy-dark"];
export function Avatar({ user, size = 40 }: { user: Pick<User, "id" | "firstName" | "lastName">; size?: number }) {
  let h = 0;
  for (const ch of user.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      className={cx("inline-grid shrink-0 place-items-center rounded-full font-round font-bold text-white", AVATAR_TONES[h % AVATAR_TONES.length])}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {(user.firstName[0] ?? "") + (user.lastName[0] ?? "")}
    </span>
  );
}

export function EmptyState({ title, text, emoji = "🌤️", action }: { title: string; text?: string; emoji?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="text-5xl">{emoji}</div>
      <h3 className="mt-3 font-round text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = "green", label }: { value: number; max?: number; tone?: "green" | "sky" | "daisy"; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const bg = { green: "bg-green", sky: "bg-sky", daisy: "bg-daisy" }[tone];
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/8" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx("h-full rounded-full transition-all", bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Tabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav className="thin-scroll -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Bo'limlar">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          scroll={false}
          aria-current={active === t.key ? "page" : undefined}
          className={cx(
            "inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
            active === t.key ? "bg-night text-cream shadow-[var(--shadow-soft)]" : "bg-white/80 text-ink hover:bg-white",
          )}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className={cx("rounded-full px-1.5 text-xs", active === t.key ? "bg-daisy text-white" : "bg-daisy-soft text-daisy-dark")}>{t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

const SUBJECT_TONE = {
  green: "bg-green-soft text-green-dark",
  daisy: "bg-daisy-soft text-daisy-dark",
  sky: "bg-sky-soft text-sky-dark",
  cream: "bg-cream text-ink",
};
export function SubjectBadge({ subjectId, short }: { subjectId: string; short?: boolean }) {
  const s = getSubject(subjectId);
  return (
    <span className={cx("chip", SUBJECT_TONE[s.tone])}>
      <span aria-hidden="true">{s.emoji}</span> {short ? s.short : s.name}
    </span>
  );
}
export const subjectBg = (subjectId: string) => ({ green: "bg-green", daisy: "bg-daisy", sky: "bg-sky", cream: "bg-cream-dark" })[getSubject(subjectId).tone];

export function KindBadge({ kind }: { kind: AssignmentKind }) {
  const map = {
    homework: ["Uy ishi", "bg-night/10 text-night"],
    classwork: ["Sinf ishi", "bg-green-soft text-green-dark"],
    test: ["Test", "bg-daisy-soft text-daisy-dark"],
  } as const;
  const [label, cls] = map[kind];
  return <span className={cx("chip", cls)}>{label}</span>;
}

export function StatusBadge({ status, late }: { status?: SubmissionStatus | "missing" | "pending"; late?: boolean }) {
  const map: Record<string, [string, string]> = {
    missing: ["Topshirilmagan", "bg-danger/10 text-danger"],
    pending: ["Bajarilishi kerak", "bg-warn/15 text-[#8a5a00]"],
    submitted: ["Tekshirilmoqda", "bg-sky-soft text-sky-dark"],
    graded: ["Baholandi", "bg-green-soft text-green-dark"],
    returned: ["Qayta ishlash", "bg-daisy-soft text-daisy-dark"],
  };
  const [label, cls] = map[status ?? "pending"];
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={cx("chip", cls)}>{label}</span>
      {late && <span className="chip bg-warn/15 text-[#8a5a00]">kechikkan</span>}
    </span>
  );
}

export function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl" title="1-o'rin">🥇</span>;
  if (rank === 2) return <span className="text-2xl" title="2-o'rin">🥈</span>;
  if (rank === 3) return <span className="text-2xl" title="3-o'rin">🥉</span>;
  return <span className="inline-grid size-8 place-items-center rounded-full bg-cream font-round text-sm font-bold text-ink-soft">{rank}</span>;
}

export function Section({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("card", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-round text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Notice({ tone = "sky", children }: { tone?: "sky" | "green" | "daisy" | "warn"; children: ReactNode }) {
  const map = { sky: "bg-sky-soft text-sky-dark", green: "bg-green-soft text-green-dark", daisy: "bg-daisy-soft text-daisy-dark", warn: "bg-[#fbecd1] text-[#7a5200]" };
  return <div className={cx("rounded-2xl px-4 py-3 text-sm font-medium", map[tone])}>{children}</div>;
}
