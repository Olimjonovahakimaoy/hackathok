"use client";

import { useActionState } from "react";
import { changePassword, type PwState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="label">Hozirgi parol</span>
        <input name="current" type="password" autoComplete="current-password" required className="input" />
      </label>
      <label className="block">
        <span className="label">Yangi parol</span>
        <input name="next" type="password" autoComplete="new-password" required minLength={8} className="input" />
        <span className="mt-1 block text-xs text-ink-soft">Kamida 8 belgi: harf va raqam.</span>
      </label>
      <label className="block">
        <span className="label">Yangi parolni takrorlang</span>
        <input name="repeat" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </label>
      {state.error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{state.error}</p>}
      {state.ok && <p className="rounded-xl bg-green-soft px-3 py-2 text-sm font-semibold text-green-dark">Parol o&apos;zgartirildi ✓</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Saqlanmoqda…" : "Parolni o'zgartirish"}</button>
    </form>
  );
}
