"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { mutate, newId } from "@/lib/db";
import { generatePassword } from "@/lib/ids";
import { toLogin } from "@/lib/translit";
import { buildTimetable } from "@/lib/seed";
import { SUBJECTS, subjectsForGrade } from "@/lib/subjects";
import type { Database, Role, User } from "@/lib/types";

export type Credential = { name: string; role: Role; login: string; password: string; className?: string };
export type AdminResult = { ok: true; message?: string; credentials?: Credential[] } | { ok: false; error: string };

const fail = (e: unknown): { ok: false; error: string } => ({ ok: false, error: e instanceof Error ? e.message : "Xatolik yuz berdi" });
const done = () => revalidatePath("/", "layout");
const clean = (v: unknown, max = 80) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function uniqueLogin(db: Database, base: string) {
  const b = toLogin(base) || "user";
  let l = b;
  let i = 2;
  while (db.users.some((u) => u.login === l)) l = `${b}${i++}`;
  return l;
}

const classLabelOf = (db: Database, id?: string) => {
  const c = db.classes.find((x) => x.id === id);
  return c ? `${c.grade}-${c.letter}` : undefined;
};

export interface NewUserInput {
  role: Role;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  position?: string;
  classId?: string;
  birthDate?: string;
  gender?: "m" | "f";
  address?: string;
  subjectIds?: string[];
  childIds?: string[];
  parent?: { mode: "none" | "existing" | "new"; parentId?: string; firstName?: string; lastName?: string; phone?: string; position?: string };
}

export async function createUser(input: NewUserInput): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    const firstName = clean(input.firstName);
    const lastName = clean(input.lastName);
    if (!firstName || !lastName) throw new Error("Ism va familiyani kiriting");
    if (!["student", "teacher", "parent", "admin"].includes(input.role)) throw new Error("Rol noto'g'ri");
    if (input.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) throw new Error("Tug'ilgan sana noto'g'ri");

    const creds: Credential[] = [];
    const now = new Date().toISOString();
    const pw1 = generatePassword();
    const pw2 = generatePassword();
    const [h1, h2] = await Promise.all([bcrypt.hash(pw1, 10), bcrypt.hash(pw2, 10)]);

    await mutate((db) => {
      if (input.role === "student" && !db.classes.some((c) => c.id === input.classId)) throw new Error("Sinfni tanlang");
      const login = uniqueLogin(db, input.role === "teacher" ? `${firstName[0]}.${lastName}` : `${firstName}.${lastName}`);
      const user: User = {
        id: newId({ admin: "adm", teacher: "tea", student: "stu", parent: "par" }[input.role]),
        role: input.role,
        login,
        passwordHash: h1,
        firstName,
        lastName,
        middleName: clean(input.middleName) || undefined,
        phone: clean(input.phone, 30) || undefined,
        position: clean(input.position) || undefined,
        createdAt: now,
        mustChangePassword: true,
      };
      if (input.role === "student") {
        user.classId = input.classId;
        user.birthDate = input.birthDate || undefined;
        user.gender = input.gender;
        user.address = clean(input.address, 200) || undefined;
        user.parentIds = [];
      }
      if (input.role === "teacher") user.subjectIds = (input.subjectIds ?? []).filter((s) => SUBJECTS.some((x) => x.id === s));
      if (input.role === "parent") {
        user.childIds = (input.childIds ?? []).filter((id) => db.users.some((u) => u.id === id && u.role === "student"));
        for (const cid of user.childIds) {
          const c = db.users.find((u) => u.id === cid)!;
          c.parentIds = [...new Set([...(c.parentIds ?? []), user.id])];
        }
      }
      db.users.push(user);
      creds.push({ name: `${lastName} ${firstName}`, role: input.role, login, password: pw1, className: classLabelOf(db, user.classId) });

      // O'quvchi bilan birga ota-ona
      if (input.role === "student" && input.parent && input.parent.mode !== "none") {
        if (input.parent.mode === "existing") {
          const p = db.users.find((u) => u.id === input.parent!.parentId && u.role === "parent");
          if (!p) throw new Error("Ota-ona topilmadi");
          p.childIds = [...new Set([...(p.childIds ?? []), user.id])];
          user.parentIds = [p.id];
        } else {
          const pf = clean(input.parent.firstName);
          const pl = clean(input.parent.lastName) || lastName;
          if (!pf) throw new Error("Ota-ona ismini kiriting");
          const plogin = uniqueLogin(db, `${pf}.${pl}`);
          const p: User = {
            id: newId("par"), role: "parent", login: plogin, passwordHash: h2, firstName: pf, lastName: pl,
            phone: clean(input.parent.phone, 30) || undefined, position: clean(input.parent.position) || "Ota-ona",
            childIds: [user.id], createdAt: now, mustChangePassword: true,
          };
          db.users.push(p);
          user.parentIds = [p.id];
          creds.push({ name: `${pl} ${pf}`, role: "parent", login: plogin, password: pw2, className: classLabelOf(db, user.classId) });
        }
      }
    });
    done();
    return { ok: true, credentials: creds, message: "Hisob yaratildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function resetPassword(userId: string): Promise<AdminResult> {
  const admin = await requireUser(["admin"]);
  try {
    if (userId === admin.id) throw new Error("O'z parolingizni Profil sahifasida o'zgartiring");
    const pw = generatePassword();
    const hash = await bcrypt.hash(pw, 10);
    const cred = await mutate((db) => {
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error("Foydalanuvchi topilmadi");
      u.passwordHash = hash;
      u.mustChangePassword = true;
      return { name: `${u.lastName} ${u.firstName}`, role: u.role, login: u.login, password: pw, className: classLabelOf(db, u.classId) } satisfies Credential;
    });
    done();
    return { ok: true, credentials: [cred], message: "Yangi parol yaratildi. Eski sessiyalar bekor qilindi." };
  } catch (e) {
    return fail(e);
  }
}

