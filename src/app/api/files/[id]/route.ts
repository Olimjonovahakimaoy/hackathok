import fs from "node:fs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { canViewFile } from "@/lib/access";
import { extFromMime, storagePath } from "@/lib/files";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Ruxsat yo'q", { status: 401 });
  const db = readDb();
  const meta = db.files.find((f) => f.id === id);
  if (!meta || !canViewFile(db, user, meta)) return new NextResponse("Topilmadi", { status: 404 });
  const file = storagePath(meta.id, extFromMime(meta.mime));
  if (!fs.existsSync(file)) return new NextResponse("Fayl o'chirilgan", { status: 404 });
  const data = fs.readFileSync(file);
  const download = new URL(req.url).searchParams.has("download");
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": meta.mime,
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=86400",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
