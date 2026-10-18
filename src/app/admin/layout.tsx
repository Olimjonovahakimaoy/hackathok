import { AppShell } from "@/components/AppShell";
import type { NavItem } from "@/components/NavLinks";
import { getAdminCtx } from "@/lib/context";
import { unreadCount } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, db } = await getAdminCtx();
  const nav: NavItem[] = [
    { href: "/admin", label: "Boshqaruv paneli", icon: "chart", exact: true },
    { href: "/admin/users", label: "Foydalanuvchilar", icon: "users" },
    { href: "/admin/classes", label: "Sinflar va darslar", icon: "school" },
    { href: "/admin/rating", label: "Reyting", icon: "trophy" },
    { href: "/admin/chat", label: "Xabarlar", icon: "message", badge: unreadCount(db, user.id) },
  ];
  return (
    <AppShell user={user} subtitle={db.school.name} nav={nav} theme="staff" home="/admin">
      {children}
    </AppShell>
  );
}
