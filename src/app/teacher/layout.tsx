import { AppShell } from "@/components/AppShell";
import type { NavItem } from "@/components/NavLinks";
import { getTeacherCtx } from "@/lib/context";
import { pendingReviews } from "@/lib/access";
import { unreadCount } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, db } = await getTeacherCtx();
  const nav: NavItem[] = [
    { href: "/teacher", label: "Bosh sahifa", icon: "home", exact: true },
    { href: "/teacher/classes", label: "Sinflarim", icon: "users" },
    { href: "/teacher/review", label: "Tekshirish", icon: "checkCircle", badge: pendingReviews(db, user.id).length },
    { href: "/teacher/assignments", label: "Vazifalar", icon: "clipboard" },
    { href: "/teacher/materials", label: "Materiallar", icon: "book" },
    { href: "/teacher/rating", label: "Reyting", icon: "trophy" },
    { href: "/teacher/ai", label: "AI yordamchi", icon: "sparkles" },
    { href: "/teacher/chat", label: "Xabarlar", icon: "message", badge: unreadCount(db, user.id) },
  ];
  return (
    <AppShell user={user} subtitle={user.position ?? "Ustoz"} nav={nav} theme="staff" home="/teacher">
      {children}
    </AppShell>
  );
}
