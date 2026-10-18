import Link from "next/link";
import type { Metadata } from "next";
import { getAdminCtx } from "@/lib/context";
import { childrenOf, classLabel, idx, parentsOf, sortedClasses } from "@/lib/access";
import { fmtDateTime } from "@/lib/dates";
import { SUBJECTS, getSubject } from "@/lib/subjects";
import { UserForm } from "@/components/admin/UserForm";
import { UserActions } from "@/components/admin/UserActions";
import { Avatar, PageHeader, Tabs } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Foydalanuvchilar" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ role?: string; class?: string; q?: string }> }) {
  const { role = "student", class: classId, q = "" } = await searchParams;
  const { db, user: me } = await getAdminCtx();
  const { classes: cmap } = idx(db);
  const classes = sortedClasses(db);
  const query = q.trim().toLowerCase();
  const list = db.users
    .filter((u) => u.role === role)
    .filter((u) => !classId || role !== "student" || u.classId === classId)
    .filter((u) => !query || `${u.firstName} ${u.lastName} ${u.login} ${u.phone ?? ""}`.toLowerCase().includes(query))
    .sort((a, b) => (cmap.get(a.classId ?? "")?.grade ?? 0) - (cmap.get(b.classId ?? "")?.grade ?? 0) || a.lastName.localeCompare(b.lastName));
  const counts = (r: string) => db.users.filter((u) => u.role === r).length;
  const qs = (r: string) => `/admin/users?role=${r}`;

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" subtitle="Har bir o'quvchi, ustoz va ota-onaning shaxsiy login-paroli." />
      <div className="mb-5">
        <UserForm
          school={db.school.name}
          classes={classes.map((c) => ({ id: c.id, label: classLabel(c) }))}
          parents={db.users.filter((u) => u.role === "parent").sort((a, b) => a.lastName.localeCompare(b.lastName)).map((p) => ({ id: p.id, label: `${p.lastName} ${p.firstName} (${childrenOf(db, p).map((c) => c.firstName).join(", ") || "—"})` }))}
          students={db.users.filter((u) => u.role === "student").sort((a, b) => a.lastName.localeCompare(b.lastName)).map((s) => ({ id: s.id, label: `${s.lastName} ${s.firstName} — ${classLabel(cmap.get(s.classId ?? ""))}` }))}
          subjects={SUBJECTS.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
      <Tabs
        active={role}
        tabs={[
          { key: "student", label: `O'quvchilar (${counts("student")})`, href: qs("student") },
          { key: "teacher", label: `Ustozlar (${counts("teacher")})`, href: qs("teacher") },
          { key: "parent", label: `Ota-onalar (${counts("parent")})`, href: qs("parent") },
          { key: "admin", label: `Ma'muriyat (${counts("admin")})`, href: qs("admin") },
        ]}
      />
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/users">
        <input type="hidden" name="role" value={role} />
        {role === "student" && (
          <select name="class" defaultValue={classId ?? ""} className="input w-auto">
            <option value="">Barcha sinflar</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
          </select>
        )}
        <div className="relative min-w-60 flex-1">
          <Icon name="search" size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft" />
          <input name="q" defaultValue={q} placeholder="Ism, login yoki telefon…" className="input pl-10" />
        </div>
        <button className="btn-ghost">Qidirish</button>
      </form>
      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="table-clean">
          <thead>
            <tr>
              <th>F.I.Sh.</th>
              <th>Login</th>
              {role === "student" && <th>Sinf</th>}
              <th className="hidden md:table-cell">{role === "student" ? "Ota-ona" : role === "parent" ? "Farzandlari" : role === "teacher" ? "Fanlar" : "Lavozim"}</th>
              <th className="hidden lg:table-cell">Oxirgi kirish</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="flex items-center gap-2.5">
                    <Avatar user={u} size={32} />
                    <span>
                      <span className="block font-semibold">{u.lastName} {u.firstName}</span>
                      {u.phone && <span className="text-xs text-ink-soft">{u.phone}</span>}
                    </span>
                  </span>
                </td>
                <td className="font-mono text-sm">{u.login}{u.mustChangePassword && <span className="ml-1.5 chip bg-warn/15 text-[#8a5a00]">yangi</span>}</td>
                {role === "student" && <td><Link className="font-round font-bold hover:underline" href={`/admin/classes/${u.classId}`}>{classLabel(cmap.get(u.classId ?? ""))}</Link></td>}
                <td className="hidden text-sm md:table-cell">
                  {role === "student" && parentsOf(db, u).map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
                  {role === "parent" && childrenOf(db, u).map((c) => `${c.firstName} (${classLabel(cmap.get(c.classId ?? ""))})`).join(", ")}
                  {role === "teacher" && (u.subjectIds ?? []).map((s) => getSubject(s).name).join(", ")}
                  {role === "admin" && u.position}
                </td>
                <td className="hidden text-sm text-ink-soft lg:table-cell">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "—"}</td>
                <td>{u.id !== me.id && <UserActions id={u.id} name={`${u.firstName} ${u.lastName}`} school={db.school.name} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-center text-sm text-ink-soft">Hech kim topilmadi</p>}
      </div>
    </div>
  );
}
