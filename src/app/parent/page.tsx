import type { Metadata } from "next";
import { getParentCtx } from "@/lib/context";
import { ChildSummary } from "@/components/views/ChildSummary";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Farzandlarim" };

export default async function ParentHome() {
  const { user, db, children } = await getParentCtx();
  return (
    <div>
      <PageHeader title={`Assalomu alaykum, ${user.firstName}!`} subtitle="Farzandlaringizning baholari, uy ishlari va davomati — real vaqtda." />
      {children.length === 0 ? (
        <EmptyState title="Farzand biriktirilmagan" text="Maktab ma'muriyatiga murojaat qiling." />
      ) : (
        <div className="space-y-6">{children.map((c) => <ChildSummary key={c.id} db={db} child={c} />)}</div>
      )}
    </div>
  );
}
