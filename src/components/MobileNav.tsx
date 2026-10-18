"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { NavLinks, type NavItem } from "./NavLinks";
import { Logo } from "./Brand";

export function MobileNav({ items, kids, footer, title }: { items: NavItem[]; kids?: boolean; footer: React.ReactNode; title: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  const unread = items.reduce((a, i) => a + (i.badge ?? 0), 0);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-night px-4 py-3 text-cream shadow-md lg:hidden">
        <Logo compact />
        <span className="truncate px-3 font-round text-base font-semibold">{title}</span>
        <button onClick={() => setOpen(true)} className="relative rounded-xl p-2 hover:bg-white/10" aria-label="Menyuni ochish">
          <Icon name="menu" size={22} />
          {unread > 0 && <span className="absolute top-1 right-1 size-2.5 rounded-full bg-daisy" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-night-deep/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Yopish" />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-night p-4 text-cream shadow-2xl animate-pop">
            <div className="mb-5 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-white/10" aria-label="Yopish">
                <Icon name="x" />
              </button>
            </div>
            <div className="thin-scroll flex-1 overflow-y-auto">
              <NavLinks items={items} kids={kids} onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">{footer}</div>
          </div>
        </div>
      )}
    </>
  );
}
