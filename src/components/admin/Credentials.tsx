"use client";

import type { Credential } from "@/app/admin/actions";
import { Icon } from "../Icon";

const ROLE: Record<string, string> = { student: "O'quvchi", teacher: "Ustoz", parent: "Ota-ona", admin: "Ma'muriyat" };

/** Login/parol kartochkalari — faqat bir marta ko'rsatiladi, chop etish mumkin */
export function CredentialsSheet({ items, onClose, school }: { items: Credential[]; onClose: () => void; school?: string }) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night-deep/70 p-4 backdrop-blur-sm print:static print:bg-white print:p-0" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-cream p-6 shadow-2xl print:rounded-none print:bg-white print:p-0 print:shadow-none">
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-round text-xl font-bold">Kirish ma&apos;lumotlari ({items.length})</h2>
            <p className="text-sm text-ink-soft">Parollar faqat hozir ko&apos;rinadi. Chop eting yoki nusxa oling — keyin ko&apos;rib bo&apos;lmaydi.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(items.map((c) => `${c.name}\t${c.className ?? ""}\t${c.login}\t${c.password}`).join("\n"))}
              className="btn-ghost"
            >
              Nusxa olish
            </button>
            <button onClick={() => window.print()} className="btn-primary"><Icon name="printer" size={18} /> Chop etish</button>
            <button onClick={onClose} className="btn-ghost" aria-label="Yopish"><Icon name="x" size={18} /></button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
          {items.map((c) => (
            <div key={c.login} className="print-card rounded-2xl border-2 border-dashed border-ink/20 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
                <span>{school ?? "SmartSchool"}</span>
                <span>{ROLE[c.role]}{c.className ? ` · ${c.className}` : ""}</span>
              </div>
              <div className="mt-1 font-round text-lg font-bold">{c.name}</div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-ink-soft">Sayt:</dt><dd className="font-mono">{url}</dd>
                <dt className="text-ink-soft">Login:</dt><dd className="font-mono font-bold">{c.login}</dd>
                <dt className="text-ink-soft">Parol:</dt><dd className="font-mono font-bold">{c.password}</dd>
              </dl>
              <p className="mt-2 text-[11px] text-ink-soft">Birinchi kirishda parolni o&apos;zgartiring. Parolni hech kimga bermang.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
