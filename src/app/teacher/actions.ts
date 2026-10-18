"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { mutate, newId } from "@/lib/db";
import { teacherHasClass, teacherTeaches } from "@/lib/access";
import { localDate, tashkentToIso } from "@/lib/dates";
import type { AssignmentKind, AttendanceStatus, Database, GradeType, TestQuestion, User } from "@/lib/types";

export type ActionResult<T = undefined> = { ok: true; message?: string; data?: T } | { ok: false; error: string };

const fail = (e: unknown): { ok: false; error: string } => ({ ok: false, error: e instanceof Error ? e.message : "Xatolik yuz berdi" });
const done = () => revalidatePath("/", "layout");

const GRADE_TYPES: GradeType[] = ["dars", "uy_ishi", "nazorat", "test"];
const STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];

function assertCanGrade(db: Database, teacher: User, studentId: string, subjectId: string) {
  const s = db.users.find((u) => u.id === studentId && u.role === "student");
  if (!s?.classId) throw new Error("O'quvchi topilmadi");
  if (!teacherTeaches(db, teacher.id, s.classId, subjectId)) throw new Error("Siz bu sinfda bu fandan dars bermaysiz");
  return s;
}

/* ---------------- Jurnal ---------------- */
export async function addGrade(input: { studentId: string; subjectId: string; date: string; value: number; type: GradeType; comment?: string }): Promise<ActionResult> {
  const user = await requireUser(["teacher"]);
  try {
    const value = Number(input.value);
    if (![1, 2, 3, 4, 5].includes(value)) throw new Error("Baho 1 dan 5 gacha");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date > localDate()) throw new Error("Sana noto'g'ri (kelajak sana mumkin emas)");
    const type = GRADE_TYPES.includes(input.type) ? input.type : "dars";
    await mutate((db) => {
      const s = assertCanGrade(db, user, input.studentId, input.subjectId);
      db.grades.push({
        id: newId("grd"), studentId: s.id, classId: s.classId!, subjectId: input.subjectId, teacherId: user.id, value,
        date: input.date, type, comment: input.comment?.trim().slice(0, 200) || undefined, createdAt: new Date().toISOString(),
      });
    });
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteGrade(gradeId: string): Promise<ActionResult> {
  const user = await requireUser(["teacher"]);
  try {
    await mutate((db) => {
      const g = db.grades.find((x) => x.id === gradeId);
      if (!g) throw new Error("Baho topilmadi");
      if (g.teacherId !== user.id) throw new Error("Faqat o'zingiz qo'ygan bahoni o'chira olasiz");
      if (g.submissionId) throw new Error("Bu baho topshiriq orqali qo'yilgan — topshiriqni qayta baholang");
      db.grades = db.grades.filter((x) => x.id !== gradeId);
    });
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- Davomat ---------------- */
export async function saveAttendance(classId: string, date: string, marks: Record<string, AttendanceStatus>): Promise<ActionResult> {
  const user = await requireUser(["teacher"]);
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > localDate()) throw new Error("Sana noto'g'ri");
    await mutate((db) => {
      if (!teacherHasClass(db, user.id, classId)) throw new Error("Bu sinf sizga biriktirilmagan");
      const roster = new Set(db.users.filter((u) => u.role === "student" && u.classId === classId).map((u) => u.id));
      const clean: Record<string, AttendanceStatus> = {};
      for (const [sid, st] of Object.entries(marks)) if (roster.has(sid) && STATUSES.includes(st)) clean[sid] = st;
      const existing = db.attendance.find((a) => a.classId === classId && a.date === date);
      const now = new Date().toISOString();
      if (existing) {
        existing.marks = { ...existing.marks, ...clean };
        existing.markedBy = user.id;
        existing.updatedAt = now;
      } else db.attendance.push({ id: newId("att"), classId, date, marks: clean, markedBy: user.id, updatedAt: now });
    });
    done();
    return { ok: true, message: "Davomat saqlandi" };
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- Vazifalar ---------------- */
export interface AssignmentInput {
  classIds: string[];
  subjectId: string;
  kind: AssignmentKind;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  allowLate: boolean;
  fileIds: string[];
  questions?: { text: string; options: string[]; correct: number }[];
}

export async function createAssignment(input: AssignmentInput): Promise<ActionResult<{ ids: string[] }>> {
  const user = await requireUser(["teacher"]);
  try {
    const title = input.title?.trim().slice(0, 160);
    const description = input.description?.trim().slice(0, 5000) ?? "";
    if (!title) throw new Error("Sarlavha kiriting");
    if (!input.classIds?.length) throw new Error("Kamida bitta sinf tanlang");
    if (!["homework", "classwork", "test"].includes(input.kind)) throw new Error("Vazifa turi noto'g'ri");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) || !/^\d{2}:\d{2}$/.test(input.dueTime)) throw new Error("Muddatni to'g'ri kiriting");
    const dueAt = tashkentToIso(input.dueDate, input.dueTime);
    if (new Date(dueAt) < new Date()) throw new Error("Muddat o'tib ketgan sanaga vazifa berib bo'lmaydi");
    let questions: TestQuestion[] | undefined;
    if (input.kind === "test") {
      const qs = (input.questions ?? [])
        .map((q) => ({ text: q.text.trim().slice(0, 500), options: q.options.map((o) => o.trim().slice(0, 200)).filter(Boolean), correct: q.correct }))
        .filter((q) => q.text);
      if (qs.length < 2) throw new Error("Testda kamida 2 ta savol bo'lsin");
      qs.forEach((q, i) => {
        if (q.options.length < 2) throw new Error(`${i + 1}-savolda kamida 2 ta variant bo'lsin`);
        if (!(q.correct >= 0 && q.correct < q.options.length)) throw new Error(`${i + 1}-savolda to'g'ri javobni belgilang`);
      });
      questions = qs.slice(0, 50).map((q) => ({ ...q, id: newId("q") }));
    }
    const ids = await mutate((db) => {
      for (const cid of input.classIds) if (!teacherTeaches(db, user.id, cid, input.subjectId)) throw new Error("Tanlangan sinflardan birida bu fandan dars bermaysiz");
      const files = (input.fileIds ?? []).slice(0, 10);
      for (const fid of files) {
        const f = db.files.find((x) => x.id === fid);
        if (!f || f.ownerId !== user.id) throw new Error("Fayl topilmadi");
      }
      const created: string[] = [];
      for (const cid of input.classIds) {
        const id = newId("asg");
        db.assignments.push({
          id, classId: cid, subjectId: input.subjectId, teacherId: user.id, kind: input.kind, title, description,
          createdAt: new Date().toISOString(), dueAt, fileIds: files, allowLate: input.kind === "test" ? false : !!input.allowLate,
          questions: questions?.map((q) => ({ ...q })),
        });
        created.push(id);
      }
      return created;
    });
    done();
    return { ok: true, data: { ids }, message: ids.length > 1 ? `${ids.length} ta sinfga vazifa berildi` : "Vazifa berildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAssignment(assignmentId: string): Promise<ActionResult> {
  const user = await requireUser(["teacher"]);
  try {
    await mutate((db) => {
      const a = db.assignments.find((x) => x.id === assignmentId);
      if (!a || a.teacherId !== user.id) throw new Error("Vazifa topilmadi");
      const subIds = new Set(db.submissions.filter((s) => s.assignmentId === a.id).map((s) => s.id));
      db.grades = db.grades.filter((g) => !g.submissionId || !subIds.has(g.submissionId));
      db.submissions = db.submissions.filter((s) => s.assignmentId !== a.id);
      db.assignments = db.assignments.filter((x) => x.id !== a.id);
    });
    done();
    return { ok: true, message: "Vazifa o'chirildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function extendAssignment(assignmentId: string, days: number): Promise<ActionResult> {
  const user = await requireUser(["teacher"]);
  try {
    const d = Math.max(1, Math.min(14, Math.round(days)));
    await mutate((db) => {
      const a = db.assignments.find((x) => x.id === assignmentId);
      if (!a || a.teacherId !== user.id) throw new Error("Vazifa topilmadi");
      const base = Math.max(new Date(a.dueAt).getTime(), Date.now());
      a.dueAt = new Date(base + d * 864e5).toISOString();
    });
    done();
    return { ok: true, message: `Muddat ${d} kunga uzaytirildi` };
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- Tekshirish ---------------- */
export interface ReviewInput {
  submissionId: string;
  grade?: number;
  feedback: string;
  mistakes: string[];
  annotatedFileIds: string[];
  action: "grade" | "return";
}

export async function reviewSubmission(input: ReviewInput): Promise<ActionResult<{ nextId?: string }>> {
  const user = await requireUser(["teacher"]);
  try {
    const nextId = await mutate((db) => {
      const sub = db.submissions.find((s) => s.id === input.submissionId);
      if (!sub) throw new Error("Topshiriq topilmadi");
      const a = db.assignments.find((x) => x.id === sub.assignmentId);
      if (!a || !teacherTeaches(db, user.id, a.classId, a.subjectId)) throw new Error("Bu ishni tekshirish huquqingiz yo'q");
      for (const fid of input.annotatedFileIds ?? []) {
        const f = db.files.find((x) => x.id === fid);
        if (!f || f.ownerId !== user.id) throw new Error("Belgilangan rasm topilmadi");
      }
      const now = new Date().toISOString();
      sub.feedback = input.feedback.trim().slice(0, 2000) || undefined;
      sub.mistakes = (input.mistakes ?? []).map((m) => m.trim().slice(0, 300)).filter(Boolean).slice(0, 30);
      sub.annotatedFileIds = (input.annotatedFileIds ?? []).slice(0, 10);
      sub.gradedBy = user.id;
      sub.gradedAt = now;
      const existingGrade = db.grades.find((g) => g.submissionId === sub.id);
      if (input.action === "return") {
        sub.status = "returned";
        sub.grade = undefined;
        if (existingGrade) db.grades = db.grades.filter((g) => g.id !== existingGrade.id);
      } else {
        const v = Number(input.grade);
        if (![2, 3, 4, 5].includes(v)) throw new Error("Bahoni tanlang (2–5)");
        sub.status = "graded";
        sub.grade = v;
        const gradeType: GradeType = a.kind === "classwork" ? "dars" : a.kind === "test" ? "test" : "uy_ishi";
        if (existingGrade) {
          existingGrade.value = v;
          existingGrade.teacherId = user.id;
          existingGrade.date = localDate();
        } else {
          db.grades.push({
            id: newId("grd"), studentId: sub.studentId, classId: a.classId, subjectId: a.subjectId, teacherId: user.id, value: v,
            date: localDate(), type: gradeType, submissionId: sub.id, comment: a.title, createdAt: now,
          });
        }
      }
      // keyingi tekshirilmagan ish
      const mine = new Set(db.assignments.filter((x) => teacherTeaches(db, user.id, x.classId, x.subjectId)).map((x) => x.id));
      return db.submissions
        .filter((s) => s.status === "submitted" && mine.has(s.assignmentId) && s.id !== sub.id)
        .sort((x, y) => x.submittedAt.localeCompare(y.submittedAt))[0]?.id;
    });
    done();
    return { ok: true, data: { nextId }, message: input.action === "return" ? "Ish qayta ishlashga qaytarildi" : "Baholandi" };
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- Materiallar ---------------- */
export async function createMaterial(input: { classIds: string[]; subjectId: string; title: string; body: string; fileIds: string[] }): Promise<ActionResult> {
  const user = await requireUser(["teacher"]);
  try {
    const title = input.title.trim().slice(0, 160);
    if (!title) throw new Error("Sarlavha kiriting");
    if (!input.classIds.length) throw new Error("Sinf tanlang");
    await mutate((db) => {
      for (const cid of input.classIds) if (!teacherTeaches(db, user.id, cid, input.subjectId)) throw new Error("Bu sinfda bu fandan dars bermaysiz");
      const files = input.fileIds.slice(0, 10);
      for (const fid of files) {
        const f = db.files.find((x) => x.id === fid);
        if (!f || f.ownerId !== user.id) throw new Error("Fayl topilmadi");
      }
      for (const cid of input.classIds) {
        db.materials.push({ id: newId("mat"), classId: cid, subjectId: input.subjectId, teacherId: user.id, title, body: input.body.trim().slice(0, 20000), fileIds: files, createdAt: new Date().toISOString() });
      }
    });
    done();
    return { ok: true, message: "Material qo'shildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  const user = await requireUser(["teacher"]);
  try {
    await mutate((db) => {
      const m = db.materials.find((x) => x.id === id);
      if (!m || m.teacherId !== user.id) throw new Error("Material topilmadi");
      db.materials = db.materials.filter((x) => x.id !== id);
    });
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
