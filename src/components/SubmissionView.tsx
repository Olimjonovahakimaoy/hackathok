import type { Assignment, Database, Submission } from "@/lib/types";
import { fmtDateTime } from "@/lib/dates";
import { GRADE_LABEL } from "@/lib/grading";
import { idx } from "@/lib/access";
import { Attachments } from "./Attachments";
import { GradeBadge, StatusBadge, cx } from "./ui";
import { Icon } from "./Icon";

/** Topshirilgan ish: javob, rasmlar, test natijasi, ustoz izohi va xatolar */
export function SubmissionView({ db, a, sub, showAnswers = true }: { db: Database; a: Assignment; sub: Submission; showAnswers?: boolean }) {
  const teacher = sub.gradedBy && sub.gradedBy !== "auto" ? idx(db).users.get(sub.gradedBy) : undefined;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={sub.status} late={sub.late} />
        <span className="text-xs text-ink-soft">
          Topshirildi: {fmtDateTime(sub.submittedAt)}
          {sub.attempts > 1 ? ` · ${sub.attempts}-urinish` : ""}
        </span>
      </div>

      {sub.status === "graded" && sub.grade !== undefined && (
        <div className="flex items-center gap-4 rounded-3xl bg-green-soft p-4">
          <GradeBadge value={sub.grade} size="lg" />
          <div>
            <div className="font-round text-lg font-bold text-green-dark">{GRADE_LABEL[sub.grade]}</div>
            {sub.maxScore ? (
              <div className="text-sm font-semibold text-green-dark/80">{sub.score} / {sub.maxScore} to&apos;g&apos;ri javob</div>
            ) : (
              teacher && <div className="text-sm text-green-dark/80">Tekshirdi: {teacher.firstName} {teacher.lastName}{sub.gradedAt ? ` · ${fmtDateTime(sub.gradedAt)}` : ""}</div>
            )}
          </div>
        </div>
      )}

      {sub.feedback && sub.gradedBy !== "auto" && (
        <div className={cx("rounded-3xl p-4", sub.status === "returned" ? "bg-daisy-soft" : "bg-sky-soft")}>
          <div className="label text-ink!">Ustoz izohi</div>
          <p className="text-[15px] leading-relaxed">{sub.feedback}</p>
        </div>
      )}

      {!!sub.mistakes?.length && (
        <div className="rounded-3xl bg-[#fdeeee] p-4">
          <div className="label text-danger!">Xatolar ({sub.mistakes.length})</div>
          <ul className="space-y-1.5">
            {sub.mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <Icon name="x" size={16} className="mt-0.5 shrink-0 text-danger" /> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!sub.annotatedFileIds?.length && <Attachments db={db} ids={sub.annotatedFileIds} title="Ustoz belgilagan rasmlar" />}

      {a.kind === "test" && a.questions && sub.answers && showAnswers && (
        <div>
          <div className="label">Javoblar tahlili</div>
          <ol className="space-y-2">
            {a.questions.map((q, i) => {
              const ok = sub.answers![i] === q.correct;
              return (
                <li key={q.id} className={cx("rounded-2xl p-3 text-sm", ok ? "bg-green-soft" : "bg-[#fdeeee]")}>
                  <div className="font-semibold">{i + 1}. {q.text}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className={ok ? "text-green-dark" : "text-danger"}>{ok ? "✓" : "✗"} Javob: {q.options[sub.answers![i]] ?? "—"}</span>
                    {!ok && <span className="text-green-dark">To&apos;g&apos;ri: {q.options[q.correct]}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {sub.text && (
        <div>
          <div className="label">Javob matni</div>
          <p className="whitespace-pre-wrap rounded-2xl bg-cream-light p-4 text-[15px] leading-relaxed ring-1 ring-ink/5">{sub.text}</p>
        </div>
      )}
      <Attachments db={db} ids={sub.fileIds} title="Yuborilgan fayllar" />
    </div>
  );
}
