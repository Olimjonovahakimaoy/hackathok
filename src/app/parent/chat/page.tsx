import type { Metadata } from "next";
import { getParentCtx } from "@/lib/context";
import { ChatPage } from "@/components/chat/ChatPage";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function ParentChat({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { with: withId } = await searchParams;
  const { user, db } = await getParentCtx();
  return (
    <div>
      <PageHeader title="Ustozlar bilan aloqa" subtitle="Farzandingizga dars beradigan barcha ustozlar." />
      <ChatPage db={db} user={user} withId={withId} basePath="/parent/chat" />
    </div>
  );
}
