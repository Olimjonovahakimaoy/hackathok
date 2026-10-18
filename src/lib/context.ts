import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "./auth";
import { readDb } from "./db";
import { childrenOf, idx, teacherClasses } from "./access";
import { isKidsGrade } from "./subjects";

/** Har bir so'rov uchun bir marta hisoblanadi (layout + sahifa birga ishlatadi) */
export const getStudentCtx = cache(async () => {
  const user = await requireUser(["student"]);
  const db = readDb();
  const cls = idx(db).classes.get(user.classId ?? "");
  if (!cls) notFound();
  return { user, db, cls, kids: isKidsGrade(cls.grade) };
});

export const getTeacherCtx = cache(async () => {
  const user = await requireUser(["teacher"]);
  const db = readDb();
  return { user, db, classes: teacherClasses(db, user.id) };
});

export const getParentCtx = cache(async () => {
  const user = await requireUser(["parent"]);
  const db = readDb();
  return { user, db, children: childrenOf(db, user) };
});

export const getAdminCtx = cache(async () => {
  const user = await requireUser(["admin"]);
  const db = readDb();
  return { user, db };
});
