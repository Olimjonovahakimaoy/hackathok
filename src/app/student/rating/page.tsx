import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { RatingView } from "@/components/views/RatingView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Reyting" };

export default async function RatingPage({ searchParams }: { searchParams: Promise<{ tab?: string; stage?: string }> }) {
  const { tab = "class", stage } = await searchParams;
  const { user, db, kids } = await getStudentCtx();
  return (
    <div>
      <PageHeader title={kids ? "Reyting 🏆" : "Reyting"} subtitle="Baholar, uy ishlari va vazifalar natijasiga qarab har kuni yangilanadi." />
      <RatingView db={db} student={user} tab={tab} stage={stage} basePath="/student/rating" kids={kids} />
    </div>
  );
}
