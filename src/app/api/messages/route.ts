import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mutate, newId, readDb } from "@/lib/db";
import { canMessage } from "@/lib/access";
import { threadIdFor } from "@/lib/threads";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  const url = new URL(req.url);
  const withId = url.searchParams.get("with") ?? "";
  const after = url.searchParams.get("after") ?? "";
  const db = readDb();
  if (!canMessage(db, user, withId)) return NextResponse.json({ error: "Bu foydalanuvchiga yozib bo'lmaydi" }, { status: 403 });
  const tid = threadIdFor(user.id, withId);
  const list = db.messages.filter((m) => m.threadId === tid && (!after || m.createdAt > after));
  if (list.some((m) => m.senderId !== user.id && !m.readAt)) {
    const at = new Date().toISOString();
    await mutate((d) => {
      for (const m of d.messages) if (m.threadId === tid && m.senderId !== user.id && !m.readAt) m.readAt = at;
    });
  }
  return NextResponse.json({
    messages: list.map((m) => ({ id: m.id, mine: m.senderId === user.id, text: m.text, createdAt: m.createdAt, read: !!m.readAt })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { to?: string; text?: string } | null;
  const to = String(body?.to ?? "");
  const text = String(body?.text ?? "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "Xabar bo'sh" }, { status: 400 });
  if (!rateLimit(`msg:${user.id}`, 30, 60 * 1000).ok) return NextResponse.json({ error: "Juda tez yozyapsiz, biroz kuting" }, { status: 429 });
  if (!canMessage(readDb(), user, to)) return NextResponse.json({ error: "Bu foydalanuvchiga yozib bo'lmaydi" }, { status: 403 });
  const msg = { id: newId("msg"), threadId: threadIdFor(user.id, to), senderId: user.id, text, createdAt: new Date().toISOString() };
  await mutate((db) => {
    db.messages.push(msg);
  });
  return NextResponse.json({ message: { id: msg.id, mine: true, text: msg.text, createdAt: msg.createdAt, read: false } });
}
