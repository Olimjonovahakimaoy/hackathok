import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Database } from "./types";
import { createSeed } from "./seed";
export { newId } from "./ids";

/**
 * Oddiy, ishonchli fayl-bazali ombor.
 *  - O'qish: xotiradagi kesh (fayl mtime o'zgarsa qayta o'qiladi)
 *  - Yozish: navbat (mutex) + atomik yozish (tmp fayl → rename)
 * Katta maktablar uchun shu modul interfeysini (readDb / mutate) saqlagan holda
 * PostgreSQL'ga o'tkazish mumkin — sahifalar o'zgarmaydi.
 */

/** Netlify / AWS Lambda / Vercel: fayl tizimi faqat o'qish uchun, yozish faqat tmp papkada mumkin */
export const IS_SERVERLESS = Boolean(
  process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.VERCEL,
);

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : IS_SERVERLESS
    ? path.join(os.tmpdir(), "smartschool-data")
    : path.join(process.cwd(), "data");
export const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

type Store = { data: Database | null; mtimeMs: number; queue: Promise<unknown> };
const g = globalThis as unknown as { __smartschoolStore?: Store };
const store: Store = (g.__smartschoolStore ??= { data: null, mtimeMs: 0, queue: Promise.resolve() });

export function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function writeAtomic(db: Database) {
  ensureDirs();
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  try {
    fs.renameSync(tmp, DB_FILE);
  } catch (e) {
    // Windows'da antivirus/indeksator faylni ushlab tursa rename EPERM berishi mumkin
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES") throw e;
    fs.copyFileSync(tmp, DB_FILE);
    fs.rmSync(tmp, { force: true });
  }
  const st = fs.statSync(DB_FILE);
  store.data = db;
  store.mtimeMs = st.mtimeMs;
}

export function saveDb(db: Database) {
  writeAtomic(db);
}

export function dbExists() {
  return fs.existsSync(DB_FILE);
}

/** Bazani o'qish (faqat o'qish uchun! natijani o'zgartirmang). */
export function readDb(): Database {
  if (store.data && store.mtimeMs === 0) return store.data; // faqat xotirada ishlayotgan demo
  if (!fs.existsSync(DB_FILE)) {
    // Birinchi ishga tushishda avtomatik demo ma'lumotlar
    const { db, credentials } = createSeed();
    try {
      writeAtomic(db);
      writeCredentialsCsv(credentials);
    } catch {
      // Yozib bo'lmasa ham demo xotirada ishlayveradi
      store.data = db;
      store.mtimeMs = 0;
    }
    return db;
  }
  const st = fs.statSync(DB_FILE);
  if (store.data && st.mtimeMs === store.mtimeMs) return store.data;
  const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
  store.data = parsed;
  store.mtimeMs = st.mtimeMs;
  return parsed;
}

/**
 * Bazani o'zgartirish. Barcha yozuvlar navbat bilan bajariladi,
 * xatolik bo'lsa baza o'zgarmaydi.
 */
export function mutate<T>(fn: (db: Database) => T): Promise<T> {
  const run = async () => {
    const draft = structuredClone(readDb());
    const result = fn(draft);
    try {
      writeAtomic(draft);
    } catch (e) {
      if (!IS_SERVERLESS) throw e;
      store.data = draft; // serverlessda diskka yozilmasa ham xotirada saqlaymiz
      store.mtimeMs = 0;
    }
    return result;
  };
  const next = store.queue.then(run, run);
  store.queue = next.catch(() => undefined);
  return next;
}

export function writeCredentialsCsv(
  rows: { role: string; fullName: string; className: string; login: string; password: string }[],
) {
  ensureDirs();
  const header = "rol,ism_familiya,sinf,login,parol";
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const body = rows
    .map((r) => [r.role, r.fullName, r.className, r.login, r.password].map(esc).join(","))
    .join("\n");
  fs.writeFileSync(path.join(/*turbopackIgnore: true*/ DATA_DIR, "credentials.csv"), "﻿" + header + "\n" + body + "\n");
}
