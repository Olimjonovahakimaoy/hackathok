import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AI_MODEL, aiEnabled, systemPromptFor } from "@/lib/ai";
import { rateLimit } from "@/lib/ratelimit";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "student" && user.role !== "teacher")) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: "AI yordamchi hali yoqilmagan. Maktab administratori serverdagi .env fayliga ANTHROPIC_API_KEY qo'shishi kerak." },
      { status: 503 },
    );
  }
  const limit = rateLimit(`ai:${user.id}`, user.role === "teacher" ? 80 : 40, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: `Bir soatlik limit tugadi. ${Math.ceil(limit.retryInSec / 60)} daqiqadan keyin davom eting.` }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { messages?: Msg[]; subjectId?: string } | null;
  const raw = Array.isArray(body?.messages) ? body!.messages : [];
  const messages: Msg[] = raw
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-16)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 3000) }));
  // Anthropic API: birinchi xabar foydalanuvchidan bo'lishi kerak
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Savol bo'sh" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = systemPromptFor(readDb(), user, typeof body?.subjectId === "string" ? body.subjectId : undefined);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const s = client.messages.stream({ model: AI_MODEL, max_tokens: 1200, system, messages });
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(ev.delta.text));
          }
        }
      } catch (e) {
        const msg = e instanceof Anthropic.APIError ? `\n\n⚠️ AI xatosi (${e.status ?? "?"}). Keyinroq urinib ko'ring.` : "\n\n⚠️ AI bilan bog'lanib bo'lmadi.";
        console.error("[ai]", e);
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
