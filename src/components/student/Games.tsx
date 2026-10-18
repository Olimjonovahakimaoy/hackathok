"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveGameResult } from "@/app/student/actions";

/* ------------------------------------------------------------------ */
/*  Umumiy: natija oynasi                                              */
/* ------------------------------------------------------------------ */
function useResult(game: string) {
  const saved = useRef(false);
  const save = useCallback(
    (score: number, stars: number) => {
      if (saved.current) return;
      saved.current = true;
      saveGameResult(game, score, stars).catch(() => {});
    },
    [game],
  );
  const reset = useCallback(() => {
    saved.current = false;
  }, []);
  return [save, reset] as const;
}

function EndScreen({ stars, title, detail, onAgain }: { stars: number; title: string; detail: string; onAgain: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center animate-pop">
      <div className="flex gap-2 text-6xl">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < stars ? "" : "opacity-20 grayscale"} style={{ animationDelay: `${i * 150}ms` }}>⭐</span>
        ))}
      </div>
      <h2 className="mt-4 font-display text-4xl text-night">{title}</h2>
      <p className="mt-2 text-lg font-semibold text-ink-soft">{detail}</p>
      <button onClick={onAgain} className="btn-green mt-6 px-8 py-3 text-lg">🔄 Yana o&apos;ynash</button>
    </div>
  );
}

const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/* ------------------------------------------------------------------ */
/*  1. Tez hisob                                                       */
/* ------------------------------------------------------------------ */
function makeMath(grade: number) {
  let a: number, b: number, op: string, ans: number;
  const kind = grade <= 1 ? rnd(0, 1) : grade === 2 ? rnd(0, 2) : rnd(0, 3);
  if (kind === 0) { a = rnd(1, grade <= 1 ? 10 : 50); b = rnd(1, grade <= 1 ? 9 : 40); op = "+"; ans = a + b; }
  else if (kind === 1) { a = rnd(5, grade <= 1 ? 18 : 90); b = rnd(1, a); op = "−"; ans = a - b; }
  else if (kind === 2) { a = rnd(2, grade <= 2 ? 5 : 10); b = rnd(2, 10); op = "×"; ans = a * b; }
  else { b = rnd(2, 9); ans = rnd(2, 10); a = b * ans; op = ":"; }
  const opts = new Set([ans]);
  while (opts.size < 4) opts.add(Math.max(0, ans + rnd(-10, 10)));
  return { q: `${a} ${op} ${b}`, ans, options: shuffle([...opts]) };
}

