import type { SchoolClass } from "./types";
import { addDays, localDate, weekday } from "./dates";

const START_MIN = 8 * 60; // 08:00
const LESSON = 45;
const BREAK = 10;

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function lessonTime(index: number) {
  const s = START_MIN + index * (LESSON + BREAK) + (index >= 3 ? 10 : 0); // 3-darsdan keyin katta tanaffus
  return { start: hhmm(s), end: hhmm(s + LESSON) };
}

/** Bugungi yoki keyingi o'quv kunining jadvali */
export function scheduleFor(cls: SchoolClass, from = localDate()) {
  const w = weekday(from);
  const isToday = w >= 1 && w <= 5;
  let day = from;
  if (!isToday) {
    for (let i = 1; i <= 3; i++) {
      const d = addDays(from, i);
      const wd = weekday(d);
      if (wd >= 1 && wd <= 5) { day = d; break; }
    }
  }
  const lessons = cls.timetable[weekday(day) - 1] ?? [];
  return { day, isToday, lessons: lessons.map((subjectId, i) => ({ subjectId, ...lessonTime(i) })) };
}

export function currentLessonIndex(lessons: { start: string; end: string }[], now = new Date()) {
  const t = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  return lessons.findIndex((l) => t >= l.start && t < l.end);
}
