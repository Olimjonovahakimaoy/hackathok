export type Role = "admin" | "teacher" | "student" | "parent";

export interface User {
  id: string;
  role: Role;
  login: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  createdAt: string;
  /** Admin yaratgan yangi hisob birinchi kirishda parolni almashtirishi shart */
  mustChangePassword?: boolean;
  /** Oxirgi kirgan vaqt */
  lastLoginAt?: string;
  // --- o'quvchi ---
  classId?: string;
  birthDate?: string;
  gender?: "m" | "f";
  address?: string;
  parentIds?: string[];
  // --- ota-ona ---
  childIds?: string[];
  // --- ustoz ---
  subjectIds?: string[];
  position?: string;
}

/** Klientga yuboriladigan xavfsiz ko'rinish (parol xeshisiz) */
export type PublicUser = Omit<User, "passwordHash">;

export interface SchoolClass {
  id: string;
  grade: number;
  letter: string;
  homeroomTeacherId?: string;
  room?: string;
  /** Dars jadvali: 0=Dushanba ... 4=Juma, har kuni fanlar ketma-ketligi */
  timetable: string[][];
}

/** Ustoz qaysi sinfda qaysi fanni o'qitadi */
export interface Teaching {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

export type AssignmentKind = "homework" | "classwork" | "test";

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

export interface Assignment {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  kind: AssignmentKind;
  title: string;
  description: string;
  createdAt: string;
  dueAt: string;
  fileIds: string[];
  questions?: TestQuestion[];
  /** Muddatdan keyin topshirishga ruxsat */
  allowLate: boolean;
}

export type SubmissionStatus = "submitted" | "graded" | "returned";

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  text?: string;
  fileIds: string[];
  answers?: number[];
  submittedAt: string;
  late: boolean;
  status: SubmissionStatus;
  /** 2..5 */
  grade?: number;
  /** test: to'g'ri javoblar soni */
  score?: number;
  maxScore?: number;
  feedback?: string;
  mistakes?: string[];
  annotatedFileIds?: string[];
  gradedAt?: string;
  gradedBy?: string;
  attempts: number;
}

export type GradeType = "dars" | "uy_ishi" | "nazorat" | "test";

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  value: number;
  date: string; // YYYY-MM-DD
  type: GradeType;
  comment?: string;
  submissionId?: string;
  createdAt: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceDay {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  marks: Record<string, AttendanceStatus>;
  markedBy: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt?: string;
}

export interface FileMeta {
  id: string;
  ownerId: string;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
  /** darslik materiallari uchun — sinfdagi hamma ko'ra oladi */
  scope: "private" | "class";
  classId?: string;
}

export interface Material {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  body: string;
  fileIds: string[];
  createdAt: string;
}

export interface GameStat {
  studentId: string;
  stars: number;
  plays: number;
  best: Record<string, number>;
  updatedAt: string;
}

export interface Database {
  version: number;
  school: { name: string; createdAt: string };
  users: User[];
  classes: SchoolClass[];
  teachings: Teaching[];
  assignments: Assignment[];
  submissions: Submission[];
  grades: Grade[];
  attendance: AttendanceDay[];
  messages: Message[];
  files: FileMeta[];
  materials: Material[];
  gameStats: GameStat[];
}
