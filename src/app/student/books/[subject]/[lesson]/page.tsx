import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { getLesson, lessonsFor } from "@/lib/lessons";
import { getSubject } from "@/lib/subjects";
import { LessonQuiz } from "@/components/LessonQuiz";
import { PageHeader, cx } from "@/components/ui";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Mavzu" };

export default async function LessonPage({ params }: { params: Promise<{ subject: string; lesson: string }> }) {
  const { subject, lesson: lid } = await params;
  const { cls, kids } = await getStudentCtx();
  const lesson = getLesson(lid);
  if (!lesson || lesson.subjectId !== subject || cls.grade < lesson.grades[0] || cls.grade > lesson.grades[1]) notFound();
  const all = lessonsFor(subject, cls.grade);
  const pos = all.findIndex((l) => l.id === lid);
  const next = all[pos + 1];
  const s = getSubject(subject);

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader back={{ href: `/student/books/${subject}`, label: s.name }} title={lesson.title} subtitle={`${s.emoji} ${lesson.intro} · ${lesson.minutes} daqiqa`} />
      <div className={cx("card space-y-5", kids ? "text-[17px]" : "text-[15px]")}>
        {lesson.blocks.map((b, i) => {
          if (b.type === "p") return <p key={i} className="prose-lesson">{b.text}</p>;
          if (b.type === "rule")
            return (
              <div key={i} className="rounded-3xl bg-green-soft p-4">
                <div className="mb-1 font-round font-bold text-green-dark">📌 {b.title}</div>
                <p className="prose-lesson whitespace-pre-wrap">{b.text}</p>
              </div>
            );
          if (b.type === "example")
            return (
              <div key={i} className="rounded-3xl bg-sky-soft p-4">
                <div className="mb-1 font-round font-bold text-sky-dark">💡 {b.title}</div>
                <p className={cx("prose-lesson whitespace-pre-wrap", b.text.includes("print(") && "font-mono text-sm")}>{b.text}</p>
              </div>
            );
          return (
            <div key={i}>
              {b.title && <div className="mb-2 font-round font-bold">{b.title}</div>}
              <ul className="space-y-1.5">
                {b.items.map((it, k) => (
                  <li key={k} className="flex gap-2"><span className="mt-2 size-2 shrink-0 rounded-full bg-daisy" />{it}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <section className="card mt-5">
        <h2 className="mb-4 font-round text-lg font-bold">{kids ? "O'zingni sinab ko'r! 🎯" : "O'z-o'zini tekshirish"}</h2>
        <LessonQuiz quiz={lesson.quiz} kids={kids} />
      </section>
      {next && (
        <Link href={`/student/books/${subject}/${next.id}`} className="card mt-5 flex items-center justify-between gap-3 transition hover:-translate-y-0.5">
          <span><span className="block text-xs font-semibold text-ink-soft">Keyingi mavzu</span><span className="font-round font-bold">{next.title}</span></span>
          <Icon name="arrowRight" />
        </Link>
      )}
    </article>
  );
}
