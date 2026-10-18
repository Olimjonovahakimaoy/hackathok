import Link from "next/link";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { studentAssignments, isStale, type StudentAssignment } from "@/lib/assignments";
import { fmtDateTime, relativeDue } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { idx } from "@/lib/access";
import { Icon } from "@/components/Icon";
import { EmptyState, GradeBadge, KindBadge, PageHeader, StatusBadge, Tabs, cx, subjectBg } from "@/components/ui";

export const metadata: Metadata = { title: "Vazifalar" };

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string; subject?: string }> }) {
  const { tab = "todo", subject } = await searchParams;
  const { user, db, kids } = await getStudentCtx();
  const now = new Date();
  const all = studentAssignments(db, user, now).filter((x) => !subject || x.a.subjectId === subject);
  const users = idx(db).users;

  const groups: Record<string, StudentAssignment[]> = {
    todo: all.filter((x) => x.status === "pending" || x.status === "returned").sort((a, b) => a.a.dueAt.localeCompare(b.a.dueAt)),
    missing: all.filter((x) => x.status === "missing" && !isStale(x, now)),
    submitted: all.filter((x) => x.status === "submitted"),
    graded: all.filter((x) => x.status === "graded"),
  };
  const list = groups[tab] ?? groups.todo;
  const q = (t: string) => `/student/assignments?tab=${t}${subject ? `&subject=${subject}` : ""}`;

  return (
    <div>
      <PageHeader
        title={kids ? "Vazifalarim 📒" : "Vazifalar"}
        subtitle="Uy ishi va testlarni shu yerda topshirasiz — rasmga olib yoki elektron ko'rinishda."
      />
      <Tabs
        active={tab}
        tabs={[
          { key: "todo", label: "Bajarish kerak", href: q("todo"), count: groups.todo.length },
          { key: "missing", label: "Qarzdorlik", href: q("missing"), count: groups.missing.length },
          { key: "submitted", label: "Tekshirilmoqda", href: q("submitted"), count: groups.submitted.length },
          { key: "graded", label: "Baholangan", href: q("graded") },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState
          emoji={tab === "todo" ? "🎉" : "📭"}
          title={tab === "todo" ? "Hammasi bajarilgan!" : "Bu yerda hozircha hech narsa yo'q"}
          text={tab === "todo" ? "Yangi vazifa berilganda shu yerda paydo bo'ladi." : undefined}
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.slice(0, 60).map(({ a, sub, status }) => {
            const due = relativeDue(a.dueAt, now);
            const s = getSubject(a.subjectId);
            return (
              <li key={a.id}>
                <Link href={`/student/assignments/${a.id}`} className="card flex h-full gap-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className={cx("grid size-12 shrink-0 place-items-center rounded-2xl text-2xl", subjectBg(a.subjectId))}>{s.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-ink-soft">{s.name}</span>
                      <KindBadge kind={a.kind} />
                    </span>
                    <span className="mt-1 block font-semibold leading-snug">{a.title}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <StatusBadge status={status} late={sub?.late} />
                      {(status === "pending" || status === "returned" || status === "missing") && (
                        <span className={cx("inline-flex items-center gap-1 font-semibold", due.tone === "late" ? "text-danger" : due.tone === "soon" ? "text-daisy-dark" : "text-ink-soft")}>
                          <Icon name="clock" size={12} /> {due.text}
                        </span>
                      )}
                      {status !== "pending" && status !== "missing" && sub && <span className="text-ink-soft">{fmtDateTime(sub.submittedAt)}</span>}
                    </span>
                    <span className="mt-1 block text-xs text-ink-soft">Ustoz: {users.get(a.teacherId)?.firstName} {users.get(a.teacherId)?.lastName}</span>
                  </span>
                  {sub?.grade && <GradeBadge value={sub.grade} />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
