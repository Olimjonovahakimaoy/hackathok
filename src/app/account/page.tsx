import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { childrenOf, classLabel, idx, parentsOf, teacherClasses } from "@/lib/access";
import { homeFor } from "@/lib/session";
import { fmtDateTime, fmtDay } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { Logo } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Avatar, Notice } from "@/components/ui";
import { PasswordForm } from "./PasswordForm";
import { logoutAction } from "../actions/auth";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = { admin: "Ma'muriyat", teacher: "Ustoz", student: "O'quvchi", parent: "Ota-ona" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const { first } = await searchParams;
  const user = await requireUser(undefined, { allowPasswordChange: true });
  const db = readDb();
  const cls = user.classId ? idx(db).classes.get(user.classId) : undefined;
  const rows: [string, string][] = [
    ["Login", user.login],
    ["Rol", ROLE[user.role]],
    ...(cls ? [["Sinf", classLabel(cls)] as [string, string]] : []),
    ...(user.birthDate ? [["Tug'ilgan sana", `${fmtDay(user.birthDate)} ${user.birthDate.slice(0, 4)}`] as [string, string]] : []),
    ...(user.phone ? [["Telefon", user.phone] as [string, string]] : []),
    ...(user.position ? [["Lavozim", user.position] as [string, string]] : []),
    ...(user.role === "teacher" ? [["Fanlar", (user.subjectIds ?? []).map((s) => getSubject(s).name).join(", ")] as [string, string], ["Sinflar", teacherClasses(db, user.id).map((c) => classLabel(c.cls)).join(", ")] as [string, string]] : []),
    ...(user.role === "parent" ? [["Farzandlar", childrenOf(db, user).map((c) => `${c.firstName} ${c.lastName}`).join(", ")] as [string, string]] : []),
    ...(user.role === "student" ? [["Ota-ona", parentsOf(db, user).map((p) => `${p.firstName} ${p.lastName}`).join(", ")] as [string, string]] : []),
    ...(user.lastLoginAt ? [["Oxirgi kirish", fmtDateTime(user.lastLoginAt)] as [string, string]] : []),
  ];

  return (
    <main className="min-h-dvh bg-cream">
      <div className="bg-night px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo href={homeFor(user.role)} />
          {!user.mustChangePassword && (
            <Link href={homeFor(user.role)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-cream/85 hover:text-cream">
              <Icon name="arrowLeft" size={16} /> Bosh sahifa
            </Link>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        {(first || user.mustChangePassword) && (
          <Notice tone="daisy">Xavfsizlik uchun birinchi kirishda vaqtinchalik parolni o&apos;zingizning parolingizga almashtiring.</Notice>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <section className="card">
            <div className="mb-5 flex items-center gap-4">
              <Avatar user={user} size={64} />
              <div>
                <h1 className="font-round text-2xl font-bold">{user.firstName} {user.lastName}</h1>
                <p className="text-sm text-ink-soft">{ROLE[user.role]}</p>
              </div>
            </div>
            <dl className="divide-y divide-ink/5 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="text-right font-semibold">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-ink-soft">Ma&apos;lumotlarda xato bo&apos;lsa, maktab ma&apos;muriyatiga murojaat qiling.</p>
          </section>
          <section className="card">
            <h2 className="mb-4 font-round text-lg font-bold">Parolni o&apos;zgartirish</h2>
            <PasswordForm />
            <form action={logoutAction} className="mt-6 border-t border-ink/5 pt-4">
              <button className="btn-ghost w-full"><Icon name="logout" size={18} /> Tizimdan chiqish</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
