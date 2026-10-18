import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { aiEnabled } from "@/lib/ai";
import { getSubject } from "@/lib/subjects";
import { AIChat } from "@/components/AIChat";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "AI yordamchi" };

export default async function TeacherAI() {
  const { user } = await getTeacherCtx();
  const subjects = (user.subjectIds ?? []).map((s) => ({ id: s, name: getSubject(s).name, emoji: getSubject(s).emoji }));
  return (
    <div>
      <PageHeader title="AI yordamchi" subtitle="Dars rejasi, test savollari, uy vazifasi g'oyalari va ota-onalarga xat tayyorlashda yordam." />
      <AIChat
        name={user.firstName}
        subjects={subjects}
        enabled={aiEnabled()}
        suggestions={["8-sinf uchun kvadrat tenglamalar bo'yicha 5 ta test savoli tuz", "45 daqiqalik dars rejasi: Pifagor teoremasi", "Uy vazifasini bajarmayotgan o'quvchi ota-onasiga muloyim xat", "Baholash mezonlari: insho uchun"]}
      />
    </div>
  );
}
