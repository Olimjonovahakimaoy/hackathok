import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { PageHeader, cx } from "@/components/ui";

export const metadata: Metadata = { title: "O'yinlar" };

const GAMES = [
  { id: "math", title: "tez hisob", desc: "Misollarni tez va to'g'ri yech!", emoji: "🔢", bg: "bg-sky" },
  { id: "memory", title: "juftini top", desc: "Rasm va so'zni juftla — xotirangni charxla", emoji: "🧠", bg: "bg-daisy" },
  { id: "words", title: "so'z yig'", desc: "Harflardan so'z yasa", emoji: "🔤", bg: "bg-green" },
  { id: "compare", title: "kattami?", desc: "> < = belgilarini qo'y", emoji: "⚖️", bg: "bg-cream" },
];

export default async function GamesPage() {
  const { user, db, kids } = await getStudentCtx();
  if (!kids) redirect("/student");
  const stat = db.gameStats.find((g) => g.studentId === user.id);
  return (
    <div>
      <PageHeader title="O'yinlar 🎮" subtitle="O'ynab o'rganamiz! Har bir o'yin uchun 3 tagacha yulduz olasan." action={<span className="rounded-2xl bg-cream px-4 py-2 font-display text-2xl text-night">⭐ {stat?.stars ?? 0}</span>} />
      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Link key={g.id} href={`/student/games/${g.id}`} className={cx("group flex items-center gap-5 rounded-[2rem] p-6 shadow-[0_6px_0_rgba(10,52,116,0.25)] transition hover:-translate-y-1", g.bg)}>
            <span className="text-6xl transition group-hover:scale-110 group-hover:rotate-6">{g.emoji}</span>
            <span>
              <span className={cx("block font-display text-3xl leading-none", g.bg === "bg-cream" ? "text-green" : "text-cream")}>{g.title}</span>
              <span className={cx("mt-2 block text-sm font-semibold", g.bg === "bg-cream" ? "text-ink-soft" : "text-white/90")}>{g.desc}</span>
              {stat?.best[g.id] !== undefined && <span className={cx("mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", g.bg === "bg-cream" ? "bg-white text-ink" : "bg-white/25 text-white")}>Rekord: {stat.best[g.id]}</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
