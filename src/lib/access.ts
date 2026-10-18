import type { Assignment, Database, FileMeta, SchoolClass, Submission, User } from "./types";
import { getSubject, subjectsForGrade } from "./subjects";

/* ---------------- indekslar (har bir baza holati uchun bir marta) ---------------- */
interface Index {
  users: Map<string, User>;
  classes: Map<string, SchoolClass>;
  assignments: Map<string, Assignment>;
  subsByAssignment: Map<string, Submission[]>;
  subsByStudent: Map<string, Submission[]>;
  studentsByClass: Map<string, User[]>;
}
const cache = new WeakMap<Database, Index>();

export function idx(db: Database): Index {
  let i = cache.get(db);
  if (i) return i;
  const users = new Map(db.users.map((u) => [u.id, u]));
  const classes = new Map(db.classes.map((c) => [c.id, c]));
  const assignments = new Map(db.assignments.map((a) => [a.id, a]));
  const subsByAssignment = new Map<string, Submission[]>();
  const subsByStudent = new Map<string, Submission[]>();
  for (const s of db.submissions) {
    (subsByAssignment.get(s.assignmentId) ?? subsByAssignment.set(s.assignmentId, []).get(s.assignmentId)!).push(s);
    (subsByStudent.get(s.studentId) ?? subsByStudent.set(s.studentId, []).get(s.studentId)!).push(s);
  }
  const studentsByClass = new Map<string, User[]>();
  for (const u of db.users) {
    if (u.role !== "student" || !u.classId) continue;
    (studentsByClass.get(u.classId) ?? studentsByClass.set(u.classId, []).get(u.classId)!).push(u);
  }
  for (const list of studentsByClass.values()) list.sort((a, b) => a.lastName.localeCompare(b.lastName, "uz") || a.firstName.localeCompare(b.firstName, "uz"));
  i = { users, classes, assignments, subsByAssignment, subsByStudent, studentsByClass };
  cache.set(db, i);
  return i;
}

export const classLabel = (c?: Pick<SchoolClass, "grade" | "letter">) => (c ? `${c.grade}-${c.letter}` : "—");

export function sortedClasses(db: Database) {
  return [...db.classes].sort((a, b) => a.grade - b.grade || a.letter.localeCompare(b.letter));
}

export function studentsOf(db: Database, classId: string): User[] {
  return idx(db).studentsByClass.get(classId) ?? [];
}

/* ---------------- ustoz ---------------- */
export interface TeacherClass {
  cls: SchoolClass;
  subjectIds: string[];
  homeroom: boolean;
}

export function teacherClasses(db: Database, teacherId: string): TeacherClass[] {
  const map = new Map<string, TeacherClass>();
  const { classes } = idx(db);
  for (const t of db.teachings) {
    if (t.teacherId !== teacherId) continue;
    const cls = classes.get(t.classId);
    if (!cls) continue;
    const row = map.get(cls.id) ?? { cls, subjectIds: [], homeroom: cls.homeroomTeacherId === teacherId };
    row.subjectIds.push(t.subjectId);
    map.set(cls.id, row);
  }
  for (const cls of db.classes) {
    if (cls.homeroomTeacherId === teacherId && !map.has(cls.id)) map.set(cls.id, { cls, subjectIds: [], homeroom: true });
  }
  return [...map.values()].sort((a, b) => a.cls.grade - b.cls.grade || a.cls.letter.localeCompare(b.cls.letter));
}

export function teacherHasClass(db: Database, teacherId: string, classId: string) {
  return teacherClasses(db, teacherId).some((c) => c.cls.id === classId);
}

export function teacherTeaches(db: Database, teacherId: string, classId: string, subjectId: string) {
  return db.teachings.some((t) => t.teacherId === teacherId && t.classId === classId && t.subjectId === subjectId);
}

export function teacherCanSeeStudent(db: Database, teacherId: string, studentId: string) {
  const s = idx(db).users.get(studentId);
  return !!s?.classId && teacherHasClass(db, teacherId, s.classId);
}

/** Sinfdagi fanlar va ularni o'qitadigan ustozlar */
export function classSubjects(db: Database, cls: SchoolClass) {
  const { users } = idx(db);
  const subjects = subjectsForGrade(cls.grade).map((s) => s.id);
  const extra = db.teachings.filter((t) => t.classId === cls.id && !subjects.includes(t.subjectId)).map((t) => t.subjectId);
  return [...subjects, ...extra].map((sid) => {
    const t = db.teachings.find((x) => x.classId === cls.id && x.subjectId === sid);
    return { subject: getSubject(sid), teacher: t ? users.get(t.teacherId) : undefined };
  });
}

