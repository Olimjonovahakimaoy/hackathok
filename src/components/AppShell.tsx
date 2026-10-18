import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, Landscape } from "./Brand";
import { Icon } from "./Icon";
import { Avatar } from "./ui";
import { NavLinks, type NavItem } from "./NavLinks";
import { MobileNav } from "./MobileNav";
import { logoutAction } from "@/app/actions/auth";
import type { User } from "@/lib/types";

export type Theme = "kids" | "pro" | "staff";

function UserFooter({ user, subtitle }: { user: User; subtitle: string }) {
  return (
    <div className="space-y-2">
      <Link href="/account" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/10">
        <Avatar user={user} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-cream">{user.firstName} {user.lastName}</span>
          <span className="block truncate text-xs text-cream/70">{subtitle}</span>
        </span>
        <Icon name="settings" size={18} className="text-cream/60" />
      </Link>
      <form action={logoutAction}>
        <button className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-cream/75 transition hover:bg-white/10 hover:text-cream">
          <Icon name="logout" size={18} /> Chiqish
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  user,
  subtitle,
  nav,
  theme,
  home,
  children,
}: {
  user: User;
  subtitle: string;
  nav: NavItem[];
  theme: Theme;
  home: string;
  children: ReactNode;
}) {
  const kids = theme === "kids";
  const footer = <UserFooter user={user} subtitle={subtitle} />;
  return (
    <div className={kids ? "theme-kids sky-bg relative min-h-dvh" : "min-h-dvh bg-cream"}>
      {kids && <Landscape className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[30vh] w-full opacity-90 lg:left-[272px] lg:w-[calc(100%-272px)]" />}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[272px] flex-col bg-night p-5 text-cream lg:flex">
        <div className="mb-8 px-1">
          <Logo href={home} />
        </div>
        <nav className="thin-scroll -mx-1 flex-1 overflow-y-auto px-1" aria-label="Asosiy menyu">
          <NavLinks items={nav} kids={kids} />
        </nav>
        <div className="mt-4 border-t border-white/10 pt-4">{footer}</div>
      </aside>

      <MobileNav items={nav} kids={kids} footer={footer} title={subtitle} />

      <main className="relative z-10 lg:pl-[272px]">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-10">{children}</div>
      </main>
    </div>
  );
}
