"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "../Icon";

export interface ContactItem {
  id: string;
  name: string;
  initials: string;
  sub: string;
  group: string;
  last?: string;
  lastAt?: string;
  unread: number;
  tone: string;
}

export function ContactList({ items, active, basePath }: { items: ContactItem[]; active?: string; basePath: string }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((c) => (c.name + " " + c.sub).toLowerCase().includes(s)) : items;
  }, [q, items]);
  const groups = useMemo(() => {
    const m = new Map<string, ContactItem[]>();
    for (const c of filtered) m.set(c.group, [...(m.get(c.group) ?? []), c]);
    return [...m.entries()];
  }, [filtered]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative p-3">
        <Icon name="search" size={16} className="absolute top-1/2 left-6 -translate-y-1/2 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish…" className="input pl-10" aria-label="Kontakt qidirish" />
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-soft">Topilmadi</p>}
        {groups.map(([g, list]) => (
          <div key={g} className="mb-2">
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider text-ink-soft uppercase">{g}</div>
            <ul>
              {list.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${basePath}?with=${c.id}`}
                    scroll={false}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${active === c.id ? "bg-sky-soft" : "hover:bg-cream-light"}`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full font-round text-sm font-bold text-white ${c.tone}`}>{c.initials}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{c.name}</span>
                        {c.lastAt && <span className="shrink-0 text-[11px] text-ink-soft">{c.lastAt}</span>}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-ink-soft">{c.last ?? c.sub}</span>
                        {c.unread > 0 && <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-daisy px-1 text-[11px] font-bold text-white">{c.unread}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
