import type { Metadata } from "next";
import { Landscape } from "@/components/Brand";
import { TrackingEyes } from "@/components/TrackingEyes";
import { LoginForm } from "./LoginForm";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { readDb } from "@/lib/db";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const school = readDb().school.name;
  // Demo loginlarni deploy qilingan previewda ham ko'rsatish mumkin.
  // SHOW_DEMO_ACCOUNTS=0 qilib productionda yashirish mumkin.
  const showDemo = process.env.SHOW_DEMO_ACCOUNTS !== "0";

  return (
    <main className="sky-bg relative min-h-dvh overflow-hidden">
      <Landscape className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] w-full" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col items-center px-4 pt-10 pb-24 sm:pt-14">
        <TrackingEyes size={128} />
        <h1 className="mt-5 text-center font-display text-5xl leading-none text-cream drop-shadow-[0_3px_0_rgba(10,52,116,0.6)]">
          Smart<span className="text-green">School</span>
        </h1>
        <p className="mt-3 text-center text-sm font-medium text-cream/85">{school} · kitob-daftarsiz zamonaviy maktab</p>
        <LoginForm next={next ?? ""} demo={showDemo ? DEMO_ACCOUNTS : []} />
      </div>
    </main>
  );
}
