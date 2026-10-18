import type { Metadata } from "next";
import { getStudentCtx } from "@/lib/context";
import { classSubjects } from "@/lib/access";
import { aiEnabled } from "@/lib/ai";
import { AIChat } from "@/components/AIChat";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "AI yordamchi" };

export default async function AIPage() {
  const { user, db, cls, kids } = await getStudentCtx();
  const subjects = classSubjects(db, cls).map(({ subject }) => ({ id: subject.id, name: subject.name, emoji: subject.emoji }));
  const suggestions = kids
    ? ["Ko'paytirishni o'yin bilan tushuntir", "Unli va undosh tovushlar farqi nima?", "Kuz fasli haqida qiziq fakt ayt", "Inglizcha ranglarni o'rgat"]
    : cls.grade >= 8
      ? ["Kvadrat tenglamani qanday yechaman?", "Nyutonning 2-qonunini misol bilan tushuntir", "Insho rejasini tuzishga yordam ber", "Present Perfect qachon ishlatiladi?"]
      : ["Kasrlarni qo'shishni tushuntir", "Algoritm nima?", "Hujayra qismlarini oson eslab qolish usuli", "Amir Temur haqida qisqacha"];
  return (
    <div>
      <PageHeader title={kids ? "Yordamchi 🤖" : "AI yordamchi"} subtitle="Dars bo'yicha savollaringizga 24/7 javob beradi." />
      <AIChat name={user.firstName} kids={kids} subjects={subjects} suggestions={suggestions} enabled={aiEnabled()} />
    </div>
  );
}
