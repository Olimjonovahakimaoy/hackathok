import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { AttendanceView } from "@/components/views/AttendanceView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Davomat" };

export default async function AttendancePage() {
  const { user, db, kids } = await getStudentCtx();
  return (
    <div>
      <PageHeader title={kids ? "Davomatim 📅" : "Davomat"} subtitle="Sinf rahbari har kuni belgilaydi." />
      <AttendanceView db={db} student={user} />
    </div>
  );
}
