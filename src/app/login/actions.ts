"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { mutate, readDb } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { homeFor } from "@/lib/session";
import { rateLimit, resetLimit } from "@/lib/ratelimit";
import type { Role } from "@/lib/types";

export type LoginState = { error?: string; login?: string; role?: Role };

const DUMMY_HASH = bcrypt.hashSync("smartschool-dummy-password", 8);

const ROLE_NAME: Record<Role, string> = { student: "o'quvchi", teacher: "ustoz", parent: "ota-ona", admin: "ma'muriyat" };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const role = String(form.get("role") ?? "student") as Role;
  const login = String(form.get("login") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "");

  if (!login || !password) return { error: "Login va parolni kiriting.", login, role };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  const key = `login:${ip}:${login}`;
  const limit = rateLimit(key, 8, 10 * 60 * 1000);
  if (!limit.ok) {
    return { error: `Juda ko'p urinish. ${Math.ceil(limit.retryInSec / 60)} daqiqadan keyin qayta urinib ko'ring.`, login, role };
  }

  const user = readDb().users.find((u) => u.login === login);
  // Foydalanuvchi bo'lmasa ham bcrypt ishlatamiz — javob vaqtidan login borligini bilib bo'lmasin
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Login yoki parol noto'g'ri.", login, role };

  if (user.role !== role) {
    return { error: `Bu ${ROLE_NAME[user.role]} hisobi. Yuqorida «${ROLE_NAME[user.role]}» bo'limini tanlang.`, login, role };
  }

  resetLimit(key);
  try {
    await mutate((db) => {
      const u = db.users.find((x) => x.id === user.id);
      if (u) u.lastLoginAt = new Date().toISOString();
    });
  } catch {
    // Oxirgi kirish vaqtini yozib bo'lmasa ham kirishga to'sqinlik qilmaymiz
  }
  await startSession(user);

  const home = homeFor(user.role);
  const safeNext = next.startsWith(home) && !next.startsWith("//") ? next : home;
  redirect(user.mustChangePassword ? "/account?first=1" : safeNext);
}