/* ---------------- o'quvchi / ota-ona ---------------- */
export function childrenOf(db: Database, parent: User): User[] {
  const { users } = idx(db);
  return (parent.childIds ?? []).map((id) => users.get(id)).filter((u): u is User => !!u);
}

export function parentsOf(db: Database, student: User): User[] {
  const { users } = idx(db);
  return (student.parentIds ?? []).map((id) => users.get(id)).filter((u): u is User => !!u);
}

/** Foydalanuvchi shu o'quvchi ma'lumotini ko'ra oladimi */
export function canViewStudent(db: Database, viewer: User, studentId: string) {
  if (viewer.role === "admin") return true;
  if (viewer.role === "student") return viewer.id === studentId;
  if (viewer.role === "parent") return (viewer.childIds ?? []).includes(studentId);
  if (viewer.role === "teacher") return teacherCanSeeStudent(db, viewer.id, studentId);
  return false;
}

export function assignmentsForClass(db: Database, classId: string) {
  return db.assignments.filter((a) => a.classId === classId).sort((a, b) => b.dueAt.localeCompare(a.dueAt));
}

export function submissionOf(db: Database, assignmentId: string, studentId: string) {
  return idx(db).subsByAssignment.get(assignmentId)?.find((s) => s.studentId === studentId);
}

/* ---------------- chat kontaktlari ---------------- */
export function contactsFor(db: Database, user: User): User[] {
  const { users } = idx(db);
  const out = new Map<string, User>();
  const addTeachersOfClass = (classId: string) => {
    for (const t of db.teachings) if (t.classId === classId) { const u = users.get(t.teacherId); if (u) out.set(u.id, u); }
    const hr = idx(db).classes.get(classId)?.homeroomTeacherId;
    if (hr && users.get(hr)) out.set(hr, users.get(hr)!);
  };
  if (user.role === "student" && user.classId) addTeachersOfClass(user.classId);
  if (user.role === "parent") for (const c of childrenOf(db, user)) if (c.classId) addTeachersOfClass(c.classId);
  if (user.role === "teacher") {
    for (const { cls } of teacherClasses(db, user.id)) {
      for (const s of studentsOf(db, cls.id)) {
        out.set(s.id, s);
        for (const p of parentsOf(db, s)) out.set(p.id, p);
      }
    }
    for (const u of db.users) if (u.role === "admin") out.set(u.id, u);
  }
  if (user.role === "admin") for (const u of db.users) if (u.role === "teacher") out.set(u.id, u);
  out.delete(user.id);
  return [...out.values()];
}

/** Ustoz tekshirishi kerak bo'lgan (status=submitted) ishlar */
export function pendingReviews(db: Database, teacherId: string) {
  const { assignments } = idx(db);
  return db.submissions
    .filter((s) => {
      if (s.status !== "submitted") return false;
      const a = assignments.get(s.assignmentId);
      return !!a && teacherTeaches(db, teacherId, a.classId, a.subjectId);
    })
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export function canMessage(db: Database, from: User, toId: string) {
  return contactsFor(db, from).some((u) => u.id === toId);
}

/* ---------------- fayllar ---------------- */
export function canViewFile(db: Database, viewer: User, file: FileMeta) {
  if (file.ownerId === viewer.id || viewer.role === "admin") return true;
  if (file.scope === "class" && file.classId) {
    if (viewer.role === "student") return viewer.classId === file.classId;
    if (viewer.role === "teacher") return teacherHasClass(db, viewer.id, file.classId);
    if (viewer.role === "parent") return childrenOf(db, viewer).some((c) => c.classId === file.classId);
  }
  // shaxsiy fayl (masalan uy ishi rasmi): egasi o'quvchi bo'lsa — uning ustozlari va ota-onasi
  const owner = idx(db).users.get(file.ownerId);
  if (owner?.role === "student") return canViewStudent(db, viewer, owner.id);
  // ustoz tekshirgan (belgilangan) rasm: shu rasm biriktirilgan topshiriq egasi ko'ra oladi
  const sub = db.submissions.find((s) => s.annotatedFileIds?.includes(file.id) || s.fileIds.includes(file.id));
  if (sub) return canViewStudent(db, viewer, sub.studentId);
  const mat = db.materials.find((m) => m.fileIds.includes(file.id));
  const asg = db.assignments.find((a) => a.fileIds.includes(file.id)) ?? mat;
  if (asg) {
    if (viewer.role === "student") return viewer.classId === asg.classId;
    if (viewer.role === "parent") return childrenOf(db, viewer).some((c) => c.classId === asg.classId);
    if (viewer.role === "teacher") return teacherHasClass(db, viewer.id, asg.classId);
  }
  return false;
}
