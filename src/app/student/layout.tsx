import { AppShell } from "@/components/AppShell";
import type { NavItem } from "@/components/NavLinks";
import { getStudentCtx } from "@/lib/context";
import { classLabel } from "@/lib/access";
import { unreadCount } from "@/lib/messages";
import { studentAssignments, todoCount } from "@/lib/assignments";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, db, cls, kids } = await getStudentCtx();
  const todo = todoCount(studentAssignments(db, user));
  const unread = unreadCount(db, user.id);

  const nav: NavItem[] = [
    { href: "/student", label: "Bosh sahifa", icon: "home", emoji: "🏠", exact: true },
    { href: "/student/assignments", label: kids ? "Vazifalarim" : "Vazifalar", icon: "clipboard", emoji: "📒", badge: todo },
    { href: "/student/books", label: "Darsliklar", icon: "book", emoji: "📚" },
    ...(kids ? [{ href: "/student/games", label: "O'yinlar", icon: "gamepad", emoji: "🎮" } as NavItem] : []),
    { href: "/student/grades", label: kids ? "Baholarim" : "Baholar", icon: "star", emoji: "⭐" },
    { href: "/student/rating", label: "Reyting", icon: "trophy", emoji: "🏆" },
    { href: "/student/attendance", label: "Davomat", icon: "calendar", emoji: "📅" },
    { href: "/student/ai", label: kids ? "Yordamchi" : "AI yordamchi", icon: "sparkles", emoji: "🤖" },
    { href: "/student/chat", label: kids ? "Ustozga yozish" : "Xabarlar", icon: "message", emoji: "💬", badge: unread },
  ];

  return (
    <AppShell user={user} subtitle={`${classLabel(cls)} sinf o'quvchisi`} nav={nav} theme={kids ? "kids" : "pro"} home="/student">
      {children}
    </AppShell>
  );
}
