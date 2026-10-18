import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR, ensureDirs } from "./db";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/gif", ext: "gif", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  { mime: "application/pdf", ext: "pdf", test: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
];

/** Fayl turini kengaytma emas, ichidagi baytlar bo'yicha aniqlaymiz */
export function sniff(bytes: Uint8Array) {
  return SIGNATURES.find((s) => s.test(bytes)) ?? null;
}

export function storagePath(id: string, ext: string) {
  return path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, `${id}.${ext}`);
}

export function writeUpload(id: string, ext: string, bytes: Uint8Array) {
  ensureDirs();
  fs.writeFileSync(storagePath(id, ext), bytes);
}

export function extFromMime(mime: string) {
  return SIGNATURES.find((s) => s.mime === mime)?.ext ?? "bin";
}

export function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|\r\n]+/g, "_").slice(0, 120) || "fayl";
}
