"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireUser, startSession } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { homeFor } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export type PwState = { error?: string; ok?: boolean };

export async function changePassword(_prev: PwState, form: FormData): Promise<PwState> {
  const user = await requireUser(undefined, { allowPasswordChange: true });
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const repeat = String(form.get("repeat") ?? "");
  if (!rateLimit(`pw:${user.id}`, 6, 15 * 60 * 1000).ok) return { error: "Juda ko'p urinish, 15 daqiqadan keyin qayta urinib ko'ring." };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Hozirgi parol noto'g'ri." };
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return { error: "Yangi parol kamida 8 belgi, harf va raqamdan iborat bo'lsin." };
  if (next !== repeat) return { error: "Yangi parollar mos emas." };
  if (next === current) return { error: "Yangi parol eskisidan farq qilsin." };
  const hash = await bcrypt.hash(next, 10);
  const updated = await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    u.passwordHash = hash;
    u.mustChangePassword = false;
    return { ...u };
  });
  await startSession(updated);
  if (user.mustChangePassword) redirect(homeFor(user.role));
  return { ok: true };
}
