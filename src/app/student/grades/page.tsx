import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { GradesView } from "@/components/views/GradesView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Baholar" };

export default async function GradesPage() {
  const { user, db, kids } = await getStudentCtx();
  return (
    <div>
      <PageHeader title={kids ? "Baholarim ⭐" : "Baholar jurnali"} subtitle="Darsdagi javoblar, uy ishlari, testlar va nazorat ishlari baholari." />
      <GradesView db={db} student={user} kids={kids} />
    </div>
  );
}
