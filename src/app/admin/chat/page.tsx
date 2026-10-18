import type { Metadata } from "next";
import { getAdminCtx } from "@/lib/context";
import { ChatPage } from "@/components/chat/ChatPage";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Xabarlar" };

export default async function AdminChat({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { with: withId } = await searchParams;
  const { user, db } = await getAdminCtx();
  return (
    <div>
      <PageHeader title="Xabarlar" subtitle="Ustozlar bilan yozishma." />
      <ChatPage db={db} user={user} withId={withId} basePath="/admin/chat" />
    </div>
  );
}