export function MathGame({ grade }: { grade: number }) {
  const ROUNDS = 10;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [task, setTask] = useState(() => makeMath(grade));
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [time, setTime] = useState(0);
  const [save, resetSave] = useResult("math");
  const done = round >= ROUNDS;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setTime((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  const stars = correct >= 9 ? 3 : correct >= 7 ? 2 : correct >= 4 ? 1 : 0;
  useEffect(() => {
    if (done) save(correct * 10 + Math.max(0, 60 - time), stars);
  }, [done, correct, time, stars, save]);

  const pick = (v: number) => {
    if (flash) return;
    const ok = v === task.ans;
    setFlash(ok ? "ok" : "bad");
    if (ok) setCorrect((c) => c + 1);
    setTimeout(() => {
      setFlash(null);
      setRound((r) => r + 1);
      setTask(makeMath(grade));
    }, ok ? 450 : 900);
  };

  if (done)
    return (
      <EndScreen
        stars={stars}
        title={stars === 3 ? "Zo'r!" : stars === 2 ? "Barakalla!" : stars === 1 ? "Yaxshi!" : "Yana urinib ko'r!"}
        detail={`${ROUNDS} tadan ${correct} ta to'g'ri · ${time} soniya`}
        onAgain={() => { resetSave(); setRound(0); setCorrect(0); setTime(0); setTask(makeMath(grade)); }}
      />
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm font-bold text-ink-soft">
        <span>{round + 1} / {ROUNDS}</span>
        <span>✅ {correct}</span>
        <span>⏱ {time}s</span>
      </div>
      <div className={`rounded-[2rem] p-8 text-center transition ${flash === "ok" ? "bg-green" : flash === "bad" ? "bg-danger animate-shake" : "bg-sky"}`}>
        <div className="font-display text-6xl text-cream sm:text-7xl">{task.q} = ?</div>
        {flash === "bad" && <div className="mt-2 text-lg font-bold text-white">To&apos;g&apos;ri javob: {task.ans}</div>}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {task.options.map((o) => (
          <button key={o} onClick={() => pick(o)} className="rounded-3xl bg-cream py-6 font-display text-4xl text-night shadow-[0_6px_0_rgba(10,52,116,0.2)] transition hover:-translate-y-0.5 active:translate-y-1">
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Juftini top                                                     */
/* ------------------------------------------------------------------ */
const PAIRS = [
  ["🍎", "olma"], ["🐱", "mushuk"], ["🌞", "quyosh"], ["📚", "kitob"], ["🐶", "kuchuk"], ["🍉", "tarvuz"],
  ["🚗", "mashina"], ["🌳", "daraxt"], ["⭐", "yulduz"], ["🐟", "baliq"], ["🏠", "uy"], ["✏️", "qalam"],
];

export function MemoryGame() {
  const make = () =>
    shuffle(
      shuffle(PAIRS)
        .slice(0, 8)
        .flatMap(([e, w], i) => [
          { key: `${i}a`, pair: i, face: e, word: false },
          { key: `${i}b`, pair: i, face: w, word: true },
        ]),
    );
  const [cards, setCards] = useState(make);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [save, resetSave] = useResult("memory");
  const done = found.size === 8;
  const stars = moves <= 12 ? 3 : moves <= 18 ? 2 : 1;

  useEffect(() => {
    if (done) save(Math.max(1, 40 - moves), stars);
  }, [done, moves, stars, save]);

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || found.has(cards[i].pair)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (cards[a].pair === cards[b].pair) {
        setTimeout(() => {
          setFound((f) => new Set(f).add(cards[a].pair));
          setOpen([]);
        }, 350);
      } else setTimeout(() => setOpen([]), 900);
    }
  };

  if (done)
    return (
      <EndScreen stars={stars} title="Hammasini topding!" detail={`${moves} ta urinishda`} onAgain={() => { resetSave(); setCards(make()); setFound(new Set()); setMoves(0); setOpen([]); }} />
    );

  return (
    <div>
      <div className="mb-4 flex justify-between text-sm font-bold text-ink-soft">
        <span>Topildi: {found.size} / 8</span>
        <span>Urinish: {moves}</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {cards.map((c, i) => {
          const shown = open.includes(i) || found.has(c.pair);
          return (
            <button
              key={c.key}
              onClick={() => flip(i)}
              aria-label={shown ? c.face : "Yopiq karta"}
              className={`grid aspect-square place-items-center rounded-2xl font-bold shadow-[0_5px_0_rgba(10,52,116,0.2)] transition duration-300 ${
                found.has(c.pair) ? "bg-green text-white" : shown ? "bg-cream text-night" : "bg-daisy text-cream hover:-translate-y-0.5"
              } ${c.word ? "text-sm sm:text-lg" : "text-3xl sm:text-5xl"}`}
            >
              {shown ? c.face : <span className="font-display text-3xl">?</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. So'z yig'                                                       */
/* ------------------------------------------------------------------ */
const WORDS = [
  ["🍎", "OLMA"], ["📚", "KITOB"], ["🏫", "MAKTAB"], ["🌞", "QUYOSH"], ["🐱", "MUSHUK"], ["🌳", "DARAXT"],
  ["🍉", "TARVUZ"], ["⭐", "YULDUZ"], ["🐟", "BALIQ"], ["🌸", "GUL"], ["🥛", "SUT"], ["🚌", "AVTOBUS"],
  ["🌙", "OY"], ["🍞", "NON"], ["🐴", "OT"], ["🎈", "SHAR"],
];

export function WordGame({ grade }: { grade: number }) {
  const pool = useMemo(() => WORDS.filter(([, w]) => (grade <= 1 ? w.length <= 5 : true)), [grade]);
  const ROUNDS = 6;
  const pickWords = useCallback(() => shuffle(pool).slice(0, ROUNDS), [pool]);
  const [words, setWords] = useState(() => shuffle(pool).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [built, setBuilt] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [save, resetSave] = useResult("words");
  const done = round >= ROUNDS;
  const [emoji, word] = words[Math.min(round, ROUNDS - 1)];
  const letters = useMemo(() => {
    const ls = word.split("");
    let s = shuffle(ls);
    for (let i = 0; i < 5 && s.join("") === word && ls.length > 1; i++) s = shuffle(ls);
    return s;
  }, [word]);
  const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;

  useEffect(() => {
    if (done) save(ROUNDS * 10 - mistakes * 2, stars);
  }, [done, mistakes, stars, save]);

  const tap = (i: number) => {
    if (built.includes(i)) return;
    const next = [...built, i];
    const expected = word[next.length - 1];
    if (letters[i] !== expected) {
      setWrong(true);
      setMistakes((m) => m + 1);
      setTimeout(() => setWrong(false), 400);
      return;
    }
    setBuilt(next);
    if (next.length === word.length) {
      setTimeout(() => {
        setBuilt([]);
        setRound((r) => r + 1);
      }, 700);
    }
  };

  if (done)
    return <EndScreen stars={stars} title="So'zlar ustasi!" detail={`${mistakes} ta xato bilan`} onAgain={() => { resetSave(); setWords(pickWords()); setRound(0); setMistakes(0); setBuilt([]); }} />;

  return (
    <div className="text-center">
      <div className="mb-4 flex justify-between text-sm font-bold text-ink-soft">
        <span>{round + 1} / {ROUNDS}</span>
        <span>Xato: {mistakes}</span>
      </div>
      <div className="text-8xl animate-float">{emoji}</div>
      <div className={`mt-6 flex flex-wrap justify-center gap-2 ${wrong ? "animate-shake" : ""}`}>
        {word.split("").map((_, i) => (
          <span key={i} className={`grid size-14 place-items-center rounded-2xl font-display text-3xl ${built[i] !== undefined ? "bg-green text-cream" : "border-2 border-dashed border-ink/25 bg-white/70 text-transparent"}`}>
            {built[i] !== undefined ? letters[built[i]] : "_"}
          </span>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {letters.map((l, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            disabled={built.includes(i)}
            className="grid size-16 place-items-center rounded-2xl bg-sky font-display text-3xl text-cream shadow-[0_5px_0_rgba(29,79,166,0.7)] transition hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-25"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Kattami, kichikmi?                                              */
/* ------------------------------------------------------------------ */
function makeCompare(grade: number) {
  const max = grade <= 1 ? 20 : grade === 2 ? 100 : 1000;
  const a = rnd(0, max);
  const b = Math.random() < 0.15 ? a : rnd(0, max);
  return { a, b, ans: a > b ? ">" : a < b ? "<" : "=" };
}

export function CompareGame({ grade }: { grade: number }) {
  const ROUNDS = 10;
  const [round, setRound] = useState(0);
  const [ok, setOk] = useState(0);
  const [task, setTask] = useState(() => makeCompare(grade));
  const [flash, setFlash] = useState<string | null>(null);
  const [save, resetSave] = useResult("compare");
  const done = round >= ROUNDS;
  const stars = ok >= 9 ? 3 : ok >= 7 ? 2 : ok >= 4 ? 1 : 0;
  useEffect(() => {
    if (done) save(ok * 10, stars);
  }, [done, ok, stars, save]);

  const pick = (s: string) => {
    if (flash) return;
    const right = s === task.ans;
    if (right) setOk((v) => v + 1);
    setFlash(right ? "ok" : "bad");
    setTimeout(() => {
      setFlash(null);
      setRound((r) => r + 1);
      setTask(makeCompare(grade));
    }, right ? 400 : 900);
  };

  if (done) return <EndScreen stars={stars} title="Ajoyib!" detail={`${ROUNDS} tadan ${ok} ta to'g'ri`} onAgain={() => { resetSave(); setRound(0); setOk(0); setTask(makeCompare(grade)); }} />;

  return (
    <div>
      <div className="mb-4 flex justify-between text-sm font-bold text-ink-soft">
        <span>{round + 1} / {ROUNDS}</span>
        <span>✅ {ok}</span>
      </div>
      <div className={`flex items-center justify-center gap-4 rounded-[2rem] p-8 transition ${flash === "ok" ? "bg-green" : flash === "bad" ? "bg-danger animate-shake" : "bg-daisy"}`}>
        <span className="font-display text-6xl text-cream">{task.a}</span>
        <span className="grid size-16 place-items-center rounded-2xl bg-white/25 font-display text-4xl text-cream">{flash === "bad" ? task.ans : "?"}</span>
        <span className="font-display text-6xl text-cream">{task.b}</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[">", "=", "<"].map((s) => (
          <button key={s} onClick={() => pick(s)} className="rounded-3xl bg-cream py-6 font-display text-5xl text-night shadow-[0_6px_0_rgba(10,52,116,0.2)] transition hover:-translate-y-0.5 active:translate-y-1">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
