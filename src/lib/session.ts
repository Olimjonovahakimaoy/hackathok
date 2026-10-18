import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./types";

export const SESSION_COOKIE = "ss_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 kun

const g = globalThis as unknown as { __ssSecret?: Uint8Array };

/** AUTH_SECRET muhit o'zgaruvchisi, bo'lmasa data/.auth-secret (avtomatik yaratiladi) */
function secretKey(): Uint8Array {
  if (g.__ssSecret) return g.__ssSecret;
  let secret = process.env.AUTH_SECRET;
  const serverless = Boolean(
    process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.VERCEL,
  );
  if (!secret || secret.length < 32) {
    if (serverless) {
      // Serverlessda har bir nusxa alohida ishlaydi — tasodifiy kalit sessiyani buzadi.
      // Demo uchun qat'iy kalit; real foydalanishda Netlify'da AUTH_SECRET ni albatta qo'ying!
      secret = "smartschool-demo-secret-CHANGE-ME-set-AUTH_SECRET-in-netlify";
    } else {
      const dir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
      const file = path.join(dir, ".auth-secret");
      fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(file)) secret = fs.readFileSync(file, "utf8").trim();
      else {
        secret = crypto.randomBytes(48).toString("base64url");
        fs.writeFileSync(file, secret, { mode: 0o600 });
      }
    }
  }
  g.__ssSecret = new TextEncoder().encode(secret);
  return g.__ssSecret;
}

/** Parol o'zgarsa eski sessiyalar bekor bo'lishi uchun */
export function passwordFingerprint(passwordHash: string) {
  return crypto.createHash("sha256").update(passwordHash).digest("base64url").slice(0, 12);
}

export interface SessionPayload {
  sub: string;
  role: Role;
  pf: string;
}

export async function signSession(p: SessionPayload) {
  return new SignJWT({ role: p.role, pf: p.pf })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.role !== "string" || typeof payload.pf !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role, pf: payload.pf };
  } catch {
    return null;
  }
}

export function homeFor(role: Role) {
  return { admin: "/admin", teacher: "/teacher", student: "/student", parent: "/parent" }[role];
}