/** Butun sinf uchun yangi parollar (kirish kartochkalarini chop etish uchun) */
export async function resetClassPasswords(classId: string, includeParents: boolean): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    const result = await mutate((db) => {
      const students = db.users.filter((u) => u.role === "student" && u.classId === classId).sort((a, b) => a.lastName.localeCompare(b.lastName));
      if (!students.length) throw new Error("Sinfda o'quvchi yo'q");
      const out: Credential[] = [];
      const targets = includeParents
        ? [...students, ...students.flatMap((s) => (s.parentIds ?? []).map((pid) => db.users.find((u) => u.id === pid)!).filter(Boolean))]
        : students;
      const seen = new Set<string>();
      for (const u of targets) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        const pw = generatePassword();
        u.passwordHash = bcrypt.hashSync(pw, 9);
        u.mustChangePassword = true;
        out.push({ name: `${u.lastName} ${u.firstName}`, role: u.role, login: u.login, password: pw, className: classLabelOf(db, classId) });
      }
      return out;
    });
    done();
    return { ok: true, credentials: result };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteUser(userId: string): Promise<AdminResult> {
  const admin = await requireUser(["admin"]);
  try {
    if (userId === admin.id) throw new Error("O'zingizni o'chira olmaysiz");
    await mutate((db) => {
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error("Foydalanuvchi topilmadi");
      if (u.role === "teacher") {
        if (db.teachings.some((t) => t.teacherId === u.id)) throw new Error("Avval bu ustozning darslarini (Sinflar bo'limida) boshqa ustozga o'tkazing");
        for (const c of db.classes) if (c.homeroomTeacherId === u.id) c.homeroomTeacherId = undefined;
      }
      if (u.role === "student") {
        const subIds = new Set(db.submissions.filter((s) => s.studentId === u.id).map((s) => s.id));
        db.submissions = db.submissions.filter((s) => !subIds.has(s.id));
        db.grades = db.grades.filter((g) => g.studentId !== u.id);
        for (const d of db.attendance) delete d.marks[u.id];
        for (const p of db.users) if (p.childIds?.includes(u.id)) p.childIds = p.childIds.filter((x) => x !== u.id);
        db.gameStats = db.gameStats.filter((g) => g.studentId !== u.id);
      }
      if (u.role === "parent") for (const s of db.users) if (s.parentIds?.includes(u.id)) s.parentIds = s.parentIds.filter((x) => x !== u.id);
      db.messages = db.messages.filter((m) => !m.threadId.split("__").includes(u.id));
      db.users = db.users.filter((x) => x.id !== u.id);
    });
    done();
    return { ok: true, message: "O'chirildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function moveStudent(studentId: string, classId: string): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    await mutate((db) => {
      const s = db.users.find((u) => u.id === studentId && u.role === "student");
      if (!s) throw new Error("O'quvchi topilmadi");
      if (!db.classes.some((c) => c.id === classId)) throw new Error("Sinf topilmadi");
      s.classId = classId;
    });
    done();
    return { ok: true, message: "Sinf o'zgartirildi" };
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- Sinflar va darslar ---------------- */
export async function createClass(grade: number, letter: string, homeroomTeacherId?: string, room?: string): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    const g = Math.round(Number(grade));
    const l = clean(letter, 2).toUpperCase();
    if (g < 1 || g > 11) throw new Error("Sinf 1 dan 11 gacha");
    if (!/^[A-ZА-Я]$/.test(l)) throw new Error("Harf bitta bo'lsin (A, B, V…)");
    await mutate((db) => {
      if (db.classes.some((c) => c.grade === g && c.letter === l)) throw new Error("Bunday sinf bor");
      const id = `cls_${g}${l.toLowerCase()}_${Date.now().toString(36).slice(-4)}`;
      db.classes.push({
        id, grade: g, letter: l, room: clean(room, 20) || undefined,
        homeroomTeacherId: homeroomTeacherId && db.users.some((u) => u.id === homeroomTeacherId && u.role === "teacher") ? homeroomTeacherId : undefined,
        timetable: buildTimetable(subjectsForGrade(g).map((s) => s.id), g),
      });
    });
    done();
    return { ok: true, message: "Sinf yaratildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function setHomeroom(classId: string, teacherId: string): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    await mutate((db) => {
      const c = db.classes.find((x) => x.id === classId);
      if (!c) throw new Error("Sinf topilmadi");
      if (teacherId && !db.users.some((u) => u.id === teacherId && u.role === "teacher")) throw new Error("Ustoz topilmadi");
      c.homeroomTeacherId = teacherId || undefined;
    });
    done();
    return { ok: true, message: "Sinf rahbari saqlandi" };
  } catch (e) {
    return fail(e);
  }
}

