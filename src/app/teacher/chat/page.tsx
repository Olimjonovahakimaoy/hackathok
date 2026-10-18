import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { ChatPage } from "@/components/chat/ChatPage";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function TeacherChat({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { with: withId } = await searchParams;
  const { user, db } = await getTeacherCtx();
  return (
    <div>
      <PageHeader title="Xabarlar" subtitle="O'quvchilar va ota-onalar bilan to'g'ridan-to'g'ri yozishma." />
      <ChatPage db={db} user={user} withId={withId} basePath="/teacher/chat" />
    </div>
  );
}
