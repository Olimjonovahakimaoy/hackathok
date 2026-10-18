import { AppShell } from "@/components/AppShell";
import type { NavItem } from "@/components/NavLinks";
import { getParentCtx } from "@/lib/context";
import { unreadCount } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, db, children: kids } = await getParentCtx();
  const nav: NavItem[] = [
    { href: "/parent", label: "Farzandlarim", icon: "home", exact: true },
    ...kids.map((k) => ({ href: `/parent/child/${k.id}`, label: `${k.firstName}`, icon: "user" as const })),
    { href: "/parent/chat", label: "Ustozlar bilan aloqa", icon: "message", badge: unreadCount(db, user.id) },
  ];
  return (
    <AppShell user={user} subtitle={`${user.position ?? "Ota-ona"} · ${kids.length} farzand`} nav={nav} theme="staff" home="/parent">
      {children}
    </AppShell>
  );
}
