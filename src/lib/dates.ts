export const TZ = "Asia/Tashkent";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Toshkent vaqti bo'yicha YYYY-MM-DD */
export function localDate(d: Date | string | number = new Date()): string {
  return dayFmt.format(new Date(d));
}

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return dt.toISOString().slice(0, 10);
}

/** 0 = yakshanba ... 6 = shanba */
export function weekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export const isSchoolDay = (ymd: string) => {
  const w = weekday(ymd);
  return w >= 1 && w <= 5;
};

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const WEEKDAYS_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

export function fmtDay(ymd: string, opts: { weekday?: boolean; short?: boolean } = {}) {
  const [, m, d] = ymd.split("-").map(Number);
  const base = `${d}-${opts.short ? MONTHS_SHORT[m - 1] : MONTHS[m - 1]}`;
  return opts.weekday ? `${WEEKDAYS[weekday(ymd)]}, ${base}` : base;
}

export function weekdayShort(ymd: string) {
  return WEEKDAYS_SHORT[weekday(ymd)];
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

export function fmtTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

export function fmtDateTime(iso: string) {
  return `${fmtDay(localDate(iso))}, ${fmtTime(iso)}`;
}

/** "2 kundan keyin", "bugun 18:00 gacha", "3 kun kechikdi" */
export function relativeDue(iso: string, now = new Date()): { text: string; tone: "ok" | "soon" | "late" } {
  const due = new Date(iso).getTime();
  const diffH = (due - now.getTime()) / 36e5;
  if (diffH < 0) {
    const days = Math.floor(-diffH / 24);
    return { text: days >= 1 ? `${days} kun o'tdi` : "muddat o'tdi", tone: "late" };
  }
  const today = localDate(now);
  const dueDay = localDate(iso);
  if (dueDay === today) return { text: `bugun ${fmtTime(iso)} gacha`, tone: "soon" };
  if (dueDay === addDays(today, 1)) return { text: `ertaga ${fmtTime(iso)} gacha`, tone: "soon" };
  const days = Math.round(diffH / 24);
  return { text: `${days} kun qoldi`, tone: "ok" };
}

/** Toshkent vaqtidagi sana+soatni ISO ga aylantirish (UTC+5, yozgi vaqt yo'q) */
export function tashkentToIso(ymd: string, hhmm = "18:00") {
  return new Date(`${ymd}T${hhmm}:00+05:00`).toISOString();
}

export function ageFrom(birthDate?: string) {
  if (!birthDate) return undefined;
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