export async function assignTeaching(classId: string, subjectId: string, teacherId: string): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    await mutate((db) => {
      if (!db.classes.some((c) => c.id === classId)) throw new Error("Sinf topilmadi");
      if (!SUBJECTS.some((s) => s.id === subjectId)) throw new Error("Fan topilmadi");
      const t = db.users.find((u) => u.id === teacherId && u.role === "teacher");
      if (!t) throw new Error("Ustoz topilmadi");
      const existing = db.teachings.find((x) => x.classId === classId && x.subjectId === subjectId);
      if (existing) existing.teacherId = teacherId;
      else db.teachings.push({ id: newId("tg"), classId, subjectId, teacherId });
      if (!t.subjectIds?.includes(subjectId)) t.subjectIds = [...(t.subjectIds ?? []), subjectId];
    });
    done();
    return { ok: true, message: "Saqlandi" };
  } catch (e) {
    return fail(e);
  }
}

export async function removeTeaching(classId: string, subjectId: string): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    await mutate((db) => {
      db.teachings = db.teachings.filter((x) => !(x.classId === classId && x.subjectId === subjectId));
    });
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function regenerateTimetable(classId: string): Promise<AdminResult> {
  await requireUser(["admin"]);
  try {
    await mutate((db) => {
      const c = db.classes.find((x) => x.id === classId);
      if (!c) throw new Error("Sinf topilmadi");
      const subj = [...new Set([...subjectsForGrade(c.grade).map((s) => s.id), ...db.teachings.filter((t) => t.classId === c.id).map((t) => t.subjectId)])];
      c.timetable = buildTimetable(subj, c.grade);
    });
    done();
    return { ok: true, message: "Jadval qayta tuzildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function renameSchool(name: string): Promise<AdminResult> {
  await requireUser(["admin"]);
  const n = clean(name, 80);
  if (!n) return { ok: false, error: "Nomni kiriting" };
  await mutate((db) => {
    db.school.name = n;
  });
  done();
  return { ok: true, message: "Saqlandi" };
}
