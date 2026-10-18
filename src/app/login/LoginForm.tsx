"use client";

import { useActionState, useRef, useState } from "react";
import { loginAction, type LoginState } from "./actions";
import type { Role } from "@/lib/types";
import { Icon } from "@/components/Icon";

const ROLES: { role: Role; title: string; hint: string; bar: string; text: string; sub: string }[] = [
  { role: "student", title: "o'quvchi", hint: "Darslar, vazifalar, o'yinlar", bar: "bg-green", text: "text-cream", sub: "text-white/90" },
  { role: "teacher", title: "ustoz", hint: "Sinflar, jurnal, tekshirish", bar: "bg-sky", text: "text-cream", sub: "text-white/90" },
  { role: "parent", title: "ota-ona", hint: "Farzand baholari va davomati", bar: "bg-daisy", text: "text-cream", sub: "text-white/90" },
];

export function LoginForm({ next, demo }: { next: string; demo: { role: string; login: string; password: string }[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [role, setRole] = useState<Role>(state.role ?? "student");
  const [show, setShow] = useState(false);
  const loginRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const fillDemo = (login: string, password: string, r: string) => {
    const mapped: Role = r.startsWith("Admin") ? "admin" : r.startsWith("Ustoz") ? "teacher" : r.startsWith("Ota") ? "parent" : "student";
    setRole(mapped);
    requestAnimationFrame(() => {
      if (loginRef.current) loginRef.current.value = login;
      if (passRef.current) passRef.current.value = password;
    });
  };

  const form = (tone: string) => (
    <form action={action} className="mt-4 space-y-3 animate-pop">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="login" className="sr-only">Login</label>
        <input
          ref={loginRef}
          id="login"
          name="login"
          defaultValue={state.login}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Login"
          className="w-full rounded-2xl border-0 bg-white/95 px-4 py-3 text-[15px] font-medium text-ink outline-none ring-2 ring-transparent placeholder:text-ink-soft/60 focus:ring-white"
        />
      </div>
      <div className="relative">
        <label htmlFor="password" className="sr-only">Parol</label>
        <input
          ref={passRef}
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="Parol"
          className="w-full rounded-2xl border-0 bg-white/95 px-4 py-3 pr-12 text-[15px] font-medium text-ink outline-none ring-2 ring-transparent placeholder:text-ink-soft/60 focus:ring-white"
        />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-ink-soft hover:text-ink" aria-label={show ? "Parolni yashirish" : "Parolni ko'rsatish"}>
          <Icon name="eye" size={18} />
        </button>
      </div>
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-danger animate-shake">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`w-full rounded-2xl bg-night py-3 text-[15px] font-bold text-cream shadow-[0_4px_0_rgba(0,0,0,0.25)] transition hover:bg-night-deep active:translate-y-0.5 disabled:opacity-70 ${tone}`}>
        {pending ? "Tekshirilmoqda…" : "Kirish"}
      </button>
    </form>
  );

  return (
    <div className="mt-8 w-full space-y-3">
      <p className="text-center text-xs font-semibold tracking-[0.2em] text-cream/70 uppercase">Kim sifatida kirasiz?</p>
      {ROLES.map((r) => {
        const active = role === r.role;
        return (
          <div
            key={r.role}
            className={`${r.bar} rounded-[1.75rem] px-6 py-4 shadow-[0_6px_0_rgba(10,52,116,0.25)] transition ${active ? "scale-[1.02]" : "opacity-95 hover:scale-[1.01]"}`}
          >
            <button type="button" aria-expanded={active} onClick={() => setRole(r.role)} className="flex w-full items-center justify-between text-left">
              <span>
                <span className={`block font-display text-3xl leading-none ${r.text}`}>{r.title}</span>
                <span className={`mt-1.5 block text-sm font-semibold ${r.sub}`}>{r.hint}</span>
              </span>
              <span className={`grid size-9 place-items-center rounded-full bg-white/25 text-white transition ${active ? "rotate-90" : ""}`}>
                <Icon name="arrowRight" size={18} />
              </span>
            </button>
            {active && form("")}
          </div>
        );
      })}

      <div className={`rounded-[1.75rem] bg-cream px-6 py-4 transition ${role === "admin" ? "shadow-[0_6px_0_rgba(10,52,116,0.25)]" : ""}`}>
        {role === "admin" ? (
          <>
            <div className="font-display text-3xl leading-none text-green">ma&apos;muriyat</div>
            <div className="mt-1.5 text-sm font-semibold text-green-dark">Direktor va o&apos;rinbosarlar</div>
            {form("")}
          </>
        ) : (
          <button type="button" onClick={() => setRole("admin")} className="flex w-full items-center justify-between text-left text-sm font-semibold text-green-dark">
            <span>Maktab ma&apos;muriyati uchun kirish</span>
            <Icon name="lock" size={16} />
          </button>
        )}
      </div>

      <p className="mx-auto w-fit rounded-full bg-night-deep/55 px-4 py-1.5 text-center text-xs font-medium text-cream backdrop-blur">
        Login va parolni sinf rahbaringiz yoki maktab ma&apos;muriyati beradi.
      </p>

      {demo.length > 0 && (
        <details className="rounded-2xl bg-night-deep/60 p-4 text-cream backdrop-blur">
          <summary className="cursor-pointer text-sm font-semibold">Demo hisoblar (faqat sinov rejimida ko&apos;rinadi)</summary>
          <ul className="mt-3 space-y-1.5 text-xs">
            {demo.map((d) => (
              <li key={d.login}>
                <button type="button" onClick={() => fillDemo(d.login, d.password, d.role)} className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-left hover:bg-white/20">
                  <span>{d.role}</span>
                  <span className="font-mono opacity-80">{d.login}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
