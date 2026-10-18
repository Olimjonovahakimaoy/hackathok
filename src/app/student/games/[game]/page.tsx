import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { PageHeader } from "@/components/ui";
import { CompareGame, MathGame, MemoryGame, WordGame } from "@/components/student/Games";
import { ClientOnly } from "@/components/ClientOnly";

export const metadata: Metadata = { title: "O'yin" };

const TITLES: Record<string, string> = { math: "Tez hisob 🔢", memory: "Juftini top 🧠", words: "So'z yig' 🔤", compare: "Kattami, kichikmi? ⚖️" };

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const { cls, kids } = await getStudentCtx();
  if (!kids) redirect("/student");
  if (!TITLES[game]) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={{ href: "/student/games", label: "O'yinlar" }} title={TITLES[game]} />
      <div className="rounded-[2rem] bg-white/95 p-5 shadow-[0_8px_0_rgba(10,52,116,0.25)] sm:p-8">
        <ClientOnly fallback={<div className="grid h-72 place-items-center text-ink-soft">O&apos;yin yuklanmoqda…</div>}>
          {game === "math" && <MathGame grade={cls.grade} />}
          {game === "memory" && <MemoryGame />}
          {game === "words" && <WordGame grade={cls.grade} />}
          {game === "compare" && <CompareGame grade={cls.grade} />}
        </ClientOnly>
      </div>
    </div>
  );
}
