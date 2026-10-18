"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  emoji?: string;
  badge?: number;
  exact?: boolean;
}

export function NavLinks({ items, kids, onNavigate }: { items: NavItem[]; kids?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] font-semibold transition ${
                active ? "bg-cream text-night shadow-[0_3px_0_rgba(0,0,0,0.15)]" : "text-cream/85 hover:bg-white/10 hover:text-cream"
              }`}
            >
              {kids && it.emoji ? (
                <span className="grid size-7 place-items-center text-xl" aria-hidden="true">{it.emoji}</span>
              ) : (
                <Icon name={it.icon} size={20} className={active ? "text-sky" : "text-cream/70 group-hover:text-cream"} />
              )}
              <span className="flex-1">{it.label}</span>
              {!!it.badge && (
                <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${active ? "bg-daisy text-white" : "bg-daisy text-white"}`}>{it.badge > 99 ? "99+" : it.badge}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
