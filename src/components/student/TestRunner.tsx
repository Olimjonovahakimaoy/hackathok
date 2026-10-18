"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitTest } from "@/app/student/actions";
import { Icon } from "../Icon";

export interface PublicQuestion {
  id: string;
  text: string;
  options: string[];
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function TestRunner({ assignmentId, questions, kids }: { assignmentId: string; questions: PublicQuestion[]; kids?: boolean }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [started, setStarted] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const q = questions[i];
  const answered = answers.filter((a) => a >= 0).length;
  const last = i === questions.length - 1;

  if (!started) {
    return (
      <div className="rounded-3xl bg-daisy-soft p-6 text-center">
        <div className="text-5xl">📝</div>
        <h3 className="mt-2 font-round text-xl font-bold">{questions.length} ta savol</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">Testni faqat bir marta topshirish mumkin. Natija va baho darhol chiqadi.</p>
        <button onClick={() => setStarted(true)} className="btn-daisy mt-4 px-8 py-3 text-base">Boshlash</button>
      </div>
    );
  }

  const choose = (k: number) => setAnswers((a) => a.map((v, idx) => (idx === i ? k : v)));

  const finish = () => {
    if (answers.includes(-1)) {
      setError("Hamma savollarga javob bering.");
      setI(answers.indexOf(-1));
      return;
    }
    setError(null);
    start(async () => {
      const r = await submitTest(assignmentId, answers);
      if (r.ok) router.refresh();
      else setError(r.error);
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-semibold text-ink-soft">{i + 1} / {questions.length}</span>
        <div className="flex flex-1 gap-1">
          {questions.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`${k + 1}-savol`}
              className={`h-2.5 flex-1 rounded-full transition ${k === i ? "bg-night" : answers[k] >= 0 ? "bg-green" : "bg-ink/10"}`}
            />
          ))}
        </div>
      </div>

      <div key={q.id} className="animate-pop">
        <h3 className={`font-round font-bold ${kids ? "text-3xl" : "text-xl"}`}>{q.text}</h3>
        <div className={`mt-5 grid gap-3 ${kids ? "grid-cols-2" : ""}`}>
          {q.options.map((opt, k) => {
            const sel = answers[i] === k;
            return (
              <button
                key={k}
                onClick={() => choose(k)}
                className={`flex items-center gap-3 rounded-2xl p-4 text-left font-semibold ring-2 transition ${
                  sel ? "bg-sky text-white ring-sky shadow-[0_4px_0_rgba(29,79,166,0.6)]" : "bg-cream-light ring-ink/5 hover:ring-sky/50"
                } ${kids ? "justify-center text-2xl" : "text-base"}`}
              >
                {!kids && <span className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm ${sel ? "bg-white/25" : "bg-white"}`}>{LETTERS[k]}</span>}
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} className="btn-ghost">
          <Icon name="arrowLeft" size={16} /> Oldingi
        </button>
        {last ? (
          <button onClick={finish} disabled={pending} className="btn-green px-6">
            <Icon name="check" size={18} /> {pending ? "Tekshirilmoqda…" : `Yakunlash (${answered}/${questions.length})`}
          </button>
        ) : (
          <button onClick={() => setI((v) => Math.min(questions.length - 1, v + 1))} className="btn-primary">
            Keyingi <Icon name="arrowRight" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
