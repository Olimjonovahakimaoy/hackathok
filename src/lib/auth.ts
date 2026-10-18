import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { readDb } from "./db";
import type { Role, User } from "./types";
import { SESSION_COOKIE, SESSION_MAX_AGE, homeFor, passwordFingerprint, signSession, verifySession } from "./session";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = readDb().users.find((u) => u.id === payload.sub);
  if (!user || user.role !== payload.role) return null;
  if (passwordFingerprint(user.passwordHash) !== payload.pf) return null;
  return user;
}

/** Sahifa yoki server action uchun: foydalanuvchi bo'lmasa /login ga, roli mos kelmasa o'z sahifasiga */
export async function requireUser(roles?: Role[], opts: { allowPasswordChange?: boolean } = {}): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  if (user.mustChangePassword && !opts.allowPasswordChange) redirect("/account?first=1");
  return user;
}

export async function startSession(user: User) {
  const token = await signSession({ sub: user.id, role: user.role, pf: passwordFingerprint(user.passwordHash) });
  const store = await cookies();
  // HTTPS orqali ochilsa — Secure cookie. Maktab ichki tarmog'ida (http://192.168…) ham ishlashi uchun protokolga qaraymiz.
  const proto = ((await headers()).get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const fullName = (u: Pick<User, "firstName" | "lastName">) => `${u.firstName} ${u.lastName}`;
export const initials = (u: Pick<User, "firstName" | "lastName">) => `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
