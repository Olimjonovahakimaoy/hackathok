"use client";

import { useState } from "react";

export function LessonQuiz({ quiz, kids }: { quiz: { q: string; options: string[]; correct: number }[]; kids?: boolean }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => quiz.map(() => null));
  const done = picked.every((p) => p !== null);
  const score = picked.filter((p, i) => p === quiz[i].correct).length;
  return (
    <div className="space-y-4">
      {quiz.map((item, i) => (
        <div key={i} className="rounded-3xl bg-cream-light p-4 ring-1 ring-ink/5">
          <p className="font-semibold">{i + 1}. {item.q}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.options.map((o, k) => {
              const chosen = picked[i] === k;
              const answered = picked[i] !== null;
              const right = k === item.correct;
              return (
                <button
                  key={k}
                  disabled={answered}
                  onClick={() => setPicked((p) => p.map((v, idx) => (idx === i ? k : v)))}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold ring-2 transition ${
                    answered && right ? "bg-green text-white ring-green" : chosen ? "bg-danger text-white ring-danger" : "bg-white ring-ink/5 hover:ring-sky"
                  } ${kids ? "text-base" : ""}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked[i] !== null && (
            <p className={`mt-2 text-sm font-semibold ${picked[i] === item.correct ? "text-green-dark" : "text-danger"}`}>
              {picked[i] === item.correct ? (kids ? "Barakalla! 🌟" : "To'g'ri!") : `Noto'g'ri. To'g'ri javob: ${item.options[item.correct]}`}
            </p>
          )}
        </div>
      ))}
      {done && (
        <div className="flex items-center justify-between rounded-3xl bg-night p-4 text-cream animate-pop">
          <span className="font-round text-lg font-bold">
            Natija: {score} / {quiz.length} {score === quiz.length ? "🏆" : score >= quiz.length / 2 ? "👍" : "📖"}
          </span>
          <button onClick={() => setPicked(quiz.map(() => null))} className="btn-sm btn bg-white/15 text-cream hover:bg-white/25">Qayta urinish</button>
        </div>
      )}
    </div>
  );
}
