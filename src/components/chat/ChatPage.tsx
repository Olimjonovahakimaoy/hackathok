import Link from "next/link";
import type { Database, User } from "@/lib/types";
import { childrenOf, classLabel, contactsFor, idx } from "@/lib/access";
import { threadIdFor } from "@/lib/threads";
import { fmtDay, fmtTime, localDate } from "@/lib/dates";
import { ChatThread } from "./ChatThread";
import { ContactList, type ContactItem } from "./ContactList";
import { Icon } from "../Icon";
import { Avatar } from "../ui";

const TONES = ["bg-green", "bg-sky", "bg-daisy", "bg-night", "bg-green-dark", "bg-sky-dark", "bg-daisy-dark"];
const toneFor = (id: string) => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
};

function describe(db: Database, u: User) {
  const { classes } = idx(db);
  if (u.role === "teacher") return { sub: u.position ?? "Ustoz", group: "Ustozlar" };
  if (u.role === "student") {
    const c = classLabel(classes.get(u.classId ?? ""));
    return { sub: `${c} sinf o'quvchisi`, group: `${c} o'quvchilari` };
  }
  if (u.role === "parent") {
    const kids = childrenOf(db, u).map((k) => `${k.firstName} (${classLabel(classes.get(k.classId ?? ""))})`).join(", ");
    return { sub: `${u.position ?? "Ota-ona"}: ${kids}`, group: "Ota-onalar" };
  }
  return { sub: u.position ?? "Ma'muriyat", group: "Ma'muriyat" };
}

export function ChatPage({ db, user, withId, basePath }: { db: Database; user: User; withId?: string; basePath: string }) {
  const contacts = contactsFor(db, user);
  const today = localDate();
  const items: (ContactItem & { sortKey: string })[] = contacts.map((c) => {
    const tid = threadIdFor(user.id, c.id);
    const msgs = db.messages.filter((m) => m.threadId === tid);
    const last = msgs.at(-1);
    const d = describe(db, c);
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      initials: `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`,
      sub: d.sub,
      group: last ? "Suhbatlar" : d.group,
      last: last ? `${last.senderId === user.id ? "Siz: " : ""}${last.text}` : undefined,
      lastAt: last ? (localDate(last.createdAt) === today ? fmtTime(last.createdAt) : fmtDay(localDate(last.createdAt), { short: true })) : undefined,
      unread: msgs.filter((m) => m.senderId !== user.id && !m.readAt).length,
      tone: toneFor(c.id),
      sortKey: last ? `0${9e15 - new Date(last.createdAt).getTime()}` : `1${d.group}${c.lastName}`,
    };
  });
  items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const selected = withId ? contacts.find((c) => c.id === withId) : undefined;
  const initial = selected
    ? db.messages
        .filter((m) => m.threadId === threadIdFor(user.id, selected.id))
        .map((m) => ({ id: m.id, mine: m.senderId === user.id, text: m.text, createdAt: m.createdAt, read: !!m.readAt }))
    : [];

  return (
    <div className="card grid h-[calc(100dvh-11rem)] min-h-[520px] overflow-hidden p-0 lg:grid-cols-[340px_1fr]">
      <aside className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-ink/5`}>
        <ContactList items={items.map(({ sortKey: _s, ...rest }) => rest)} active={selected?.id} basePath={basePath} />
      </aside>
      <section className={`${selected ? "flex" : "hidden lg:flex"} min-h-0 flex-col`}>
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-ink/5 px-4 py-3">
              <Link href={basePath} className="rounded-xl p-1.5 hover:bg-cream lg:hidden" aria-label="Orqaga"><Icon name="arrowLeft" /></Link>
              <Avatar user={selected} size={40} />
              <div className="min-w-0">
                <div className="truncate font-semibold">{selected.firstName} {selected.lastName}</div>
                <div className="truncate text-xs text-ink-soft">{describe(db, selected).sub}{selected.role === "teacher" && selected.phone ? ` · ${selected.phone}` : ""}</div>
              </div>
            </header>
            <ChatThread key={selected.id} withId={selected.id} initial={initial} />
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center text-ink-soft">
            <div>
              <div className="text-5xl">💬</div>
              <p className="mt-3 font-semibold">Suhbatni tanlang</p>
              <p className="text-sm">Chap tomondan kimga yozmoqchi ekaningizni tanlang.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
