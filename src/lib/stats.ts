import type { AttendanceStatus, Database, Grade, SchoolClass, User } from "./types";
import { idx, studentsOf } from "./access";

/* ================================================================== */
/*  REYTING                                                            */
/*  Jami 100 ball:                                                     */
/*    • Baholar o'rtachasi ............ 50 ball  (o'rtacha / 5 × 50)   */
/*    • Uy ishlarini bajarish ......... 30 ball  (o'z vaqtida = 1,     */
/*                                         kechikkan = 0.5, yo'q = 0)  */
/*    • Vazifa/test natijalari ........ 20 ball  (tekshirilgan ishlar  */
/*                                         o'rtacha foizi × 20)        */
/* ================================================================== */
export const RATING_WEIGHTS = { grades: 50, homework: 30, tasks: 20 };

export interface RatingRow {
  studentId: string;
  classId: string;
  total: number;
  gradeAvg: number | null;
  gradesCount: number;
  gradePts: number;
  hwDone: number;
  hwLate: number;
  hwTotal: number;
  hwPts: number;
  taskAvgPct: number | null;
  taskPts: number;
  rank: number;
  classRank: number;
}

const ratingCache = new WeakMap<Database, { at: number; rows: Map<string, RatingRow> }>();
const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeRatings(db: Database, now = new Date()): Map<string, RatingRow> {
  const cached = ratingCache.get(db);
  if (cached && now.getTime() - cached.at < 60_000) return cached.rows;
  const { subsByStudent, assignments } = idx(db);
  const gradesByStudent = new Map<string, Grade[]>();
  for (const g of db.grades) (gradesByStudent.get(g.studentId) ?? gradesByStudent.set(g.studentId, []).get(g.studentId)!).push(g);
  const dueByClass = new Map<string, string[]>();
  for (const a of db.assignments) {
    if (a.kind === "classwork") continue;
    if (new Date(a.dueAt) > now) continue;
    (dueByClass.get(a.classId) ?? dueByClass.set(a.classId, []).get(a.classId)!).push(a.id);
  }

  const rows = new Map<string, RatingRow>();
  for (const s of db.users) {
    if (s.role !== "student" || !s.classId) continue;
    const gs = gradesByStudent.get(s.id) ?? [];
    const gradeAvg = gs.length ? gs.reduce((a, g) => a + g.value, 0) / gs.length : null;
    const gradePts = gradeAvg ? (gradeAvg / 5) * RATING_WEIGHTS.grades : 0;

    const subs = subsByStudent.get(s.id) ?? [];
    const subByA = new Map(subs.map((x) => [x.assignmentId, x]));
    const dueIds = new Set(dueByClass.get(s.classId) ?? []);
    // muddati kelmagan, lekin topshirilganlarni ham hisobga olamiz (rag'bat)
    for (const x of subs) if (assignments.get(x.assignmentId)?.classId === s.classId) dueIds.add(x.assignmentId);
    let done = 0, late = 0;
    for (const id of dueIds) {
      const sub = subByA.get(id);
      if (!sub) continue;
      if (sub.late) late++;
      else done++;
    }
    const hwTotal = dueIds.size;
    const hwPts = hwTotal ? ((done + late * 0.5) / hwTotal) * RATING_WEIGHTS.homework : 0;

    const graded = subs.filter((x) => x.status === "graded");
    const pcts = graded.map((x) => (x.maxScore ? (x.score ?? 0) / x.maxScore : (x.grade ?? 0) / 5));
    const taskAvgPct = pcts.length ? (pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100 : null;
    const taskPts = taskAvgPct !== null ? (taskAvgPct / 100) * RATING_WEIGHTS.tasks : 0;

    rows.set(s.id, {
      studentId: s.id,
      classId: s.classId,
      total: round1(gradePts + hwPts + taskPts),
      gradeAvg: gradeAvg !== null ? Math.round(gradeAvg * 100) / 100 : null,
      gradesCount: gs.length,
      gradePts: round1(gradePts),
      hwDone: done,
      hwLate: late,
      hwTotal,
      hwPts: round1(hwPts),
      taskAvgPct: taskAvgPct !== null ? Math.round(taskAvgPct) : null,
      taskPts: round1(taskPts),
      rank: 0,
      classRank: 0,
    });
  }
  const cmp = (a: RatingRow, b: RatingRow) => b.total - a.total || (b.gradeAvg ?? 0) - (a.gradeAvg ?? 0);
  const all = [...rows.values()].sort(cmp);
  all.forEach((r, i) => (r.rank = i > 0 && all[i - 1].total === r.total ? all[i - 1].rank : i + 1));
  const byClass = new Map<string, RatingRow[]>();
  for (const r of all) (byClass.get(r.classId) ?? byClass.set(r.classId, []).get(r.classId)!).push(r);
  for (const list of byClass.values()) list.forEach((r, i) => (r.classRank = i > 0 && list[i - 1].total === r.total ? list[i - 1].classRank : i + 1));
  ratingCache.set(db, { at: now.getTime(), rows });
  return rows;
}

export function classRating(db: Database, classId: string) {
  const rows = computeRatings(db);
  return studentsOf(db, classId)
    .map((s) => ({ student: s, row: rows.get(s.id)! }))
    .sort((a, b) => a.row.classRank - b.row.classRank);
}

export function schoolRating(db: Database, filter?: (c: SchoolClass) => boolean) {
  const rows = computeRatings(db);
  const { users, classes } = idx(db);
  return [...rows.values()]
    .filter((r) => !filter || filter(classes.get(r.classId)!))
    .sort((a, b) => a.rank - b.rank)
    .map((row) => ({ student: users.get(row.studentId)!, cls: classes.get(row.classId)!, row }));
}

export function classesLeaderboard(db: Database) {
  const rows = computeRatings(db);
  return db.classes
    .map((cls) => {
      const list = studentsOf(db, cls.id).map((s) => rows.get(s.id)!).filter(Boolean);
      const avg = list.length ? list.reduce((a, r) => a + r.total, 0) / list.length : 0;
      const gradeAvg = list.filter((r) => r.gradeAvg).reduce((a, r, _, arr) => a + (r.gradeAvg ?? 0) / arr.length, 0);
      const hw = list.reduce((a, r) => a + r.hwDone + r.hwLate, 0) / Math.max(1, list.reduce((a, r) => a + r.hwTotal, 0));
      return { cls, avg: round1(avg), gradeAvg: Math.round(gradeAvg * 100) / 100, hwRate: Math.round(hw * 100), students: list.length };
    })
    .sort((a, b) => b.avg - a.avg);
}

/* ================================================================== */
/*  BAHOLAR                                                            */
/* ================================================================== */
export function gradesOf(db: Database, studentId: string) {
  return db.grades.filter((g) => g.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function avg(values: number[]) {
  return values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null;
}

export function gradesBySubject(db: Database, studentId: string) {
  const map = new Map<string, Grade[]>();
  for (const g of gradesOf(db, studentId)) (map.get(g.subjectId) ?? map.set(g.subjectId, []).get(g.subjectId)!).push(g);
  return map;
}

/* ================================================================== */
/*  DAVOMAT                                                            */
/* ================================================================== */
export interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  rate: number; // %
  days: { date: string; status: AttendanceStatus }[];
}

export function attendanceOf(db: Database, student: User): AttendanceSummary {
  const days = db.attendance
    .filter((d) => d.classId === student.classId && d.marks[student.id])
    .map((d) => ({ date: d.date, status: d.marks[student.id] }))
    .sort((a, b) => b.date.localeCompare(a.date));
  const count = (s: AttendanceStatus) => days.filter((d) => d.status === s).length;
  const present = count("present"), late = count("late"), absent = count("absent"), excused = count("excused");
  const total = days.length;
  return { present, late, absent, excused, total, rate: total ? Math.round(((present + late) / total) * 100) : 100, days };
}

export function classAttendanceRate(db: Database, classId: string, date?: string) {
  const days = db.attendance.filter((d) => d.classId === classId && (!date || d.date === date));
  let p = 0, t = 0;
  for (const d of days) for (const st of Object.values(d.marks)) { t++; if (st === "present" || st === "late") p++; }
  return t ? Math.round((p / t) * 100) : null;
}
