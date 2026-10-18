"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, type Credential, type NewUserInput } from "@/app/admin/actions";
import { CredentialsSheet } from "./Credentials";
import { Icon } from "../Icon";
import type { Role } from "@/lib/types";

export function UserForm({
  classes,
  parents,
  students,
  subjects,
  school,
}: {
  classes: { id: string; label: string }[];
  parents: { id: string; label: string }[];
  students: { id: string; label: string }[];
  subjects: { id: string; name: string }[];
  school: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [parentMode, setParentMode] = useState<"new" | "existing" | "none">("new");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (fd: FormData) => {
    setError(null);
    const g = (k: string) => String(fd.get(k) ?? "");
    const input: NewUserInput = {
      role,
      firstName: g("firstName"),
      lastName: g("lastName"),
      middleName: g("middleName"),
      phone: g("phone"),
      position: g("position"),
      classId: g("classId"),
      birthDate: g("birthDate"),
      gender: (g("gender") || undefined) as "m" | "f" | undefined,
      address: g("address"),
      subjectIds,
      childIds,
      parent:
        role === "student"
          ? { mode: parentMode, parentId: g("parentId"), firstName: g("pFirstName"), lastName: g("pLastName"), phone: g("pPhone"), position: g("pPosition") }
          : undefined,
    };
    start(async () => {
      const r = await createUser(input);
      if (!r.ok) return setError(r.error);
      setCreds(r.credentials ?? []);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      {creds && <CredentialsSheet items={creds} onClose={() => setCreds(null)} school={school} />}
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-primary"><Icon name="plus" size={18} /> Yangi foydalanuvchi</button>
      ) : (
        <form action={submit} className="card w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-round text-lg font-bold">Yangi hisob</h2>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-cream" aria-label="Yopish"><Icon name="x" /></button>
          </div>
          <div className="inline-flex flex-wrap rounded-2xl bg-cream p-1">
            {(
              [
                ["student", "O'quvchi"],
                ["teacher", "Ustoz"],
                ["parent", "Ota-ona"],
                ["admin", "Ma'muriyat"],
              ] as const
            ).map(([r, l]) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${role === r ? "bg-white text-night shadow" : "text-ink-soft"}`}>{l}</button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label><span className="label">Familiya *</span><input name="lastName" required className="input" /></label>
            <label><span className="label">Ism *</span><input name="firstName" required className="input" /></label>
            <label><span className="label">Otasining ismi</span><input name="middleName" className="input" /></label>
          </div>

          {role === "student" && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <label><span className="label">Sinf *</span>
                  <select name="classId" required className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                </label>
                <label><span className="label">Tug&apos;ilgan sana</span><input name="birthDate" type="date" className="input" /></label>
                <label><span className="label">Jinsi</span>
                  <select name="gender" className="input"><option value="">—</option><option value="m">O&apos;g&apos;il</option><option value="f">Qiz</option></select>
                </label>
                <label><span className="label">Manzil</span><input name="address" className="input" /></label>
              </div>
              <fieldset className="rounded-3xl bg-cream-light p-4 ring-1 ring-ink/5">
                <legend className="px-1 text-sm font-bold">Ota-ona hisobi</legend>
                <div className="mb-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["new", "Yangi yaratish"],
                      ["existing", "Mavjudini biriktirish"],
                      ["none", "Keyinroq"],
                    ] as const
                  ).map(([m, l]) => (
                    <button key={m} type="button" onClick={() => setParentMode(m)} className={`chip px-3 py-1.5 text-sm ${parentMode === m ? "bg-sky text-white" : "bg-white"}`}>{l}</button>
                  ))}
                </div>
                {parentMode === "new" && (
                  <div className="grid gap-3 sm:grid-cols-4">
                    <label><span className="label">Ismi *</span><input name="pFirstName" required className="input bg-white" /></label>
                    <label><span className="label">Familiyasi</span><input name="pLastName" className="input bg-white" placeholder="o'quvchiniki" /></label>
                    <label><span className="label">Telefon</span><input name="pPhone" className="input bg-white" placeholder="+998 90 123 45 67" /></label>
                    <label><span className="label">Kim</span><select name="pPosition" className="input bg-white"><option>Otasi</option><option>Onasi</option><option>Vasiysi</option></select></label>
                  </div>
                )}
                {parentMode === "existing" && (
                  <select name="parentId" className="input bg-white">{parents.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
                )}
              </fieldset>
            </>
          )}

          {role === "teacher" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="label">Lavozim</span><input name="position" className="input" placeholder="Matematika o'qituvchisi" /></label>
                <label><span className="label">Telefon</span><input name="phone" className="input" /></label>
              </div>
              <div>
                <span className="label">Fanlar</span>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => (
                    <button key={s.id} type="button" onClick={() => setSubjectIds((x) => (x.includes(s.id) ? x.filter((y) => y !== s.id) : [...x, s.id]))} className={`chip px-3 py-1.5 text-sm ${subjectIds.includes(s.id) ? "bg-sky text-white" : "bg-cream"}`}>{s.name}</button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-ink-soft">Sinflarga biriktirish — &quot;Sinflar va darslar&quot; bo&apos;limida.</p>
              </div>
            </div>
          )}

          {role === "parent" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="label">Telefon</span><input name="phone" className="input" /></label>
                <label><span className="label">Kim</span><select name="position" className="input"><option>Otasi</option><option>Onasi</option><option>Vasiysi</option></select></label>
              </div>
              <label className="block"><span className="label">Farzandlari (Ctrl/Cmd bilan bir nechtasini)</span>
                <select multiple value={childIds} onChange={(e) => setChildIds(Array.from(e.target.selectedOptions).map((o) => o.value))} className="input h-40">
                  {students.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
            </div>
          )}

          {role === "admin" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="label">Lavozim</span><input name="position" className="input" placeholder="Direktor o'rinbosari" /></label>
              <label><span className="label">Telefon</span><input name="phone" className="input" /></label>
            </div>
          )}

          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
          <button disabled={pending} className="btn-green"><Icon name="check" size={18} /> {pending ? "Yaratilmoqda…" : "Yaratish va login berish"}</button>
          <p className="text-xs text-ink-soft">Login avtomatik yaratiladi (ism.familiya), parol tasodifiy. Birinchi kirishda foydalanuvchi parolini o&apos;zgartiradi.</p>
        </form>
      )}
    </>
  );
}
