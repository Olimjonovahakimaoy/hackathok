"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { mutate, newId } from "@/lib/db";
import { deriveStatus } from "@/lib/assignments";
import { gradeFromPercent } from "@/lib/grading";
import { localDate } from "@/lib/dates";
import { rateLimit } from "@/lib/ratelimit";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const MAX_TEXT = 5000;
const MAX_FILES = 8;

/** Uy ishini topshirish (matn va/yoki rasm/PDF) */
export async function submitHomework(assignmentId: string, text: string, fileIds: string[]): Promise<ActionResult> {
  const user = await requireUser(["student"]);
  const clean = String(text ?? "").trim().slice(0, MAX_TEXT);
  const files = Array.from(new Set((fileIds ?? []).map(String))).slice(0, MAX_FILES);
  if (!clean && files.length === 0) return { ok: false, error: "Javob yozing yoki kamida bitta rasm qo'shing." };

  try {
    const msg = await mutate((db) => {
      const a = db.assignments.find((x) => x.id === assignmentId);
      if (!a || a.classId !== user.classId) throw new Error("Vazifa topilmadi");
      if (a.kind === "test") throw new Error("Test boshqa usulda topshiriladi");
      for (const fid of files) {
        const f = db.files.find((x) => x.id === fid);
        if (!f || f.ownerId !== user.id) throw new Error("Fayl topilmadi yoki sizga tegishli emas");
      }
      const existing = db.submissions.find((s) => s.assignmentId === a.id && s.studentId === user.id);
      const now = new Date();
      const st = deriveStatus(a, existing, now);
      if (!st.canSubmit) throw new Error(existing?.status === "graded" ? "Vazifa allaqachon baholangan" : "Topshirish muddati tugagan");
      const late = now > new Date(a.dueAt);
      if (existing) {
        existing.text = clean;
        existing.fileIds = files;
        existing.submittedAt = now.toISOString();
        existing.late = late;
        existing.status = "submitted";
        existing.attempts += 1;
        return "Javob yangilandi. Ustoz tekshirgach bahosi chiqadi.";
      }
      db.submissions.push({
        id: newId("sub"),
        assignmentId: a.id,
        studentId: user.id,
        text: clean,
        fileIds: files,
        submittedAt: now.toISOString(),
        late,
        status: "submitted",
        attempts: 1,
      });
      return late ? "Topshirildi (kechikkan). Ustoz tekshiradi." : "Topshirildi! Ustoz tekshirgach bahosi chiqadi. 🎉";
    });
    revalidatePath("/student", "layout");
    return { ok: true, message: msg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xatolik yuz berdi" };
  }
}

/** Testni topshirish — avtomatik tekshiriladi, baho jurnalga tushadi */
export async function submitTest(assignmentId: string, answers: number[]): Promise<ActionResult> {
  const user = await requireUser(["student"]);
  try {
    const msg = await mutate((db) => {
      const a = db.assignments.find((x) => x.id === assignmentId);
      if (!a || a.classId !== user.classId || a.kind !== "test" || !a.questions?.length) throw new Error("Test topilmadi");
      if (db.submissions.some((s) => s.assignmentId === a.id && s.studentId === user.id)) throw new Error("Bu test allaqachon topshirilgan");
      const now = new Date();
      if (now > new Date(a.dueAt) && !a.allowLate) throw new Error("Test muddati tugagan");
      if (!Array.isArray(answers) || answers.length !== a.questions.length) throw new Error("Barcha savollarga javob bering");
      const norm = answers.map((v, i) => (Number.isInteger(v) && v >= 0 && v < a.questions![i].options.length ? v : -1));
      if (norm.includes(-1)) throw new Error("Barcha savollarga javob bering");
      const score = norm.filter((v, i) => v === a.questions![i].correct).length;
      const max = a.questions.length;
      const grade = gradeFromPercent((score / max) * 100);
      const subId = newId("sub");
      const iso = now.toISOString();
      db.submissions.push({
        id: subId, assignmentId: a.id, studentId: user.id, fileIds: [], answers: norm, submittedAt: iso,
        late: now > new Date(a.dueAt), status: "graded", score, maxScore: max, grade, gradedAt: iso, gradedBy: "auto",
        feedback: "Test avtomatik tekshirildi.", attempts: 1,
      });
      db.grades.push({
        id: newId("grd"), studentId: user.id, classId: a.classId, subjectId: a.subjectId, teacherId: a.teacherId,
        value: grade, date: localDate(now), type: "test", submissionId: subId, createdAt: iso, comment: a.title,
      });
      return `Natija: ${score}/${max} — bahoyingiz ${grade}`;
    });
    revalidatePath("/student", "layout");
    return { ok: true, message: msg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xatolik yuz berdi" };
  }
}

/** O'yin natijasi (1–4 sinflar) */
export async function saveGameResult(game: string, score: number, stars: number): Promise<ActionResult> {
  const user = await requireUser(["student"]);
  const g = ["math", "memory", "words", "compare"].includes(game) ? game : null;
  if (!g) return { ok: false, error: "Noma'lum o'yin" };
  if (!rateLimit(`game:${user.id}`, 40, 60 * 60 * 1000).ok) return { ok: true, message: "Dam oling, ko'zlaringiz charchamasin 🙂" };
  const st = Math.max(0, Math.min(3, Math.round(stars)));
  const sc = Math.max(0, Math.min(1000, Math.round(score)));
  await mutate((db) => {
    let row = db.gameStats.find((x) => x.studentId === user.id);
    if (!row) {
      row = { studentId: user.id, stars: 0, plays: 0, best: {}, updatedAt: "" };
      db.gameStats.push(row);
    }
    row.stars += st;
    row.plays += 1;
    row.best[g] = Math.max(row.best[g] ?? 0, sc);
    row.updatedAt = new Date().toISOString();
  });
  revalidatePath("/student", "layout");
  return { ok: true };
}
