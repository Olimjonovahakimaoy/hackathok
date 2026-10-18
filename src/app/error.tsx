"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div className="card max-w-md">
        <div className="text-5xl">😵</div>
        <h1 className="mt-3 font-round text-xl font-bold">Nimadir xato ketdi</h1>
        <p className="mt-1 text-sm text-ink-soft">Sahifani qayta yuklab ko&apos;ring. Muammo takrorlansa, ma&apos;muriyatga xabar bering.{error.digest ? ` (kod: ${error.digest})` : ""}</p>
        <button onClick={reset} className="btn-primary mt-4">Qayta urinish</button>
      </div>
    </div>
  );
}
