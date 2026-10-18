import type { Metadata } from "next";
import { getTeacherCtx } from "@/lib/context";
import { classLabel, idx } from "@/lib/access";
import { fmtDateTime } from "@/lib/dates";
import { getSubject } from "@/lib/subjects";
import { Attachments } from "@/components/Attachments";
import { DeleteMaterialButton, MaterialForm } from "@/components/teacher/MaterialForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Materiallar" };

export default async function MaterialsPage() {
  const { user, db, classes } = await getTeacherCtx();
  const teachings = classes.flatMap(({ cls, subjectIds }) => subjectIds.map((s) => ({ classId: cls.id, label: classLabel(cls), subjectId: s })));
  const subjects = [...new Set(teachings.map((t) => t.subjectId))].map((s) => ({ id: s, name: getSubject(s).name, emoji: getSubject(s).emoji }));
  const mine = db.materials.filter((m) => m.teacherId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="Darslik materiallari" subtitle="O'quvchilar ularni 'Darsliklar' bo'limida ko'radi — kitob ko'tarib yurish shart emas." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <MaterialForm teachings={teachings} subjects={subjects} />
        <section className="space-y-3">
          <h2 className="font-round text-lg font-bold">Mening materiallarim ({mine.length})</h2>
          {mine.length === 0 && <div className="card text-sm text-ink-soft">Hali material qo&apos;shilmagan.</div>}
          {mine.map((m) => (
            <article key={m.id} className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getSubject(m.subjectId).emoji}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-xs text-ink-soft">{classLabel(idx(db).classes.get(m.classId))} · {getSubject(m.subjectId).name} · {fmtDateTime(m.createdAt)}</p>
                </div>
                <DeleteMaterialButton id={m.id} />
              </div>
              {m.body && <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-ink-soft">{m.body}</p>}
              <div className="mt-3"><Attachments db={db} ids={m.fileIds} /></div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
