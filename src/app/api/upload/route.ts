import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mutate, newId, readDb } from "@/lib/db";
import { MAX_UPLOAD_BYTES, safeName, sniff, writeUpload } from "@/lib/files";
import { rateLimit } from "@/lib/ratelimit";
import { teacherHasClass } from "@/lib/access";
import type { FileMeta } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });

  const rl = rateLimit(`upload:${user.id}`, 80, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Juda ko'p fayl yuklandi. Birozdan so'ng urinib ko'ring." }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Fayl bo'sh" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Fayl hajmi 10 MB dan oshmasin" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return NextResponse.json({ error: "Faqat rasm (JPG, PNG, WEBP) yoki PDF yuklash mumkin" }, { status: 415 });

  // Ustoz sinf uchun material yuklasa — sinfdagilar ko'ra oladi
  const scopeReq = String(form.get("scope") ?? "private");
  const classId = String(form.get("classId") ?? "");
  let scope: FileMeta["scope"] = "private";
  if (scopeReq === "class" && user.role === "teacher" && classId && teacherHasClass(readDb(), user.id, classId)) scope = "class";

  const id = newId("fil");
  writeUpload(id, kind.ext, bytes);
  const meta: FileMeta = {
    id,
    ownerId: user.id,
    name: safeName(file.name || `fayl.${kind.ext}`),
    mime: kind.mime,
    size: bytes.length,
    createdAt: new Date().toISOString(),
    scope,
    classId: scope === "class" ? classId : undefined,
  };
  await mutate((db) => {
    db.files.push(meta);
  });
  return NextResponse.json({ id, name: meta.name, mime: meta.mime, size: meta.size });
}
