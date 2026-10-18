import crypto from "node:crypto";

/**
 * Seed rejimida ID va parollar deterministik bo'ladi: serverless (Netlify) da har bir
 * server nusxasi bazani o'zi yaratadi, ID lar mos kelmasa sessiya yaroqsiz bo'lib qoladi.
 */
let seedMode = false;
let seedCounter = 0;
let seedState = 123456789;
export function setSeedMode(on: boolean) {
  seedMode = on;
  seedCounter = 0;
  seedState = 123456789;
}
function seedRandom() {
  seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
  return seedState / 4294967296;
}

export function newId(prefix: string) {
  if (seedMode) return `${prefix}_${(++seedCounter).toString(36).padStart(6, "0")}seed`;
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

/** Odam o'qiy oladigan, adashtirmaydigan belgilar bilan parol (0/O, 1/l yo'q) */
export function generatePassword(length = 8) {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = letters + upper + digits;
  const randInt = (n: number) => (seedMode ? Math.floor(seedRandom() * n) : crypto.randomInt(n));
  const pick = (set: string) => set[randInt(set.length)];
  const chars = [pick(upper), pick(digits), pick(letters)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
