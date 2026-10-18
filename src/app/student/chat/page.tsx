import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { ChatPage } from "@/components/chat/ChatPage";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function StudentChat({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { with: withId } = await searchParams;
  const { user, db, kids } = await getStudentCtx();
  return (
    <div>
      <PageHeader title={kids ? "Ustozga yozish 💬" : "Xabarlar"} subtitle="Ustozlaringiz bilan to'g'ridan-to'g'ri yozishing." />
      <ChatPage db={db} user={user} withId={withId} basePath="/student/chat" />
    </div>
  );
}
