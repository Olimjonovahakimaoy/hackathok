import type { Assignment, Database, Submission, User } from "./types";
import { assignmentsForClass, submissionOf } from "./access";

export type DerivedStatus = "pending" | "missing" | "submitted" | "graded" | "returned";

export interface StudentAssignment {
  a: Assignment;
  sub?: Submission;
  status: DerivedStatus;
  overdue: boolean;
  canSubmit: boolean;
}

export function deriveStatus(a: Assignment, sub: Submission | undefined, now = new Date()): StudentAssignment {
  const overdue = new Date(a.dueAt) < now;
  let status: DerivedStatus;
  if (sub) status = sub.status;
  else status = overdue ? "missing" : "pending";
  const canSubmit =
    (!sub && (!overdue || a.allowLate)) ||
    (sub?.status === "returned" && (!overdue || a.allowLate)) ||
    (sub?.status === "submitted" && a.kind !== "test" && (!overdue || a.allowLate));
  return { a, sub, status, overdue, canSubmit };
}

export function studentAssignments(db: Database, student: User, now = new Date()): StudentAssignment[] {
  if (!student.classId) return [];
  return assignmentsForClass(db, student.classId).map((a) => deriveStatus(a, submissionOf(db, a.id, student.id), now));
}

/** "Bajarilishi kerak" — topshirilmagan va hali topshirish mumkin bo'lganlar */
export function todoCount(list: StudentAssignment[]) {
  return list.filter((x) => (x.status === "pending" || x.status === "returned" || (x.status === "missing" && x.canSubmit && !isStale(x))) ).length;
}

/** 14 kundan oshgan qarzlar ro'yxatni to'ldirmasin */
export function isStale(x: StudentAssignment, now = new Date()) {
  return now.getTime() - new Date(x.a.dueAt).getTime() > 14 * 864e5;
}
